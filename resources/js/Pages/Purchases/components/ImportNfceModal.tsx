import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import NfceQrScanner from '@/Pages/Purchases/components/NfceQrScanner';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEvent, useEffect, useState } from 'react';

interface ImportNfceModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptUrl: string;
    receiptUrlError?: string;
    processing: boolean;
    onReceiptUrlChange: (value: string) => void;
    onQrCodeDetected: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ImportNfceModal({
    isOpen,
    onClose,
    receiptUrl,
    receiptUrlError,
    processing,
    onReceiptUrlChange,
    onQrCodeDetected,
    onSubmit,
}: ImportNfceModalProps) {
    const [mode, setMode] = useState<'link' | 'scan'>('link');

    useEffect(() => {
        if (!isOpen) {
            setMode('link');
        }
    }, [isOpen]);

    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Compras"
            title="Importar compra da NFC-e"
            description="Cole o link publico da SEFAZ do Parana ou leia o QR Code da nota. O sistema busca os itens, monta um rascunho e voce classifica cada produto antes de confirmar."
            maxWidth="xl"
            actions={
                <div className="flex flex-wrap justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>Buscar nota</PrimaryButton>
                </div>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setMode('link')}
                    className={`rounded-[24px] border px-4 py-3 text-left transition ${
                        mode === 'link'
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <p className="text-sm font-semibold">Colar link</p>
                    <p
                        className={`mt-1 text-sm ${
                            mode === 'link' ? 'text-slate-200' : 'text-slate-500'
                        }`}
                    >
                        Use o endereco publico da SEFAZ.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setMode('scan')}
                    className={`rounded-[24px] border px-4 py-3 text-left transition ${
                        mode === 'scan'
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <p className="text-sm font-semibold">Escanear QR Code</p>
                    <p
                        className={`mt-1 text-sm ${
                            mode === 'scan' ? 'text-slate-200' : 'text-slate-500'
                        }`}
                    >
                        Leia a nota com a camera ou por imagem.
                    </p>
                </button>
            </div>

            {mode === 'scan' ? (
                <NfceQrScanner isActive={isOpen} onDetected={onQrCodeDetected} />
            ) : null}

            <LabeledInputField
                id="receipt_url"
                label={mode === 'scan' ? 'Link identificado' : 'Link da NFC-e'}
                value={receiptUrl}
                onChange={onReceiptUrlChange}
                placeholder="https://www.fazenda.pr.gov.br/nfce/qrcode?p=..."
                error={receiptUrlError}
            />

            <div className="rounded-[24px] bg-[#f8f4ec] px-4 py-4 text-sm text-slate-600">
                Suporte inicial para consulta publica da NFC-e do Parana.
            </div>
        </FormEntityModal>
    );
}
