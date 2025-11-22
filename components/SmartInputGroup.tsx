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
                        disabled={isUploading || disabled}
                        className={`
              absolute right-2 top-1/2 -translate-y-1/2 
              p-2 rounded-lg border transition-all
              ${photoUrl && !isUploading
                                ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                                : 'bg-white border-[#dbdbdb] text-[#8e8e8e] hover:bg-gray-50 hover:text-[#0095f6] hover:border-[#0095f6]'
                            }
              ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-sm hover:shadow
            `}
                        title={photoUrl ? 'Ver foto' : 'Tomar foto'}
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : photoUrl ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                )}

                {/* Input oculto para seleccionar archivo */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Thumbnail preview pequeño debajo del input */}
            {photoUrl && !isUploading && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setShowPhotoPreview(true)}
                        className="relative group"
                    >
                        <img
                            src={photoUrl}
                            alt="Preview"
                            className="w-8 h-8 rounded object-cover border border-gray-300 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded flex items-center justify-center transition-colors">
                            <Eye className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>

                    <div className="flex-1 text-xs text-gray-600">
                        <p className="font-semibold">Foto capturada</p>
                        <p className="text-gray-400">Click para ver</p>
                    </div>

                    {onPhotoDelete && (
                        <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar foto"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Modal de preview */}
            {showPhotoPreview && photoUrl && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPhotoPreview(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setShowPhotoPreview(false)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={photoUrl}
                            alt="Preview grande"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
