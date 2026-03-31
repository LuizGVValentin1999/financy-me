import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEvent } from 'react';

interface ImportNfceModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptUrl: string;
    receiptUrlError?: string;
    processing: boolean;
    onReceiptUrlChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ImportNfceModal({
    isOpen,
    onClose,
    receiptUrl,
    receiptUrlError,
    processing,
    onReceiptUrlChange,
    onSubmit,
}: ImportNfceModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Compras"
            title="Importar compra por link da NFC-e"
            description="Cole o link publico da SEFAZ do Parana. O sistema busca os itens da nota, monta um rascunho e voce classifica cada produto antes de confirmar."
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
            <LabeledInputField
                id="receipt_url"
                label="Link da NFC-e"
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
