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
        <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 block">
                {label} <span className="text-red-400">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    const hexColor = ANALYST_COLOR_HEX[color];

                    return (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onColorChange(color)}
                            className={`
                relative p-4 rounded-xl border-2 transition-all
                flex flex-col items-center gap-2
                hover:scale-105 active:scale-95
                ${isSelected
                                    ? 'border-white shadow-lg'
                                    : 'border-gray-600 hover:border-gray-400'
                                }
              `}
                            style={{
                                backgroundColor: isSelected ? `${hexColor}20` : 'transparent',
                                borderColor: isSelected ? hexColor : undefined
                            }}
                        >
                            {/* Color circle */}
                            <div
                                className={`
                  w-12 h-12 rounded-full border-4 transition-all
                  ${isSelected ? 'border-white scale-110' : 'border-transparent'}
                `}
                                style={{ backgroundColor: hexColor }}
                            />

                            {/* Label */}
                            <span className={`
                text-sm font-semibold transition-colors
                ${isSelected ? 'text-white' : 'text-gray-400'}
              `}>
                                {ANALYST_COLOR_LABELS[color]}
                            </span>

                            {/* Check mark when selected */}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
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
                <p className="text-xs text-gray-500 mt-2">
                    Este color te identificará en todos los análisis que realices hoy
                </p>
            )}
        </div>
    );
}
