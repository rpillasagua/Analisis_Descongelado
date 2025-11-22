'use client';

import React, { useState } from 'react';
import { X, Download, Calendar, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getAnalysesByDate, getAnalysesByShift } from '@/lib/analysisService';
import { generateDailyReport } from '@/lib/reportService';
import { QualityAnalysis, WorkShift } from '@/lib/types';

interface DailyReportCardProps {
    onClose: () => void;
}

const getLocalDateString = () => {
    const now = new Date();
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
        setAnalyses([]);

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
            const blob = await generateDailyReport(analyses, selectedDate, selectedShift);

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

    const countDia = analyses.filter(a => a.shift === 'DIA').length;
    const countNoche = analyses.filter(a => a.shift === 'NOCHE').length;

    return (
        <div className="glass rounded-2xl p-2 sm:p-3 shadow-2xl relative animate-slide-up border border-white/20">
            <button
                onClick={onClose}
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1.5 gradient-blue rounded-xl shadow-lg">
                    <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Reporte Diario</h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Selecciona fecha y turno</p>
                </div>
            </div>

            {/* Controles de Filtro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                <div className="space-y-0.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-gray-700 ml-1">Fecha</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full glass border-2 border-white/20 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all shadow-md text-gray-900"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-gray-700 ml-1">Turno</label>
                    <select
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value as 'ALL' | WorkShift)}
                        className="w-full glass border-2 border-white/20 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all shadow-md text-gray-900"
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
                className="w-full gradient-blue text-white py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Buscando...</span>
                    </>
                ) : (
                    <>
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Buscar Registros</span>
                    </>
                )}
            </button>

            {/* Resultados y Descarga */}
            {analyses.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-2 animate-slide-up">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-1.5">
                        <StatCard label="Total" value={analyses.length} highlight={true} />
                        <StatCard label="Día" value={countDia} highlight={countDia > 0} />
                        <StatCard label="Noche" value={countNoche} highlight={countNoche > 0} />
                    </div>

                    {/* Botón Descargar */}
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full gradient-primary text-white py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Generando Excel...</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>Descargar Reporte (.xlsx)</span>
                                <Sparkles className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// Subcomponente para stat cards
const StatCard = ({
    label,
    value,
    highlight = false
}: {
    label: string;
    value: number;
    highlight?: boolean;
}) => (
    <div className={`glass p-1.5 rounded-lg text-center transition-all border ${highlight
        ? 'border-blue-200 bg-blue-50/50'
        : 'border-white/20'
        } shadow-md hover:shadow-lg`}>
        <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
            {label}
        </span>
        <span className={`block text-base sm:text-lg font-bold leading-tight ${highlight ? 'text-blue-700' : 'text-gray-700'
            }`}>
            {value}
        </span>
    </div>
);

export default DailyReportCard;

