'use client';

import { AnalystColor, ANALYST_COLOR_HEX } from '@/lib/types';
import { Plus } from 'lucide-react';

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
            {Array.from({ length: analysesCount }, (_, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onTabChange(index)}
                    className={`
            flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm
            transition-all whitespace-nowrap
            ${activeTab === index
                            ? 'text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }
          `}
                    style={{
                        backgroundColor: activeTab === index ? colorHex : 'transparent',
                        borderBottom: activeTab === index ? `3px solid ${colorHex}` : undefined
                    }}
                >
                    <span>Análisis {index + 1}</span>

                    {/* Circle indicator with color */}
                    <div
                        className={`
              w-2 h-2 rounded-full
              ${activeTab === index ? 'bg-white' : 'bg-gray-600'}
            `}
                    />
                </button>
            ))}

            {/* Add Analysis Button */}
            <button
                type="button"
                onClick={onAddAnalysis}
                className="
          flex items-center gap-2 px-3 py-2.5 rounded-t-lg
          bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
          border-2 border-dashed border-gray-600 hover:border-gray-500
          transition-all font-medium text-sm whitespace-nowrap
        "
                title="Agregar nuevo análisis"
            >
                <Plus className="w-4 h-4" />
                <span>Nuevo</span>
            </button>
        </div>
    );
}
