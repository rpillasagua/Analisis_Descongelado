/**
 * Google Drive Service
 * Maneja el almacenamiento de fotos en Google Drive
 */

interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  rootFolderId: string;
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
        console.log('✅ Usando carpeta raíz existente:', this.rootFolderId);
        return;
      }

      // Si ya tenemos la carpeta raíz en memoria, no buscarla de nuevo
      if (this.rootFolderId) {
        return;
      }

      // Si no, buscar o crear la carpeta "descongelado" en el drive
      console.log('🔍 Buscando carpeta "descongelado"...');
      const existingFolder = await this.findFolderInRoot(this.ROOT_FOLDER_NAME);
      
      if (existingFolder) {
        this.rootFolderId = existingFolder;
        console.log('✅ Carpeta "descongelado" encontrada:', this.rootFolderId);
      } else {
        console.log('📁 Creando carpeta "descongelado"...');
        this.rootFolderId = await this.createRootFolder();
        console.log('✅ Carpeta "descongelado" creada:', this.rootFolderId);
      }
    } catch (error) {
      console.error('❌ Error inicializando Google Drive:', error);
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

      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      console.error('Error buscando carpeta en raíz:', error);
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

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creando carpeta raíz:', error);
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

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
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

      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      console.error('Error finding folder:', error);
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
   * Hace un archivo público para que pueda ser visualizado
   */
  async makeFilePublic(fileId: string): Promise<void> {
    console.log(`🔓 Configurando permisos públicos para archivo: ${fileId}`);

    try {
      // Asegurar token válido antes de cualquier operación
      await this.ensureToken();

      // Primero verificar si ya tiene permisos públicos
      const existingPermissions = await this.getFilePermissions(fileId);
      const hasPublicAccess = existingPermissions.some(p =>
        p.type === 'anyone' && p.role === 'reader'
      );

      if (hasPublicAccess) {
        console.log(`✅ Archivo ${fileId} ya tiene permisos públicos`);
        return;
      }

      // Crear permiso público
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        }
      );

      if (!response.ok) {
        // Si es error de auth (401), intentar una vez más refrescando token explícitamente
        if (response.status === 401) {
            console.log('🔄 Error 401 en permisos. Reintentando con token fresco...');
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
                    role: 'reader',
                    type: 'anyone'
                  })
                }
            );
            
            if (retryResponse.ok) {
                console.log(`✅ Permisos públicos configurados tras reintento para archivo ${fileId}`);
                return;
            }
            
            // Si falla el reintento, capturar el error del reintento
            let retryErrorMessage = `HTTP ${retryResponse.status}`;
            try {
                const retryErrorData = await retryResponse.json();
                if (retryErrorData?.error?.message) {
                    retryErrorMessage += `: ${retryErrorData.error.message}`;
                }
            } catch (e) { /* ignore */ }
            throw new Error(`Failed to make file public after retry: ${retryErrorMessage}`);
        }

        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error && errorData.error.message) {
            errorMessage += `: ${errorData.error.message}`;
          }
        } catch (jsonError) {
          errorMessage += ` (error procesando respuesta)`;
        }
        console.error('❌ Error configurando permisos públicos:', errorMessage);
        throw new Error(`Failed to make file public: ${errorMessage}`);
      }

      console.log(`✅ Permisos públicos configurados para archivo ${fileId}`);
    } catch (error) {
      console.error('❌ Error en makeFilePublic:', error);
      throw error;
    }
  }

  /**
   * Obtiene los permisos de un archivo
   */
  async getFilePermissions(fileId: string): Promise<any[]> {
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
        console.warn(`No se pudieron obtener permisos para ${fileId}:`, response.status);
        return [];
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
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
      console.log(`⬆️ Subiendo archivo: ${fileName} (${file.size} bytes)`);

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
        console.error('❌ Error en respuesta de subida:', errorData);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Archivo subido exitosamente. ID: ${data.id}`);

      // Verificar que tenemos el ID del archivo
      if (!data.id) {
        throw new Error('No file ID returned from upload');
      }
      
      // Intentar hacer el archivo público para que se pueda visualizar
      try {
        await this.makeFilePublic(data.id);
        console.log('✅ Permisos públicos configurados');
      } catch (error) {
        console.warn('⚠️ No se pudieron configurar permisos públicos:', error.message);
        // Continuar de todos modos
      }
      
      // Usar URL de thumbnail que es más confiable para acceso público
      // Si no hay thumbnail, usar una URL directa que debería funcionar con permisos públicos
      const publicUrl = data.thumbnailLink || 
                       `https://drive.google.com/thumbnail?id=${data.id}&sz=w800` ||
                       `https://drive.google.com/uc?export=view&id=${data.id}`;
      
      console.log(`🔗 URL pública generada: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
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
    oldPhotoUrl?: string
  ): Promise<string> {
    try {
      console.log(`📸 Subiendo foto: ${photoType} (${file.size} bytes)`);

      // Asegurar token válido antes de comenzar
      await this.ensureToken();

      // Verificar conectividad primero
      console.log('🔍 Verificando conectividad con Google Drive...');
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        // Intentar refrescar token una vez más si falla la conectividad
        await this.ensureToken();
        const retryConnected = await this.checkConnectivity();
        if (!retryConnected) {
             throw new Error('Error de conexión con Google Drive. Verifica tu conexión a internet o permisos de Google Drive.');
        }
      }
      console.log('✅ Conectividad verificada');

      // Si hay una foto anterior, eliminarla primero
      if (oldPhotoUrl) {
        const oldFileId = this.extractFileIdFromUrl(oldPhotoUrl);
        if (oldFileId) {
          try {
            console.log(`🗑️ Eliminando foto anterior: ${oldFileId}`);
            await this.deleteFile(oldFileId);
            console.log(`✅ Foto anterior eliminada: ${oldFileId}`);
          } catch (error) {
            console.warn('No se pudo eliminar la foto anterior:', error);
            // Continuar aunque falle la eliminación
          }
        }
      }

      // Asegurar que la carpeta raíz "descongelado" existe
      console.log('📁 Verificando carpeta raíz...');
      if (!this.rootFolderId) {
        await this.initialize();
      }
      console.log('✅ Carpeta raíz verificada:', this.rootFolderId);

      // Estructura: descongelado/CODIGO/LOTE/TIPO_FOTO.jpg
      
      // Obtener o crear carpeta del código
      console.log(`📁 Creando/verificando carpeta del código: ${codigo}`);
      const codigoFolderId = await this.getOrCreateFolder(codigo, this.rootFolderId || undefined);
      console.log('✅ Carpeta del código:', codigoFolderId);
      
      // Obtener o crear carpeta del lote
      console.log(`📁 Creando/verificando carpeta del lote: ${lote}`);
      const loteFolderId = await this.getOrCreateFolder(lote, codigoFolderId);
      console.log('✅ Carpeta del lote:', loteFolderId);
      
      // Generar nombre de archivo con timestamp para evitar duplicados
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${photoType}_${timestamp}.${extension}`;
      console.log(`📄 Nombre de archivo generado: ${fileName}`);
      
      // Subir archivo
      console.log(`⬆️ Subiendo archivo a Google Drive...`);
      const url = await this.uploadFile(file, fileName, loteFolderId);
      
      console.log(`✅ Foto subida exitosamente: descongelado/${codigo}/${lote}/${fileName}`);
      console.log(`🔗 URL generada: ${url}`);
      
      return url;
    } catch (error) {
      console.error('❌ Error uploading analysis photo:', error);
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
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    } catch (error) {
      console.error('Error deleting file:', error);
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
        console.warn('❌ No hay token de acceso para verificar conectividad');
        return false;
      }

      // Hacer una petición simple para verificar conectividad
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('❌ Error de conectividad con Google Drive:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      console.log('✅ Conectividad con Google Drive verificada para usuario:', data.user?.displayName);
      return true;
    } catch (error) {
      console.error('❌ Error verificando conectividad:', error);
      return false;
    }
  }

  /**
   * Renueva permisos públicos para múltiples archivos
   * Útil para arreglar permisos expirados en análisis existentes
   */
  async renewPublicPermissions(fileIds: string[]): Promise<void> {
    console.log(`🔄 Renovando permisos para ${fileIds.length} archivos...`);
    
    for (const fileId of fileIds) {
      try {
        await this.makeFilePublic(fileId);
        console.log(`✅ Permisos renovados para: ${fileId}`);
        // Pequeño delay para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`⚠️ Error renovando permisos para ${fileId}:`, error.message);
      }
    }
    
    console.log('✅ Renovación de permisos completada');
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
