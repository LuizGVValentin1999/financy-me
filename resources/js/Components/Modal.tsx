import { Modal as AntModal } from 'antd';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
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
    }[maxWidth];

    return (
        <AntModal
            open={show}
            onCancel={close}
            footer={null}
            closable={closeable}
            maskClosable={closeable}
            keyboard={closeable}
            width={maxWidthValue}
            centered
            styles={{ body: { padding: 0 } }}
        >
            {children}
        </AntModal>
    );
}
