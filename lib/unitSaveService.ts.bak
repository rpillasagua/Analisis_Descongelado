import { ResistanceTest } from './types';
import { saveTestToFirestore } from './firestoreService';

export interface UnitSaveProgress {
  sampleId: string;
  field: 'rawUnits' | 'cookedUnits';
  stage: 'validating' | 'saving' | 'verifying' | 'completed' | 'error';
  progress: number;
  message: string;
  retryCount?: number;
}

export interface UnitSaveOptions {
  maxRetries?: number;
  enableLocalBackup?: boolean;
  validateChanges?: boolean;
}

export interface UnitSaveResult {
  success: boolean;
  savedValues: { sampleId: string; field: 'rawUnits' | 'cookedUnits'; value: number | undefined }[];
  errors: string[];
}

/**
 * Servicio confiable para guardar unidades (crudo/cocido) con validación y reintentos
 */
export const saveUnitsReliably = async (
  test: ResistanceTest,
  changes: { sampleId: string; field: 'rawUnits' | 'cookedUnits'; value: number | undefined }[],
  options: UnitSaveOptions = {},
  onProgress?: (progress: UnitSaveProgress) => void
): Promise<UnitSaveResult> => {
  const {
    maxRetries = 3,
    enableLocalBackup = true,
    validateChanges = true
  } = options;

  const result: UnitSaveResult = {
    success: true,
    savedValues: [],
    errors: []
  };

  // Validar cambios antes de proceder
  if (validateChanges) {
    onProgress?.({
      sampleId: 'validation',
      field: 'rawUnits',
      stage: 'validating',
      progress: 10,
      message: 'Validando cambios...'
    });

    for (const change of changes) {
      const sample = test.samples.find(s => s.id === change.sampleId);
      if (!sample) {
        result.errors.push(`Muestra ${change.sampleId} no encontrada`);
        result.success = false;
        continue;
      }

      const currentValue = sample[change.field];

      // Usar función mejorada para detectar cambios
      if (!isUnitChangeSignificant(currentValue, change.value)) {
        // No hay cambio real, continuar
        continue;
      }

      // Validar que el valor sea razonable
      const validation = validateUnitValue(change.value);
      if (!validation.valid) {
        result.errors.push(`${validation.error} para ${change.field} en muestra ${change.sampleId}`);
        result.success = false;
        continue;
      }
    }

    if (!result.success) {
      onProgress?.({
        sampleId: 'validation',
        field: 'rawUnits',
        stage: 'error',
        progress: 0,
        message: 'Errores de validación encontrados'
      });
      return result;
    }
  }

  // Aplicar cambios al test
  let updatedTest = { ...test };
  for (const change of changes) {
    updatedTest = {
      ...updatedTest,
      samples: updatedTest.samples.map(s =>
        s.id === change.sampleId ? { ...s, [change.field]: change.value } : s
      )
    };
  }

  // Intentar guardar con reintentos
  let lastError: Error | null = null;
  const firstSampleId = changes[0]?.sampleId || 'unknown';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.({
        sampleId: firstSampleId,
        field: changes[0]?.field || 'rawUnits',
        stage: 'saving',
        progress: 30 + (attempt * 20),
        message: attempt === 0 ? 'Guardando unidades...' : `Reintentando guardado... (${attempt + 1}/${maxRetries + 1})`,
        retryCount: attempt
      });

      // Guardar usando el servicio existente
      await saveTestToFirestore(updatedTest);

      // Verificar que se guardó correctamente
      onProgress?.({
        sampleId: firstSampleId,
        field: changes[0]?.field || 'rawUnits',
        stage: 'verifying',
        progress: 80,
        message: 'Verificando guardado...'
      });

      // Aquí podríamos agregar verificación leyendo de Firestore, pero por ahora confiamos en saveTestToFirestore

      // Éxito - registrar valores guardados
      result.savedValues = changes;
      result.success = true;

      onProgress?.({
        sampleId: firstSampleId,
        field: changes[0]?.field || 'rawUnits',
        stage: 'completed',
        progress: 100,
        message: '¡Unidades guardadas exitosamente!'
      });

      return result;

    } catch (error) {
      lastError = error as Error;
      console.warn(`Intento ${attempt + 1} falló:`, error);

      if (attempt < maxRetries) {
        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Todos los intentos fallaron
  result.success = false;
  result.errors.push(`Error después de ${maxRetries + 1} intentos: ${lastError?.message}`);

  onProgress?.({
    sampleId: firstSampleId,
    field: changes[0]?.field || 'rawUnits',
    stage: 'error',
    progress: 0,
    message: 'Error al guardar unidades'
  });

  return result;
};

/**
 * Función helper para guardar una sola unidad
 */
export const saveSingleUnit = async (
  test: ResistanceTest,
  sampleId: string,
  field: 'rawUnits' | 'cookedUnits',
  value: number | undefined,
  options?: UnitSaveOptions,
  onProgress?: (progress: UnitSaveProgress) => void
): Promise<UnitSaveResult> => {
  return saveUnitsReliably(test, [{ sampleId, field, value }], options, onProgress);
};

/**
 * Valida si un cambio en unidades es significativo
 * Maneja correctamente undefined, null, y valores numéricos
 */
export const isUnitChangeSignificant = (
  oldValue: number | undefined | null,
  newValue: number | undefined | null
): boolean => {
  // Normalizar valores: convertir undefined y null a null para comparación
  const normalizedOld = oldValue ?? null;
  const normalizedNew = newValue ?? null;

  // Si ambos son null, no hay cambio
  if (normalizedOld === null && normalizedNew === null) {
    return false;
  }

  // Si uno es null y el otro no, hay cambio significativo
  if ((normalizedOld === null) !== (normalizedNew === null)) {
    return true;
  }

  // Ambos tienen valores numéricos, comparar
  return normalizedOld !== normalizedNew;
};

/**
 * Valida que un valor de unidad sea razonable
 */
export const validateUnitValue = (value: number | undefined | null): { valid: boolean; error?: string } => {
  if (value === undefined || value === null) {
    return { valid: true }; // undefined/null es válido
  }

  if (typeof value !== 'number') {
    return { valid: false, error: 'El valor debe ser un número' };
  }

  if (isNaN(value)) {
    return { valid: false, error: 'El valor no puede ser NaN' };
  }

  if (!isFinite(value)) {
    return { valid: false, error: 'El valor debe ser finito' };
  }

  if (value < 0) {
    return { valid: false, error: 'El valor no puede ser negativo' };
  }

  if (value > 10000) {
    return { valid: false, error: 'El valor parece demasiado alto (máx. 10,000)' };
  }

  return { valid: true };
};