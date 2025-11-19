'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Edit2, Trash2, Check, Hourglass, Clock } from 'lucide-react';
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
    
    return matchesSearch;
  });

  const groupedByShift = {
    DIA: filteredAnalyses.filter(a => a.shift === 'DIA'),
    NOCHE: filteredAnalyses.filter(a => a.shift === 'NOCHE')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Barra de búsqueda solamente */}
        <div className="glass-card rounded-xl p-3 mb-6 sticky top-20 z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Buscar código o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[rgba(6,182,212,0.2)] rounded-lg bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:border-[rgba(6,182,212,0.4)]"
            />
          </div>
        </div>

        {/* Lista de Análisis */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#06b6d4] mb-4"></div>
            <p className="text-[#9ca3af] text-sm">Cargando análisis...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-[rgba(6,182,212,0.2)]">
            <div className="bg-[rgba(6,182,212,0.1)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-[#06b6d4]" />
            </div>
            <h3 className="text-lg font-medium text-[#f3f4f6] mb-1">No hay análisis</h3>
            <p className="text-[#9ca3af] text-sm">No se encontraron registros para esta búsqueda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {['DIA', 'NOCHE'].map((shift) => {
              const shiftAnalyses = groupedByShift[shift as keyof typeof groupedByShift];
              if (shiftAnalyses.length === 0) return null;

              return (
                <div key={shift}>
                  <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-2 ml-1">
                    Turno {shift} ({shiftAnalyses.length})
                  </h2>
                  <div className="space-y-2">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => handleEdit(analysis.id, analysis.status)}
                        className="glass-card rounded-lg overflow-hidden border border-[rgba(6,182,212,0.2)] transition-all cursor-pointer active:scale-[0.99] hover:shadow-lg hover:border-[rgba(6,182,212,0.4)]"
                      >
                        {/* Card Header compacto */}
                        <div className="px-3 py-1.5 flex justify-between items-center border-b border-[rgba(6,182,212,0.1)] bg-[rgba(6,182,212,0.05)]">
                          <div className="flex items-center gap-1 text-xs font-medium text-[#9ca3af]">
                            <Clock size={12} />
                            {new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide ${
                            analysis.status === 'COMPLETADO' 
                              ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981]'
                              : 'bg-[rgba(249,115,22,0.2)] text-[#f97316]'
                          }`}>
                            {analysis.status === 'COMPLETADO' ? <Check size={9} /> : <Hourglass size={9} />}
                            {analysis.status === 'COMPLETADO' ? 'LISTO' : 'EN PROG'}
                          </div>
                        </div>

                        {/* Card Body compacto */}
                        <div className="p-2.5">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[#9ca3af] text-[10px]">Lote:</span>
                              <p className="font-mono font-semibold text-[#f3f4f6] text-[11px] truncate">{analysis.lote}</p>
                            </div>
                            <div>
                              <span className="text-[#9ca3af] text-[10px]">Código:</span>
                              <p className="font-bold text-[#f3f4f6] text-[11px]">{analysis.codigo}</p>
                            </div>
                            <div>
                              <span className="text-[#9ca3af] text-[10px]">Talla:</span>
                              <p className="font-semibold text-[#f3f4f6] text-[11px]">{analysis.talla || '-'}</p>
                            </div>
                          </div>

                          {/* Tipo de producto - más compacto */}
                          <div className="mt-1.5 pt-1.5 border-t border-[rgba(6,182,212,0.1)]">
                            <p className="text-[10px] font-medium text-[#06b6d4]">
                              {PRODUCT_TYPE_LABELS[analysis.productType]}
                            </p>
                          </div>
                        </div>

                        {/* Botones de edición solo si está completado */}
                        {analysis.status === 'COMPLETADO' && (
                          <div className="px-2 py-1 flex gap-1 border-t border-[rgba(6,182,212,0.1)] bg-[rgba(6,182,212,0.02)]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(analysis.id, analysis.status);
                              }}
                              className="p-1 text-[#9ca3af] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)] rounded transition-colors active:scale-95"
                              aria-label="Editar análisis"
                            >
                              <Edit2 size={14} />
                            </button>
                            {deleteConfirm === analysis.id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(analysis.id);
                                }}
                                className="p-1 text-[#ef4444] bg-[rgba(239,68,68,0.2)] rounded animate-pulse active:scale-95"
                                aria-label="Confirmar eliminación"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(analysis.id);
                                  setTimeout(() => setDeleteConfirm(null), 3000);
                                }}
                                className="p-1 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors active:scale-95"
                                aria-label="Eliminar análisis"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
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
