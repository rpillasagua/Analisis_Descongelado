import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

// Helper para validar token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// GET - Listar archivos o buscar folders
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const folderId = searchParams.get('folderId');
    const folderName = searchParams.get('folderName');

    // Buscar folder por nombre
    if (action === 'findFolder' && folderName) {
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error buscando folder en Drive');
      }

      const data = await response.json();
      return NextResponse.json({ folders: data.files || [] });
    }

    // Listar archivos en folder
    if (action === 'listFiles' && folderId) {
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime)`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error listando archivos de Drive');
      }

      const data = await response.json();
      return NextResponse.json({ files: data.files || [] });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error en GET /api/drive:', error);
    return NextResponse.json(
      { error: error.message || 'Error al acceder a Drive' },
      { status: 500 }
    );
  }
}

// POST - Crear folders o subir archivos
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');
    
    // Crear folder
    if (contentType?.includes('application/json')) {
      const { action, name, parentId } = await request.json();

      if (action === 'createFolder') {
        const metadata = {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          ...(parentId && { parents: [parentId] })
        };

        const response = await fetch(`${GOOGLE_DRIVE_API}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
        });

        if (!response.ok) {
          throw new Error('Error creando folder en Drive');
        }

        const data = await response.json();
        return NextResponse.json({ folderId: data.id, folderName: data.name });
      }
    }

    // Subir archivo (FormData) - Detectar si no tiene multipart en header
    if (contentType?.includes('multipart/form-data') || !contentType) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string;
      const folderId = formData.get('folderId') as string;

      if (!file || !fileName) {
        return NextResponse.json({ error: 'Archivo y nombre requeridos' }, { status: 400 });
      }

      const metadata = {
        name: fileName,
        ...(folderId && { parents: [folderId] })
      };

      const fileBuffer = await file.arrayBuffer();

      // Upload multipart
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${file.type}\r\n\r\n` +
        Buffer.from(fileBuffer).toString('binary') +
        closeDelimiter;

      const response = await fetch(
        `${UPLOAD_API}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!response.ok) {
        throw new Error('Error subiendo archivo a Drive');
      }

      const data = await response.json();
      const fileUrl = `https://drive.google.com/file/d/${data.id}/view`;
      
      return NextResponse.json({ 
        fileId: data.id, 
        fileName: data.name,
        fileUrl 
      });
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error en POST /api/drive:', error);
    return NextResponse.json(
      { error: error.message || 'Error al subir a Drive' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar archivos
export async function DELETE(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId requerido' }, { status: 400 });
    }

    const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Error eliminando archivo de Drive');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Archivo eliminado exitosamente' 
    });
    
  } catch (error: any) {
    console.error('Error en DELETE /api/drive:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar de Drive' },
      { status: 500 }
    );
  }
}
