'use client';

import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getTestsByDate } from '../lib/firestoreService';
import { exportDailyReport, generateDailyReportBlob } from '../lib/excelExport';
import { saveDailyReportToOneDrive } from '../lib/graphService';
import { useMsal } from '@azure/msal-react';
import { DailyReport } from '../lib/types';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"]
};

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const { instance } = useMsal();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<DailyReport | null>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const tests = await getTestsByDate(selectedDate);
      
      const report: DailyReport = {
        date: selectedDate,
        tests,
        totalTests: tests.length,
        completedTests: tests.filter(t => t.isCompleted).length
      };
      
      setReportData(report);
      
      if (tests.length === 0) {
        alert('No se encontraron pruebas para esta fecha.');
      }
    } catch (error: any) {
      alert(`Error al generar reporte: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (reportData) {
      exportDailyReport(reportData);
    }
  };

  const handleSaveToOneDrive = async () => {
    if (!reportData) return;
    
    setIsLoading(true);
    try {
      // Separar tests por tipo
      const mpTests = reportData.tests.filter(t => t.testType === 'MATERIA_PRIMA');
      const ptTests = reportData.tests.filter(t => t.testType === 'PRODUCTO_TERMINADO');
      
      let savedCount = 0;
      
      // Guardar reporte de Materia Prima si hay tests
      if (mpTests.length > 0) {
        const mpReport: DailyReport = {
          date: reportData.date,
          tests: mpTests,
          totalTests: mpTests.length,
          completedTests: mpTests.filter(t => t.isCompleted).length
        };
        const mpBlob = generateDailyReportBlob(mpReport);
        await saveDailyReportToOneDrive(instance, loginRequest.scopes, selectedDate, mpBlob, 'MATERIA_PRIMA');
        savedCount++;
      }
      
      // Guardar reporte de Producto Terminado si hay tests
      if (ptTests.length > 0) {
        const ptReport: DailyReport = {
          date: reportData.date,
          tests: ptTests,
          totalTests: ptTests.length,
          completedTests: ptTests.filter(t => t.isCompleted).length
        };
        const ptBlob = generateDailyReportBlob(ptReport);
        await saveDailyReportToOneDrive(instance, loginRequest.scopes, selectedDate, ptBlob, 'PRODUCTO_TERMINADO');
        savedCount++;
      }
      
      if (savedCount === 0) {
        alert('⚠️ No hay pruebas para guardar.');
      } else if (savedCount === 1) {
        alert('✅ Reporte guardado en OneDrive exitosamente.');
      } else {
        alert(`✅ ${savedCount} reportes guardados en OneDrive exitosamente (MP y PT).`);
      }
    } catch (error: any) {
      alert(`❌ Error al guardar en OneDrive: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold">Generar Reporte Diario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Seleccionar Fecha</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full pl-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700"
                />
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap h-10 sm:h-auto"
              >
                {isLoading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>

          {reportData && (
            <div className="border dark:border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-3 text-sm sm:text-base">Resumen del Reporte</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fecha:</p>
                  <p className="font-medium">{reportData.date.split('-').reverse().join('/')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total de Pruebas:</p>
                  <p className="font-medium">{reportData.totalTests}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Completadas:</p>
                  <p className="font-medium text-green-600">{reportData.completedTests}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">En Progreso:</p>
                  <p className="font-medium text-yellow-600">{reportData.totalTests - reportData.completedTests}</p>
                </div>
              </div>

              {reportData.tests.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Lotes incluidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {reportData.tests.map(test => (
                      <span key={test.id} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                        {test.lotNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-4 sm:p-6 border-t dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm h-10"
          >
            Cerrar
          </button>
          {reportData && (
            <>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm h-10"
              >
                <Download size={16} />
                Descargar Excel
              </button>
              <button
                onClick={handleSaveToOneDrive}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm h-10"
              >
                <Download size={16} />
                {isLoading ? 'Guardando...' : 'Guardar en OneDrive'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportModal;