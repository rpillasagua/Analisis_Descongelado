'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Calendar, FileText, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { updateAnalysisStatus } from '@/lib/analysisService';
import DailyReportModal from './DailyReportModalNew';

interface AnalysisDashboardProps {
  initialAnalyses: QualityAnalysis[];
}

export default function AnalysisDashboard({ initialAnalyses }: AnalysisDashboardProps) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>(initialAnalyses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETADO' | 'EN_PROGRESO'>('ALL');

  useEffect(() => {
    setAnalyses(initialAnalyses);
  }, [initialAnalyses]);

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch =
      analysis.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' ? true :
        filterStatus === 'COMPLETADO' ? analysis.status === 'COMPLETADO' :
          analysis.status !== 'COMPLETADO';

    return matchesSearch && matchesStatus;
  });

  const handleComplete = async (id: string) => {
    try {
      await updateAnalysisStatus(id, 'COMPLETADO');
      setAnalyses(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'COMPLETADO' } : a
      ));
    } catch (error) {
      console.error('Error completing analysis:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#dbdbdb] px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e8e8e]" />
              <input
                type="text"
                placeholder="Buscar por lote o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#efefef] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#dbdbdb] transition-all placeholder-[#8e8e8e] text-[#262626]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2 text-[#262626] hover:bg-[#efefef] rounded-lg transition-colors"
              title="Generar Reporte"
            >
              <FileText className="h-6 w-6" />
            </button>
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="bg-[#0095f6] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1877f2] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nuevo Análisis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 pb-20 space-y-6">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filterStatus === 'ALL'
                ? 'bg-[#262626] text-white'
                : 'bg-white border border-[#dbdbdb] text-[#262626] hover:bg-[#fafafa]'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('EN_PROGRESO')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filterStatus === 'EN_PROGRESO'
                ? 'bg-[#262626] text-white'
                : 'bg-white border border-[#dbdbdb] text-[#262626] hover:bg-[#fafafa]'
              }`}
          >
            En Progreso
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETADO')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filterStatus === 'COMPLETADO'
                ? 'bg-[#262626] text-white'
                : 'bg-white border border-[#dbdbdb] text-[#262626] hover:bg-[#fafafa]'
              }`}
          >
            Completados
          </button>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => router.push(`/dashboard/tests/${analysis.id}`)}
              className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Card Header */}
              <div className="p-3 flex items-center justify-between border-b border-[#efefef]">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${analysis.shift === 'DIA' ? 'bg-orange-400' : 'bg-indigo-500'
                    }`}>
                    {analysis.shift === 'DIA' ? 'D' : 'N'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#262626]">{analysis.lote}</p>
                    <p className="text-xs text-[#8e8e8e]">
                      {new Date(analysis.createdAt).toLocaleDateString()} • {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {analysis.analystColor && (
                  <div
                    className="w-6 h-6 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: analysis.analystColor }}
                    title="Color del Analista"
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#fafafa] p-2 rounded border border-[#efefef]">
                    <p className="text-xs text-[#8e8e8e] mb-0.5">Código</p>
                    <p className="text-sm font-semibold text-[#262626]">{analysis.codigo}</p>
                  </div>
                  {analysis.talla && (
                    <div className="bg-[#fafafa] p-2 rounded border border-[#efefef]">
                      <p className="text-xs text-[#8e8e8e] mb-0.5">Talla</p>
                      <p className="text-sm font-semibold text-[#262626]">{analysis.talla}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {PRODUCT_TYPE_LABELS[analysis.productType]}
                  </span>

                  {analysis.status === 'COMPLETADO' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      Completado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <Clock className="w-3 h-3" />
                      En Progreso
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#fafafa] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#8e8e8e]" />
            </div>
            <h3 className="text-lg font-semibold text-[#262626]">No se encontraron análisis</h3>
            <p className="text-[#8e8e8e]">Intenta ajustar tu búsqueda o crea un nuevo análisis.</p>
          </div>
        )}
      </div>

      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
