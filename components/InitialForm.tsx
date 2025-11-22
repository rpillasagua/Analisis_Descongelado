'use client';

import { useState } from 'react';
import { AnalystColor } from '@/lib/types';
import AnalystColorSelector from './AnalystColorSelector';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

// 1. Definimos tipos más estrictos y reutilizables
interface AnalysisData {
    lote: string;
    codigo: string;
    talla: string;
    color: AnalystColor | null;
}

interface InitialFormProps {
    onComplete: (data: AnalysisData) => Promise<void> | void; // Soporte para async
    initialData?: Partial<AnalysisData>;
}

// 2. Input Component mejorado con soporte para errores y estilos Dark/Glass
const Input = ({
    error,
    label,
    id,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string; label: string }) => (
    <div className="space-y-1.5 group">
        <label htmlFor={id} className="text-xs font-bold text-blue-200/80 uppercase tracking-wider ml-1">
            {label} {props.required && <span className="text-blue-400">*</span>}
        </label>
        <div className="relative">
            <input
                id={id}
                {...props}
                className={`
          w-full bg-black/20 border rounded-xl px-4 py-3 text-white placeholder-white/20 
          transition-all duration-200 outline-none font-mono
          focus:bg-black/30 focus:ring-2 focus:ring-blue-500/20
          ${error
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-blue-500/50'
                    }
        `}
            />
            {/* Icono de error si existe */}
            {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                </div>
            )}
        </div>
        {/* Mensaje de error animado */}
        <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-xs text-red-400 ml-1 font-medium flex items-center gap-1">
                {error}
            </p>
        </div>
    </div>
);

export default function InitialForm({ onComplete, initialData }: InitialFormProps) {
    // 3. Estado unificado para limpieza y manejo más fácil
    const [formData, setFormData] = useState<AnalysisData>({
        lote: initialData?.lote || '',
        codigo: initialData?.codigo || '',
        talla: initialData?.talla || '',
        color: initialData?.color || null,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof AnalysisData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Helper para actualizar campos
    const handleChange = (field: keyof AnalysisData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Limpiar error al escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Helper para marcar campo como "tocado" (blur)
    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.lote.trim()) newErrors.lote = 'El lote es requerido';
        if (!formData.codigo.trim()) newErrors.codigo = 'El código es requerido';
        if (!formData.talla.trim()) newErrors.talla = 'La talla es requerida';
        if (!formData.color) newErrors.color = 'Selecciona un color';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            // Marcar todos como tocados para mostrar errores visuales si el usuario intenta enviar vacío
            setTouched({ lote: true, codigo: true, talla: true, color: true });
            return;
        }

        setIsSubmitting(true);
        try {
            await onComplete(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="relative glass-panel-pro p-8 rounded-2xl overflow-hidden bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Efecto de fondo decorativo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        Nuevo Análisis
                    </h2>
                    <p className="text-blue-200/60 text-sm">
                        Ingresa los datos de identificación del lote para comenzar el proceso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* Grid para inputs */}
                    <div className="space-y-5">
                        <Input
                            id="lote"
                            label="Lote de Producción"
                            placeholder="Ej: L-2024-001"
                            value={formData.lote}
                            onChange={(e) => handleChange('lote', e.target.value)}
                            onBlur={() => handleBlur('lote')}
                            error={touched.lote ? errors.lote : undefined}
                            required
                            autoFocus
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input
                                id="codigo"
                                label="Código Referencia"
                                placeholder="Ej: REF-882"
                                value={formData.codigo}
                                onChange={(e) => handleChange('codigo', e.target.value)}
                                onBlur={() => handleBlur('codigo')}
                                error={touched.codigo ? errors.codigo : undefined}
                                required
                            />

                            <Input
                                id="talla"
                                label="Talla / Calibre"
                                placeholder="Ej: 40-50"
                                value={formData.talla}
                                onChange={(e) => handleChange('talla', e.target.value)}
                                onBlur={() => handleBlur('talla')}
                                error={touched.talla ? errors.talla : undefined}
                                required
                            />
                        </div>
                    </div>

                    {/* Sección de Color con mejor UI */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${errors.color && touched.color
                            ? 'bg-red-500/5 border-red-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                                Color del Analista *
                            </span>
                            {errors.color && touched.color && (
                                <span className="text-xs text-red-400 font-medium animate-pulse">Requerido</span>
                            )}
                        </div>

                        <AnalystColorSelector
                            selectedColor={formData.color || ''}
                            onSelect={(c) => handleChange('color', c)}
                        />
                    </div>

                    {/* Botón de acción con estados de carga */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                group w-full relative overflow-hidden rounded-xl py-4 font-bold text-sm uppercase tracking-widest transition-all
                ${isSubmitting
                                    ? 'bg-gray-800 text-gray-400 cursor-wait'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0'
                                }
              `}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Comenzar Análisis</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
