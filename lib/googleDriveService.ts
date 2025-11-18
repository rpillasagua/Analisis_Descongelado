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
   * Inicializa Google Drive API y crea carpeta raíz si no existe
   */
  async initialize() {
    try {
      // Si ya tenemos un rootFolderId configurado, usarlo
      if (this.config.rootFolderId) {
        this.rootFolderId = this.config.rootFolderId;
        console.log('✅ Usando carpeta raíz existente:', this.rootFolderId);
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
   * Sube un archivo a Google Drive
   * @param file Archivo a subir
   * @param fileName Nombre del archivo
   * @param folderId ID de la carpeta destino
   */
  async uploadFile(file: File, fileName: string, folderId: string): Promise<string> {
    try {
      // Crear metadata
      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: form
        }
      );

      const data = await response.json();
      return data.webViewLink || data.webContentLink;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Sube una foto del análisis organizada por código/lote
   * @param file Archivo de imagen
   * @param codigo Código del análisis
   * @param lote Lote del análisis
   * @param photoType Tipo de foto (ej: 'peso_bruto', 'uniformidad_grandes')
   */
  async uploadAnalysisPhoto(
    file: File,
    codigo: string,
    lote: string,
    photoType: string
  ): Promise<string> {
    try {
      // Asegurar que la carpeta raíz "descongelado" existe
      if (!this.rootFolderId) {
        await this.initialize();
      }

      // Estructura: descongelado/CODIGO/LOTE/TIPO_FOTO.jpg
      
      // Obtener o crear carpeta del código
      const codigoFolderId = await this.getOrCreateFolder(codigo, this.rootFolderId || undefined);
      
      // Obtener o crear carpeta del lote
      const loteFolderId = await this.getOrCreateFolder(lote, codigoFolderId);
      
      // Generar nombre de archivo con timestamp para evitar duplicados
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${photoType}_${timestamp}.${extension}`;
      
      // Subir archivo
      const url = await this.uploadFile(file, fileName, loteFolderId);
      
      console.log(`✅ Foto subida: descongelado/${codigo}/${lote}/${fileName}`);
      
      return url;
    } catch (error) {
      console.error('Error uploading analysis photo:', error);
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
   * Establece el token de acceso
   * @param token Token de acceso de Google OAuth2
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }
}

// Exportar instancia singleton
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
