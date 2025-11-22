'use client';

import { useState } from 'react';
import { Eye, X, ZoomIn } from 'lucide-react';

interface PhotoThumbnailProps {
    photoUrl: string;
    alt?: string;
    onDelete?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export default function PhotoThumbnail({
    photoUrl,
    alt = 'Photo',
    onDelete,
    size = 'md'
}: PhotoThumbnailProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const handleClick = () => {
        setShowPreview(true);
    };

    return (
        <>
            {/* Thumbnail with hover effects */}
            <div className="relative group inline-block">
                <button
                    type="button"
                    onClick={handleClick}
                    className={`
            ${sizeClasses[size]} 
            rounded-lg overflow-hidden border-2 border-gray-300 
            hover:border-blue-500 transition-all hover:scale-110 
            ${isFlashing ? 'animate-flash' : ''}
            shadow-sm hover:shadow-md
          `}
                >
                    <img
                        src={photoUrl}
                        alt={alt}
                        className="w-full h-full object-cover"
                    />

                    {/* Hover overlay con icono de zoom */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                        <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </button>

                {/* Delete button */}
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="
              absolute -top-2 -right-2 
              bg-red-500 text-white rounded-full p-1 
              opacity-0 group-hover:opacity-100 
              transition-opacity shadow-lg
              hover:bg-red-600 active:scale-90
            "
                        title="Eliminar foto"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Fullscreen preview modal */}
            {showPreview && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative max-w-6xl max-h-[95vh] w-full">
                        {/* Close button */}
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X className="w-10 h-10" />
                        </button>

                        {/* Image */}
                        <img
                            src={photoUrl}
                            alt={alt}
                            className="max-w-full max-h-[95vh] mx-auto rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Info bar */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur">
                            Click fuera para cerrar
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
