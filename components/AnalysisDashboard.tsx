'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Edit2, Trash2, Check, Hourglass, Clock, User, LogOut } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import DailyReportModal from '@/components/DailyReportModalNew';
import { googleAuthService } from '@/lib/googleAuthService';

export default function AnalysisDashboard() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'EN_PROGRESO'>('TODOS');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; picture?: string } | null>(null);

  useEffect(() => {
    // Obtener usuario actual
    const user = googleAuthService.getUser();
    setCurrentUser(user);
    
    // Suscribirse a cambios de usuario
    const unsubscribe = googleAuthService.subscribe((user) => {
      setCurrentUser(user);
    });
    
    loadAnalyses();
    return unsubscribe;
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
    
    // Filtro por estado: solo mostrar "En Progreso" o "Todos"
    const matchesStatus = filterStatus === 'TODOS' || 
                         (filterStatus === 'EN_PROGRESO' && (!analysis.status || analysis.status === 'EN_PROGRESO'));
    
    return matchesSearch && matchesStatus;
  });

  const groupedByShift = {
    DIA: filteredAnalyses.filter(a => a.shift === 'DIA'),
    NOCHE: filteredAnalyses.filter(a => a.shift === 'NOCHE')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Título y fecha centrados */}
        <div className="text-center mb-6 sticky top-16 z-20">
          <h1 className="text-2xl font-bold text-[#f3f4f6]">
            Análisis
          </h1>
          <p className="text-xs text-[#9ca3af]">
            {new Date(selectedDate).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Botones principales centrados */}
        <div className="flex justify-center gap-4 mb-6 sticky top-28 z-20">
          {/* Botón Generar Reporte */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-3 bg-gradient-to-br from-[#10b981] to-[#059669] text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 hover:from-[#059669] hover:to-[#047857]"
            title="Generar Reporte"
          >
            <FileText size={24} />
          </button>
          
          {/* Botón Nuevo Análisis */}
          <button
            onClick={() => router.push('/dashboard/tests/new')}
            className="p-3 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 hover:from-[#0891b2] hover:to-[#067e8f]"
            title="Nuevo Análisis"
          >
            <Plus size={28} />
          </button>

          {/* Botón Perfil con menú */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-3 rounded-full transition-all hover:bg-[rgba(6,182,212,0.2)] text-[#06b6d4]"
              title="Perfil"
            >
              {currentUser?.picture ? (
                <img 
                  src={currentUser.picture} 
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full border-2 border-[#06b6d4]"
                />
              ) : (
                <User size={24} />
              )}
            </button>
            
            {/* Menú desplegable de Perfil */}
            {showProfileMenu && currentUser && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-xl border border-[rgba(6,182,212,0.2)] z-30 overflow-hidden">
                <div className="px-4 py-3 border-b border-[rgba(6,182,212,0.1)]">
                  <p className="text-sm font-medium text-[#f3f4f6]">{currentUser.name}</p>
                  <p className="text-xs text-[#9ca3af]">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    googleAuthService.logout();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Barra de búsqueda siempre visible */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Buscar código o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[rgba(6,182,212,0.2)] rounded-lg bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:border-[rgba(6,182,212,0.4)]"
            />
          </div>
          
          {/* Botones de filtro */}
          <div className="flex gap-2">
            {(['EN_PROGRESO', 'TODOS'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  filterStatus === status
                    ? 'bg-[#06b6d4] text-white shadow-sm'
                    : 'text-[#9ca3af] hover:text-[#06b6d4] border border-[rgba(6,182,212,0.2)]'
                }`}
              >
                {status === 'EN_PROGRESO' ? 'En Progreso' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de Total y En Progreso - Centrados */}
        {!isLoading && filteredAnalyses.length > 0 && (
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <div className="px-6 py-3 glass-card rounded-lg border-l-4 border-[#06b6d4] text-center min-w-[140px]">
              <div className="text-xs text-[#9ca3af] uppercase tracking-wide">Total</div>
              <div className="text-2xl font-bold text-[#f3f4f6]">{filteredAnalyses.length}</div>
            </div>
            <div className="px-6 py-3 glass-card rounded-lg border-l-4 border-[#f97316] text-center min-w-[140px]">
              <div className="text-xs text-[#9ca3af] uppercase tracking-wide">En Progreso</div>
              <div className="text-2xl font-bold text-[#f3f4f6]">{filteredAnalyses.filter(a => !a.status || a.status === 'EN_PROGRESO').length}</div>
            </div>
          </div>
        )}

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
                  <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-3 ml-1">
                    Turno {shift} ({shiftAnalyses.length})
                  </h2>
                  <div className="space-y-3">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => handleEdit(analysis.id, analysis.status)}
                        className="glass-card rounded-lg overflow-hidden border border-[rgba(6,182,212,0.2)] transition-all cursor-pointer active:scale-[0.99] hover:shadow-lg hover:border-[rgba(6,182,212,0.4)]"
                      >
                        {/* Card Header compacto */}
                        <div className="px-3 py-2 flex justify-between items-center border-b border-[rgba(6,182,212,0.1)] bg-[rgba(6,182,212,0.05)]">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#9ca3af]">
                            <Clock size={12} />
                            {new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${
                            analysis.status === 'COMPLETADO' 
                              ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981]'
                              : 'bg-[rgba(249,115,22,0.2)] text-[#f97316]'
                          }`}>
                            {analysis.status === 'COMPLETADO' ? <Check size={10} /> : <Hourglass size={10} />}
                            {analysis.status === 'COMPLETADO' ? 'LISTO' : 'EN PROGRESO'}
                          </div>
                        </div>

                        {/* Card Body compacto */}
                        <div className="p-3">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[#9ca3af]">Lote:</span>
                              <p className="font-mono font-semibold text-[#f3f4f6] text-xs truncate">{analysis.lote}</p>
                            </div>
                            <div>
                              <span className="text-[#9ca3af]">Código:</span>
                              <p className="font-bold text-[#f3f4f6]">{analysis.codigo}</p>
                            </div>
                            <div>
                              <span className="text-[#9ca3af]">Talla:</span>
                              <p className="font-semibold text-[#f3f4f6]">{analysis.talla || '-'}</p>
                            </div>
                          </div>

                          {/* Tipo de producto */}
                          <div className="mt-2 pt-2 border-t border-[rgba(6,182,212,0.1)]">
                            <p className="text-xs font-medium text-[#06b6d4]">
                              {PRODUCT_TYPE_LABELS[analysis.productType]}
                            </p>
                          </div>
                        </div>

                        {/* Botones de edición solo si está completado */}
                        {analysis.status === 'COMPLETADO' && (
                          <div className="px-3 py-2 flex gap-1 border-t border-[rgba(6,182,212,0.1)] bg-[rgba(6,182,212,0.02)]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(analysis.id, analysis.status);
                              }}
                              className="p-1.5 text-[#9ca3af] hover:text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)] rounded transition-colors active:scale-95"
                              aria-label="Editar análisis"
                            >
                              <Edit2 size={16} />
                            </button>
                            {deleteConfirm === analysis.id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(analysis.id);
                                }}
                                className="p-1.5 text-[#ef4444] bg-[rgba(239,68,68,0.2)] rounded animate-pulse active:scale-95"
                                aria-label="Confirmar eliminación"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(analysis.id);
                                  setTimeout(() => setDeleteConfirm(null), 3000);
                                }}
                                className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors active:scale-95"
                                aria-label="Eliminar análisis"
                              >
                                <Trash2 size={16} />
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
