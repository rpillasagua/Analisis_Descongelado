'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Filter } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS, ANALYST_COLOR_HEX } from '@/lib/types';
import DailyReportModal from '@/components/DailyReportModalNew';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

export default function AnalysisDashboard() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'EN_PROGRESO' | 'COMPLETADO'>('TODOS');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<{ id: string, lote: string } | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, id: string, lote: string) => {
    e.stopPropagation();
    setAnalysisToDelete({ id, lote });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!analysisToDelete) return;

    try {
      await deleteAnalysis(analysisToDelete.id);
      setAnalyses(prev => prev.filter(a => a.id !== analysisToDelete.id));
      // Optional: Show success toast
    } catch (error) {
      console.error('Error eliminando análisis:', error);
      alert('Error al eliminar el análisis');
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Controls & Search Section */}
      <div className="flex flex-col gap-6 mb-8">

        {/* Top Actions: Report & New Analysis */}
        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-4 py-3 sm:py-3 min-h-[44px] bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-medium text-sm sm:text-base"
          >
            <FileText size={20} />
            <span>Reporte</span>
          </button>


          <button
            onClick={() => router.push('/dashboard/tests/new')}
            className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-4 py-3 sm:py-3 min-h-[44px] bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 font-medium text-sm sm:text-base"
          >
            <Plus size={20} />
            <span>Nuevo Análisis</span>
          </button>
        </div>

        {/* Search Bar (Maximum Size) */}
        <div>
          <input
            type="text"
            placeholder="Buscar por código o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-2xl px-8 py-6 rounded-2xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600 text-center shadow-lg"
          />
        </div>

        {/* Filter Buttons (Centered & Full Width with Indicators) */}
        <div className="flex bg-slate-900 rounded-xl p-1.5 border border-slate-800">
          <button
            onClick={() => setFilterStatus('TODOS')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${filterStatus === 'TODOS'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Todos
          </button>

          <button
            onClick={() => setFilterStatus('EN_PROGRESO')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterStatus === 'EN_PROGRESO'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterStatus === 'EN_PROGRESO' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-amber-500/50'}`}></span>
            En Progreso
          </button>

          <button
            onClick={() => setFilterStatus('COMPLETADO')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterStatus === 'COMPLETADO'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterStatus === 'COMPLETADO' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/50'}`}></span>
            Completados
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card p-12 text-center border-dashed">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No se encontraron análisis</h3>
          <p className="text-slate-400 text-sm mb-6">
            Intenta ajustar tus filtros de búsqueda.
          </p>
          <button
            onClick={() => router.push('/dashboard/tests/new')}
            className="btn-primary px-6 py-2 inline-flex items-center gap-2 text-sm"
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
                  <div className={`w-1 h-4 rounded-full ${shift === 'DIA' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
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
                        className="card p-4 cursor-pointer group transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
                        style={{
                          borderColor: analystColorHex,
                          boxShadow: `0 4px 20px -10px ${analystColorHex}40`,
                          background: `linear-gradient(145deg, ${analystColorHex}08 0%, rgba(15, 23, 42, 1) 100%)`
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Main Title: Lote (Swapped from Code) */}
                            <h3 className="text-base font-semibold text-white truncate mb-1 group-hover:text-sky-400 transition-colors">
                              {analysis.lote}
                            </h3>

                            {/* Secondary Info: Code & Talla - Improved Layout */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                              <div className="flex flex-col">
                                <span className="text-slate-500 font-medium">Código</span>
                                <span className="text-slate-300 font-mono">{analysis.codigo}</span>
                              </div>
                              {analysis.talla && (
                                <div className="flex flex-col">
                                  <span className="text-slate-500 font-medium">Talla</span>
                                  <span className="text-slate-300 font-mono">{analysis.talla}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Product Type & Analyst Color */}
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-bold text-slate-300 whitespace-nowrap">
                              {PRODUCT_TYPE_LABELS[analysis.productType]}
                            </span>
                            {analysis.analystColor && (
                              <div
                                className="w-8 h-8 rounded-full ring-2 ring-slate-800 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: analystColorHex, boxShadow: `0 0 10px ${analystColorHex}80` }}
                                title={`Analista: ${analysis.analystColor}`}
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                          <div className="flex items-center gap-3">
                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteClick(e, analysis.id, analysis.lote)}
                              className="text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                              title="Eliminar análisis"
                            >
                              Borrar
                            </button>
                          </div>

                          {analysis.status !== 'COMPLETADO' ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-amber-500 flex items-center gap-1.5">
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
                                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 sm:px-4 py-2 sm:py-2 min-h-[40px] sm:min-h-[44px] rounded-lg hover:bg-slate-800 transition-colors"
                              >
                                Completar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={analysisToDelete?.lote}
      />
    </div >
  );
}
