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

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [selectedShift, setSelectedShift] = useState<'ALL' | WorkShift>('ALL');

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      let data: QualityAnalysis[];

      if (selectedShift === 'ALL') {
        data = await getAnalysesByDate(selectedDate);
      } else {
        data = await getAnalysesByShift(selectedDate, selectedShift);
      }

      setAnalyses(data);

      if (data.length === 0) {
        alert('No se encontraron análisis para esta fecha/turno.');
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
            const getProp = (prop: keyof any) => {
              return analysis.analyses?.[0]?.[prop] || (analysis as any)[prop];
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <h2 className="text-2xl font-bold">Reporte Diario de Análisis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de fecha */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full pl-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Selector de turno */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Turno</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700"
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
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Cargando...' : 'Generar Reporte'}
          </button>

          {/* Resumen */}
          {analyses.length > 0 && (
            <div className="border dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-3">Resumen</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total de análisis:</p>
                  <p className="font-medium text-lg">{analyses.length}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Turno Día:</p>
                  <p className="font-medium text-lg">
                    {analyses.filter(a => a.shift === 'DIA').length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Turno Noche:</p>
                  <p className="font-medium text-lg">
                    {analyses.filter(a => a.shift === 'NOCHE').length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Productos únicos:</p>
                  <p className="font-medium text-lg">
                    {new Set(analyses.map(a => a.codigo)).size}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón descargar */}
          {analyses.length > 0 && (
            <button
              onClick={handleDownloadReport}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              {isLoading ? 'Generando...' : 'Descargar Reporte Excel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportModal;
