'use client';

import { useState } from 'react';
import { AnalystColor } from '@/lib/types';
import AnalystColorSelector from './AnalystColorSelector';

interface InitialFormProps {
    onComplete: (data: {
        lote: string;
        codigo: string;
        talla: string;
        color: AnalystColor;
    }) => void;
    initialData?: {
        lote?: string;
        codigo?: string;
        talla?: string;
        color?: AnalystColor;
    };
}

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    <input {...props} style={{ colorScheme: 'dark' }} className="flex min-h-[44px] w-full rounded-lg border-2 border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm sm:text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 shadow-sm transition-all placeholder:text-slate-400" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    <label {...props} className="text-sm font-medium leading-tight text-slate-200" />;

export default function InitialForm({ onComplete, initialData }: InitialFormProps) {
    const [lote, setLote] = useState(initialData?.lote || '');
    const [codigo, setCodigo] = useState(initialData?.codigo || '');
    const [talla, setTalla] = useState(initialData?.talla || '');
    const [color, setColor] = useState<AnalystColor | null>(initialData?.color || null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!lote.trim()) {
            alert('El lote es obligatorio');
            return;
        }

        if (!codigo.trim()) {
            alert('El código es obligatorio');
            return;
        }

        if (!color) {
            alert('Debes seleccionar un color de analista');
            return;
        }

        onComplete({
            lote: lote.trim(),
            codigo: codigo.trim(),
            talla: talla.trim(),
            color
        });
    };

    const isValid = lote.trim() && codigo.trim() && color !== null;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        📋 Información Básica del Análisis
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Completa estos campos obligatorios para comenzar. Una vez guardados, podrás realizar múltiples análisis para este lote.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Lote y Código */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lote">
                                📦 Lote <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="lote"
                                placeholder="Ej: L-12345"
                                value={lote}
                                onChange={(e) => setLote(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="codigo">
                                🔢 Código <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="codigo"
                                placeholder="Ej: C-789"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Talla */}
                    <div className="space-y-2">
                        <Label htmlFor="talla">
                            📏 Talla <span className="text-gray-500">(opcional)</span>
                        </Label>
                        <Input
                            id="talla"
                            placeholder="Ej: 16/20, 21/25, etc."
                            value={talla}
                            onChange={(e) => setTalla(e.target.value)}
                        />
                    </div>

                    {/* Color del Analista */}
                    <AnalystColorSelector
                        selectedColor={color}
                        onColorChange={setColor}
                    />

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`
                flex-1 px-6 py-3 rounded-xl font-semibold text-base min-h-[48px]
                transition-all shadow-lg
                ${isValid
                                    ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white hover:from-[#0891b2] hover:to-[#067e8f] hover:scale-105 active:scale-95'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }
              `}
                        >
                            ✅ Guardar y Continuar
                        </button>
                    </div>

                    {!isValid && (
                        <p className="text-sm text-gray-500 text-center">
                            Completa los campos obligatorios y selecciona tu color para continuar
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
