'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Edit2, Trash2 } from 'lucide-react';
import { getAnalysesByDate, deleteAnalysis } from '@/lib/analysisService';
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

  const handleEdit = (id: string) => {
    router.push(`/dashboard/analysis/edit/${id}`);
  };

  const filteredAnalyses = analyses.filter(analysis => 
    analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByShift = {
    DIA: filteredAnalyses.filter(a => a.shift === 'DIA'),
    NOCHE: filteredAnalyses.filter(a => a.shift === 'NOCHE')
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="text-blue-600 dark:text-blue-400 text-sm mb-1">Turno Día</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {groupedByShift.DIA.length}
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="text-purple-600 dark:text-purple-400 text-sm mb-1">Turno Noche</div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {groupedByShift.NOCHE.length}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shiftAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(analysis.createdAt).toLocaleTimeString('es-EC', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(analysis.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </button>
                          
                          {deleteConfirm === analysis.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(analysis.id)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                title="Confirmar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(analysis.id)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
