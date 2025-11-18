'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Edit2, Trash2, Check, Hourglass, Clock, Filter } from 'lucide-react';
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
    // Filtro por búsqueda
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Header Compacto */}
        <div className="flex justify-between items-center mb-6 sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Análisis
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(selectedDate).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm'}`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Filtros Expandibles */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="space-y-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar código o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {(['TODOS', 'EN_PROGRESO', 'COMPLETADO'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      filterStatus === status
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {status === 'TODOS' ? 'Todos' : status === 'EN_PROGRESO' ? 'En Progreso' : 'Completados'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileText size={16} />
                Generar Reporte Diario
              </button>
            </div>
          </div>
        )}

        {/* Resumen Rápido */}
        {!showFilters && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-lg font-bold">{filteredAnalyses.length}</div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-orange-500">
              <div className="text-xs text-gray-500">En Progreso</div>
              <div className="text-lg font-bold">{groupedByStatus.EN_PROGRESO.length}</div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="text-xs text-gray-500">Completados</div>
              <div className="text-lg font-bold">{groupedByStatus.COMPLETADO.length}</div>
            </div>
          </div>
        )}

        {/* Lista de Análisis */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Cargando análisis...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No hay análisis</h3>
            <p className="text-gray-500 text-sm mb-4">No se encontraron registros para esta fecha</p>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              Crear nuevo análisis
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {['DIA', 'NOCHE'].map((shift) => {
              const shiftAnalyses = groupedByShift[shift as keyof typeof groupedByShift];
              if (shiftAnalyses.length === 0) return null;

              return (
                <div key={shift}>
                  <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                    Turno {shift} ({shiftAnalyses.length})
                  </h2>
                  <div className="space-y-4">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => handleEdit(analysis.id, analysis.status)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all cursor-pointer active:scale-[0.99] hover:shadow-lg"
                      >
                        {/* Card Header */}
                        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <Clock size={14} />
                            {new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            analysis.status === 'COMPLETADO' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {analysis.status === 'COMPLETADO' ? <Check size={12} /> : <Hourglass size={12} />}
                            {analysis.status === 'COMPLETADO' ? 'COMPLETADO' : 'EN PROGRESO'}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                                {analysis.codigo}
                              </h3>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                                {PRODUCT_TYPE_LABELS[analysis.productType]}
                              </p>
                            </div>
                            {analysis.status === 'COMPLETADO' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(analysis.id, analysis.status);
                                  }}
                                  className="p-2.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors active:scale-95"
                                  aria-label="Editar análisis"
                                >
                                  <Edit2 size={20} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                {deleteConfirm === analysis.id ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(analysis.id);
                                    }}
                                    className="p-2.5 sm:p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full animate-pulse active:scale-95"
                                    aria-label="Confirmar eliminación"
                                  >
                                    <Trash2 size={20} className="sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm(analysis.id);
                                      setTimeout(() => setDeleteConfirm(null), 3000);
                                    }}
                                    className="p-2.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors active:scale-95"
                                    aria-label="Eliminar análisis"
                                  >
                                    <Trash2 size={20} className="sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Lote:</span>
                              <span className="font-mono font-semibold text-gray-900 dark:text-white">{analysis.lote}</span>
                            </div>
                            {analysis.talla && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Talla:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{analysis.talla}</span>
                              </div>
                            )}
                            {analysis.pesoNeto?.valor && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Peso Neto:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{analysis.pesoNeto.valor} kg</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        {analysis.status !== 'COMPLETADO' && (
                          <div className="px-4 pb-4 pt-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(analysis.id);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                            >
                              <Check size={18} />
                              COMPLETAR
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de reporte */}
      <DailyReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
}
