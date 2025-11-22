import { toast } from 'sonner';

const toastQueue = new Map<string, boolean>();

/**
 * Muestra un toast con rate limiting para evitar spam de notificaciones idénticas
 * @param message Mensaje a mostrar
 * @param type Tipo de toast ('success' | 'error' | 'info' | 'warning')
 * @param duration Duración del bloqueo en ms (default 3000ms)
 */
export const rateLimitedToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 3000
) => {
    const key = `${type}:${message}`;

    if (toastQueue.has(key)) {
        return; // Ya mostrado recientemente, ignorar
    }

    // Mostrar toast
    toast[type](message);

    // Bloquear duplicados
    toastQueue.set(key, true);

    // Limpiar bloqueo después del tiempo especificado
    setTimeout(() => {
        toastQueue.delete(key);
    }, duration);
};

export default rateLimitedToast;
