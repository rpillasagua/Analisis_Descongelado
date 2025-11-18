import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

// GET - Obtener tests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const limitParam = searchParams.get('limit');

    const testsRef = collection(db, 'resistance_tests');

    // Obtener test por ID
    if (action === 'getById' && id) {
      const testDoc = await getDoc(doc(testsRef, id));
      if (!testDoc.exists()) {
        return NextResponse.json({ error: 'Test no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ test: { id: testDoc.id, ...testDoc.data() } });
    }

    // Obtener tests en progreso
    if (action === 'getInProgress') {
      const q = query(
        testsRef,
        where('isCompleted', '==', false),
        orderBy('date', 'desc'),
        limit(limitParam ? parseInt(limitParam) : 50)
      );
      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ tests });
    }

    // Obtener tests por fecha
    if (action === 'getByDate' && date) {
      const q = query(
        testsRef,
        where('date', '==', date),
        orderBy('startTime', 'desc')
      );
      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ tests });
    }

    // Obtener todos los tests (con límite)
    const q = query(
      testsRef,
      orderBy('date', 'desc'),
      limit(limitParam ? parseInt(limitParam) : 100)
    );
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ tests });
    
  } catch (error: any) {
    console.error('Error en GET /api/firestore:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos' },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, test } = body;

    if (!test || !test.id) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const testsRef = collection(db, 'resistance_tests');
    const testDoc = doc(testsRef, test.id);

    if (action === 'save' || action === 'update') {
      await setDoc(testDoc, test, { merge: true });
      return NextResponse.json({ 
        success: true, 
        message: 'Test guardado exitosamente',
        testId: test.id 
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error en POST /api/firestore:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar datos' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar test
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const testsRef = collection(db, 'resistance_tests');
    await deleteDoc(doc(testsRef, id));

    return NextResponse.json({ 
      success: true, 
      message: 'Test eliminado exitosamente' 
    });
    
  } catch (error: any) {
    console.error('Error en DELETE /api/firestore:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar datos' },
      { status: 500 }
    );
  }
}
