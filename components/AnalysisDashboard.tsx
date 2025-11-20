'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Edit2, Trash2, Check, Hourglass, Clock, Filter, Search } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
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
  const [showFilters, setShowFilters] = useState(false);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {new Date(selectedDate).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 flex-1 md:flex-none ${showFilters
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'glass-panel text-gray-300 hover:bg-white/5'
              }`}
          >
            <Filter size={20} />
            <span className="md:hidden">Filtros</span>
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-panel rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="modern-input w-full px-4 py-3 rounded-xl"
              />
            </div>

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
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</label>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-3 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FileText size={18} />
                Generar Reporte
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex flex-wrap gap-2">
              {(['TODOS', 'EN_PROGRESO', 'COMPLETADO'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
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
      )}

      {/* Stats Overview */}
      {!showFilters && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-4 border-l-4 border-blue-500">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{filteredAnalyses.length}</div>
          </div>
          <div className="glass-card rounded-2xl p-4 border-l-4 border-amber-500">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">En Progreso</div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{groupedByStatus.EN_PROGRESO.length}</div>
          </div>
          <div className="glass-card rounded-2xl p-4 border-l-4 border-emerald-500">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Completados</div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{groupedByStatus.COMPLETADO.length}</div>
          </div>
        </div>
      )}

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
                  {shiftAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => handleEdit(analysis.id, analysis.status)}
                      className="glass-card rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
                    >
                      {/* Status Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border ${analysis.status === 'COMPLETADO'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {analysis.status === 'COMPLETADO' ? 'COMPLETADO' : 'EN PROGRESO'}
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                            <Clock size={12} />
                            {new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {analysis.codigo}
                          </h3>
                          <p className="text-sm font-medium text-blue-400/80 mt-0.5">
                            {PRODUCT_TYPE_LABELS[analysis.productType]}
                          </p>

                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                          <span className="text-xs text-gray-500 block mb-0.5">Lote</span>
                          <span className="text-sm font-mono font-semibold text-gray-200">{analysis.lote}</span>
                        </div>
                        {/* Support for both new (analyses[0]) and legacy (direct property) structures */}
                        {(analysis.analyses?.[0]?.pesoNeto?.valor || (analysis as any).pesoNeto?.valor) && (
                          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                            <span className="text-xs text-gray-500 block mb-0.5">Peso Neto</span>
                            <span className="text-sm font-semibold text-gray-200">
                              {analysis.analyses?.[0]?.pesoNeto?.valor || (analysis as any).pesoNeto?.valor} kg
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        {analysis.status !== 'COMPLETADO' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(analysis.id);
                            }}
                            className="flex-1 bg-white text-black font-bold py-2.5 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Check size={16} />
                            Completar
                          </button>
                        ) : (
                          <div className="flex gap-2 w-full justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(analysis.id, analysis.status);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteConfirm === analysis.id) {
                                  handleDelete(analysis.id);
                                } else {
                                  setDeleteConfirm(analysis.id);
                                  setTimeout(() => setDeleteConfirm(null), 3000);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${deleteConfirm === analysis.id
                                ? 'bg-red-500 text-white'
                                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
