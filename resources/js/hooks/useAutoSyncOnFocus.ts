import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

type UseAutoSyncOnFocusOptions = {
    enabled?: boolean;
    cooldownMs?: number;
};

export function useAutoSyncOnFocus({
    enabled = true,
    cooldownMs = 5000,
}: UseAutoSyncOnFocusOptions = {}) {
    const lastSyncRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const trySync = () => {
            const now = Date.now();

            if (document.visibilityState !== 'visible') {
                return;
            }

            if (now - lastSyncRef.current < cooldownMs) {
                return;
            }

            lastSyncRef.current = now;
            router.reload();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                trySync();
            }
        };

        window.addEventListener('focus', trySync);
        window.addEventListener('online', trySync);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', trySync);
            window.removeEventListener('online', trySync);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, cooldownMs]);
}
