<?php

namespace App\Services;

use Carbon\Carbon;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class ParanaNfceImporter
{
    public function supports(string $url): bool
    {
        $parts = parse_url($this->normalizeUrl($url));

        if (! is_array($parts)) {
            return false;
        }

        $host = $parts['host'] ?? '';
        $path = $parts['path'] ?? '';

        return Str::endsWith($host, 'fazenda.pr.gov.br')
            && Str::contains($path, '/nfce/qrcode');
    }

    /**
     * @return array{
     *     store_name: string,
     *     cnpj: string|null,
     *     address: string|null,
     *     invoice_number: string|null,
     *     series: string|null,
     *     issued_at: string|null,
     *     issued_at_label: string|null,
     *     access_key: string|null,
     *     total_items: int,
     *     total_amount: float,
     *     discount_amount: float,
     *     amount_paid: float,
     *     payment_methods: array<int, array{method: string, amount: float}>,
     *     items: array<int, array{
     *         name: string,
     *         code: string|null,
     *         quantity: float,
     *         unit: string,
     *         unit_price: float,
     *         total_amount: float
     *     }>
     * }
     */
    public function import(string $url): array
    {
        $normalizedUrl = $this->normalizeUrl($url);

        if (! $this->supports($normalizedUrl)) {
            throw new RuntimeException('No momento so aceitamos links de NFC-e do portal da SEFAZ do Parana.');
        }

        $response = Http::timeout(20)
            ->retry(2, 300)
            ->withHeaders([
                'User-Agent' => 'FinancyMe/1.0 (+https://localhost)',
                'Accept-Language' => 'pt-BR,pt;q=0.9',
            ])
            ->get($normalizedUrl);

        if (! $response->successful()) {
            throw new RuntimeException('Nao foi possivel consultar esse link da NFC-e agora.');
        }

        return $this->parseHtml($response->body());
    }

    public function normalizeUrl(string $url): string
    {
        return str_replace('|', '%7C', trim($url));
    }

    /**
     * @return array{
     *     store_name: string,
     *     cnpj: string|null,
     *     address: string|null,
     *     invoice_number: string|null,
     *     series: string|null,
     *     issued_at: string|null,
     *     issued_at_label: string|null,
     *     access_key: string|null,
     *     total_items: int,
     *     total_amount: float,
     *     discount_amount: float,
     *     amount_paid: float,
     *     payment_methods: array<int, array{method: string, amount: float}>,
     *     items: array<int, array{
     *         name: string,
     *         code: string|null,
     *         quantity: float,
     *         unit: string,
     *         unit_price: float,
     *         total_amount: float
     *     }>
     * }
     */
    public function parseHtml(string $html): array
    {
        $document = new DOMDocument();

        libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="utf-8" ?>'.$html);
        libxml_clear_errors();

        $xpath = new DOMXPath($document);

        $storeName = $this->text($xpath, "//*[@id='u20']");

        if ($storeName === null) {
            throw new RuntimeException('Nao foi possivel identificar o estabelecimento nessa NFC-e.');
        }

        $invoiceInfo = $this->text(
            $xpath,
            "//div[@id='infos']//h4[contains(., 'Informações gerais da Nota')]/following-sibling::ul/li",
        );

        preg_match('/Número:\s*(\d+)/u', $invoiceInfo ?? '', $numberMatches);
        preg_match('/Série:\s*(\d+)/u', $invoiceInfo ?? '', $seriesMatches);
        preg_match('/Emissão:\s*([0-9\/:\s]+)-/u', $invoiceInfo ?? '', $issuedAtMatches);

        $issuedAtLabel = isset($issuedAtMatches[1]) ? trim($issuedAtMatches[1]) : null;
        $issuedAt = null;

        if ($issuedAtLabel !== null) {
            $issuedAt = Carbon::createFromFormat(
                'd/m/Y H:i:s',
                $issuedAtLabel,
                'America/Sao_Paulo',
            )->toDateString();
        }

        $paymentMethods = [];

        foreach ($xpath->query("//div[@id='totalNota']/div[label[contains(@class, 'tx')]]") as $paymentRow) {
            if (! $paymentRow instanceof DOMElement) {
                continue;
            }

            $method = $this->text($xpath, './/label', $paymentRow);
            $amount = $this->text($xpath, './/span', $paymentRow);

            if ($method !== null && $amount !== null) {
                $paymentMethods[] = [
                    'method' => $method,
                    'amount' => $this->parseBrazilianNumber($amount),
                ];
            }
        }

        $items = [];

        foreach ($xpath->query("//table[@id='tabResult']/tr") as $row) {
            if (! $row instanceof DOMElement) {
                continue;
            }

            $name = $this->text($xpath, ".//span[contains(@class, 'txtTit2')]", $row);

            if ($name === null) {
                continue;
            }

            $codeText = $this->text($xpath, ".//span[contains(@class, 'RCod')]", $row);
            $quantityText = $this->text($xpath, ".//span[contains(@class, 'Rqtd')]", $row);
            $unitText = $this->text($xpath, ".//span[contains(@class, 'RUN')]", $row);
            $unitPriceText = $this->text($xpath, ".//span[contains(@class, 'RvlUnit')]", $row);
            $totalAmountText = $this->text($xpath, ".//span[contains(@class, 'valor')]", $row);

            preg_match('/Código:\s*([^)]+)/u', $codeText ?? '', $codeMatches);
            preg_match('/Qtde\.\:\s*([0-9\.,]+)/u', $quantityText ?? '', $quantityMatches);
            preg_match('/UN:\s*([A-Z]+)/u', $unitText ?? '', $unitMatches);
            preg_match('/Vl\.\s*Unit\.\:\s*([0-9\.,]+)/u', $unitPriceText ?? '', $unitPriceMatches);

            $items[] = [
                'name' => $name,
                'code' => isset($codeMatches[1]) ? trim($codeMatches[1]) : null,
                'quantity' => $this->parseBrazilianNumber($quantityMatches[1] ?? '0'),
                'unit' => $unitMatches[1] ?? 'UN',
                'unit_price' => $this->parseBrazilianNumber($unitPriceMatches[1] ?? '0'),
                'total_amount' => $this->parseBrazilianNumber($totalAmountText ?? '0'),
            ];
        }

        if ($items === []) {
            throw new RuntimeException('Nao encontramos itens nessa NFC-e.');
        }

        return [
            'store_name' => $storeName,
            'cnpj' => $this->extractAfterLabel($xpath, "//div[@id='conteudo']//div[contains(@class, 'text')][1]", 'CNPJ:'),
            'address' => $this->text($xpath, "//div[@id='conteudo']//div[contains(@class, 'text')][2]"),
            'invoice_number' => $numberMatches[1] ?? null,
            'series' => $seriesMatches[1] ?? null,
            'issued_at' => $issuedAt,
            'issued_at_label' => $issuedAtLabel,
            'access_key' => $this->sanitizeAccessKey($this->text($xpath, "//span[contains(@class, 'chave')]")),
            'total_items' => (int) $this->parseBrazilianNumber($this->valueByLabel($xpath, 'Qtd. total de itens:') ?? '0'),
            'total_amount' => $this->parseBrazilianNumber($this->valueByLabel($xpath, 'Valor total R$:') ?? '0'),
            'discount_amount' => $this->parseBrazilianNumber($this->valueByLabel($xpath, 'Descontos R$:') ?? '0'),
            'amount_paid' => $this->parseBrazilianNumber($this->valueByLabel($xpath, 'Valor a pagar R$:') ?? '0'),
            'payment_methods' => $paymentMethods,
            'items' => $items,
        ];
    }

    public function normalizeUnit(?string $unit): string
    {
        return match (Str::lower(trim((string) $unit))) {
            'un', 'und', 'unid', 'pc', 'pct' => 'un',
            'kg' => 'kg',
            'g', 'gr' => 'g',
            'l', 'lt' => 'l',
            'ml' => 'ml',
            'cx' => 'cx',
            default => 'un',
        };
    }

    private function text(DOMXPath $xpath, string $expression, ?DOMElement $context = null): ?string
    {
        $nodes = $xpath->query($expression, $context);

        if ($nodes === false || $nodes->length === 0) {
            return null;
        }

        return Str::of($nodes->item(0)?->textContent ?? '')->squish()->toString();
    }

    private function valueByLabel(DOMXPath $xpath, string $label): ?string
    {
        return $this->text(
            $xpath,
            sprintf("//div[@id='totalNota']//label[contains(normalize-space(.), '%s')]/following-sibling::span[1]", $label),
        );
    }

    private function extractAfterLabel(DOMXPath $xpath, string $expression, string $label): ?string
    {
        $text = $this->text($xpath, $expression);

        if ($text === null) {
            return null;
        }

        return trim(Str::after($text, $label));
    }

    private function parseBrazilianNumber(string $value): float
    {
        $normalized = str_replace('.', '', trim($value));
        $normalized = str_replace(',', '.', $normalized);

        return (float) $normalized;
    }

    private function sanitizeAccessKey(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value);

        return $digits !== '' ? $digits : null;
    }
}
