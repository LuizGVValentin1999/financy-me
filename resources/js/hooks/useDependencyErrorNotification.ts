import { message } from 'antd';
import { useEffect, useRef } from 'react';

interface DependencyErrorConfig {
    /**
     * Field patterns that represent dependencies (e.g. 'payments\\.', 'account_id')
     * If a field matches one of these patterns, it is treated as a dependency error.
     */
    dependencyPatterns?: RegExp[];
    /**
     * Custom message shown in the notification.
     */
    customMessage?: string;
    /**
     * Notification type ('info', 'warning', 'error', 'success').
     * Default: 'warning'.
     */
    type?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * Monitors dependency-related validation errors and displays
 * an Ant Design message notification for better visibility
 * on mobile or scrolled screens.
 *
 * @example
 * const { errors } = useForm({ ... });
 * useDependencyErrorNotification(errors, {
 *   dependencyPatterns: [/^payments\./, /account_id$/],
 *   customMessage: 'Revise as contas e pagamentos',
 *   type: 'warning'
 * });
 */
export function useDependencyErrorNotification(
    errors: Record<string, string | undefined>,
    config: DependencyErrorConfig = {},
) {
    const shownErrorsRef = useRef<Set<string>>(new Set());
    const defaultPatterns = [
        /^payments\./,      // payments.0.account_id, payments.1.type, etc
        /account_id$/,      // Any field ending with account_id
        /_id$/,             // Foreign key fields ending with _id
    ];

    const patterns = config.dependencyPatterns || defaultPatterns;
    const customMsg = config.customMessage || 'Revise os campos obrigatórios destacados';
    const notificationType = config.type || 'warning';

    useEffect(() => {
        const dependencyErrors = Object.entries(errors)
            .filter(([field]) =>
                patterns.some((pattern) => pattern.test(field)),
            )
            .map(([field, msg]) => ({ field, msg: msg || 'Campo obrigatório' }))
            .filter((x) => Boolean(x.msg));

        // Show each unique error only once.
        dependencyErrors.forEach(({ field, msg }) => {
            const errorKey = `${field}:${msg}`;
            if (!shownErrorsRef.current.has(errorKey)) {
                shownErrorsRef.current.add(errorKey);

                message[notificationType]({
                    content: `${customMsg}: ${msg}`,
                    duration: 5,
                });
            }
        });

        // Clear tracked errors when there are no dependency errors.
        if (dependencyErrors.length === 0) {
            shownErrorsRef.current.clear();
        }
    }, [errors, patterns, customMsg, notificationType]);
}
