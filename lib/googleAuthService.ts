/**
 * Google Authentication Service
 * Maneja la autenticación con Google OAuth2
 */

interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private user: any = null;
  private listeners: ((user: any) => void)[] = [];

  constructor() {
    this.config = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || '',
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file'
      ]
    };
  }

  /**
   * Inicializa Google Identity Services
   */
  async initialize() {
    if (typeof window === 'undefined') return;

    try {
      // Cargar Google Identity Services
      await this.loadGoogleScript();
      
      // Inicializar token client
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' '),
        callback: (response: any) => {
          if (response.error) {
            console.error('❌ Error en autenticación Google:', response.error);
            alert(`Error de autenticación: ${response.error}\n\nPosibles causas:\n1. URL no autorizada en Google Cloud Console\n2. Client ID incorrecto\n3. Permisos denegados`);
            return;
          }
          
          this.accessToken = response.access_token;
          this.loadUserInfo();
        },
      });

      // Verificar si hay sesión guardada
      const savedToken = sessionStorage.getItem('google_access_token');
      if (savedToken) {
        this.accessToken = savedToken;
        await this.loadUserInfo();
      }

      console.log('✅ Google Auth inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Google Auth:', error);
      throw error;
    }
  }

  /**
   * Carga el script de Google Identity Services
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Inicia el flujo de login
   */
  async login(): Promise<void> {
    if (!this.tokenClient) {
      await this.initialize();
    }

    // Solicitar token de acceso
    this.tokenClient.requestAccessToken();
  }

  /**
   * Cierra la sesión
   */
  logout() {
    if (this.accessToken) {
      // Revocar token
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token revocado');
      });
    }

    this.accessToken = null;
    this.user = null;
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_user');
    this.notifyListeners();
  }

  /**
   * Obtiene información del usuario autenticado
   */
  private async loadUserInfo() {
    if (!this.accessToken) return;

    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      );

      const userData = await response.json();
      this.user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      };

      // Guardar en sessionStorage
      sessionStorage.setItem('google_access_token', this.accessToken);
      sessionStorage.setItem('google_user', JSON.stringify(this.user));

      console.log('✅ Usuario autenticado:', this.user.name);
      this.notifyListeners();
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      this.logout();
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Obtiene el token de acceso actual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Obtiene la información del usuario actual
   */
  getUser() {
    return this.user;
  }

  /**
   * Verifica y renueva el token si es necesario
   */
  async ensureValidToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión.');
    }

    // Verificar si el token es válido
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`
      );

      if (!response.ok) {
        // Token inválido, intentar renovar automáticamente
        console.warn('Token expirado, intentando renovar...');
        
        // Limpiar token actual
        this.accessToken = null;
        sessionStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_user');
        this.user = null;
        this.notifyListeners();
        
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      const tokenInfo = await response.json();
      
      // Verificar si el token expira pronto (menos de 5 minutos)
      const expiresIn = tokenInfo.expires_in;
      if (expiresIn && expiresIn < 300) {
        console.warn('Token expira pronto, sería bueno renovarlo');
        // Por ahora, continuar con el token actual
      }

      return this.accessToken;
    } catch (error) {
      console.error('Error verificando token:', error);
      
      // Limpiar estado
      this.accessToken = null;
      this.user = null;
      sessionStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_user');
      this.notifyListeners();
      
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
  }

  /**
   * Suscribe a cambios en el estado de autenticación
   */
  subscribe(listener: (user: any) => void) {
    this.listeners.push(listener);
    // Emitir estado actual inmediatamente
    listener(this.user);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }
}

// Exportar instancia singleton
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
