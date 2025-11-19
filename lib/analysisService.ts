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
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { QualityAnalysis } from './types';

const ANALYSES_COLLECTION = 'quality_analyses';

/**
 * Limpia los datos para Firestore (convierte undefined a null)
 */
const cleanDataForFirestore = (data: any): any => {
  if (data === undefined) {
    return null;
  }
  
  // Prevenir guardar URLs de blob (locales) en Firestore
  if (typeof data === 'string' && data.startsWith('blob:')) {
    console.warn('⚠️ Detectada URL blob en guardado, ignorando para evitar enlaces rotos:', data);
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataForFirestore);
  }
  
  if (data !== null && typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = cleanDataForFirestore(value);
    }
    return cleaned;
  }
  
  return data;
};

/**
 * Guarda un nuevo análisis en Firestore
 */
export const saveAnalysis = async (analysis: QualityAnalysis): Promise<void> => {
  if (!db) {
    throw new Error('Firestore no está configurado');
  }
  
  try {
    const analysisRef = doc(db, ANALYSES_COLLECTION, analysis.id);
    const cleanedAnalysis = cleanDataForFirestore({
      ...analysis,
      updatedAt: Timestamp.now()
    });
    
    await setDoc(analysisRef, cleanedAnalysis);
    console.log('✅ Análisis guardado:', analysis.codigo);
  } catch (error) {
    console.error('❌ Error guardando análisis:', error);
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
    const analysisRef = doc(db, ANALYSES_COLLECTION, analysisId);
    const cleanedUpdates = cleanDataForFirestore({
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    await updateDoc(analysisRef, cleanedUpdates);
    console.log('✅ Análisis actualizado:', analysisId);
  } catch (error) {
    console.error('❌ Error actualizando análisis:', error);
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
    const analysisRef = doc(db, ANALYSES_COLLECTION, analysisId);
    const docSnap = await getDoc(analysisRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as QualityAnalysis;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo análisis:', error);
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
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 
                    (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 
                    (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return timeB - timeA;
    });
    
    return analyses;
  } catch (error) {
    console.error('❌ Error obteniendo análisis por fecha:', error);
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
    console.error('❌ Error obteniendo análisis por rango:', error);
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
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 
                    (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 
                    (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return timeB - timeA;
    });
    
    return analyses;
  } catch (error) {
    console.error('❌ Error obteniendo análisis por turno:', error);
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
    const analysisRef = doc(db, ANALYSES_COLLECTION, analysisId);
    await deleteDoc(analysisRef);
    console.log('✅ Análisis eliminado:', analysisId);
  } catch (error) {
    console.error('❌ Error eliminando análisis:', error);
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
    console.error('❌ Error buscando análisis:', error);
    throw error;
  }
};

/**
 * Renueva permisos de fotos en un análisis existente
 * Útil para arreglar problemas de permisos expirados
 */
export const renewAnalysisPhotoPermissions = async (analysisId: string): Promise<void> => {
  try {
    console.log(`🔄 Renovando permisos de fotos para análisis: ${analysisId}`);
    
    // Obtener el análisis
    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error(`Análisis ${analysisId} no encontrado`);
    }
    
    // Extraer todas las URLs de fotos
    const photoUrls: string[] = [];
    
    // Fotos principales
    if (analysis.fotoCalidad) photoUrls.push(analysis.fotoCalidad);
    if (analysis.pesoBruto?.fotoUrl) photoUrls.push(analysis.pesoBruto.fotoUrl);
    if (analysis.pesoCongelado?.fotoUrl) photoUrls.push(analysis.pesoCongelado.fotoUrl);
    if (analysis.pesoNeto?.fotoUrl) photoUrls.push(analysis.pesoNeto.fotoUrl);
    
    // Fotos de uniformidad
    if (analysis.uniformidad?.grandes?.fotoUrl) photoUrls.push(analysis.uniformidad.grandes.fotoUrl);
    if (analysis.uniformidad?.pequenos?.fotoUrl) photoUrls.push(analysis.uniformidad.pequenos.fotoUrl);
    
    // Fotos de pesos brutos
    if (analysis.pesosBrutos) {
      analysis.pesosBrutos.forEach(peso => {
        if (peso.fotoUrl) photoUrls.push(peso.fotoUrl);
      });
    }
    
    // Filtrar solo URLs de Google Drive
    const driveUrls = photoUrls.filter(url => url && url.includes('drive.google.com'));
    
    if (driveUrls.length === 0) {
      console.log('ℹ️ No se encontraron URLs de Google Drive en este análisis');
      return;
    }
    
    console.log(`📸 Encontradas ${driveUrls.length} URLs de Google Drive`);
    
    // Importar servicio de Google Drive
    const { googleDriveService } = await import('./googleDriveService');
    
    // Extraer IDs de archivos
    const fileIds = googleDriveService.extractFileIdsFromUrls(driveUrls);
    console.log(`🆔 Extraídos ${fileIds.length} IDs únicos de archivos`);
    
    // Renovar permisos
    await googleDriveService.renewPublicPermissions(fileIds);
    
    console.log('✅ Permisos de fotos renovados exitosamente');
  } catch (error) {
    console.error('❌ Error renovando permisos de fotos:', error);
    throw error;
  }
};

export default {
  saveAnalysis,
  updateAnalysis,
  getAnalysisById,
  getAnalysesByDate,
  getAnalysesByDateRange,
  getAnalysesByShift,
  deleteAnalysis,
  searchAnalyses,
  renewAnalysisPhotoPermissions
};
