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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Header Compacto */}
        <div className="flex justify-between items-center mb-6 sticky top-16 z-20 glass-card py-4 px-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-bold text-[#f3f4f6]">
              Análisis
            </h1>
            <p className="text-xs text-[#9ca3af]">
              {new Date(selectedDate).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-all ${showFilters ? 'bg-[rgba(6,182,212,0.2)] text-[#06b6d4]' : 'glass-card text-[#9ca3af] hover:text-[#06b6d4]'}`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="p-2 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:from-[#0891b2] hover:to-[#067e8f]"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Filtros Expandibles */}
        {showFilters && (
          <div className="glass-card rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="space-y-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-[rgba(6,182,212,0.2)] rounded-lg bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] placeholder-[#6b7280]"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="Buscar código o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[rgba(6,182,212,0.2)] rounded-lg bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] placeholder-[#6b7280]"
                />
              </div>
              <div className="flex gap-2 p-1 bg-[rgba(6,182,212,0.1)] rounded-lg">
                {(['TODOS', 'EN_PROGRESO', 'COMPLETADO'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      filterStatus === status
                        ? 'glass-card text-[#06b6d4] shadow-sm'
                        : 'text-[#9ca3af] hover:text-[#06b6d4]'
                    }`}
                  >
                    {status === 'TODOS' ? 'Todos' : status === 'EN_PROGRESO' ? 'En Progreso' : 'Completados'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#10b981] bg-[rgba(16,185,129,0.1)] rounded-lg hover:bg-[rgba(16,185,129,0.2)] transition-colors border border-[rgba(16,185,129,0.2)]"
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
            <div className="flex-shrink-0 px-4 py-2 glass-card rounded-lg border-l-4 border-[#06b6d4]">
              <div className="text-xs text-[#9ca3af]">Total</div>
              <div className="text-lg font-bold text-[#f3f4f6]">{filteredAnalyses.length}</div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 glass-card rounded-lg border-l-4 border-[#f97316]">
              <div className="text-xs text-[#9ca3af]">En Progreso</div>
              <div className="text-lg font-bold text-[#f3f4f6]">{groupedByStatus.EN_PROGRESO.length}</div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 glass-card rounded-lg border-l-4 border-[#10b981]">
              <div className="text-xs text-[#9ca3af]">Completados</div>
              <div className="text-lg font-bold text-[#f3f4f6]">{groupedByStatus.COMPLETADO.length}</div>
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
          <div className="text-center py-12 glass-card rounded-2xl border border-[rgba(6,182,212,0.2)]">
            <div className="bg-[rgba(6,182,212,0.1)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-[#06b6d4]" />
            </div>
            <h3 className="text-lg font-medium text-[#f3f4f6] mb-1">No hay análisis</h3>
            <p className="text-[#9ca3af] text-sm mb-4">No se encontraron registros para esta fecha</p>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="text-[#06b6d4] font-medium text-sm hover:text-[#0891b2] transition-colors"
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
                  <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-3 ml-1">
                    Turno {shift} ({shiftAnalyses.length})
                  </h2>
                  <div className="space-y-4">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => handleEdit(analysis.id, analysis.status)}
                        className="glass-card rounded-xl overflow-hidden border border-[rgba(6,182,212,0.2)] transition-all cursor-pointer active:scale-[0.99] hover:shadow-lg hover:border-[rgba(6,182,212,0.4)]"
                      >
                        {/* Card Header */}
                        <div className="px-4 py-3 flex justify-between items-center border-b border-[rgba(6,182,212,0.1)] bg-[rgba(6,182,212,0.05)]">
                          <div className="flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                            <Clock size={14} />
                            {new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            analysis.status === 'COMPLETADO' 
                              ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981]'
                              : 'bg-[rgba(249,115,22,0.2)] text-[#f97316]'
                          }`}>
                            {analysis.status === 'COMPLETADO' ? <Check size={12} /> : <Hourglass size={12} />}
                            {analysis.status === 'COMPLETADO' ? 'COMPLETADO' : 'EN PROGRESO'}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-3xl font-bold text-[#f3f4f6] tracking-tight leading-none">
                                {analysis.codigo}
                              </h3>
                              <p className="text-sm font-medium text-[#06b6d4] mt-1">
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
                                  className="p-2.5 sm:p-2 text-[#9ca3af] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)] rounded-full transition-colors active:scale-95"
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
                                    className="p-2.5 sm:p-2 text-[#ef4444] bg-[rgba(239,68,68,0.2)] rounded-full animate-pulse active:scale-95"
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
                                    className="p-2.5 sm:p-2 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded-full transition-colors active:scale-95"
                                    aria-label="Eliminar análisis"
                                  >
                                    <Trash2 size={20} className="sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 bg-[rgba(6,182,212,0.05)] rounded-lg p-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[#9ca3af]">Lote:</span>
                              <span className="font-mono font-semibold text-[#f3f4f6]">{analysis.lote}</span>
                            </div>
                            {analysis.talla && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-[#9ca3af]">Talla:</span>
                                <span className="font-semibold text-[#f3f4f6]">{analysis.talla}</span>
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
