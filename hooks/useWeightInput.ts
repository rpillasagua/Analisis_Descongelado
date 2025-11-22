import { useCallback } from 'react';
import { Analysis, PesoConFoto } from '@/lib/types';

/**
 * Hook para manejar la actualización de campos de peso en el análisis
 * Reduce la duplicación de código en PageContent
 */
export function useWeightInput(
    currentAnalysis: Analysis,
    updateCurrentAnalysis: (updates: Partial<Analysis>) => void
) {
    const handleWeightChange = useCallback((field: keyof Analysis, value: number) => {
        const currentField = currentAnalysis[field] as PesoConFoto | undefined;

        // Asegurar que no guardamos NaN
        const safeValue = isNaN(value) ? undefined : value;

        updateCurrentAnalysis({
            [field]: {
                ...(currentField || {}),
                valor: safeValue
            } as any // Cast necesario por la flexibilidad de Analysis
        });
    }, [currentAnalysis, updateCurrentAnalysis]);

    return { handleWeightChange };
}
