'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, CheckCircle, Plus, Ruler, QrCode, Loader2, Calendar } from 'lucide-react';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import DailyReportCard from './DailyReportCard';
import { logger } from '@/lib/logger';

interface AnalysisDashboardProps {
  initialAnalyses: QualityAnalysis[];
  initialLastDoc?: any;
}

export default function AnalysisDashboard({ initialAnalyses, initialLastDoc }: AnalysisDashboardProps) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>(initialAnalyses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'en_progreso'>('todos');

  // Pagination state
  const [lastDoc, setLastDoc] = useState<any>(initialLastDoc);
  const [hasMore, setHasMore] = useState(!!initialLastDoc);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnalyses(initialAnalyses);
    setLastDoc(initialLastDoc);
    setHasMore(!!initialLastDoc);
  }, [initialAnalyses, initialLastDoc]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || searchTerm) return;

    setIsLoadingMore(true);
    try {
      const { getPaginatedAnalyses } = await import('@/lib/analysisService');
      const { analyses: newAnalyses, lastDoc: newLastDoc } = await getPaginatedAnalyses(20, lastDoc);

      if (newAnalyses.length === 0) {
        setHasMore(false);
      } else {
        setAnalyses((prev: any[]) => [...prev, ...newAnalyses]);
        setLastDoc(newLastDoc);
        if (newAnalyses.length < 20) {
          setHasMore(false);
        }
      }
    } catch (error) {
      logger.error('Error loading more analyses:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lastDoc, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchTerm) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore, hasMore, isLoadingMore, searchTerm]);

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch =
      analysis.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'todos') return matchesSearch && analysis.status === 'COMPLETADO';
    if (activeTab === 'en_progreso') return matchesSearch && analysis.status !== 'COMPLETADO';

    return matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Controls Section - Sticky con glassmorphism */}
      <div className="sticky top-0 z-30 glass border-b border-white/20 backdrop-blur-xl px-3 py-3 sm:px-4 sm:py-4 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Actions Row - Mobile optimized */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="flex-1 gradient-blue text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-sm sm:text-base font-bold hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md min-w-0"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Nuevo</span>
            </button>
            <button
              onClick={() => setShowReportModal(!showReportModal)}
              className="flex-1 bg-white/90 backdrop-blur text-blue-600 border-2 border-blue-500/50 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-sm sm:text-base font-bold hover:bg-blue-50 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 min-w-0"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Reporte</span>
            </button>
          </div>

          {/* Search Bar con glassmorphism */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por lote o código..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full glass shadow-xl pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border border-white/20 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder-gray-400 text-gray-900 outline-none"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1 glass p-1 rounded-full shadow-md">
              <button
                onClick={() => setActiveTab('todos')}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${activeTab === 'todos'
                  ? 'gradient-blue text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('en_progreso')}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${activeTab === 'en_progreso'
                  ? 'gradient-blue text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
              >
                En Progreso
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 pb-6">
        {/* Report Card */}
        {showReportModal && (
          <div className="mb-3 animate-slide-up">
            <DailyReportCard onClose={() => setShowReportModal(false)} />
          </div>
        )}

        {/* Grid de Análisis - Compacto y optimizado para móvil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => router.push(`/dashboard/tests/edit?id=${analysis.id}`)}
              className="card-float cursor-pointer relative overflow-hidden group bg-white"
            >
              {/* Gradient accent border */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600"
              />

              <div className="p-2.5 sm:p-3">
                {/* Header compacto */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                      {analysis.lote}
                    </h3>
                    {analysis.status === 'COMPLETADO' && (
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-1">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">{new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Grid compacto 2x2 */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  {/* Producto */}
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight mb-0.5">Producto</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                      {PRODUCT_TYPE_LABELS[analysis.productType]}
                    </p>
                  </div>

                  {/* Código */}
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight flex items-center gap-1 mb-0.5">
                      <QrCode className="w-2.5 h-2.5" /> Código
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight truncate">
                      {analysis.codigo}
                    </p>
                  </div>

                  {/* Talla */}
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight flex items-center gap-1 mb-0.5">
                      <Ruler className="w-2.5 h-2.5" /> Talla
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                      {analysis.talla || '-'}
                    </p>
                  </div>

                  {/* Turno */}
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight mb-0.5">Turno</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-sm leading-tight ${analysis.shift === 'NOCHE'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-amber-100 text-amber-700'
                      }`}>
                      {analysis.shift}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover overlay sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        {hasMore && !searchTerm && (
          <div ref={observerTarget} className="flex justify-center py-6 sm:py-8">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {filteredAnalyses.length === 0 && (
          <div className="text-center py-12 sm:py-16 animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 glass rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No se encontraron análisis</h3>
            <p className="text-sm sm:text-base text-gray-500">Intenta ajustar tu búsqueda o crea un nuevo análisis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
