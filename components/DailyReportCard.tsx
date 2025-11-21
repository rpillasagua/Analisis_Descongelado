'use client';

import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { getAnalysesByDate, getAnalysesByShift } from '@/lib/analysisService';
import { QualityAnalysis, WorkShift, PRODUCT_TYPE_LABELS } from '@/lib/types';
import ExcelJS from 'exceljs';

interface DailyReportCardProps {
    onClose: () => void;
}

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DailyReportCard: React.FC<DailyReportCardProps> = ({ onClose }) => {
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [isLoading, setIsLoading] = useState(false);
    const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
    const [selectedShift, setSelectedShift] = useState<'ALL' | WorkShift>('ALL');

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
                        '', '', '', '', '', '', '', '', '', '', ''
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
                '', '', '', '', '', '', '', '', '', '', ''
            ]);
            totalRow.font = { bold: true, size: 12 };
            totalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFBDD7EE' }
            };

            // Ajustar ancho de columnas
            worksheet.columns = [
                { width: 10 }, { width: 12 }, { width: 18 }, { width: 15 },
                { width: 12 }, { width: 10 }, { width: 14 }, { width: 16 },
                { width: 12 }, { width: 10 }, { width: 18 }, { width: 18 },
                { width: 15 }, { width: 30 }
            ];

            // Bordes
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 shadow-md relative">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Generar Reporte</h2>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Turno</label>
                    <select
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Todos</option>
                        <option value="DIA">Día</option>
                        <option value="NOCHE">Noche</option>
                    </select>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all mb-3"
            >
                {isLoading ? 'Buscando...' : 'Buscar Análisis'}
            </button>

            {/* Results */}
            {analyses.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-blue-300">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                            <span className="block text-xs text-gray-600">Total</span>
                            <span className="block text-lg font-bold text-gray-900">{analyses.length}</span>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                            <span className="block text-xs text-gray-600">Día</span>
                            <span className="block text-lg font-bold text-gray-900">{analyses.filter(a => a.shift === 'DIA').length}</span>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-blue-200">
                            <span className="block text-xs text-gray-600">Noche</span>
                            <span className="block text-lg font-bold text-gray-900">{analyses.filter(a => a.shift === 'NOCHE').length}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadReport}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Descargar Excel
                    </button>
                </div>
            )}
        </div>
    );
};

export default DailyReportCard;
