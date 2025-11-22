'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Optimización de Next.js
import { User, LogOut, Loader2 } from 'lucide-react';
import { googleAuthService, UserProfile } from '@/lib/googleAuthService';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { QualityAnalysis } from '@/lib/types';
import { logger } from '@/lib/logger';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

// --- Custom Hook ---
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

        // La suscripción actualiza el estado automáticamente cuando el servicio cambia
        const unsubscribe = googleAuthService.subscribe((user) => {
          setAuthState({
            isAuthenticated: !!user,
            user: user,
            loading: false
          });
        });

        return unsubscribe;
      } catch (error) {
        logger.error('Error inicializando Google Auth:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    // Ejecutar y limpiar
    const cleanupPromise = initAuth();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  const login = async () => {
    try {
      await googleAuthService.login();
    } catch (error) {
      logger.error('Error en login:', error);
    }
  };

  const logout = () => {
    googleAuthService.logout();
  };
  return { ...authState, login, logout };
};

// --- Components ---

const LoginPage = ({ onLoginTrigger }: { onLoginTrigger: () => void }) => {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-300">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Control de Calidad</h1>
          <h2 className="text-xl font-semibold text-slate-800">Análisis en Descongelado</h2>
          <p className="text-sm text-slate-500 mt-2">Accede con tu cuenta corporativa para gestionar los análisis</p>
        </div>
        <div className="mb-8"><GoogleLoginButton onLoginSuccess={onLoginTrigger} /></div>
        <p className="text-xs text-center text-slate-400">&copy; {new Date().getFullYear()} Aquagold S.A. Todos los derechos reservados.</p>
      </div>
      const {isAuthenticated, user, loading, login, logout} = useGoogleAuth();
      const [initialAnalyses, setInitialAnalyses] = useState<QualityAnalysis[]>([]);
      const [initialLastDoc, setInitialLastDoc] = useState<any>(null);
        const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Efecto para cargar datos SOLO cuando el usuario se autentica
  useEffect(() => {
          let isMounted = true;

        if (isAuthenticated && user) {
      const fetchAnalyses = async () => {
          setLoadingAnalyses(true);
        try {
          const {getPaginatedAnalyses} = await import('@/lib/analysisService');
        const {analyses, lastDoc} = await getPaginatedAnalyses(20);

        if (isMounted) {
          setInitialAnalyses(analyses);
        setInitialLastDoc(lastDoc);
          }
        } catch (error) {
          logger.error('Error fetching initial analyses:', error);
        } finally {
          if (isMounted) {
          setLoadingAnalyses(false);
          }
        }
      };

        fetchAnalyses();
    }

    return () => {isMounted = false; };
  }, [isAuthenticated, user]);

        if (loading) return <LoadingScreen />;

        if (!isAuthenticated || !user) {
    return <LoginPage onLoginTrigger={login} />;
  }

        return (
        <div className="min-h-screen bg-slate-50 pb-10">
          <AppHeader user={user} onLogout={logout} />

          <main className="animate-fade-in mt-6">
            {loadingAnalyses ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Obteniendo registros recientes...</p>
              </div>
            ) : (
              <AnalysisDashboard initialAnalyses={initialAnalyses} initialLastDoc={initialLastDoc} />
            )}
          </main>
        </div>
        );
}
