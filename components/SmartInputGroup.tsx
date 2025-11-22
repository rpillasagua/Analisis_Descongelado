'use client';

import { useRef, useState } from 'react';
import { Camera, Eye, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SmartInputGroupProps {
    label: string;
    value: number | string;
    photoUrl?: string;
    onChange: (value: number) => void;
    onPhotoCapture?: (file: File) => void;
    onPhotoDelete?: () => void;
    isUploading?: boolean;
    error?: boolean;
    success?: boolean;
    unit?: string;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    disabled?: boolean;
}

export default function SmartInputGroup({
    label,
    value,
    photoUrl,
    onChange,
    onPhotoCapture,
    onPhotoDelete,
    isUploading = false,
    error = false,
    success = false,
    unit = '',
    placeholder = '0.00',
    required = false,
    min,
    max,
    disabled = false
}: SmartInputGroupProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPhotoPreview, setShowPhotoPreview] = useState(false);

    const handlePhotoClick = () => {
        if (photoUrl) {
            setShowPhotoPreview(true);
        } else if (onPhotoCapture) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onPhotoCapture) {
            onPhotoCapture(file);
        }
        // Reset input para permitir subir la misma foto de nuevo
        e.target.value = '';
    };

    const handleDeletePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onPhotoDelete) {
            onPhotoDelete();
        }
    };

    return (
        <div className="space-y-2">
            <Label required={required}>{label}</Label>

            {/* Input Group con botón integrado */}
            <div className="relative flex items-center">
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    placeholder={placeholder}
                    error={error}
                    success={success}
                    disabled={disabled}
                    min={min}
                    max={max}
                    className="pr-14" // Espacio para el botón
                />

                {/* Unit label (opcional) */}
                {unit && (
                    <span className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-[#8e8e8e] font-semibold pointer-events-none">
                        {unit}
                    </span>
                )}

                {/* Botón de cámara/foto integrado */}
                {onPhotoCapture && (
                    <button
                        type="button"
                        onClick={handlePhotoClick}
                        disabled={disabled || isUploading}
                        className={`
                            absolute right-1 top-1/2 -translate-y-1/2
                            h-8 w-10 flex items-center justify-center rounded-md transition-all
                            ${photoUrl
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                            }
                            ${isUploading ? 'opacity-70 cursor-wait' : ''}
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={photoUrl ? "Ver foto" : "Tomar foto"}
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : photoUrl ? (
                            <div className="relative w-full h-full overflow-hidden rounded-md">
                                <Image
                                    src={photoUrl}
                                    alt="Thumbnail"
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                    unoptimized // Necesario si el dominio no está en remotePatterns o output: export
                                />
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <Eye className="h-3 w-3 text-white drop-shadow-md" />
                                </div>
                            </div>
                        ) : (
                            <Camera className="h-4 w-4" />
                        )}
                    </button>
                )}

                {/* Input file oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Modal de previsualización */}
            {showPhotoPreview && photoUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setShowPhotoPreview(false)}
                >
                    <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        {/* Header del modal */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                            <span className="text-white font-medium text-sm drop-shadow-md">{label}</span>
                            <button
                                onClick={() => setShowPhotoPreview(false)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Imagen grande */}
                        <div className="relative w-full aspect-[3/4] sm:aspect-square bg-zinc-900">
                            <Image
                                src={photoUrl}
                                alt={label}
                                fill
                                className="object-contain"
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 600px"
                            />
                        </div>

                        {/* Footer con acciones */}
                        <div className="p-4 bg-zinc-900 border-t border-white/10 flex gap-3">
                            <button
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setShowPhotoPreview(false);
                                }}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                Cambiar foto
                            </button>

                            {onPhotoDelete && (
                                <button
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        handleDeletePhoto(e);
                                        setShowPhotoPreview(false);
                                    }}
                                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium text-sm transition-colors"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
