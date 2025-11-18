/**
 * Script para renovar permisos de fotos en análisis existentes
 * Ejecutar con: node scripts/renew-photo-permissions.js <analysisId>
 * O para todos los análisis de una fecha: node scripts/renew-photo-permissions.js --date 2024-01-15
 */

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const analysisService = require('../lib/analysisService');

const firebaseConfig = {
  // Configuración de Firebase (debería estar en .env.local)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function renewPermissions(analysisId) {
  try {
    console.log(`🔄 Renovando permisos para análisis: ${analysisId}`);
    await analysisService.renewAnalysisPhotoPermissions(analysisId);
    console.log(`✅ Permisos renovados exitosamente para: ${analysisId}`);
  } catch (error) {
    console.error(`❌ Error renovando permisos para ${analysisId}:`, error.message);
  }
}

async function renewPermissionsByDate(date) {
  try {
    console.log(`🔄 Renovando permisos para análisis del ${date}`);
    const analyses = await analysisService.getAnalysesByDate(date);

    console.log(`📊 Encontrados ${analyses.length} análisis`);

    for (const analysis of analyses) {
      await renewPermissions(analysis.id);
      // Pequeño delay para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Renovación completada para ${analyses.length} análisis`);
  } catch (error) {
    console.error('❌ Error en renovación masiva:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso:');
    console.log('  node scripts/renew-photo-permissions.js <analysisId>');
    console.log('  node scripts/renew-photo-permissions.js --date YYYY-MM-DD');
    process.exit(1);
  }

  const [firstArg, secondArg] = args;

  if (firstArg === '--date' && secondArg) {
    await renewPermissionsByDate(secondArg);
  } else {
    await renewPermissions(firstArg);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { renewPermissions, renewPermissionsByDate };