'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search } from 'lucide-react';
import { getAnalysesByDate, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS, ANALYST_COLOR_HEX } from '@/lib/types';
import DailyReportModal from '@/components/DailyReportModalNew';

export default function AnalysisDashboard() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'EN_PROGRESO' | 'COMPLETADO'>('TODOS');

  useEffect(() => {
    loadAnalyses();
  }, [selectedDate]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await getAnalysesByDate(selectedDate);
      setAnalyses(data);
    } catch (error) {
      console.error('Error cargando análisis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const now = new Date().toISOString();
      await updateAnalysis(id, {
        status: 'COMPLETADO',
        completedAt: now
      });

      setAnalyses(prev => prev.map(a =>
        a.id === id
          ? { ...a, status: 'COMPLETADO' as const, completedAt: now }
          : a
      ));

      alert('Análisis marcado como completado');
    } catch (error) {
      console.error('Error completando análisis:', error);
      alert('Error al completar el análisis');
    }
  };

  const handleEdit = (id: string, status?: string) => {
    router.push(`/dashboard/tests/new?id=${id}`);
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.lote.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'TODOS' ||
      (filterStatus === 'EN_PROGRESO' && (!analysis.status || analysis.status === 'EN_PROGRESO')) ||
      (filterStatus === 'COMPLETADO' && analysis.status === 'COMPLETADO');

    return matchesSearch && matchesStatus;
  });

  const groupedByShift = {
    DIA: filteredAnalyses.filter(a => a.shift === 'DIA'),
    NOCHE: filteredAnalyses.filter(a => a.shift === 'NOCHE')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Controls & Search Section */}
        <div className="flex flex-col gap-6 mb-8">

          {/* Top Actions: Report & New Analysis */}
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all font-medium text-sm sm:text-base shadow-sm"
            >
              <FileText size={20} />
              <span>Reporte</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
            >
              <Plus size={20} />
              <span>Nuevo Análisis</span>
            </button>
          </div>

          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Buscar por código o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-gray-300 text-gray-900 text-2xl px-8 py-6 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-gray-400 text-center shadow-lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex bg-white rounded-xl p-1.5 border-2 border-gray-200 shadow-sm">
            <button
              onClick={() => setFilterStatus('TODOS')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${filterStatus === 'TODOS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Todos
            </button>

            <button
              onClick={() => setFilterStatus('EN_PROGRESO')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterStatus === 'EN_PROGRESO'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${filterStatus === 'EN_PROGRESO' ? 'bg-amber-300' : 'bg-amber-500'}`}></span>
              En Progreso
            </button>

            <button
              onClick={() => setFilterStatus('COMPLETADO')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterStatus === 'COMPLETADO'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${filterStatus === 'COMPLETADO' ? 'bg-emerald-300' : 'bg-emerald-500'}`}></span>
              Completados
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron análisis</h3>
            <p className="text-gray-600 text-sm mb-6">
              Intenta ajustar tus filtros de búsqueda.
            </p>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={16} />
              Crear Análisis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {['DIA', 'NOCHE'].map((shift) => {
              const shiftAnalyses = groupedByShift[shift as keyof typeof groupedByShift];
              if (shiftAnalyses.length === 0) return null;

              return (
                <div key={shift} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-1 h-6 rounded-full ${shift === 'DIA' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Turno {shift}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {shiftAnalyses.map((analysis) => {
                      const analystColorHex = analysis.analystColor ? ANALYST_COLOR_HEX[analysis.analystColor] : '#0ea5e9';

                      return (
                        <div
                          key={analysis.id}
                          onClick={() => handleEdit(analysis.id, analysis.status)}
                          className="bg-white border-2 border-gray-200 rounded-xl p-5 cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400"
                          style={{
                            boxShadow: `0 4px 20px -10px ${analystColorHex}40`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Main Title: Lote */}
                              <h3 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors">
                                {analysis.lote}
                              </h3>

                              {/* Secondary Info: Code & Talla */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                                <div className="flex flex-col">
                                  <span className="text-gray-500 font-medium text-xs">Código</span>
                                  <span className="text-gray-900 font-semibold">{analysis.codigo}</span>
                                </div>
                                {analysis.talla && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-500 font-medium text-xs">Talla</span>
                                    <span className="text-gray-900 font-semibold">{analysis.talla}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Product Type & Analyst Color */}
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm font-bold text-gray-700 whitespace-nowrap px-3 py-1 bg-gray-100 rounded-lg">
                                {PRODUCT_TYPE_LABELS[analysis.productType]}
                              </span>
                              {analysis.analystColor && (
                                <div
                                  className="w-10 h-10 rounded-full ring-4 ring-white shadow-lg transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: analystColorHex, boxShadow: `0 4px 12px ${analystColorHex}60` }}
                                  title={`Analista: ${analysis.analystColor}`}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 mt-3">
                            {analysis.status !== 'COMPLETADO' ? (
                              <div className="flex items-center justify-between w-full gap-3">
                                <span className="text-sm font-semibold text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                  En Progreso
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleComplete(analysis.id);
                                  }}
                                  className="text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-all border-2 border-blue-600"
                                >
                                  Completar
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Completado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
        }

        <DailyReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      </div >
    </div>
  );
}
