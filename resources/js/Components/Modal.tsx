import { Drawer, Grid, Modal as AntModal } from 'antd';
import { PropsWithChildren } from 'react';

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
