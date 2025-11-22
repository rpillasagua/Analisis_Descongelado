/**
 * Google Drive Service
 * Maneja el almacenamiento de fotos en Google Drive
 */

import { logger } from './logger';

interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  rootFolderId: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface GoogleDrivePermission {
  id: string;
  type: string;
  role: string;
  emailAddress?: string;
}

interface GoogleDriveListResponse {
  files: GoogleDriveFile[];
}

class GoogleDriveService {
  private config: GoogleDriveConfig;
  private accessToken: string | null = null;
  private rootFolderId: string | null = null;
  private readonly ROOT_FOLDER_NAME = 'descongelado';

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '',
      clientId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || '',
      rootFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_ID || ''
    };
  }

  /**
   * Asegura que tenemos un token válido
   */
  private async ensureToken() {
    const { googleAuthService } = await import('./googleAuthService');
    this.accessToken = await googleAuthService.ensureValidToken();
  }

  /**
   * Inicializa Google Drive API y crea carpeta raíz si no existe
   */
  async initialize() {
    try {
      // Importar el servicio de autenticación
      const { googleAuthService } = await import('./googleAuthService');

      // Inicializar el servicio de autenticación si no está inicializado
      if (typeof window !== 'undefined') {
        await googleAuthService.initialize();
      }

      // Obtener y configurar el token de acceso
      await this.ensureToken();

      // Si ya tenemos un rootFolderId configurado, usarlo
      if (this.config.rootFolderId) {
        this.rootFolderId = this.config.rootFolderId;
        logger.log('✅ Usando carpeta raíz existente:', this.rootFolderId);
        return;
      }

      // Si ya tenemos la carpeta raíz en memoria, no buscarla de nuevo
      if (this.rootFolderId) {
        return;
      }

      // Si no, buscar o crear la carpeta "descongelado" en el drive
      logger.log('🔍 Buscando carpeta "descongelado"...');
      const existingFolder = await this.findFolderInRoot(this.ROOT_FOLDER_NAME);

      if (existingFolder) {
        this.rootFolderId = existingFolder;
        logger.log('✅ Carpeta "descongelado" encontrada:', this.rootFolderId);
      } else {
        logger.log('📁 Creando carpeta "descongelado"...');
        this.rootFolderId = await this.createRootFolder();
        logger.log('✅ Carpeta "descongelado" creada:', this.rootFolderId);
      }
    } catch (error) {
      logger.error('❌ Error inicializando Google Drive:', error);
      throw error;
    }
  }

  /**
   * Busca una carpeta en la raíz del Drive
   */
  private async findFolderInRoot(folderName: string): Promise<string | null> {
    try {
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data: GoogleDriveListResponse = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      logger.error('Error buscando carpeta en raíz:', error);
      return null;
    }
  }

  /**
   * Crea la carpeta raíz "descongelado" en el Drive
   */
  private async createRootFolder(): Promise<string> {
    try {
      const metadata = {
        name: this.ROOT_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      const data: GoogleDriveFile = await response.json();
      return data.id;
    } catch (error) {
      logger.error('Error creando carpeta raíz:', error);
      throw error;
    }
  }

  /**
   * Crea una carpeta en Google Drive
   * @param folderName Nombre de la carpeta
   * @param parentFolderId ID de la carpeta padre (opcional)
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId || this.config.rootFolderId]
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      const data: GoogleDriveFile = await response.json();
      return data.id;
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Busca una carpeta por nombre
   * @param folderName Nombre de la carpeta
   * @param parentFolderId ID de la carpeta padre
   */
  async findFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId || this.config.rootFolderId}' in parents and trashed=false`;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data: GoogleDriveListResponse = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      logger.error('Error finding folder:', error);
      return null;
    }
  }

  /**
   * Obtiene o crea una carpeta
   * @param folderName Nombre de la carpeta
   * @param parentFolderId ID de la carpeta padre
   */
  async getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    // Asegurar que la carpeta raíz existe
    if (!this.rootFolderId) {
      await this.initialize();
    }

    let folderId = await this.findFolder(folderName, parentFolderId);

    if (!folderId) {
      folderId = await this.createFolder(folderName, parentFolderId);
    }

    return folderId;
  }

  /**
   * Comparte un archivo con un usuario específico
   */
  async shareWithUser(fileId: string, email: string): Promise<void> {
    logger.log(`👤 Compartiendo archivo ${fileId} con ${email}`);
    try {
      await this.addPermission(fileId, 'user', 'reader', email);
      logger.log(`✅ Archivo compartido exitosamente con ${email}`);
    } catch (error) {
      logger.warn(`⚠️ No se pudo compartir con ${email}:`, error instanceof Error ? error.message : String(error));
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  /**
   * Hace un archivo público para que pueda ser visualizado
   */
  async makeFilePublic(fileId: string): Promise<void> {
    logger.log(`🔓 Configurando permisos para archivo: ${fileId}`);

    try {
      // Asegurar token válido antes de cualquier operación
      await this.ensureToken();

      // Primero verificar si ya tiene permisos públicos o de dominio
      const existingPermissions = await this.getFilePermissions(fileId);
      const hasAccess = existingPermissions.some(p =>
        (p.type === 'anyone' || p.type === 'domain') && p.role === 'reader'
      );

      if (hasAccess) {
        logger.log(`✅ Archivo ${fileId} ya tiene permisos de acceso`);
        return;
      }

      // Intentar primero permiso público (anyone)
      try {
        await this.addPermission(fileId, 'anyone', 'reader');
        logger.log(`✅ Permisos PÚBLICOS configurados para archivo ${fileId}`);
        return;
      } catch (publicError) {
        logger.warn('⚠️ No se pudo configurar permiso público ("anyone").', publicError instanceof Error ? publicError.message : String(publicError));
        logger.info('ℹ️ El archivo se subió pero puede requerir permisos manuales si la organización es estricta.');
      }
    } catch (error) {
      logger.error('❌ Error en makeFilePublic:', error);
      throw error;
    }
  }

  /**
   * Helper para agregar un permiso específico
   */
  private async addPermission(fileId: string, type: string, role: string, emailAddress?: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      role: role,
      type: type
    };

    if (emailAddress) {
      body.emailAddress = emailAddress;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      // Si es error de auth (401), intentar una vez más refrescando token explícitamente
      if (response.status === 401) {
        logger.log('🔄 Error 401 en permisos. Reintentando con token fresco...');
        await this.ensureToken();

        const retryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              role: role,
              type: type
            })
          }
        );

        if (retryResponse.ok) return;

        const retryData = await retryResponse.json();
        throw new Error(retryData?.error?.message || `HTTP ${retryResponse.status}`);
      }

      const errorData = await response.json();
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }
  }

  /**
   * Obtiene los permisos de un archivo
   */
  async getFilePermissions(fileId: string): Promise<GoogleDrivePermission[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        logger.warn(`No se pudieron obtener permisos para ${fileId}:`, response.status);
        return [];
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      logger.error('Error obteniendo permisos:', error);
      return [];
    }
  }  /**
   * Sube un archivo a Google Drive
   * @param file Archivo a subir
   * @param fileName Nombre del archivo
   * @param folderId ID de la carpeta destino
   */
  async uploadFile(file: File, fileName: string, folderId: string): Promise<string> {
    try {
      logger.log(`⬆️ Subiendo archivo: ${fileName} (${file.size} bytes)`);

      // Crear metadata
      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: form
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('❌ Error en respuesta de subida:', errorData);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data: GoogleDriveFile = await response.json();
      logger.log(`✅ Archivo subido exitosamente. ID: ${data.id}`);

      // Verificar que tenemos el ID del archivo
      if (!data.id) {
        throw new Error('No file ID returned from upload');
      }

      // Intentar hacer el archivo público para que se pueda visualizar
      try {
        await this.makeFilePublic(data.id);
        logger.log('✅ Permisos públicos configurados');

        // Agregar delay de 2 segundos para que los permisos se propaguen
        logger.log('⏳ Esperando propagación de permisos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        logger.log('✅ Propagación completada');
      } catch (error) {
        logger.warn('⚠️ No se pudieron configurar permisos públicos:', error instanceof Error ? error.message : String(error));
        // Continuar de todos modos
      }

      // ESTRATEGIA DE URLs:
      // 1. thumbnailLink: Es la más confiable para <img> tags (googleusercontent.com), evitamos 403s.
      //    Viene pequeña (s220), así que la agrandamos a s2000.
      // 2. uc?export=view: Fallback si no hay thumbnail.

      let publicUrl: string;
      let thumbnailLink = data.thumbnailLink;

      // Si no hay thumbnailLink, intentamos obtenerlo nuevamente después de un breve delay
      if (!thumbnailLink) {
        logger.log('⚠️ thumbnailLink no disponible inmediatamente, reintentando obtener metadatos...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        try {
          const fileMetadata = await this.getFile(data.id);
          if (fileMetadata && fileMetadata.thumbnailLink) {
            thumbnailLink = fileMetadata.thumbnailLink;
            logger.log('✅ thumbnailLink recuperado en segundo intento');
          }
        } catch (e) {
          logger.warn('⚠️ Falló el reintento de obtener metadatos:', e);
        }
      }

      if (thumbnailLink) {
        // Reemplazar el tamaño (=s220) por uno grande (=s2000) para mantener calidad
        publicUrl = thumbnailLink.replace(/=s\d+/, '=s2000');
        logger.log(`🔗 Usando thumbnailLink optimizado: ${publicUrl}`);
      } else {
        // Fallback a la URL directa
        publicUrl = `https://drive.google.com/uc?export=view&id=${data.id}`;
        logger.log(`🔗 Usando URL directa (fallback): ${publicUrl}`);
      }

      return publicUrl;
    } catch (error) {
      logger.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Obtiene los metadatos de un archivo
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    await this.ensureToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,webViewLink,webContentLink,thumbnailLink`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Extrae el ID de archivo de una URL de Google Drive
   */
  private extractFileIdFromUrl(url: string): string | null {
    if (!url) return null;

    // Formato: https://drive.google.com/uc?export=view&id=FILE_ID
    const match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];

    // Formato: https://drive.google.com/file/d/FILE_ID/view
    const match2 = url.match(/\/file\/d\/([^/]+)/);
    if (match2) return match2[1];

    return null;
  }

  /**
   * Sube una foto del análisis organizada por código/lote
   * @param file Archivo de imagen
   * @param codigo Código del análisis
   * @param lote Lote del análisis
   * @param photoType Tipo de foto (ej: 'peso_bruto', 'uniformidad_grandes')
   * @param oldPhotoUrl URL de la foto anterior (opcional, se eliminará si existe)
   */
  async uploadAnalysisPhoto(
    file: File,
    codigo: string,
    lote: string,
    photoType: string,
    oldPhotoUrl?: string,
    viewerEmail?: string
  ): Promise<string> {
    try {
      logger.log(`📸 Subiendo foto: ${photoType} (${file.size} bytes)`);

      // Asegurar token válido antes de comenzar
      await this.ensureToken();

      // Verificar conectividad primero
      logger.log('🔍 Verificando conectividad con Google Drive...');
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        // Intentar refrescar token una vez más si falla la conectividad
        await this.ensureToken();
        const retryConnected = await this.checkConnectivity();
        if (!retryConnected) {
          throw new Error('Error de conexión con Google Drive. Verifica tu conexión a internet o permisos de Google Drive.');
        }
      }
      logger.log('✅ Conectividad verificada');

      // Si hay una foto anterior, eliminarla primero
      if (oldPhotoUrl) {
        const oldFileId = this.extractFileIdFromUrl(oldPhotoUrl);
        if (oldFileId) {
          try {
            logger.log(`🗑️ Eliminando foto anterior: ${oldFileId}`);
            await this.deleteFile(oldFileId);
            logger.log(`✅ Foto anterior eliminada: ${oldFileId}`);
          } catch (error) {
            logger.warn('No se pudo eliminar la foto anterior:', error);
            // Continuar aunque falle la eliminación
          }
        }
      }

      // Asegurar que la carpeta raíz "descongelado" existe
      logger.log('📁 Verificando carpeta raíz...');
      if (!this.rootFolderId) {
        await this.initialize();
      }
      logger.log('✅ Carpeta raíz verificada:', this.rootFolderId);

      // Estructura: descongelado/CODIGO/LOTE/TIPO_FOTO.jpg

      // Obtener o crear carpeta del código
      logger.log(`📁 Creando/verificando carpeta del código: ${codigo}`);
      const codigoFolderId = await this.getOrCreateFolder(codigo, this.rootFolderId || undefined);
      logger.log('✅ Carpeta del código:', codigoFolderId);

      // Obtener o crear carpeta del lote
      logger.log(`📁 Creando/verificando carpeta del lote: ${lote}`);
      const loteFolderId = await this.getOrCreateFolder(lote, codigoFolderId);
      logger.log('✅ Carpeta del lote:', loteFolderId);

      // Generar nombre de archivo con timestamp para evitar duplicados
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${photoType}_${timestamp}.${extension}`;
      logger.log(`📄 Nombre de archivo generado: ${fileName}`);

      // Subir archivo
      logger.log(`⬆️ Subiendo archivo a Google Drive...`);
      const url = await this.uploadFile(file, fileName, loteFolderId);

      logger.log(`✅ Foto subida exitosamente: descongelado/${codigo}/${lote}/${fileName}`);

      // Si se proporcionó un email de visualizador, compartir explícitamente
      if (viewerEmail) {
        // Extraer ID del archivo nuevo
        const newFileId = this.extractFileIdFromUrl(url);
        if (newFileId) {
          await this.shareWithUser(newFileId, viewerEmail);
        }
      }

      logger.log(`🔗 URL generada: ${url}`);

      return url;
    } catch (error) {
      logger.error('❌ Error uploading analysis photo:', error);
      throw error;
    }
  }

  /**
   * Elimina un archivo de Google Drive
   * @param fileId ID del archivo
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken} `
        }
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Verifica la conectividad con Google Drive
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Verificar si tenemos token válido
      if (!this.accessToken) {
        logger.warn('❌ No hay token de acceso para verificar conectividad');
        return false;
      }

      // Hacer una petición simple para verificar conectividad
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken} `
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn('❌ Error de conectividad con Google Drive:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      logger.log('✅ Conectividad con Google Drive verificada para usuario:', data.user?.displayName);
      return true;
    } catch (error) {
      logger.error('❌ Error verificando conectividad:', error);
      return false;
    }
  }

  /**
   * Renueva permisos públicos para múltiples archivos
   * Útil para arreglar permisos expirados en análisis existentes
   */
  async renewPublicPermissions(fileIds: string[]): Promise<void> {
    logger.log(`🔄 Renovando permisos para ${fileIds.length} archivos...`);

    for (const fileId of fileIds) {
      try {
        await this.makeFilePublic(fileId);
        logger.log(`✅ Permisos renovados para: ${fileId} `);
        // Pequeño delay para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        logger.warn(`⚠️ Error renovando permisos para ${fileId}: `, error instanceof Error ? error.message : String(error));
      }
    }

    logger.log('✅ Renovación de permisos completada');
  }

  /**
   * Extrae IDs de archivos de Google Drive de una lista de URLs
   */
  extractFileIdsFromUrls(urls: string[]): string[] {
    const fileIds: string[] = [];

    for (const url of urls) {
      if (url && url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/[?&]id=([^&]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          fileIds.push(fileIdMatch[1]);
        }
      }
    }

    return [...new Set(fileIds)]; // Remover duplicados
  }
}

// Exportar instancia singleton
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
