'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { googleAuthService } from '@/lib/googleAuthService';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import AnalysisDashboard from '@/components/AnalysisDashboard';

// Estado para manejar autenticación Google
interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string; picture?: string } | null;
  loading: boolean;
}

// Hook personalizado para Google Auth
const useGoogleAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        await googleAuthService.initialize();

        // Suscribirse a cambios
        const unsubscribe = googleAuthService.subscribe((user) => {
          setAuthState({
            isAuthenticated: !!user,
            user: user,
            loading: false
          });
        });

        return unsubscribe;
      } catch (error: any) {
        console.error('Error inicializando Google Auth:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    const cleanupPromise = initAuth();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  const login = async () => {
    try {
      await googleAuthService.login();
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const logout = () => {
    googleAuthService.logout();
  };

  return { ...authState, login, logout };
};

// UI Components removed - using inline styles in LoginPage

// Página de login
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-10">
        {/* Icon/Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-md">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#1a1a1a' }}>
          Control de Calidad
        </h1>
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: '#1a1a1a' }}>
          Análisis en Descongelado
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-center mb-8" style={{ color: '#666' }}>
          Accede con tu cuenta corporativa para gestionar los análisis
        </p>

        {/* Google Login Button */}
        <div className="mb-6">
          <GoogleLoginButton onLoginSuccess={onLogin} />
        </div>

        {/* Copyright */}
        <p className="text-xs text-center" style={{ color: '#999' }}>
          &copy; {new Date().getFullYear()} Aquagold S.A. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
};

// Componente de carga
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-6 text-lg font-medium text-blue-400 animate-pulse">Cargando sistema...</p>
  </div>
);

// Header con información del usuario
const AppHeader = ({ user, onLogout }: { user: { name: string; email: string; picture?: string }; onLogout: () => void }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white pt-6 pb-2 px-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          {/* Title */}
          <h1 className="text-3xl font-bold text-[#262626] leading-tight max-w-[70%]">
            Análisis en<br />Descongelado
          </h1>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="focus:outline-none group transition-transform active:scale-95"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-md">
                  <span className="text-xl font-bold">{user.name.charAt(0)}</span>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente principal
const NO_OP = () => { };

export default function Home() {
  const { isAuthenticated, user, loading, login, logout } = useGoogleAuth();
  const [initialAnalyses, setInitialAnalyses] = useState<any[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Fetch analyses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAnalyses = async () => {
        setLoadingAnalyses(true);
        try {
          // Import dynamically to avoid server-side issues if any
          const { getAnalysesByDate } = await import('@/lib/analysisService');

          // Get today's date in YYYY-MM-DD format
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;

          const data = await getAnalysesByDate(today);
          setInitialAnalyses(data);
        } catch (error) {
          console.error('Error fetching initial analyses:', error);
        } finally {
          setLoadingAnalyses(false);
        }
      };

      fetchAnalyses();
    }
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={NO_OP} />;
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen pb-10">
      <AppHeader user={user} onLogout={logout} />
      <main className="animate-fade-in">
        {loadingAnalyses ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <AnalysisDashboard initialAnalyses={initialAnalyses} />
        )}
      </main>
    </div>
  );
}
