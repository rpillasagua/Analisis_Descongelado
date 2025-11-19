'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
  <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>{children}</div>;

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h2>;

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>{children}</p>;

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-4 sm:p-6 pt-0 ${className}`}>{children}</div>;

// Página de login
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0e27] to-[#1a2847] p-2 xs:p-3 sm:p-4">
      <Card className="max-w-xs xs:max-w-sm sm:max-w-md w-full shadow-2xl border-0">
        <CardHeader className="space-y-2 text-center py-3 sm:py-5 px-2 sm:px-4">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <CardTitle className="text-base sm:text-xl leading-tight">Sistema de Análisis de Descongelado</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">Control de Calidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-5 pb-3 sm:pb-5 px-2 sm:px-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3">
            <p className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 text-center">
              Accede con tu cuenta de Google para gestionar análisis de calidad
            </p>
          </div>
          <GoogleLoginButton onLoginSuccess={onLogin} />
          <p className="text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            Al iniciar sesión, aceptas las políticas de uso del sistema
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

// Componente de carga
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a2847]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#06b6d4] mx-auto"></div>
      <p className="mt-4 text-[#9ca3af]">Cargando...</p>
    </div>
  </div>
);

// Header con información del usuario
const AppHeader = ({ user, onLogout }: { user: { name: string; email: string; picture?: string }; onLogout: () => void }) => {
  return (
    <header className="sticky top-0 z-50 glass-card m-0 rounded-none border-b border-[rgba(6,182,212,0.2)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-between items-center gap-2">
          {/* Logo - Compacto en mobile */}
          <div>
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-[#f3f4f6] whitespace-nowrap">
              🦐 Análisis
            </h1>
            <p className="text-[10px] sm:text-xs text-[#9ca3af] hidden xs:block">Control de Calidad</p>
          </div>
          
          {/* Info usuario - Solo en desktop */}
          <div className="text-right hidden md:block">
            <div className="text-xs font-medium text-[#f3f4f6]">
              {user.name}
            </div>
            <div className="text-[10px] text-[#9ca3af]">
              {user.email}
            </div>
          </div>
          
          {/* Avatar */}
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#06b6d4] flex-shrink-0"
            />
          )}
          
          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 text-[#9ca3af] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[rgba(239,68,68,0.1)] flex-shrink-0"
            title="Cerrar sesión"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

// Componente principal
const NO_OP = () => {};

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847]">
      <AppHeader user={user} onLogout={logout} />
      <AnalysisDashboard />
    </div>
  );
}








