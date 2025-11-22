'use client';

import { AnalystColor, ANALYST_COLOR_HEX } from '@/lib/types';
import { Plus, CheckCircle2 } from 'lucide-react';

interface AnalysisTabsProps {
    analysesCount: number;
    activeTab: number;
    onTabChange: (index: number) => void;
    onAddAnalysis: () => void;
    analystColor: AnalystColor;
}

export default function AnalysisTabs({
    analysesCount,
    activeTab,
    onTabChange,
    onAddAnalysis,
    analystColor
}: AnalysisTabsProps) {
    const colorHex = ANALYST_COLOR_HEX[analystColor];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-gray-700">
            {/* Analysis Tabs */}
            {Array.from({ length: analysesCount }, (_, index) => {
                const isActive = activeTab === index;

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onTabChange(index)}
                        className={`
                            relative flex items-center gap-3 px-5 py-3 rounded-t-xl font-bold text-sm
                            transition-all duration-200 whitespace-nowrap
                            ${isActive
                                ? 'text-white shadow-xl scale-105 -mb-0.5'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 scale-95 hover:scale-100'
                            }
                        `}
                        style={{
                            backgroundColor: isActive ? colorHex : 'transparent',
                        }}
                    >
                        {/* Badge numérico */}
                        <div className={`
                            flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs
                            transition-all duration-200
                            ${isActive
                                ? 'bg-white/20 text-white ring-2 ring-white/30'
                                : 'bg-gray-700 text-gray-400'
                            }
                        `}>
                            {index + 1}
                        </div>

                        <span className="tracking-wide">Análisis {index + 1}</span>

                        {/* Indicador de check para el activo */}
                        {isActive && (
                            <CheckCircle2 className="w-4 h-4 text-white animate-pulse" />
                        )}

                        {/* Barra inferior indicadora */}
                        {isActive && (
                            <div
                                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                                style={{ backgroundColor: 'white', boxShadow: `0 0 10px ${colorHex}` }}
                            />
                        )}
                    </button>
                );
            })}

            {/* Add Analysis Button */}
            <button
                type="button"
                onClick={onAddAnalysis}
                className="
                    flex items-center gap-2 px-4 py-3 rounded-t-xl
                    bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
                    border-2 border-dashed border-gray-600 hover:border-gray-500
                    transition-all duration-200 font-semibold text-sm whitespace-nowrap
                    hover:scale-105 active:scale-95
                "
                title="Agregar nuevo análisis"
            >
                <Plus className="w-4 h-4" />
                <span>Nuevo</span>
            </button>
        </div>
    );
}
