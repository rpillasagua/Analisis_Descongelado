'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Calendar, FileText, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { updateAnalysis } from '@/lib/analysisService';
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
      await updateAnalysis(id, { status: 'COMPLETADO' });
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
      <div className="sticky top-0 z-30 bg-white border-b border-[#dbdbdb] px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Actions Row - Centered */}
          <div className="flex justify-center items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="bg-[#0095f6] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1877f2] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Análisis</span>
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-white text-[#262626] border border-[#dbdbdb] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#fafafa] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <FileText className="h-5 w-5" />
              <span>Reporte</span>
            </button>
          </div>

          {/* Search Bar - Centered & Enhanced */}
          <div className="max-w-md mx-auto relative group">
            <input
              type="text"
              placeholder="Buscar por lote o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#dbdbdb] rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-[#efefef] focus:border-[#a8a8a8] transition-all placeholder-[#8e8e8e] text-[#262626] shadow-sm text-center"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 pb-20 space-y-6">
        {/* Filters */}
        <div className="flex justify-center gap-3 pb-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105 ${filterStatus === 'ALL'
              ? 'bg-[#262626] text-white shadow-md'
              : 'bg-white border border-[#dbdbdb] text-[#262626] hover:bg-[#fafafa]'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETADO')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105 ${filterStatus === 'COMPLETADO'
              ? 'bg-[#262626] text-white shadow-md'
              : 'bg-white border border-[#dbdbdb] text-[#262626] hover:bg-[#fafafa]'
              }`}
          >
            Completado
          </button>
        </div>

        {/* Grid de Análisis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => router.push(`/dashboard/tests/edit?id=${analysis.id}`)}
              className="bg-white border border-[#dbdbdb] rounded-lg p-4 hover:bg-[#fafafa] transition-colors cursor-pointer shadow-sm group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#262626] text-lg">
                      Lote: {analysis.lote}
                    </span>
                    {analysis.status === 'COMPLETADO' && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="text-xs text-[#8e8e8e] font-medium">
                    {new Date(analysis.date).toLocaleDateString()} • {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: analysis.analystColor || '#ccc' }}
                  title={analysis.createdBy}
                />
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-[#8e8e8e] text-xs block">Producto</span>
                  <span className="font-medium text-[#262626]">
                    {PRODUCT_TYPE_LABELS[analysis.productType] || analysis.productType}
                  </span>
                </div>
                <div>
                  <span className="text-[#8e8e8e] text-xs block">Código</span>
                  <span className="font-medium text-[#262626]">{analysis.codigo}</span>
                </div>
                <div>
                  <span className="text-[#8e8e8e] text-xs block">Talla</span>
                  <span className="font-medium text-[#262626]">{analysis.talla || '-'}</span>
                </div>
                <div>
                  <span className="text-[#8e8e8e] text-xs block">Turno</span>
                  <span className="font-medium text-[#262626]">{analysis.shift}</span>
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
    </div >
  );
}
