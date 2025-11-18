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
        
        const isAuth = googleAuthService.isAuthenticated();
        const user = googleAuthService.getUser();
        
        setAuthState({
          isAuthenticated: isAuth,
          user: user || null,
          loading: false
        });
      } catch (error: any) {
        console.error('Error inicializando Google Auth:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    try {
      await googleAuthService.login();
      const user = googleAuthService.getUser();
      setAuthState({
        isAuthenticated: true,
        user: user || null,
        loading: false
      });
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const logout = () => {
    googleAuthService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Sistema de Análisis de Descongelado</CardTitle>
          <CardDescription>Control de Calidad - Aquagold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              Accede con tu cuenta de Google para gestionar análisis de calidad
            </p>
          </div>
          <GoogleLoginButton onLoginSuccess={onLogin} />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Al iniciar sesión, aceptas las políticas de uso del sistema
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

// Componente de carga
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
);

// Header con información del usuario
const AppHeader = ({ user, onLogout }: { user: { name: string; email: string; picture?: string }; onLogout: () => void }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🦐 Análisis de Descongelado
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Aquagold S.A.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
            
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600"
              />
            )}
            
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente principal
export default function Home() {
  const { isAuthenticated, user, loading, login, logout } = useGoogleAuth();

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={login} />;
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader user={user} onLogout={logout} />
      <AnalysisDashboard />
    </div>
  );
}








