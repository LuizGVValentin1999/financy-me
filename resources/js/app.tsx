import '../css/app.css';
import 'antd/dist/reset.css';
import './bootstrap';

import { App as AntdApp, ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import ptBRModule from 'antd/locale/pt_BR.js';
import { createInertiaApp } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Finency-me';
const ptBR = ('default' in ptBRModule ? ptBRModule.default : ptBRModule) as Locale;

dayjs.locale('pt-br');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

        if (isSecureContext) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Keep app startup resilient even if SW registration fails.
            });
        }
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfigProvider
                locale={ptBR}
                theme={{
                    token: {
                        colorPrimary: '#6f8ea8',
                        colorPrimaryHover: '#7f9cb4',
                        colorPrimaryActive: '#5b7891',
                        colorPrimaryBg: '#edf3f7',
                        colorPrimaryBgHover: '#e5eef4',
                        colorPrimaryBorder: '#bfd0dc',
                        colorPrimaryBorderHover: '#9db6c7',
                        colorPrimaryText: '#5b7891',
                        colorPrimaryTextHover: '#506d86',
                        colorPrimaryTextActive: '#435d74',
                        colorInfo: '#6f8ea8',
                        colorLink: '#6f8ea8',
                        colorLinkHover: '#7f9cb4',
                        colorLinkActive: '#5b7891',
                        colorSuccess: '#1e7a8a',
                        colorError: '#be3d2a',
                        colorBorder: '#e8ddd0',
                        colorBorderSecondary: '#efe6da',
                        colorBgContainer: '#ffffff',
                        colorBgElevated: '#ffffff',
                        colorText: '#334155',
                        colorTextPlaceholder: '#94a3b8',
                        borderRadius: 16,
                        fontFamily: 'Manrope, sans-serif',
                    },
                    components: {
                        Button: {
                            borderRadius: 999,
                            controlHeight: 48,
                            fontWeight: 600,
                            primaryShadow:
                                '0 16px 40px -18px rgba(91, 120, 145, 0.45)',
                            dangerShadow:
                                '0 14px 30px -18px rgba(190, 61, 42, 0.75)',
                        },
                        Input: {
                            borderRadiusLG: 16,
                            controlHeightLG: 48,
                        },
                        DatePicker: {
                            borderRadiusLG: 16,
                            controlHeightLG: 48,
                        },
                        Select: {
                            borderRadiusLG: 16,
                            controlHeightLG: 48,
                            optionSelectedBg: 'rgba(111, 142, 168, 0.14)',
                        },
                        Tabs: {
                            inkBarColor: '#6f8ea8',
                            itemActiveColor: '#5b7891',
                            itemHoverColor: '#7f9cb4',
                            itemSelectedColor: '#5b7891',
                        },
                        Modal: {
                            borderRadiusLG: 24,
                        },
                    },
                }}
            >
                <AntdApp>
                    <App {...props} />
                </AntdApp>
            </ConfigProvider>,
        );
    },
    progress: {
        color: '#e07a5f',
    },
});
