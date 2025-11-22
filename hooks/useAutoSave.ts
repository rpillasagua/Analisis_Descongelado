import { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { logger } from '@/lib/logger';

interface AutoSaveOptions {
    delay?: number; // milliseconds to wait before saving
    enabled?: boolean;
}

interface AutoSaveState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
}

interface BackupData<T> {
    version: string;
    timestamp: number;
    data: T;
}

const BACKUP_VERSION = '1.0.0';
const BACKUP_KEY = 'analysis_backup_v2';

/**
 * Hook robusto para auto-guardado con debounce dinámico y backup local
 * 
 * Características:
 * - Debounce dinámico basado en red
 * - Backup automático a localStorage con versionado
 * - Recuperación automática si falla la red
 * - Estados de saving/saved/error
 */
export function useAutoSave<T>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options: AutoSaveOptions = {}
) {
    const { enabled = true } = options;

    // Determinar delay óptimo basado en conexión
    const getOptimalDelay = () => {
        if (typeof navigator === 'undefined') return 1000;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connection = (navigator as any).connection;
        if (connection?.effectiveType === '4g') return 1000;
        if (connection?.effectiveType === '3g') return 2000;
        if (connection?.effectiveType === '2g') return 3000;
        return 1000;
    };

    const [delay] = useState(options.delay || getOptimalDelay());

    const [state, setState] = useState<AutoSaveState>({
        isSaving: false,
        lastSaved: null,
        error: null
    });

    const [debouncedData] = useDebounce(data, delay);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // No guardar en el primer render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!enabled || !debouncedData) return;

        const saveData = async () => {
            setState(prev => ({ ...prev, isSaving: true, error: null }));

            try {
                // 1. Guardar en localStorage inmediatamente (backup)
                const backup: BackupData<T> = {
                    version: BACKUP_VERSION,
                    timestamp: Date.now(),
                    data: debouncedData
                };
                localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

                // 2. Intentar guardar en la base de datos
                await saveFunction(debouncedData);

                // 3. Si tiene éxito, limpiar backup
                localStorage.removeItem(BACKUP_KEY);

                setState({
                    isSaving: false,
                    lastSaved: new Date(),
                    error: null
                });
            } catch (error) {
                logger.error('Error en auto-save, pero backup local guardado:', error);
                setState({
                    isSaving: false,
                    lastSaved: null,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        };

        saveData();
    }, [debouncedData, saveFunction, enabled]);

    /**
     * Recuperar datos del backup local si existen
     */
    const recoverFromBackup = (): T | null => {
        try {
            const backupStr = localStorage.getItem(BACKUP_KEY);
            if (!backupStr) return null;

            const backup: BackupData<T> = JSON.parse(backupStr);

            // Verificar versión
            if (backup.version !== BACKUP_VERSION) {
                logger.warn('Backup version mismatch, discarding');
                localStorage.removeItem(BACKUP_KEY);
                return null;
            }

            // Verificar antigüedad (ej: descartar si tiene más de 24h)
            if (Date.now() - backup.timestamp > 24 * 60 * 60 * 1000) {
                logger.warn('Backup too old, discarding');
                localStorage.removeItem(BACKUP_KEY);
                return null;
            }

            return backup.data;
        } catch (error) {
            logger.error('Error al recuperar backup:', error);
            return null;
        }
    };

    /**
     * Forzar guardado inmediato (útil antes de navegar)
     */
    const forceSave = async () => {
        if (!data) return;

        setState(prev => ({ ...prev, isSaving: true }));
        try {
            await saveFunction(data);
            localStorage.removeItem(BACKUP_KEY);
            setState({
                isSaving: false,
                lastSaved: new Date(),
                error: null
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: error instanceof Error ? error.message : 'Error'
            }));
            throw error;
        }
    };

    return {
        ...state,
        forceSave,
        recoverFromBackup
    };
}
