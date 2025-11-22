'use client';

import React, { useState } from 'react';
import { X, Download, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getAnalysesByDate, getAnalysesByShift } from '@/lib/analysisService';
import { generateDailyReport } from '@/lib/reportService';
import { QualityAnalysis, WorkShift } from '@/lib/types';

interface DailyReportCardProps {
    onClose: () => void;
}

const getLocalDateString = () => {
    const now = new Date();
    // Solución robusta para timezone offset
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

const DailyReportCard: React.FC<DailyReportCardProps> = ({ onClose }) => {
    const [selectedDate, setSelectedDate] = useState(getLocalDateString());
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
    const [selectedShift, setSelectedShift] = useState<'ALL' | WorkShift>('ALL');

    const handleSearch = async () => {
        setIsLoading(true);
        setAnalyses([]); // Limpiar resultados anteriores

        try {
            const data = selectedShift === 'ALL'
                ? await getAnalysesByDate(selectedDate)
                : await getAnalysesByShift(selectedDate, selectedShift);

            setAnalyses(data);

            if (data.length === 0) {
                toast.info('No se encontraron registros para los filtros seleccionados');
            } else {
                toast.success(`Se encontraron ${data.length} registros`);
            }
        } catch (error) {
            console.error('Error al buscar análisis:', error);
            toast.error('Error al conectar con la base de datos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (analyses.length === 0) {
            toast.warning('No hay datos para exportar');
            return;
        }

        setIsGenerating(true);
        try {
            // Llamada limpia al servicio
            const blob = await generateDailyReport(analyses, selectedDate, selectedShift);

            // Descarga
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_Calidad_${selectedDate}_${selectedShift}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Reporte descargado exitosamente');
        } catch (error) {
            console.error('Error generando Excel:', error);
            toast.error('No se pudo generar el archivo Excel');
        } finally {
            setIsGenerating(false);
        }
    };

    // Cálculos para la UI
    const countDia = analyses.filter(a => a.shift === 'DIA').length;
    const countNoche = analyses.filter(a => a.shift === 'NOCHE').length;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Reporte Diario</h2>
                    <p className="text-xs text-gray-500">Selecciona fecha y turno para exportar</p>
                </div>
            </div>

            {/* Controles de Filtro */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Fecha</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Turno</label>
                    <select
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="ALL">Todos los turnos</option>
                        <option value="DIA">Turno Día</option>
                        <option value="NOCHE">Turno Noche</option>
                    </select>
                </div>
            </div>

            {/* Botón de Búsqueda */}
            <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="animate-pulse">Buscando...</span>
                ) : (
                    <>
                        <Search className="h-4 w-4" /> Buscar Registros
                    </>
                )}
            </button>

            {/* Resultados y Descarga */}
            {analyses.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-300">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Total" value={analyses.length} />
                        <StatCard label="Día" value={countDia} highlight={countDia > 0} />
                        <StatCard label="Noche" value={countNoche} highlight={countNoche > 0} />
                    </div>

                    {/* Botón Descargar */}
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Generando Excel...</span>
                        ) : (
                            <>
                                <Download className="h-5 w-5" /> Descargar Reporte (.xlsx)
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// Subcomponente para limpiar el JSX
const StatCard = ({
    label,
    value,
    highlight = false
}: {
    label: string;
    value: number;
    highlight?: boolean;
}) => (
    <div className={`p-3 rounded-lg border text-center transition-colors ${highlight
            ? 'bg-blue-50 border-blue-100'
            : 'bg-gray-50 border-gray-100'
        }`}>
        <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            {label}
        </span>
        <span className={`block text-xl font-bold mt-1 ${highlight ? 'text-blue-700' : 'text-gray-700'
            }`}>
            {value}
        </span>
    </div>
);

export default DailyReportCard;
