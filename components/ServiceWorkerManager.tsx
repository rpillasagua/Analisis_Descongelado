'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';

export default function ServiceWorkerManager() {
    useServiceWorker();
    return null;
}
