'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, CheckCircle, Plus, Ruler, QrCode } from 'lucide-react';
import { QualityAnalysis, PRODUCT_TYPE_LABELS } from '@/lib/types';
import DailyReportCard from './DailyReportCard';

interface AnalysisDashboardProps {
  initialAnalyses: QualityAnalysis[];
}

export default function AnalysisDashboard({ initialAnalyses }: AnalysisDashboardProps) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>(initialAnalyses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'en_progreso'>('todos');

  useEffect(() => {
    setAnalyses(initialAnalyses);
  }, [initialAnalyses]);

  const filteredAnalyses = analyses.filter(analysis => {
    // Filter by search term
    const matchesSearch =
      analysis.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by tab
    if (activeTab === 'todos') return matchesSearch;
    if (activeTab === 'en_progreso') return matchesSearch && analysis.status !== 'COMPLETADO';

    return matchesSearch;
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
              className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-400 text-gray-900 shadow-md"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'todos'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('en_progreso')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'en_progreso'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              En Progreso
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-2 pb-24 space-y-2">
        {/* Report Card - Shows at top when active */}
        {showReportModal && (
          <DailyReportCard onClose={() => setShowReportModal(false)} />
        )}

        {/* Grid de Análisis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => router.push(`/dashboard/tests/edit?id=${analysis.id}`)}
              className="bg-white rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer relative overflow-hidden group h-fit"
              style={{
                borderLeft: `8px solid ${analysis.analystColor || '#3B82F6'}`,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)' // Constant-like shadow for floating effect
              }}
            >
              <div className="p-2">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                      {analysis.lote}
                    </h3>
                    {analysis.status === 'COMPLETADO' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-medium text-gray-400 leading-none">
                      {new Date(analysis.date).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Card Body Grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  {/* Producto */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-medium text-gray-500 leading-none">Producto:</p>
                    <p className="text-xs font-bold text-gray-900 leading-none">
                      {PRODUCT_TYPE_LABELS[analysis.productType] || analysis.productType}
                    </p>
                  </div>

                  {/* Código */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-medium text-gray-500 leading-none flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Código:
                    </p>
                    <p className="text-sm font-bold text-gray-800 leading-none">
                      {analysis.codigo}
                    </p>
                  </div>

                  {/* Talla */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-medium text-gray-500 leading-none flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Talla:
                    </p>
                    <p className="text-xs font-bold text-gray-900 leading-none">
                      {analysis.talla || '-'}
                    </p>
                  </div>

                  {/* Turno */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-medium text-gray-500 leading-none">Turno:</p>
                    <div className="flex">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm leading-none ${analysis.shift === 'NOCHE'
                        ? 'bg-[#6B21A8] text-white'
                        : 'bg-amber-400 text-gray-900'
                        }`}>
                        {analysis.shift}
                      </span>
                    </div>
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
    </div>
  );
}
