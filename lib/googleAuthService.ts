/**
 * Google Authentication Service (MEJORADO)
 * - Token guardado en localStorage (persiste entre sesiones)
 * - Auto-refresh de token antes de expirar
 * - Mejor manejo de errores sin clearing agresivo
 */

interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

interface TokenInfo {
  expires_in: number;
  access_type: string;
  [key: string]: any;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private user: any = null;
  private listeners: ((user: any) => void)[] = [];
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private TOKEN_STORAGE_KEY = 'google_access_token_v2';
  private USER_STORAGE_KEY = 'google_user_v2';
  private TOKEN_EXPIRY_KEY = 'google_token_expiry';

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
   * Inicializa Google Identity Services y restaura sesión guardada
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
        callback: this.onTokenResponse,
      });

      // MEJORÍA: Restaurar sesión desde localStorage (persiste entre navegador restarts)
      await this.syncFromPersistentStorage();

      console.log('✅ Google Auth inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Google Auth:', error);
      throw error;
    }
  }

  /**
   * Restaura token y usuario desde localStorage
   */
  private async syncFromPersistentStorage() {
    if (typeof window === 'undefined') return;

    try {
      const savedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(this.USER_STORAGE_KEY);
      const savedExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (savedToken && savedUser) {
        this.accessToken = savedToken;
        this.user = JSON.parse(savedUser);

        // Verificar si el token aún es válido
        const isValid = await this.verifyToken();
        
        if (isValid) {
          console.log('✅ Token restaurado desde localStorage (persistencia)');
          this.notifyListeners();
          
          // Configurar refresh automático si falta poco para expirar
          if (savedExpiry) {
            const expiryTime = parseInt(savedExpiry);
            const now = Date.now();
            const timeToExpiry = expiryTime - now;
            
            if (timeToExpiry > 0 && timeToExpiry < 3600000) { // Si expira en menos de 1 hora
              this.scheduleTokenRefresh(timeToExpiry - 300000); // Refresh 5 min antes
            }
          }
          return;
        }

        // Token expirado, limpiar
        console.warn('⚠️ Token guardado expiró, limpiando...');
        this.clearStoredAuth();
      }
    } catch (error) {
      console.error('Error sincronizando storage:', error);
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
   * Callback cuando se recibe un token (LOGIN)
   */
  private onTokenResponse = async (response: any) => {
    if (response.error) {
      console.error('❌ Error en autenticación Google:', response.error);
      alert(`Error de autenticación: ${response.error}`);
      return;
    }

    if (response.access_token) {
      this.accessToken = response.access_token;
      
      // MEJORÍA: Guardar en localStorage en lugar de sessionStorage
      localStorage.setItem(this.TOKEN_STORAGE_KEY, this.accessToken);
      
      // Cargar información del usuario
      await this.loadUserInfo();
      
      // Configurar refresh automático (cada 50 minutos)
      this.scheduleTokenRefresh(50 * 60 * 1000);
      
      this.notifyListeners();
    }
  };

  /**
   * Cierra la sesión
   */
  logout() {
    if (this.tokenClient && this.accessToken) {
      // Revocar token en Google
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token revocado en Google');
      });
    }

    this.clearStoredAuth();
  }

  /**
   * Limpia autenticación (sin ser tan agresivo como antes)
   */
  private clearStoredAuth() {
    this.accessToken = null;
    this.user = null;

    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);

    // Limpiar timer de refresh
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    this.notifyListeners();
  }

  /**
   * Inicia el flujo de login
   */
  async login(): Promise<void> {
    if (!this.tokenClient) {
      await this.initialize();
    }

    this.tokenClient.requestAccessToken();
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
          headers: { Authorization: `Bearer ${this.accessToken}` },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const userData = await response.json();
      this.user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      };

      // Guardar en localStorage
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(this.user));
      
      // Estimar expiración en 1 hora
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

      console.log('✅ Usuario autenticado:', this.user.name);
      this.notifyListeners();
    } catch (error) {
      console.error('Error obteniendo info del usuario:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Verifica si un token es válido (sin clearing agresivo)
   */
  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.status === 401) {
        console.warn('⚠️ Token inválido (401)');
        return false;
      }

      if (!response.ok) {
        console.warn(`⚠️ Token check failed: ${response.status}`);
        return false;
      }

      const tokenInfo: TokenInfo = await response.json();
      
      // Si expira muy pronto, marcar como inválido
      if (tokenInfo.expires_in && tokenInfo.expires_in < 60) {
        console.warn('⚠️ Token expira en menos de 1 minuto');
        return false;
      }

      console.log(`✅ Token válido (expira en ${tokenInfo.expires_in}s)`);
      return true;
    } catch (error) {
      console.warn('Error verificando token:', error);
      return false;
    }
  }

  /**
   * Programa refresh automático del token
   */
  private scheduleTokenRefresh(delayMs: number) {
    // Limpiar timer anterior
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    this.tokenRefreshTimer = setTimeout(async () => {
      console.log('🔄 Refrescando token automáticamente...');
      
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken();
      }
    }, delayMs);
  }

  /**
   * MEJORADO: Verifica y renueva el token si es necesario (sin throwing agresivo)
   */
  async ensureValidToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión.');
    }

    try {
      // Verificar si el token es válido
      const isValid = await this.verifyToken();

      if (isValid) {
        return this.accessToken;
      }

      // Token inválido, marcar como expirado
      console.warn('⚠️ Token inválido, usuario debe re-autenticar');
      this.clearStoredAuth();

      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } catch (error) {
      console.error('Error verificando token:', error);
      this.clearStoredAuth();
      throw error;
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
