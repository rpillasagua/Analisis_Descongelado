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

// UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`glass-card rounded-2xl p-1 ${className}`}>{children}</div>;

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`p-6 sm:p-8 text-center ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <h2 className={`text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 ${className}`}>{children}</h2>;

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <p className={`text-sm sm:text-base text-gray-400 mt-2 ${className}`}>{children}</p>;

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`p-6 sm:p-8 pt-0 ${className}`}>{children}</div>;

// Página de login
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[100px]"></div>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-t border-white/10">
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <User className="h-10 w-10 text-white" />
          </div>
          <CardTitle>Sistema de Análisis</CardTitle>
          <CardDescription>Control de Calidad y Resistencias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-200 text-center font-medium">
              Accede con tu cuenta corporativa para gestionar los análisis.
            </p>
          </div>

          <div className="transform hover:scale-[1.02] transition-transform duration-200">
            <GoogleLoginButton onLoginSuccess={onLogin} />
          </div>

          <p className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Aquagold S.A. Todos los derechos reservados.
          </p>
        </CardContent>
      </Card>
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
  return (
    <header className="glass-panel sticky top-0 z-50 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white hidden sm:block">
              Resistencias App
            </h1>
            <p className="text-[10px] sm:text-xs text-[#9ca3af] hidden xs:block">Control de Calidad</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-gray-200">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.email}
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border-2 border-blue-500/50 shadow-md"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-300">{user.name.charAt(0)}</span>
                </div>
              )}

              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
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
        <AnalysisDashboard />
      </main>
    </div>
  );
}
