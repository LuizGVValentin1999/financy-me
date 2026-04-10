import { Drawer, Grid, Modal as AntModal } from 'antd';
import { PropsWithChildren, useEffect, useId, useRef } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'screen';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const modalHistoryId = useId();
    const hasPushedHistoryRef = useRef(false);
    const ignoreNextPopRef = useRef(false);
    const openRef = useRef(show);

    useEffect(() => {
        openRef.current = show;
    }, [show]);

    useEffect(() => {
        if (!isMobile || !closeable) {
            return;
        }

        const handlePopState = (event: PopStateEvent) => {
            if (ignoreNextPopRef.current) {
                ignoreNextPopRef.current = false;
                return;
            }

            if (!openRef.current || !hasPushedHistoryRef.current) {
                return;
            }

            const nextModalId = (event.state as { __appModalId?: string } | null)?.__appModalId;

            // If the next history entry is another modal, only the topmost one should close.
            if (nextModalId === modalHistoryId) {
                return;
            }

            hasPushedHistoryRef.current = false;
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [closeable, isMobile, modalHistoryId, onClose]);

    useEffect(() => {
        if (!isMobile || !closeable) {
            return;
        }

        if (show) {
            if (!hasPushedHistoryRef.current) {
                window.history.pushState(
                    { ...(window.history.state ?? {}), __appModalId: modalHistoryId },
                    '',
                );
                hasPushedHistoryRef.current = true;
            }

            return;
        }

        if (!hasPushedHistoryRef.current) {
            return;
        }

        hasPushedHistoryRef.current = false;

        if ((window.history.state as { __appModalId?: string } | null)?.__appModalId === modalHistoryId) {
            ignoreNextPopRef.current = true;
            window.history.back();
        }
    }, [closeable, isMobile, modalHistoryId, show]);

    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthValue = {
        sm: 384,
        md: 448,
        lg: 512,
        xl: 576,
        '2xl': 672,
        '4xl': 960,
        '6xl': 1180,
        '7xl': 1320,
        screen: 'calc(100vw - 48px)',
    }[maxWidth];

    if (isMobile) {
        return (
            <Drawer
                open={show}
                onClose={close}
                closeIcon={closeable ? undefined : false}
                mask={{ closable: closeable }}
                keyboard={closeable}
                placement="right"
                size="default"
                destroyOnHidden
                className="app-fullscreen-modal"
                rootClassName="app-fullscreen-modal"
                styles={{
                    wrapper: { width: '100%' },
                    body: { padding: 0 },
                    header: {
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
                    },
                }}
            >
                {children}
            </Drawer>
        );
    }

    return (
        <AntModal
            open={show}
            onCancel={close}
            footer={null}
            closable={closeable}
            mask={{ closable: closeable }}
            keyboard={closeable}
            width={maxWidthValue}
            destroyOnHidden
            centered
            className="app-responsive-modal"
            rootClassName="app-responsive-modal"
            styles={{ body: { padding: 0 } }}
        >
            {children}
        </AntModal>
    );
}
