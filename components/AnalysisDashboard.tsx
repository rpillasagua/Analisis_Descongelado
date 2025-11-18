'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Edit2, Trash2 } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis, PRODUCT_TYPE_LABELS, SHIFT_LABELS } from '@/lib/types';
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
    // Si está EN_PROGRESO o no tiene estado, abrir en la página de creación para editar
    if (!status || status === 'EN_PROGRESO') {
      router.push(`/dashboard/tests/new?id=${id}`);
    } else {
      // Si está COMPLETADO, abrir en modo solo lectura
      router.push(`/dashboard/tests/edit?id=${id}`);
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Análisis de Calidad
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestión de análisis de descongelado
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span>Reporte Diario</span>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/tests/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Nuevo Análisis</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('TODOS')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterStatus === 'TODOS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('EN_PROGRESO')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterStatus === 'EN_PROGRESO'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  En Progreso
                </button>
                <button
                  onClick={() => setFilterStatus('COMPLETADO')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterStatus === 'COMPLETADO'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Completados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredAnalyses.length}
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-sm p-6 border-2 border-orange-200 dark:border-orange-800">
            <div className="text-orange-600 dark:text-orange-400 text-sm mb-1">En Progreso</div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {groupedByStatus.EN_PROGRESO.length}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm p-6 border-2 border-green-200 dark:border-green-800">
            <div className="text-green-600 dark:text-green-400 text-sm mb-1">Completados</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {groupedByStatus.COMPLETADO.length}
            </div>
          </div>
        </div>

        {/* Lista de análisis por turno */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando análisis...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay análisis
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No se encontraron análisis para la fecha seleccionada
            </p>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Crear Primer Análisis
            </button>
          </div>
        ) : (
          <>
            {['DIA', 'NOCHE'].map((shift) => {
              const shiftAnalyses = groupedByShift[shift as keyof typeof groupedByShift];
              
              if (shiftAnalyses.length === 0) return null;
              
              return (
                <div key={shift} className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${shift === 'DIA' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    {shift === 'DIA' ? 'Turno Día' : 'Turno Noche'}
                    <span className="text-sm font-normal text-gray-500">
                      ({shiftAnalyses.length})
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => analysis.status !== 'COMPLETADO' && handleEdit(analysis.id, analysis.status)}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all p-4 ${
                          analysis.status !== 'COMPLETADO' ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(analysis.createdAt).toLocaleTimeString('es-EC', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                analysis.status === 'COMPLETADO'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                              }`}>
                                {analysis.status === 'COMPLETADO' ? '✓ Completado' : '⏳ En Progreso'}
                              </span>
                            </div>
                            <div className="font-semibold text-lg text-gray-900 dark:text-white">
                              {analysis.codigo}
                            </div>
                          </div>
                          
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {PRODUCT_TYPE_LABELS[analysis.productType]}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Lote:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{analysis.lote}</span>
                          </div>
                          
                          {analysis.talla && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Talla:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{analysis.talla}</span>
                            </div>
                          )}
                          
                          {analysis.pesoNeto?.valor && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Peso Neto:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{analysis.pesoNeto.valor} kg</span>
                            </div>
                          )}
                        </div>
                        
                        {analysis.status !== 'COMPLETADO' && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(analysis.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              title="Marcar como completado"
                            >
                              ✓ Completar
                            </button>
                          </div>
                        )}
                        
                        {analysis.status === 'COMPLETADO' && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(analysis.id, analysis.status);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Edit2 className="h-4 w-4" />
                              Ver
                            </button>
                            
                            {deleteConfirm === analysis.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(analysis.id);
                                  }}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  title="Confirmar"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(null);
                                  }}
                                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(analysis.id);
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
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
          </>
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
