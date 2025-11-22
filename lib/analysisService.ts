import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentReference,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { QualityAnalysis } from './types';
import { logger } from './logger';

const ANALYSES_COLLECTION = 'quality_analyses';
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Valida y obtiene la referencia al documento
 * Previene path traversal / "SQL Injection"
 */
const getAnalysisRef = (analysisId: string): DocumentReference => {
  if (!VALID_ID_REGEX.test(analysisId)) {
    throw new Error(`Invalid analysis ID format: ${analysisId}`);
  }
  return doc(db, ANALYSES_COLLECTION, analysisId);
};

/**
 * Limpia los datos para Firestore (convierte undefined a null)
 */
const cleanDataForFirestore = <T>(data: T): T | null => {
  if (data === undefined) {
    return null;
  }

  // Prevenir guardar URLs de blob (locales) en Firestore
  if (typeof data === 'string' && data.startsWith('blob:')) {
    logger.warn('⚠️ Detectada URL blob en guardado, ignorando para evitar enlaces rotos:', data);
    return null;
  }

  if (Array.isArray(data)) {
    return data.map(cleanDataForFirestore) as unknown as T;
  }

  if (data !== null && typeof data === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = cleanDataForFirestore(value);
    }
    return cleaned as T;
  }

  return data;
};

/**
 * Helper para obtener timestamp de forma segura (string o Firestore Timestamp)
 */
const getTimestampMillis = (val: string | Timestamp | undefined | unknown): number => {
  if (!val) return 0;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val === 'object' && 'toMillis' in val && typeof (val as Timestamp).toMillis === 'function') {
    return (val as Timestamp).toMillis();
  }
  return 0;
};

/**
 * Guarda un nuevo análisis en Firestore
 */
export const saveAnalysis = async (analysis: QualityAnalysis): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const analysisRef = getAnalysisRef(analysis.id);
    const cleanedAnalysis = cleanDataForFirestore({
      ...analysis,
      updatedAt: Timestamp.now()
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await setDoc(analysisRef, cleanedAnalysis as any);
    logger.log('✅ Análisis guardado:', analysis.codigo);
  } catch (error) {
    logger.error('❌ Error guardando análisis:', error);
    throw error;
  }
};

/**
 * Actualiza un análisis existente
 */
export const updateAnalysis = async (
  analysisId: string,
  updates: Partial<QualityAnalysis>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const analysisRef = getAnalysisRef(analysisId);
    const cleanedUpdates = cleanDataForFirestore({
      ...updates,
      updatedAt: Timestamp.now()
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(analysisRef, cleanedUpdates as any);
    logger.log('✅ Análisis actualizado:', analysisId);
  } catch (error) {
    logger.error('❌ Error actualizando análisis:', error);
    throw error;
  }
};

/**
 * Obtiene un análisis por ID
 */
export const getAnalysisById = async (analysisId: string): Promise<QualityAnalysis | null> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const analysisRef = getAnalysisRef(analysisId);
    const docSnap = await getDoc(analysisRef);

    if (docSnap.exists()) {
      return docSnap.data() as QualityAnalysis;
    }

    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo análisis:', error);
    throw error;
  }
};

/**
 * Obtiene todos los análisis de una fecha específica
 */
export const getAnalysesByDate = async (date: string): Promise<QualityAnalysis[]> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];

    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
    });

    // Ordenar en memoria por createdAt (más recientes primero)
    analyses.sort((a, b) => {
      return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
    });

    return analyses;
  } catch (error) {
    logger.error('❌ Error obteniendo análisis por fecha:', error);
    throw error;
  }
};

/**
 * Obtiene análisis por rango de fechas
 */
export const getAnalysesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<QualityAnalysis[]> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];

    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
    });

    return analyses;
  } catch (error) {
    logger.error('❌ Error obteniendo análisis por rango:', error);
    throw error;
  }
};

/**
 * Obtiene los análisis más recientes (sin filtrar por fecha)
 */
export const getRecentAnalyses = async (limitCount: number = 100): Promise<QualityAnalysis[]> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];

    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
    });

    return analyses;
  } catch (error) {
    logger.error('❌ Error obteniendo análisis recientes:', error);
    throw error;
  }
};

/**
 * Obtiene análisis paginados para infinite scroll
 */
export const getPaginatedAnalyses = async (
  limitCount: number = 20,
  lastDoc: QueryDocumentSnapshot | null = null
): Promise<{ analyses: QualityAnalysis[]; lastDoc: QueryDocumentSnapshot | null }> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    let q = query(
      collection(db, ANALYSES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];

    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
    });

    return {
      analyses,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
  } catch (error) {
    logger.error('❌ Error obteniendo análisis paginados:', error);
    throw error;
  }
};

/**
 * Obtiene análisis por turno
 */
export const getAnalysesByShift = async (
  date: string,
  shift: 'DIA' | 'NOCHE'
): Promise<QualityAnalysis[]> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('date', '==', date),
      where('shift', '==', shift)
    );

    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];

    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
    });

    // Ordenar en memoria por createdAt (más recientes primero)
    analyses.sort((a, b) => {
      return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
    });

    return analyses;
  } catch (error) {
    logger.error('❌ Error obteniendo análisis por turno:', error);
    throw error;
  }
};

/**
 * Elimina un análisis
 */
export const deleteAnalysis = async (analysisId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    const analysisRef = getAnalysisRef(analysisId);
    await deleteDoc(analysisRef);
    logger.log('✅ Análisis eliminado:', analysisId);
  } catch (error) {
    logger.error('❌ Error eliminando análisis:', error);
    throw error;
  }
};

/**
 * Busca análisis por código o lote
 */
export const searchAnalyses = async (searchTerm: string): Promise<QualityAnalysis[]> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }

  try {
    // Buscar por código
    const qCodigo = query(
      collection(db, ANALYSES_COLLECTION),
      where('codigo', '>=', searchTerm),
      where('codigo', '<=', searchTerm + '\uf8ff')
    );

    // Buscar por lote
    const qLote = query(
      collection(db, ANALYSES_COLLECTION),
      where('lote', '>=', searchTerm),
      where('lote', '<=', searchTerm + '\uf8ff')
    );

    const [codigoSnapshot, loteSnapshot] = await Promise.all([
      getDocs(qCodigo),
      getDocs(qLote)
    ]);

    const analyses: QualityAnalysis[] = [];
    const seenIds = new Set<string>();

    codigoSnapshot.forEach((doc) => {
      const data = doc.data() as QualityAnalysis;
      if (!seenIds.has(data.id)) {
        analyses.push(data);
        seenIds.add(data.id);
      }
    });

    loteSnapshot.forEach((doc) => {
      const data = doc.data() as QualityAnalysis;
      if (!seenIds.has(data.id)) {
        analyses.push(data);
        seenIds.add(data.id);
      }
    });

    return analyses;
  } catch (error) {
    logger.error('❌ Error buscando análisis:', error);
    throw error;
  }
};

/**
 * Renueva permisos de fotos en un análisis existente
 * Útil para arreglar problemas de permisos expirados
 */
export const renewAnalysisPhotoPermissions = async (analysisId: string): Promise<void> => {
  try {
    logger.log(`🔄 Renovando permisos de fotos para análisis: ${analysisId}`);

    // Obtener el análisis
    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error(`Análisis ${analysisId} no encontrado`);
    }

    // Extraer todas las URLs de fotos
    const photoUrls: string[] = [];

    // Fotos principales - acceder desde analyses[0] (nueva estructura)
    const firstAnalysis = analysis.analyses?.[0];
    if (firstAnalysis?.fotoCalidad) photoUrls.push(firstAnalysis.fotoCalidad);
    if (firstAnalysis?.pesoBruto?.fotoUrl) photoUrls.push(firstAnalysis.pesoBruto.fotoUrl);
    if (firstAnalysis?.pesoCongelado?.fotoUrl) photoUrls.push(firstAnalysis.pesoCongelado.fotoUrl);
    if (firstAnalysis?.pesoNeto?.fotoUrl) photoUrls.push(firstAnalysis.pesoNeto.fotoUrl);

    // Fotos de uniformidad
    if (firstAnalysis?.uniformidad?.grandes?.fotoUrl) photoUrls.push(firstAnalysis.uniformidad.grandes.fotoUrl);
    if (firstAnalysis?.uniformidad?.pequenos?.fotoUrl) photoUrls.push(firstAnalysis.uniformidad.pequenos.fotoUrl);

    // Fotos de pesos brutos
    if (firstAnalysis?.pesosBrutos) {
      firstAnalysis.pesosBrutos.forEach(peso => {
        if (peso.fotoUrl) photoUrls.push(peso.fotoUrl);
      });
    }

    // Filtrar solo URLs de Google Drive
    const driveUrls = photoUrls.filter(url => url && url.includes('drive.google.com'));

    if (driveUrls.length === 0) {
      logger.info('ℹ️ No se encontraron URLs de Google Drive en este análisis');
      return;
    }

    logger.log(`📸 Encontradas ${driveUrls.length} URLs de Google Drive`);

    // Importar servicio de Google Drive
    const { googleDriveService } = await import('./googleDriveService');

    // Extraer IDs de archivos
    const fileIds = googleDriveService.extractFileIdsFromUrls(driveUrls);
    logger.log(`🆔 Extraídos ${fileIds.length} IDs únicos de archivos`);

    // Renovar permisos
    await googleDriveService.renewPublicPermissions(fileIds);

    logger.log('✅ Permisos de fotos renovados exitosamente');
  } catch (error) {
    logger.error('❌ Error renovando permisos de fotos:', error);
    throw error;
  }
};

export default {
  saveAnalysis,
  updateAnalysis,
  getAnalysisById,
  getAnalysesByDate,
  getAnalysesByDateRange,
  getRecentAnalyses,
  getPaginatedAnalyses,
  getAnalysesByShift,
  deleteAnalysis,
  searchAnalyses,
  renewAnalysisPhotoPermissions
};
