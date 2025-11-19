'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAnalysisById, updateAnalysis } from '@/lib/analysisService';
import { QualityAnalysis } from '@/lib/types';

function EditAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');
  
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  const loadAnalysis = async () => {
    if (!analysisId) return;
    
    setIsLoading(true);
    try {
      const data = await getAnalysisById(analysisId);
      if (data) {
        setAnalysis(data);
      } else {
        alert('Análisis no encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando análisis:', error);
      alert('Error al cargar el análisis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysisId || !analysis) return;

    setIsSaving(true);
    try {
      await updateAnalysis(analysisId, analysis);
      alert('Análisis actualizado exitosamente');
      router.push('/');
    } catch (error) {
      console.error('Error actualizando análisis:', error);
      alert('Error al actualizar el análisis');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <main className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Editar Análisis
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {analysis.codigo} - {analysis.lote}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Observaciones</label>
            <textarea
              value={analysis.observations || ''}
              onChange={(e) => setAnalysis({ ...analysis, observations: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 min-h-32"
              placeholder="Agregar observaciones..."
            />
          </div>

          {/* Aquí puedes agregar más campos editables según necesites */}

          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EditAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <EditAnalysisContent />
    </Suspense>
  );
}
