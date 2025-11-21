'use client';

import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { getAnalysesByDate, getAnalysesByShift } from '@/lib/analysisService';
import { QualityAnalysis, WorkShift, PRODUCT_TYPE_LABELS, DEFECTO_LABELS } from '@/lib/types';
import ExcelJS from 'exceljs';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Función para obtener fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [selectedShift, setSelectedShift] = useState<'ALL' | WorkShift>('ALL');

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsLoading(true);
    console.log(`🔍 Buscando análisis para fecha: ${selectedDate}, Turno: ${selectedShift}`);
    try {
      let data: QualityAnalysis[];

      if (selectedShift === 'ALL') {
        data = await getAnalysesByDate(selectedDate);
      } else {
        data = await getAnalysesByShift(selectedDate, selectedShift);
      }

      console.log(`✅ Encontrados ${data.length} análisis`);
      setAnalyses(data);

      if (data.length === 0) {
        alert(`No se encontraron análisis para la fecha ${selectedDate} y turno ${selectedShift}.`);
      }
    } catch (error: any) {
      console.error('Error al cargar análisis:', error);
      alert(`Error al cargar análisis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (analyses.length === 0) {
      alert('No hay análisis para exportar');
      return;
    }

    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Diario');

      // Título del reporte
      worksheet.mergeCells('A1:M1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Reporte de Análisis de Calidad - ${selectedDate}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

      // Subtítulo con turno
      worksheet.mergeCells('A2:M2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = selectedShift === 'ALL'
        ? 'Todos los turnos'
        : selectedShift === 'DIA'
          ? 'Turno Día (7:10 AM - 7:10 PM)'
          : 'Turno Noche (7:10 PM - 7:10 AM)';
      subtitleCell.font = { size: 12, bold: true };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow([]);

      // Encabezados
      const headerRow = worksheet.addRow([
        'Hora',
        'Turno',
        'Tipo Producto',
        'Lote',
        'Código',
        'Talla',
        'Peso Bruto',
        'Peso Congelado',
        'Peso Neto',
        'Conteo',
        'Uniformidad Grandes',
        'Uniformidad Pequeños',
        'Total Defectos',
        'Observaciones'
      ]);

      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Agrupar por turno
      const analysesByShift = {
        DIA: analyses.filter(a => a.shift === 'DIA'),
        NOCHE: analyses.filter(a => a.shift === 'NOCHE')
      };

      // Agregar datos por turno
      ['DIA', 'NOCHE'].forEach((shift) => {
        const shiftAnalyses = analysesByShift[shift as WorkShift];

        if (shiftAnalyses.length > 0) {
          // Separador de turno
          const separatorRow = worksheet.addRow([shift === 'DIA' ? 'TURNO DÍA' : 'TURNO NOCHE']);
          worksheet.mergeCells(`A${separatorRow.number}:N${separatorRow.number}`);
          separatorRow.font = { bold: true, size: 12 };
          separatorRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: shift === 'DIA' ? 'FFFFF2CC' : 'FFE2EFDA' }
          };

          shiftAnalyses.forEach((analysis) => {
            // Helper to get property from new structure (analyses[0]) or legacy structure
            const getProp = (prop: string): any => {
              return analysis.analyses?.[0]?.[prop as keyof typeof analysis.analyses[0]] || (analysis as any)[prop];
            };

            const defectos = getProp('defectos');
            const totalDefectos = defectos
              ? Object.values(defectos).reduce((sum: any, val: any) => sum + val, 0)
              : 0;

            const row = worksheet.addRow([
              new Date(analysis.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
              shift === 'DIA' ? 'Día' : 'Noche',
              PRODUCT_TYPE_LABELS[analysis.productType],
              analysis.lote,
              analysis.codigo,
              analysis.talla || '-',
              getProp('pesoBruto')?.valor || '-',
              getProp('pesoCongelado')?.valor || '-',
              getProp('pesoNeto')?.valor || '-',
              getProp('conteo') || '-',
              getProp('uniformidad')?.grandes?.valor || '-',
              getProp('uniformidad')?.pequenos?.valor || '-',
              totalDefectos,
              analysis.observations || '-'
            ]);

            row.alignment = { vertical: 'middle' };
          });

          // Fila de subtotales por turno
          const subtotalRow = worksheet.addRow([
            '',
            `Subtotal ${shift === 'DIA' ? 'Día' : 'Noche'}:`,
            `${shiftAnalyses.length} análisis`,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
          ]);
          subtotalRow.font = { bold: true };
          subtotalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };

          worksheet.addRow([]);
        }
      });

      // Fila de totales
      const totalRow = worksheet.addRow([
        '',
        'TOTAL:',
        `${analyses.length} análisis`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
      totalRow.font = { bold: true, size: 12 };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBDD7EE' }
      };

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 10 },  // Hora
        { width: 12 },  // Turno
        { width: 18 },  // Tipo Producto
        { width: 15 },  // Lote
        { width: 12 },  // Código
        { width: 10 },  // Talla
        { width: 14 },  // Peso Bruto
        { width: 16 },  // Peso Congelado
        { width: 12 },  // Peso Neto
        { width: 10 },  // Conteo
        { width: 18 },  // Uniformidad Grandes
        { width: 18 },  // Uniformidad Pequeños
        { width: 15 },  // Total Defectos
        { width: 30 }   // Observaciones
      ];

      // Bordes para todas las celdas con datos
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_calidad_${selectedDate}_${selectedShift}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('✅ Reporte descargado exitosamente');
    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      alert(`❌ Error al generar reporte: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900">Reporte Diario de Análisis</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Selector de fecha */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Fecha</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex min-h-[44px] w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>

            {/* Selector de turno */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Turno</label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
                className="flex min-h-[44px] w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ colorScheme: 'light' }}
              >
                <option value="ALL">Todos los turnos</option>
                <option value="DIA">Turno Día (7:10 AM - 7:10 PM)</option>
                <option value="NOCHE">Turno Noche (7:10 PM - 7:10 AM)</option>
              </select>
            </div>

            {/* Botón generar */}
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-6 py-3 min-h-[48px] rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? '⏳ Buscando...' : '🔍 Paso 1: Buscar Análisis'}
            </button>
            {!isLoading && analyses.length === 0 && (
              <p className="text-sm text-center text-gray-600 mt-2">
                👆 Haz clic para buscar los análisis de la fecha seleccionada
              </p>
            )}

            {/* Resumen */}
            {analyses.length > 0 && (
              <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Resumen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700 font-medium">Total de análisis:</p>
                    <p className="font-bold text-2xl text-blue-600">{analyses.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Turno Día:</p>
                    <p className="font-bold text-2xl text-blue-600">
                      {analyses.filter(a => a.shift === 'DIA').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Turno Noche:</p>
                    <p className="font-bold text-2xl text-blue-600">
                      {analyses.filter(a => a.shift === 'NOCHE').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Productos únicos:</p>
                    <p className="font-bold text-2xl text-blue-600">
                      {new Set(analyses.map(a => a.codigo)).size}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón descargar */}
            {analyses.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={handleDownloadReport}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white px-6 py-3 min-h-[48px] rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="h-5 w-5" />
                  {isLoading ? '📊 Generando Excel...' : '⬇️ Paso 2: Descargar Reporte Excel'}
                </button>
                <p className="text-sm text-center text-gray-700 font-medium">
                  ✅ {analyses.length} análisis encontrados. El Excel se descargará automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReportModal;
