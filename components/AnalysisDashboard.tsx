'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, CheckCircle, Plus, Ruler, QrCode } from 'lucide-react';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { updateAnalysis } from '@/lib/analysisService';
import DailyReportCard from './DailyReportCard';

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

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Controls Section - Sticky */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Actions Row */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/tests/new')}
              className="flex-1 bg-[#0095f6] text-white px-5 py-3 rounded-full text-base font-bold hover:bg-[#1877f2] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md whitespace-nowrap min-w-[140px]"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Análisis</span>
            </button>
            <button
              onClick={() => setShowReportModal(!showReportModal)}
              className="flex-1 bg-white text-[#0095f6] border border-[#0095f6] px-5 py-3 rounded-full text-base font-bold hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]"
            >
              <FileText className="h-5 w-5" />
              <span>Reporte</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por lote o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f0f2f5] border-none rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-500 text-gray-900"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 w-full">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${filterStatus === 'ALL'
                ? 'text-[#0095f6]'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Todos
              {filterStatus === 'ALL' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0095f6] rounded-t-full mx-auto w-12" />
              )}
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETADO')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${filterStatus === 'COMPLETADO'
                ? 'text-[#0095f6]'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Completado
              {filterStatus === 'COMPLETADO' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0095f6] rounded-t-full mx-auto w-12" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 pb-24 space-y-4">
        {/* Report Card - Shows at top when active */}
        {showReportModal && (
          <DailyReportCard onClose={() => setShowReportModal(false)} />
        )}

        {/* Grid de Análisis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => router.push(`/dashboard/tests/edit?id=${analysis.id}`)}
              className="bg-white rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group mb-1"
              style={{
                borderLeft: `8px solid ${analysis.analystColor || '#3B82F6'}`,
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="p-3">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-none">
                      {analysis.lote}
                    </h3>
                    {analysis.status === 'COMPLETADO' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-400">
                      {new Date(analysis.date).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Card Body Grid */}
                <div className="grid grid-cols-2 gap-y-1 gap-x-3">
                  {/* Producto */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0">Producto:</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {PRODUCT_TYPE_LABELS[analysis.productType] || analysis.productType}
                    </p>
                  </div>

                  {/* Código */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" /> Código:
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {analysis.codigo}
                    </p>
                  </div>

                  {/* Talla */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0 flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" /> Talla:
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {analysis.talla || '-'}
                    </p>
                  </div>

                  {/* Turno */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Turno:</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${analysis.shift === 'NOCHE'
                      ? 'bg-[#6B21A8] text-white'
                      : 'bg-amber-400 text-gray-900'
                      }`}>
                      {analysis.shift}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No se encontraron análisis</h3>
            <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda o crea un nuevo análisis.</p>
          </div>
        )}
      </div>
    </div >
  );
}
