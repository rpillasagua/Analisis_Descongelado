'use client';

import { AnalystColor, ANALYST_COLOR_LABELS, ANALYST_COLOR_HEX } from '@/lib/types';

interface AnalystColorSelectorProps {
    selectedColor: AnalystColor | null;
    onColorChange: (color: AnalystColor) => void;
    label?: string;
}

const COLORS: AnalystColor[] = ['red', 'blue', 'green', 'yellow'];

export default function AnalystColorSelector({
    selectedColor,
    onColorChange,
    label = 'Selecciona tu color de analista'
}: AnalystColorSelectorProps) {
    return (
        <div className="space-y-4">
            <label className="text-base font-bold text-gray-900 block">
                {label} <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    const hexColor = ANALYST_COLOR_HEX[color];

                    return (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onColorChange(color)}
                            className={`
                relative p-5 rounded-2xl border-3 transition-all
                flex flex-col items-center gap-3
                hover:scale-105 active:scale-95
                ${isSelected
                                    ? 'border-blue-600 shadow-xl bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                                }
              `}
                        >
                            {/* Color circle */}
                            <div
                                className={`
                  w-20 h-20 rounded-full border-4 transition-all shadow-lg
                  ${isSelected ? 'border-white scale-110 ring-4 ring-blue-200' : 'border-gray-200'}
                `}
                                style={{ backgroundColor: hexColor, boxShadow: `0 4px 20px ${hexColor}60` }}
                            />

                            {/* Label */}
                            <span className="text-base font-bold transition-colors text-gray-900">
                                {ANALYST_COLOR_LABELS[color]}
                            </span>

                            {/* Check mark when selected */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {!selectedColor && (
                <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    💡 Este color te identificará en todos los análisis que realices hoy
                </p>
            )}
        </div>
    );
}
