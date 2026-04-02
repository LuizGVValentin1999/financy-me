import { extractReceiptUrlFromQrPayload } from '@/lib/nfce';
import jsQR from 'jsqr';
import { Camera, Link2, ScanLine, Upload } from 'lucide-react';
import {
    ChangeEvent,
    MutableRefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

interface NfceQrScannerProps {
    isActive: boolean;
    onDetected: (receiptUrl: string) => void;
}

type ScanStatus = 'idle' | 'starting' | 'scanning' | 'success' | 'error';

function stopActiveStream(streamRef: MutableRefObject<MediaStream | null>) {
    if (!streamRef.current) {
        return;
    }

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
}

export default function NfceQrScanner({
    isActive,
    onDetected,
}: NfceQrScannerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [status, setStatus] = useState<ScanStatus>('idle');
    const [scannerMessage, setScannerMessage] = useState(
        'Aponte a camera para o QR Code da NFC-e.',
    );
    const [lastDetectedUrl, setLastDetectedUrl] = useState('');

    const cameraSupported = useMemo(
        () =>
            typeof navigator !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function',
        [],
    );

    const stopScanning = useCallback(() => {
        if (animationFrameRef.current) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        stopActiveStream(streamRef);

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }
    }, []);

    const handleDecodedPayload = useCallback(
        (rawPayload: string) => {
            const extractedUrl = extractReceiptUrlFromQrPayload(rawPayload);

            if (!extractedUrl) {
                setStatus('error');
                setScannerMessage(
                    'O QR Code lido nao contem um link HTTP/HTTPS valido da NFC-e.',
                );
                stopScanning();

                return;
            }

            setLastDetectedUrl(extractedUrl);
            setStatus('success');
            setScannerMessage('QR Code lido. Revise o link e clique em Buscar nota.');
            stopScanning();
            onDetected(extractedUrl);
        },
        [onDetected, stopScanning],
    );

    const scanCurrentFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            animationFrameRef.current = window.requestAnimationFrame(scanCurrentFrame);

            return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
            animationFrameRef.current = window.requestAnimationFrame(scanCurrentFrame);

            return;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
            setStatus('error');
            setScannerMessage('Nao foi possivel processar a imagem da camera.');
            stopScanning();

            return;
        }

        context.drawImage(video, 0, 0, width, height);

        const imageData = context.getImageData(0, 0, width, height);
        const decoded = jsQR(imageData.data, width, height);

        if (decoded?.data) {
            handleDecodedPayload(decoded.data);

            return;
        }

        animationFrameRef.current = window.requestAnimationFrame(scanCurrentFrame);
    }, [handleDecodedPayload, stopScanning]);

    const startScanning = useCallback(async () => {
        if (!cameraSupported || !isActive) {
            return;
        }

        stopScanning();
        setStatus('starting');
        setScannerMessage('Solicitando acesso a camera...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: 'environment' },
                },
            });

            streamRef.current = stream;

            const video = videoRef.current;

            if (!video) {
                throw new Error('camera-video-unavailable');
            }

            video.srcObject = stream;
            await video.play();

            setStatus('scanning');
            setScannerMessage('Camera ativa. Posicione o QR Code dentro da area visivel.');
            animationFrameRef.current = window.requestAnimationFrame(scanCurrentFrame);
        } catch (error) {
            setStatus('error');
            setScannerMessage(
                'Nao foi possivel acessar a camera. Verifique a permissao do navegador ou envie uma imagem do QR Code.',
            );
            stopScanning();
        }
    }, [cameraSupported, isActive, scanCurrentFrame, stopScanning]);

    const scanUploadedImage = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            try {
                const bitmap = await createImageBitmap(file);
                const canvas = canvasRef.current;

                if (!canvas) {
                    throw new Error('scanner-canvas-unavailable');
                }

                canvas.width = bitmap.width;
                canvas.height = bitmap.height;

                const context = canvas.getContext('2d', { willReadFrequently: true });

                if (!context) {
                    throw new Error('scanner-context-unavailable');
                }

                context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

                const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
                const decoded = jsQR(imageData.data, bitmap.width, bitmap.height);

                bitmap.close();

                if (!decoded?.data) {
                    setStatus('error');
                    setScannerMessage(
                        'Nao encontramos um QR Code valido nessa imagem. Tente outra foto ou use a camera.',
                    );
                    event.target.value = '';

                    return;
                }

                handleDecodedPayload(decoded.data);
            } catch (error) {
                setStatus('error');
                setScannerMessage(
                    'Nao foi possivel ler a imagem enviada. Tente outra imagem ou cole o link manualmente.',
                );
            } finally {
                event.target.value = '';
            }
        },
        [handleDecodedPayload],
    );

    useEffect(() => {
        if (!isActive) {
            stopScanning();
            setStatus('idle');
            setScannerMessage('Aponte a camera para o QR Code da NFC-e.');

            return;
        }

        void startScanning();

        return () => {
            stopScanning();
        };
    }, [isActive, startScanning, stopScanning]);

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
                <div className="relative aspect-[4/3] w-full">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                    />

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-52 w-52 rounded-[32px] border-2 border-dashed border-white/70 bg-white/5 shadow-[0_0_0_9999px_rgba(15,23,42,0.38)]" />
                    </div>

                    <div className="absolute left-4 top-4 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        {status === 'scanning'
                            ? 'Camera ativa'
                            : status === 'starting'
                              ? 'Iniciando camera'
                              : status === 'success'
                                ? 'QR lido'
                                : status === 'error'
                                  ? 'Scanner indisponivel'
                                  : 'Scanner pronto'}
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                    <ScanLine className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">{scannerMessage}</p>
                        <p className="text-sm text-slate-500">
                            Se preferir, voce pode enviar uma foto do QR Code ou continuar colando o
                            link manualmente.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => void startScanning()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                    <Camera className="h-4 w-4" />
                    Reativar camera
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                    <Upload className="h-4 w-4" />
                    Ler imagem do QR Code
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={scanUploadedImage}
            />

            {lastDetectedUrl ? (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                        <Link2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-emerald-800">Link identificado</p>
                            <p className="break-all text-sm text-emerald-700">{lastDetectedUrl}</p>
                        </div>
                    </div>
                </div>
            ) : null}

            {!cameraSupported ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Seu navegador nao expoe acesso a camera nesta tela. Use a opcao de imagem ou cole
                    o link da NFC-e manualmente.
                </div>
            ) : null}
        </div>
    );
}
