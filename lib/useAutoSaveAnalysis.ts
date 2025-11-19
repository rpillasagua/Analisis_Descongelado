import { useEffect, useRef, useState } from 'react';
import { QualityAnalysis } from './types';

interface UseAutoSaveOptions {
  data: Partial<QualityAnalysis>;
  onSave: (data: Partial<QualityAnalysis>) => Promise<void>;
  delay?: number; // Delay en ms antes de guardar (default: 2000)
  enabled?: boolean;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useAutoSaveAnalysis({
  data,
  onSave,
  delay = 2000,
  enabled = true
}: UseAutoSaveOptions): AutoSaveState {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    // Serializar datos para comparación
    const currentData = JSON.stringify(data);

    // Si los datos no cambiaron, no hacer nada
    if (currentData === previousDataRef.current) {
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programar guardado
    timeoutRef.current = setTimeout(async () => {
      // Verificar que hay datos mínimos para guardar
      if (!data.codigo || !data.lote) {
        return;
      }

      setState(prev => ({ ...prev, isSaving: true, error: null }));

      try {
        await onSave(data);
        setState({
          isSaving: false,
          lastSaved: new Date(),
          error: null
        });
        previousDataRef.current = currentData;
      } catch (error: any) {
        console.error('Error en auto-guardado:', error);
        setState({
          isSaving: false,
          lastSaved: null,
          error: error.message || 'Error al guardar'
        });
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  return state;
}
