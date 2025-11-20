'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Edit2, Trash2, Check, Hourglass, Clock, Search } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS, ANALYST_COLOR_HEX } from '@/lib/types';
import DailyReportModal from '@/components/DailyReportModalNew';

export default function AnalysisDashboard() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      alert('Análisis eliminado');
    } catch (error) {
      console.error('Error eliminando análisis:', error);
      alert('Error al eliminar el análisis');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const now = new Date().toISOString();
      await updateAnalysis(id, {
        status: 'COMPLETADO',
        completedAt: now
      });

      // Actualizar la lista local
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
    // Siempre usar la página completa de edición que tiene todos los campos
    router.push(`/dashboard/tests/new?id=${id}`);
  };

  const filteredAnalyses = analyses.filter(analysis => {
    // Filtro solo por búsqueda
    const matchesSearch = analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.lote.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado
    const matchesStatus = filterStatus === 'TODOS' ||
      (filterStatus === 'EN_PROGRESO' && (!analysis.status || analysis.status === 'EN_PROGRESO')) ||
      (filterStatus === 'COMPLETADO' && analysis.status === 'COMPLETADO');

    return matchesSearch && matchesStatus;
  });

  const groupedByStatus = {
    EN_PROGRESO: filteredAnalyses.filter(a => !a.status || a.status === 'EN_PROGRESO'),
    COMPLETADO: filteredAnalyses.filter(a => a.status === 'COMPLETADO')
  };

  const groupedByShift = {
    DIA: filteredAnalyses.filter(a => a.shift === 'DIA'),
    NOCHE: filteredAnalyses.filter(a => a.shift === 'NOCHE')
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* Header & Controls */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {new Date(selectedDate).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowReportModal(true)}
              className="glass-panel p-3 rounded-xl flex items-center justify-center gap-2 flex-1 md:flex-none text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <FileText size={20} />
              <span className="font-semibold">Generar Reporte</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 flex-1 md:flex-none"
            >
              <Plus size={20} />
              <span className="font-semibold">Nuevo Análisis</span>
            </button>
          </div>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar código, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="modern-input w-full pl-12 pr-4 py-3 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
              <div className="flex gap-2">
                {(['TODOS', 'EN_PROGRESO', 'COMPLETADO'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 ${filterStatus === status
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                  >
                    {status === 'TODOS' ? 'Todos' : status === 'EN_PROGRESO' ? 'En Progreso' : 'Completados'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 animate-pulse">Sincronizando datos...</p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-gray-700">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No se encontraron análisis</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            No hay registros que coincidan con tus filtros para la fecha seleccionada.
          </p>
          <button
            onClick={() => router.push('/dashboard/tests/new')}
            className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Primer Análisis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['DIA', 'NOCHE'].map((shift) => {
            const shiftAnalyses = groupedByShift[shift as keyof typeof groupedByShift];
            if (shiftAnalyses.length === 0) return null;

            return (
              <div key={shift} className="space-y-4">
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className={`w-2 h-8 rounded-full ${shift === 'DIA' ? 'bg-amber-400' : 'bg-indigo-500'}`}></div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    Turno {shift} <span className="text-gray-500 text-sm ml-2">({shiftAnalyses.length})</span>
                  </h2>
                </div>

                <div className="space-y-4">
                  {shiftAnalyses.map((analysis) => {
                    const analystColorHex = analysis.analystColor ? ANALYST_COLOR_HEX[analysis.analystColor] : '#06b6d4';

                    return (
                      <div
                        key={analysis.id}
                        onClick={() => handleEdit(analysis.id, analysis.status)}
                        className="glass-card rounded-md p-2 cursor-pointer group hover:bg-white/10 transition-all"
                        style={{ borderLeft: `3px solid ${analystColorHex}` }}
                      >
                        {/* Línea 1: Código + Tipo + Color */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-baseline gap-2 flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white truncate">
                              {analysis.codigo}
                            </h3>
                            <span className="text-[11px] text-blue-400/70 truncate">
                              {PRODUCT_TYPE_LABELS[analysis.productType]}
                            </span>
                          </div>
                          {analysis.analystColor && (
                            <div
                              className="w-6 h-6 rounded-full border-2 border-white/60 shadow-sm flex-shrink-0"
                              style={{ backgroundColor: analystColorHex }}
                              title={analysis.analystColor}
                            />
                          )}
                        </div>

                        {/* Línea 2: Lote y Talla */}
                        <div className="flex gap-2 text-[11px] mb-1">
                          <span className="text-gray-400">Lote:</span>
                          <span className="font-semibold text-gray-200">{analysis.lote}</span>
                          {analysis.talla && (
                            <>
                              <span className="text-gray-600">|</span>
                              <span className="text-gray-400">Talla:</span>
                              <span className="font-semibold text-gray-200">{analysis.talla}</span>
                            </>
                          )}
                        </div>

                        {/* Línea 3: Estado + Botón */}
                        <div className="flex items-center gap-2">
                          {analysis.status !== 'COMPLETADO' ? (
                            <>
                              <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                EN PROGRESO
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleComplete(analysis.id);
                                }}
                                className="flex-1 bg-white text-black font-semibold py-1 px-2 rounded text-[11px] hover:bg-gray-200 transition-colors"
                              >
                                Completar
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              COMPLETADO
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
      )}

      {/* Modal de reporte */}
      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
