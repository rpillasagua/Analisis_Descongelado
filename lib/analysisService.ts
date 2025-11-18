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
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];
    
    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
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
      where('shift', '==', shift),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const analyses: QualityAnalysis[] = [];
    
    querySnapshot.forEach((doc) => {
      analyses.push(doc.data() as QualityAnalysis);
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

export default {
  saveAnalysis,
  updateAnalysis,
  getAnalysisById,
  getAnalysesByDate,
  getAnalysesByDateRange,
  getAnalysesByShift,
  deleteAnalysis,
  searchAnalyses
};
