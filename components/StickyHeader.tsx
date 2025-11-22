'use client';

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { AnalystColor, ANALYST_COLOR_HEX } from '@/lib/types';

interface StickyHeaderProps {
    lote: string;
    codigo: string;
    talla: string;
    analystColor: AnalystColor;
    activeAnalysisIndex: number;
    totalAnalyses: number;
    saveState?: 'saving' | 'saved' | 'error' | null;
    lastSaved?: Date | null;
}

export default function StickyHeader({
    lote,
    codigo,
    talla,
    analystColor,
    activeAnalysisIndex,
    totalAnalyses,
    saveState = null,
    lastSaved = null
}: StickyHeaderProps) {
    const colorHex = ANALYST_COLOR_HEX[analystColor];

    const getSaveStateDisplay = () => {
        if (!saveState) return null;

        switch (saveState) {
            case 'saving':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>Guardando...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Guardado {lastSaved && formatTimeAgo(lastSaved)}</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>Error al guardar</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const formatTimeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 10) return 'ahora';
        if (seconds < 60) return `hace ${seconds}s`;
        if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
        return `hace ${Math.floor(seconds / 3600)}h`;
    };

    return (
        <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-[#efefef] shadow-sm transition-all">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Left side - Key info */}
                    <div className="flex items-center gap-4 text-xs font-mono text-[#8e8e8e] flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#262626]">LOTE:</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[#262626] font-bold">{lote}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#262626]">COD:</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[#262626] font-bold">{codigo}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#262626]">TALLA:</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[#262626] font-bold">{talla}</span>
                        </div>
                    </div>

                    {/* Right side - Analysis number & save state */}
                    <div className="flex items-center gap-4">
                        {getSaveStateDisplay()}

                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: colorHex }}
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span>Muestra {activeAnalysisIndex + 1}/{totalAnalyses}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
