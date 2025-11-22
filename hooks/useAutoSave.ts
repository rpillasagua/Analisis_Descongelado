import { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';

interface AutoSaveOptions {
    delay?: number; // milliseconds to wait before saving
    enabled?: boolean;
}

interface AutoSaveState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
}

/**
 * Hook robusto para auto-guardado con debounce y backup local
 * 
 * Características:
 * - Debounce configurable (default 1000ms)
 * - Backup automático a localStorage
 * - Recuperación automática si falla la red
 * - Estados de saving/saved/error
 */
export function useAutoSave<T>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options: AutoSaveOptions = {}
) {
    const { delay = 1000, enabled = true } = options;

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
                localStorage.setItem('analysis_backup', JSON.stringify(debouncedData));

                // 2. Intentar guardar en la base de datos
                await saveFunction(debouncedData);

                // 3. Si tiene éxito, limpiar backup
                localStorage.removeItem('analysis_backup');

                setState({
                    isSaving: false,
                    lastSaved: new Date(),
                    error: null
                });
            } catch (error) {
                console.error('Error en auto-save, pero backup local guardado:', error);
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
            const backup = localStorage.getItem('analysis_backup');
            return backup ? JSON.parse(backup) : null;
        } catch (error) {
            console.error('Error al recuperar backup:', error);
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
            localStorage.removeItem('analysis_backup');
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
