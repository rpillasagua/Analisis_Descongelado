'use client';

import { useState } from 'react';
import { AnalystColor } from '@/lib/types';
import AnalystColorSelector from './AnalystColorSelector';
import { AlertCircle, Loader2, ArrowRight, FileText, Tag, Layers } from 'lucide-react';

// 1. Tipado estricto y reutilizable
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

// 2. Componente Input Reutilizable con estilo Dark Glass y manejo de errores
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ElementType;
}

const Input = ({ error, label, id, icon: Icon, ...props }: CustomInputProps) => (
    <div className="space-y-1.5 group">
        <label htmlFor={id} className="text-xs font-bold text-blue-200/80 uppercase tracking-wider ml-1 flex items-center gap-2">
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
          ${Icon ? 'pl-11' : 'pl-4'}
          ${error
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-blue-500/50'
                    }
        `}
            />
            {/* Icono decorativo a la izquierda */}
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
            )}

            {/* Icono de alerta a la derecha si hay error */}
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
    // 3. Estado unificado
    const [formData, setFormData] = useState<AnalysisData>({
        lote: initialData?.lote || '',
        codigo: initialData?.codigo || '',
        talla: initialData?.talla || '',
        color: initialData?.color || null,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof AnalysisData, string>>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Actualizar campos y limpiar errores
    const handleChange = (field: keyof AnalysisData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Marcar campo como tocado al salir (onBlur)
    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field as keyof AnalysisData);
    };

    const validateField = (field: keyof AnalysisData) => {
        let error = '';
        if (field === 'lote' && !formData.lote.trim()) error = 'El lote es requerido';
        if (field === 'codigo' && !formData.codigo.trim()) error = 'El código es requerido';
        if (field === 'talla' && !formData.talla.trim()) error = 'La talla es requerida';
        if (field === 'color' && !formData.color) error = 'Selecciona un color';

        setErrors(prev => ({ ...prev, [field]: error || undefined }));
        return !error;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar todo antes de enviar
        const isLoteValid = validateField('lote');
        const isCodigoValid = validateField('codigo');
        const isTallaValid = validateField('talla');
        const isColorValid = validateField('color');

        if (!isLoteValid || !isCodigoValid || !isTallaValid || !isColorValid) {
            setTouched({ lote: true, codigo: true, talla: true, color: true });
            return;
        }

        setIsSubmitting(true);
        try {
            await onComplete(formData);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Contenedor Glass Panel */}
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-2xl overflow-hidden">

                {/* Efecto de fondo (brillo azul) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 mb-8 border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2">
                        Nuevo Análisis
                    </h2>
                    <p className="text-blue-200/60 text-sm">
                        Ingresa los datos de identificación del lote para comenzar el proceso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* Inputs */}
                    <div className="space-y-5">
                        <Input
                            id="lote"
                            label="Lote de Producción"
                            icon={Layers}
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
                                icon={FileText}
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
                                icon={Tag}
                                placeholder="Ej: 40-50"
                                value={formData.talla}
                                onChange={(e) => handleChange('talla', e.target.value)}
                                onBlur={() => handleBlur('talla')}
                                error={touched.talla ? errors.talla : undefined}
                                required
                            />
                        </div>
                    </div>

                    {/* Selector de Color con estilo integrado */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${errors.color && touched.color
                            ? 'bg-red-500/5 border-red-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-blue-200/80 uppercase tracking-wider flex items-center gap-2">
                                Color del Analista *
                            </span>
                            {errors.color && touched.color && (
                                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                                    Requerido
                                </span>
                            )}
                        </div>

                        <AnalystColorSelector
                            selectedColor={formData.color || ''}
                            onSelect={(c) => {
                                handleChange('color', c);
                                if (touched.color) validateField('color');
                            }}
                        />
                    </div>

                    {/* Botón de Acción */}
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
                            {/* Fondo con brillo animado */}
                            {!isSubmitting && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />}

                            <div className="flex items-center justify-center gap-2 relative z-10">
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
