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
    <input {...props} style={{ colorScheme: 'light' }} className="w-full bg-white border border-[#dbdbdb] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-all text-[#262626] placeholder-gray-400" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    <label {...props} className="text-sm font-semibold text-[#262626] block mb-1" />;

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

        if (!talla.trim()) {
            alert('La talla es obligatoria');
            return;
        }

        onComplete({
            lote: lote.trim(),
            codigo: codigo.trim(),
            talla: talla.trim(),
            color
        });
    };

    const isValid = lote.trim() && codigo.trim() && talla.trim() && color !== null;

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-[#dbdbdb] p-6 sm:p-8">
                <div className="mb-8 text-center">
                    <h2 className="text-xl font-bold text-[#262626] mb-2">
                        Nuevo Análisis
                    </h2>
                    <p className="text-[#8e8e8e] text-sm">
                        Ingresa los datos básicos para comenzar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Lote, Código y Talla */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="lote">
                                Lote <span className="text-red-500">*</span>
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

                        <div>
                            <Label htmlFor="codigo">
                                Código <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="codigo"
                                placeholder="Ej: C-789"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="talla">
                                Talla <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="talla"
                                placeholder="Ej: 41-50"
                                value={talla}
                                onChange={(e) => setTalla(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Color del Analista */}
                    <AnalystColorSelector
                        selectedColor={color || ''}
                        onSelect={(c) => setColor(c as AnalystColor)}
                    />

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`
                                w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm
                                ${isValid
                                    ? 'bg-[#0095f6] text-white hover:bg-[#1877f2] active:bg-[#1877f2]'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            Comenzar Análisis
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
