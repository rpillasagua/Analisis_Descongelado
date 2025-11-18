import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ResistanceTest, DualSaveResult } from './types';
import { saveTestBackupJSON, loadTestFromJSON } from './graphService';
import { 
  saveTestLocally, 
  markPendingSync, 
  removePendingSync,
  getAllTestsLocally,
  getPendingSyncTests,
  getTestLocally,
  deleteTestLocally,
  saveLastSyncTimestamp,
  getLastSyncTimestamp,
  cleanOldTestsFromLocal,
  saveTestsBatch,
  cleanOldMetadataRecords
} from './localStorageService';

const TESTS_COLLECTION = 'resistance_tests';

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
 * Guarda o actualiza una prueba en Firestore (con respaldo local automático)
 */
export const saveTestToFirestore = async (test: ResistanceTest): Promise<void> => {
  // ✅ VALIDACIÓN CRÍTICA: Asegurar que testType no sea undefined
  if (!test.testType || (test.testType !== 'MATERIA_PRIMA' && test.testType !== 'PRODUCTO_TERMINADO')) {
    console.error('❌ CRÍTICO: testType inválido o faltante en test:', test);
    console.error('    ID:', test.id);
    console.error('    testType:', test.testType);
    // Intentar recuperar del contexto o asignar valor por defecto
    test.testType = 'MATERIA_PRIMA';
    console.warn('⚠️ testType asignado por defecto: MATERIA_PRIMA');
  }
  
  // SIEMPRE guardar localmente primero (nunca se pierde)
  try {
    await saveTestLocally(test);
    console.log('💾 Guardado local exitoso:', test.lotNumber, '(testType:', test.testType, ')');
  } catch (localError) {
    console.error('❌ Error en guardado local:', localError);
    // Continuar intentando Firestore aunque falle local
  }

  // Intentar guardar en Firestore
  if (!db) {
    console.warn('⚠️ Firestore no está configurado. Solo se guardó localmente.');
    await markPendingSync(test.id);
    return;
  }
  
  try {
    console.log('☁️ Sincronizando con Firestore:', test.lotNumber, '(testType:', test.testType, ')');
    const testRef = doc(db, TESTS_COLLECTION, test.id);
    
    // Limpiar datos antes de guardar
    const cleanedTest = cleanDataForFirestore({
      ...test,
      updatedAt: Timestamp.now()
    });
    
    await setDoc(testRef, cleanedTest);
    console.log(`✅ Prueba ${test.lotNumber} sincronizada con Firestore (testType: ${test.testType})`);
    
    // Remover de cola de sincronización si estaba pendiente
    await removePendingSync(test.id);
    
  } catch (error: any) {
    console.error('❌ Error al sincronizar con Firestore:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    
    // Marcar como pendiente de sincronización
    await markPendingSync(test.id);
    console.log('📌 Datos guardados localmente, se sincronizarán cuando haya conexión');
    
    // Solo mostrar alerta en caso de error grave, no por falta de conexión
    if (error.code === 'permission-denied') {
      console.warn('⚠️ Permiso denegado. Datos guardados localmente.');
    } else if (error.code === 'unavailable' || error.message.includes('network')) {
      console.log('📡 Sin conexión. Datos guardados localmente.');
    } else {
      console.warn(`⚠️ Error: ${error.message}. Datos guardados localmente.`);
    }
    
    // NO lanzar error - los datos están seguros localmente
  }
};

/**
 * Limpia los datos cuando vienen de Firestore (convierte null a undefined)
 * ✅ CORREGIDO: Preserva valores primitivos (0, false, '') que son válidos
 */
const cleanDataFromFirestore = (data: any): any => {
  // Null o undefined → undefined
  if (data === null || data === undefined) {
    return undefined;
  }
  
  // ✅ IMPORTANTE: Preservar valores primitivos válidos (0, false, '')
  // Estos son valores legítimos, NO deben ser filtrados
  if (typeof data === 'number' || typeof data === 'boolean' || typeof data === 'string') {
    return data;
  }
  
  // Arrays: limpiar cada elemento (pero preservar arrays vacíos válidos)
  if (Array.isArray(data)) {
    return data.map(cleanDataFromFirestore);
  }
  
  // Objetos: limpiar recursivamente
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanDataFromFirestore(value);
      // Incluir el campo incluso si es 0, false, o ''
      // Solo excluir undefined
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return data;
};

/**
 * Obtiene las pruebas en progreso (no completadas)
 * ✅ OPTIMIZADO: Lee de cache local (0 consultas Firestore)
 */
export const getInProgressTests = async (): Promise<ResistanceTest[]> => {
  // ✅ OPTIMIZACIÓN: Leer de cache local (ya sincronizado incrementalmente)
  try {
    const allLocalTests = await getAllTestsLocally();
    const inProgressTests = allLocalTests.filter(t => !t.isCompleted);
    
    console.log(`✅ ${inProgressTests.length} pruebas en progreso (desde cache local)`);
    return inProgressTests;
  } catch (error: any) {
    console.error('❌ Error al cargar desde local:', error);
    return [];
  }
};

/**
 * Obtiene las pruebas de un día específico
 * ✅ ARREGLADO: Usa UTC para garantizar correcta zona horaria
 */
export const getTestsByDate = async (date: string): Promise<ResistanceTest[]> => {
  try {
    // Parsear fecha en UTC (date viene como "2025-10-18")
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1));
    
    const startDateStr = startDate.toISOString().split('T')[0]; // "2025-10-18"
    const endDateStr = endDate.toISOString().split('T')[0];     // "2025-10-19"

    const testsRef = collection(db, TESTS_COLLECTION);
    const q = query(
      testsRef,
      where('date', '>=', startDateStr),
      where('date', '<', endDateStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];
    
    console.log(`✅ ${tests.length} pruebas encontradas para ${date} (UTC correcto)`);
    return tests;
  } catch (error: any) {
    console.error('❌ Error al buscar pruebas por fecha:', error);
    throw new Error(`Error al buscar: ${error.message}`);
  }
};

/**
 * Obtiene TODAS las resistencias con SINCRONIZACIÓN INCREMENTAL
 * - Carga primero desde cache local (INSTANTÁNEO)
 * - Luego sincroniza solo los cambios nuevos en background
 * - Mantiene máximo 50 tests en cache
 */
export const getAllTests = async (): Promise<ResistanceTest[]> => {
  // 0. Limpiar metadata antigua de v1 (migración automática)
  cleanOldMetadataRecords().catch(err => {
    console.error('⚠️ Error limpiando metadata antigua:', err);
  });

  // 1. Cargar inmediatamente desde cache local (respuesta instantánea)
  let cachedTests: ResistanceTest[] = [];
  try {
    cachedTests = await getAllTestsLocally();
    console.log(`📦 ${cachedTests.length} tests cargados desde cache local`);
  } catch (error) {
    console.error('❌ Error cargando cache:', error);
  }

  // 2. Sincronizar cambios en background (sin bloquear UI)
  if (db) {
    syncIncrementalChanges().catch(err => {
      console.error('⚠️ Error en sincronización incremental:', err);
    });
  }

  return cachedTests;
};

/**
 * Sincronización incremental: Solo descarga tests nuevos o modificados
 * ✅ OPTIMIZADO: Retorna true si hubo cambios
 */
export const syncIncrementalChanges = async (): Promise<boolean> => {
  try {
    // Obtener timestamp de última sincronización
    const lastSync = await getLastSyncTimestamp();
    const now = new Date().toISOString();

    console.log('🔄 Iniciando sincronización incremental...');
    console.log('⏱️ Última sincronización:', lastSync || 'Primera vez');

    if (!db) {
      console.warn('⚠️ Firestore no disponible');
      return false;
    }

    const testsRef = collection(db, TESTS_COLLECTION);
    let q;

    if (lastSync) {
      // Solo obtener tests creados/modificados después del último sync
      q = query(
        testsRef,
        where('updatedAt', '>', lastSync),
        orderBy('updatedAt', 'desc')
      );
      console.log(`🔍 Buscando cambios desde ${lastSync}`);
    } else {
      // Primera sincronización: obtener los últimos 50
      q = query(
        testsRef,
        orderBy('date', 'desc')
      );
      console.log('🔍 Primera sincronización: cargando últimos 50 tests');
    }

    const snapshot = await getDocs(q);
    const newTests = snapshot.docs.map(doc => cleanDataFromFirestore({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];

    if (newTests.length === 0) {
      console.log('✅ Sin cambios nuevos');
      await saveLastSyncTimestamp(now);
      return false; // ✅ No hubo cambios
    }

    console.log(`📥 Descargados ${newTests.length} tests nuevos/modificados`);

    // Guardar tests nuevos en IndexedDB local (BATCH para mayor velocidad)
    if (newTests.length > 0) {
      await saveTestsBatch(newTests);
    }

    // Limpiar tests antiguos (mantener solo últimos 50 en IndexedDB)
    const deletedCount = await cleanOldTestsFromLocal();
    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} tests antiguos eliminados del almacenamiento local`);
    }

    // Actualizar timestamp de sincronización
    await saveLastSyncTimestamp(now);

    console.log(`✅ Sincronización completada. IndexedDB actualizado.`);
    return true; // ✅ Hubo cambios
  } catch (error: any) {
    console.error('❌ Error en sincronización incremental:', error);
    return false;
  }
};

/**
 * Busca pruebas por múltiples criterios
 * ✅ OPTIMIZADO: Busca en cache local primero, fallback a Firestore si no encuentra
 */
export const searchTests = async (
  searchTerm: string, 
  searchInFirestore = false
): Promise<ResistanceTest[]> => {
  
  // 1. ✅ Buscar en cache local SIEMPRE primero (instantáneo)
  try {
    const allTests = await getAllTestsLocally();
    
    // Filtrado en cliente para búsqueda flexible
    const cachedResults = allTests.filter(test => 
      test.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.pool.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`🔍 ${cachedResults.length} pruebas encontradas para "${searchTerm}" (desde cache local)`);
    
    // Si encuentra resultados en cache, retornar
    if (cachedResults.length > 0) {
      return cachedResults;
    }
    
    // 2. ✅ Si NO encuentra Y usuario quiere buscar en Firestore
    if (searchInFirestore && db) {
      console.log('🌐 Buscando en Firestore (histórico completo)...');
      
      try {
        const testsRef = collection(db, TESTS_COLLECTION);
        
        // Búsqueda por número de lote (más común y eficiente)
        const q = query(
          testsRef,
          where('lotNumber', '>=', searchTerm.toUpperCase()),
          where('lotNumber', '<=', searchTerm.toUpperCase() + '\uf8ff'),
          orderBy('lotNumber'),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const firestoreResults = snapshot.docs.map(doc => cleanDataFromFirestore({
          ...doc.data(),
          id: doc.id
        })) as ResistanceTest[];
        
        console.log(`📥 ${firestoreResults.length} pruebas encontradas en Firestore`);
        
        // Guardar resultados en cache para próxima vez
        if (firestoreResults.length > 0) {
          await saveTestsBatch(firestoreResults);
          console.log('💾 Resultados guardados en cache local');
        }
        
        return firestoreResults;
      } catch (error: any) {
        console.error('❌ Error al buscar en Firestore:', error);
        return [];
      }
    }
    
    // No se encontró nada
    return [];
    
  } catch (error: any) {
    console.error('❌ Error al buscar en local:', error);
    return [];
  }
};

/**
 * Obtiene una prueba por ID
 * ✅ OPTIMIZADO: Lee de cache local primero, Firestore solo si no existe
 */
export const getTestById = async (id: string): Promise<ResistanceTest | null> => {
  // ✅ OPTIMIZACIÓN: Intentar leer de cache local primero (95% de casos)
  try {
    const test = await getTestLocally(id);
    if (test) {
      console.log(`✅ Test ${id} cargado desde cache local`);
      return test;
    }
  } catch (error: any) {
    console.error('❌ Error al obtener desde local:', error);
  }

  // Solo si NO está en cache, consultar Firestore
  if (db) {
    try {
      const testRef = doc(db, TESTS_COLLECTION, id);
      const snapshot = await getDoc(testRef);
      
      if (snapshot.exists()) {
        const firestoreTest = cleanDataFromFirestore({ 
          ...snapshot.data(), 
          id: snapshot.id 
        }) as ResistanceTest;
        
        console.log(`✅ Test ${id} cargado desde Firestore (guardando en cache)`);
        
        // Guardar en cache para próxima vez
        await saveTestLocally(firestoreTest);
        
        return firestoreTest;
      }
    } catch (error: any) {
      console.error('❌ Error al obtener desde Firestore:', error);
    }
  }

  console.warn(`⚠️ Test ${id} no encontrado`);
  return null;
};

/**
 * Marca una prueba como completada
 * ✅ OPTIMIZADO: Actualiza cache local primero, luego Firestore
 */
export const markTestAsCompleted = async (testId: string): Promise<void> => {
  // 1. ✅ Obtener test de cache local
  const test = await getTestLocally(testId);
  if (!test) {
    throw new Error('Test no encontrado en cache local');
  }

  // 2. ✅ Actualizar cache local PRIMERO
  const updatedTest: ResistanceTest = {
    ...test,
    isCompleted: true,
    completedAt: new Date().toISOString()
  };

  try {
    await saveTestLocally(updatedTest);
    console.log(`✅ Test ${testId} marcado como completado localmente`);
  } catch (localError) {
    console.error('❌ Error actualizando cache local:', localError);
    throw localError;
  }

  // 3. ✅ Sincronizar con Firestore (si hay conexión)
  if (!db) {
    console.warn('⚠️ Firestore no disponible. Cambio guardado localmente.');
    await markPendingSync(testId);
    return;
  }

  try {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      isCompleted: true,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()  // ✅ CRÍTICO para sync incremental
    });
    console.log(`☁️ Test ${testId} sincronizado con Firestore`);
  } catch (error: any) {
    console.error('❌ Error sincronizando con Firestore:', error);
    // Marcar para sincronización posterior
    await markPendingSync(testId);
    console.log('📌 Cambio guardado localmente, se sincronizará cuando haya conexión');
    // NO lanzar error - el cambio ya está guardado localmente
  }
};

/**
 * NOTA: Las fotos ahora se suben SOLO a OneDrive (no a Firebase Storage)
 * Ver graphService.ts -> uploadPhotoToOneDrive()
 */

// /**
//  * Sube una foto a Firebase Storage (DESHABILITADO - Ahora se usa OneDrive)
//  */
// export const uploadPhotoToStorage = async (
//   testId: string,
//   sampleId: string,
//   photoBlob: Blob
// ): Promise<string> => {
//   try {
//     // Importación dinámica solo en el cliente
//     if (typeof window === 'undefined') {
//       throw new Error('Storage solo está disponible en el cliente');
//     }
//     
//     const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
//     
//     const fileName = `${testId}/${sampleId}.jpg`;
//     const storageRef = ref(storage, `resistance_tests/${fileName}`);
//     
//     await uploadBytes(storageRef, photoBlob);
//     const url = await getDownloadURL(storageRef);
//     
//     console.log(`✅ Foto subida: ${fileName}`);
//     return url;
//   } catch (error: any) {
//     console.error('❌ Error al subir foto:', error);
//     throw new Error(`Error al subir foto: ${error.message}`);
//   }
// };

/**
 * Utilidad para obtener el día siguiente
 */
/**
 * Obtiene el siguiente día en formato YYYY-MM-DD (UTC correcto)
 * ✅ Usa UTC para evitar problemas de zona horaria
 */
const getNextDay = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().split('T')[0];
};

/**
 * Elimina una resistencia de Firestore Y del almacenamiento local
 */
export const deleteTest = async (
  testId: string, 
  lotNumber?: string, 
  testType?: import('./types').TestType
): Promise<void> => {
  // Eliminar de local primero (siempre)
  try {
    await deleteTestLocally(testId);
    console.log(`✅ Test ${testId} eliminado del almacenamiento local`);
  } catch (localError) {
    console.error('❌ Error eliminando de local:', localError);
  }

  // Intentar eliminar de Firestore
  if (!db) {
    console.warn('⚠️ Firestore no está configurado. Solo se eliminó localmente.');
    return;
  }
  
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(testRef);
    console.log(`✅ Test ${testId} eliminado de Firestore`);
  } catch (error: any) {
    console.error('❌ Error al eliminar de Firestore:', error);
    console.warn('⚠️ Test eliminado localmente, pero no de Firestore');
    // No lanzar error - el test ya fue eliminado localmente
  }

  // Intentar eliminar carpeta de Google Drive si se proporcionan los datos
  if (lotNumber && testType) {
    try {
      // Usar la API de Drive para eliminar archivos
      const response = await fetch(`/api/drive/lot?lotNumber=${encodeURIComponent(lotNumber)}&testType=${testType}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log(`✅ Carpeta ${lotNumber} eliminada de Google Drive`);
      } else {
        console.warn('⚠️ No se pudo eliminar de Google Drive');
      }
    } catch (driveError: any) {
      console.error('❌ Error al eliminar de Google Drive:', driveError);
      console.warn('⚠️ Test eliminado de Firestore, pero no de Google Drive');
      // No lanzar error - el test ya fue eliminado de Firestore
    }
  } else {
    console.warn('ℹ️ No se eliminó de Google Drive (faltan parámetros)');
  }
};

/**
 * Sincroniza todos los datos locales pendientes con Firestore
 * Se llama automáticamente al iniciar la app o cuando se recupera la conexión
 */
export const syncPendingData = async (): Promise<number> => {
  if (!db) {
    console.log('⏸️ Firestore no disponible, sincronización pospuesta');
    return 0;
  }

  try {
    const pendingTests = await getPendingSyncTests();
    
    if (pendingTests.length === 0) {
      console.log('✅ No hay datos pendientes de sincronización');
      return 0;
    }

    console.log(`🔄 Sincronizando ${pendingTests.length} tests pendientes...`);
    let syncedCount = 0;

    for (const test of pendingTests) {
      try {
        const testRef = doc(db, TESTS_COLLECTION, test.id);
        const cleanedTest = cleanDataForFirestore({
          ...test,
          updatedAt: Timestamp.now()
        });
        
        await setDoc(testRef, cleanedTest);
        await removePendingSync(test.id);
        syncedCount++;
        console.log(`✅ Sincronizado: ${test.lotNumber}`);
      } catch (error: any) {
        console.error(`❌ Error sincronizando ${test.lotNumber}:`, error);
        // Continuar con los demás tests aunque uno falle
      }
    }

    console.log(`✅ Sincronización completada: ${syncedCount}/${pendingTests.length} tests`);
    return syncedCount;
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return 0;
  }
};

// ============================================
// SISTEMA HÍBRIDO - FUNCIONES DUALES
// ============================================

import { 
  ResistanceTestIndex 
} from './types';

/**
 * Generar checksum para validación de integridad
 * Simple hash para verificar que los datos son idénticos
 */
export const generateChecksum = (test: ResistanceTest): string => {
  const testString = JSON.stringify(test, Object.keys(test).sort());
  let hash = 0;
  for (let i = 0; i < testString.length; i++) {
    const char = testString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

/**
 * CARGA HÍBRIDA DUAL
 * ==================
 * Lee datos de sistema nuevo (índice) + sistema viejo (completo)
 * GARANTIZA que TODOS los datos actuales se vean
 * 
 * Flujo:
 * 1. Cargar tests migrados (índice híbrido)
 * 2. Cargar tests NO migrados (Firebase legacy)
 * 3. Combinar y retornar TODO
 */
export const loadTestsHybridDual = async (
  instance: any,
  scopes: string[]
): Promise<ResistanceTest[]> => {
  console.log('🔄 Cargando tests desde Firebase con respaldos en OneDrive...');
  
  try {
    // 1. Cargar TODOS los tests desde Firebase (source of truth)
    const testsRef = collection(db, 'resistance_tests');
    const testsSnapshot = await getDocs(
      query(testsRef, orderBy('date', 'desc'))
    );
    
    if (testsSnapshot.size === 0) {
      console.log('No hay tests en Firebase');
      return [];
    }
    
    console.log(`${testsSnapshot.size} tests encontrados en Firebase`);
    
    const allTests = testsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ResistanceTest[];
    
    // 2. Verificar que tienen testType
    const withTestType = allTests.filter(t => t.testType);
    const withoutTestType = allTests.filter(t => !t.testType);
    
    console.log(`✅ ${withTestType.length} tests con testType`);
    if (withoutTestType.length > 0) {
      console.log(`⚠️ ${withoutTestType.length} tests sin testType`);
    }
    
    // 3. Guardar en cache para uso offline
    await saveTestsBatch(allTests);
    console.log(`💾 ${allTests.length} tests guardados en cache local`);
    
    // 4. OPTIMIZACIÓN: Guardar automáticamente JSON faltantes en background
    // (No bloquea el flujo principal, solo crea los JSON que falten)
    if (instance && withTestType.length > 0) {
      console.log(`🔄 Verificando JSON faltantes en OneDrive...`);
      // Ejecutar en background sin await
      createMissingJSONBackups(instance, scopes, withTestType).catch(err => {
        console.warn(`⚠️ Error creando JSON faltantes:`, err);
      });
    }
    
    return allTests;
    
  } catch (error) {
    console.error('❌ Error en carga dual:', error);
    
    // FALLBACK: Cargar solo desde cache local
    console.warn('⚠️ Fallback a cache local');
    return getAllTestsLocally();
  }
};

/**
 * Crea automáticamente los JSON que faltan en OneDrive (background)
 * No bloquea - se ejecuta en segundo plano
 */
const createMissingJSONBackups = async (
  instance: any,
  scopes: string[],
  tests: ResistanceTest[]
): Promise<void> => {
  console.log(`🔍 Verificando ${tests.length} tests para JSON faltantes...`);
  
  let created = 0;
  for (const test of tests) {
    try {
      // Verificar si existe en índice
      const indexRef = doc(db, 'test_index', test.id);
      const indexDoc = await getDoc(indexRef);
      
      // Si NO está en índice o NO tiene jsonPath, crear JSON
      if (!indexDoc.exists() || !indexDoc.data()?.jsonPath) {
        console.log(`📝 Creando JSON faltante para: ${test.lotNumber}`);
        
        const jsonResult = await saveTestBackupJSON(instance, scopes, test);
        
        if (jsonResult.success) {
          // Crear/actualizar índice
          await setDoc(indexRef, {
            id: test.id,
            lotNumber: test.lotNumber,
            date: test.date,
            testType: test.testType,
            isCompleted: test.isCompleted,
            jsonPath: jsonResult.jsonPath,
            updatedAt: Timestamp.now(),
            savedToOneDrive: true
          }, { merge: true });
          
          created++;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ Error procesando ${test.lotNumber}:`, error.message);
      // Continuar con siguientes
    }
  }
  
  if (created > 0) {
    console.log(`✅ ${created} JSON faltantes creados automáticamente`);
  }
};

/**
 * FUNCIÓN LEGACY (mantener como fallback)
 * Carga tests solo desde Firebase legacy
 */
const loadTestsLegacy = async (): Promise<ResistanceTest[]> => {
  const legacyRef = collection(db, 'resistance_tests');
  const snapshot = await getDocs(query(legacyRef, orderBy('date', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResistanceTest));
};

/**
 * Carga un test individual desde el índice híbrido
 * Estrategia de fallback:
 * 1. Busca en índice
 * 2. Si hay ruta JSON, intenta cargar desde OneDrive
 * 3. Si NO hay JSON o falla, carga desde Firebase
 * 4. Si carga desde Firebase, GUARDA AUTOMÁTICAMENTE el JSON que faltaba
 */
export const loadTestFromIndex = async (
  instance: any,
  scopes: string[],
  testId: string
): Promise<ResistanceTest | null> => {
  try {
    console.log(`🔍 Buscando test ${testId} en índice híbrido...`);
    
    // 1. Buscar en índice
    const indexRef = doc(db, 'test_index', testId);
    const indexDoc = await getDoc(indexRef);
    
    let testData: ResistanceTest | null = null;
    let loadedFromJSON = false;
    
    // 2a. Si existe en índice e indica que hay JSON
    if (indexDoc.exists()) {
      const indexData = indexDoc.data();
      console.log(`✅ Test encontrado en índice`);
      
      if (indexData?.jsonPath && indexData?.savedToOneDrive) {
        try {
          console.log(`📖 Intentando cargar desde JSON: ${indexData.jsonPath}`);
          testData = await loadTestFromJSON(instance, scopes, indexData.jsonPath);
          loadedFromJSON = true;
          console.log(`✅ Test cargado desde JSON en OneDrive`);
        } catch (error: any) {
          console.warn(`⚠️ JSON no disponible o corrupto, usando Firebase:`, error.message);
          testData = null; // Forzar cargar desde Firebase
        }
      }
    }
    
    // 2b. Si NO cargó desde JSON, cargar desde Firebase
    if (!testData) {
      console.log(`📊 Cargando desde Firebase...`);
      const testRef = doc(db, 'resistance_tests', testId);
      const testDoc = await getDoc(testRef);
      
      if (testDoc.exists()) {
        testData = { id: testDoc.id, ...testDoc.data() } as ResistanceTest;
        console.log(`✅ Test cargado desde Firebase`);
        
        // 3. Si cargó desde Firebase pero NO tenía JSON, GUARDAR JSON AUTOMÁTICAMENTE
        if (!loadedFromJSON && instance) {
          try {
            console.log(`💾 Guardando JSON que faltaba en OneDrive...`);
            const jsonResult = await saveTestBackupJSON(instance, scopes, testData);
            
            if (jsonResult.success) {
              // Actualizar índice con la nueva ruta JSON
              const indexRef = doc(db, 'test_index', testId);
              await setDoc(indexRef, {
                id: testData.id,
                lotNumber: testData.lotNumber,
                date: testData.date,
                testType: testData.testType,
                isCompleted: testData.isCompleted,
                jsonPath: jsonResult.jsonPath,
                updatedAt: Timestamp.now(),
                savedToOneDrive: true
              }, { merge: true });
              
              console.log(`✅ JSON guardado y índice actualizado`);
            }
          } catch (error: any) {
            console.warn(`⚠️ No se pudo guardar JSON (pero Firebase tiene los datos):`, error.message);
            // No es crítico - Firebase tiene los datos
          }
        }
      }
    }
    
    // 4. Guardar en cache local (siempre)
    if (testData) {
      await saveTestLocally(testData);
      return testData;
    }
    
    console.warn(`⚠️ Test ${testId} no encontrado en ningún lado`);
    return null;
    
  } catch (error: any) {
    console.error(`❌ Error cargando test desde índice:`, error);
    return null;
  }
};

/**
 * GUARDADO DUAL (Durante migración)
 * ==================================
 * Guarda en sistema híbrido Y sistema legacy
 * GARANTÍA: Si falla híbrido, legacy tiene los datos
 * 
 * Flujo:
 * 1. Guardar en cache local (SIEMPRE primero)
 * 2. Guardar en Firebase legacy (garantía de seguridad)
 * 3. Guardar en sistema híbrido (nuevo)
 */
export const saveTestHybridDual = async (
  instance: any,
  scopes: string[],
  test: ResistanceTest
): Promise<DualSaveResult> => {
  const result: DualSaveResult = {
    success: true,
    errors: [],
    savedToLocal: false,
    savedToLegacy: false,
    savedToHybrid: false,
  };
  
  console.log(`💾 Guardando test ${test.id} en modo dual...`);
  
  // 1. GUARDAR EN CACHE LOCAL (SIEMPRE primero)
  try {
    await saveTestLocally(test);
    result.savedToLocal = true;
    console.log('Guardado en cache local');
  } catch (error: any) {
    result.errors.push(`Cache local: ${error.message}`);
    console.error('Error guardando en cache local:', error);
  }
  
  // 2. GUARDAR EN SISTEMA LEGACY (Garantía de seguridad)
  try {
    const legacyRef = doc(db, 'resistance_tests', test.id);
    await setDoc(legacyRef, cleanDataForFirestore({
      ...test,
      updatedAt: Timestamp.now()
    }));
    result.savedToLegacy = true;
    console.log('Guardado en sistema legacy (Firebase completo)');
  } catch (error: any) {
    result.errors.push(`Legacy: ${error.message}`);
    console.error('Error guardando en legacy:', error);
    result.success = false; // Critical: Legacy es obligatorio
  }
  
  // 3. GUARDAR EN SISTEMA HÍBRIDO (Nuevo) - JSON en OneDrive + Índice en Firebase
  try {
    // 3a. Guardar JSON de respaldo en OneDrive (estructura MP/PT/mes)
    console.log('💾 Guardando JSON de respaldo en OneDrive...');
    const jsonResult = await saveTestBackupJSON(instance, scopes, test);
    
    if (jsonResult.success) {
      console.log(`✅ JSON guardado: ${jsonResult.jsonPath}`);
      
      // 3b. Crear/actualizar índice en Firebase que apunta al JSON
      const indexRef = doc(db, 'test_index', test.id);
      await setDoc(indexRef, {
        id: test.id,
        lotNumber: test.lotNumber,
        date: test.date,
        testType: test.testType,
        isCompleted: test.isCompleted,
        jsonPath: jsonResult.jsonPath,
        updatedAt: Timestamp.now(),
        savedToOneDrive: true
      }, { merge: true });
      
      result.savedToHybrid = true;
      console.log('✅ Índice híbrido actualizado en Firebase');
    } else {
      console.warn('⚠️ No se pudo guardar JSON en OneDrive (pero Firebase tiene los datos)');
    }
  } catch (error: any) {
    result.errors.push(`Híbrido/JSON: ${error.message}`);
    console.warn('⚠️ Error guardando JSON: ', error);
    // NO es crítico: Firebase tiene los datos en legacy
  }
  
  // Log resumen
  if (result.success) {
    console.log(`Test ${test.id} guardado exitosamente`);
  } else {
    console.error(`Test ${test.id} guardado con errores:`, result.errors);
  }
  
  return result;
};