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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <h2 className="text-base font-semibold text-[#262626]">Reporte Diario</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#262626] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1 bg-white">
          {/* Selector de fecha */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8e8e8e] uppercase tracking-wide">Fecha</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#dbdbdb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#a8a8a8] transition-all text-[#262626]"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* Selector de turno */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8e8e8e] uppercase tracking-wide">Turno</label>
            <select
              value={selectedShift}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
              className="w-full bg-[#fafafa] border border-[#dbdbdb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#a8a8a8] transition-all text-[#262626] appearance-none"
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
            className="w-full bg-[#0095f6] text-white px-4 py-2.5 rounded-lg hover:bg-[#1877f2] active:bg-[#1877f2] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Buscar Análisis'
            )}
          </button>

          {!isLoading && analyses.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-[#8e8e8e]">
                Selecciona una fecha y busca para ver resultados
              </p>
            </div>
          )}

          {/* Resumen */}
          {analyses.length > 0 && (
            <div className="bg-[#fafafa] border border-[#dbdbdb] rounded-lg p-3">
              <h3 className="font-semibold text-xs text-[#262626] mb-3 uppercase tracking-wide">Resumen</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded border border-[#efefef]">
                  <span className="text-[10px] text-[#8e8e8e] block mb-0.5">Total</span>
                  <span className="font-semibold text-lg text-[#262626]">{analyses.length}</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#efefef]">
                  <span className="text-[10px] text-[#8e8e8e] block mb-0.5">Productos</span>
                  <span className="font-semibold text-lg text-[#262626]">
                    {new Set(analyses.map(a => a.codigo)).size}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-[#efefef]">
                  <span className="text-[10px] text-[#8e8e8e] block mb-0.5">Día</span>
                  <span className="font-semibold text-lg text-[#262626]">
                    {analyses.filter(a => a.shift === 'DIA').length}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-[#efefef]">
                  <span className="text-[10px] text-[#8e8e8e] block mb-0.5">Noche</span>
                  <span className="font-semibold text-lg text-[#262626]">
                    {analyses.filter(a => a.shift === 'NOCHE').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Download Button */}
        {analyses.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 pb-safe">
            <button
              onClick={handleDownloadReport}
              disabled={isLoading}
              className="w-full bg-white border border-[#dbdbdb] text-[#262626] px-4 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Download className="h-4 w-4" />
              {isLoading ? 'Generando...' : 'Descargar Excel'}
            </button>
            <p className="text-[10px] text-center text-[#8e8e8e] mt-2">
              {analyses.length} análisis listos para exportar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportModal;
