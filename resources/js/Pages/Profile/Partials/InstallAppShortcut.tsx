import PrimaryButton from '@/Components/PrimaryButton';
import { useAntdApp } from '@/hooks/useAntdApp';
import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
};

const isStandaloneMode = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const iosStandalone = typeof (window.navigator as Navigator & { standalone?: boolean }).standalone === 'boolean'
        ? Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
        : false;

    return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
};

export default function InstallAppShortcut({ className = '' }: { className?: string }) {
    const { message } = useAntdApp();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(isStandaloneMode());

    const isIos = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const ua = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(ua);
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (isInstalled) {
            message.info('O app ja esta instalado neste dispositivo.');
            return;
        }

        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                message.success('Instalacao iniciada com sucesso!');
            } else {
                message.info('Instalacao cancelada.');
            }

            setDeferredPrompt(null);
            return;
        }

        if (isIos) {
            message.info('No iPhone: toque em Compartilhar e depois em Adicionar a Tela de Inicio.');
            return;
        }

        message.info('Use o menu do navegador e escolha Instalar app ou Adicionar a tela inicial.');
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">App no celular</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Instale o Financy-me no seu dispositivo para abrir em modo app, sem barra de URL.
                </p>
            </header>

            <div className="mt-6">
                <PrimaryButton type="button" onClick={handleInstall} disabled={isInstalled}>
                    {isInstalled ? 'App instalado' : 'Instalar app'}
                </PrimaryButton>
            </div>
        </section>
    );
}
