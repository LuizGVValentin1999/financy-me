import '../css/app.css';
import 'antd/dist/reset.css';
import './bootstrap';

import { ConfigProvider } from 'antd';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
                theme={{
                    token: {
                        colorPrimary: '#0f172a',
                        colorInfo: '#0f172a',
                        colorSuccess: '#1e7a8a',
                        colorError: '#be3d2a',
                        borderRadius: 16,
                        fontFamily: 'Manrope, sans-serif',
                    },
                    components: {
                        Button: {
                            borderRadius: 999,
                            controlHeight: 48,
                            fontWeight: 600,
                            primaryShadow:
                                '0 16px 40px -18px rgba(15, 23, 42, 0.85)',
                            dangerShadow:
                                '0 14px 30px -18px rgba(190, 61, 42, 0.75)',
                        },
                        Input: {
                            borderRadiusLG: 16,
                            controlHeightLG: 48,
                        },
                        Select: {
                            borderRadiusLG: 16,
                            controlHeightLG: 48,
                        },
                        Modal: {
                            borderRadiusLG: 24,
                        },
                    },
                }}
            >
                <App {...props} />
            </ConfigProvider>,
        );
    },
    progress: {
        color: '#e07a5f',
    },
});
