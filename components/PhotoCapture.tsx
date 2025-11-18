'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ImageOff } from 'lucide-react';

interface PhotoCaptureProps {
  label: string;
  photoUrl?: string;
  onPhotoCapture: (file: File) => void;
  onPhotoRemove?: () => void;
}

export default function PhotoCapture({ label, photoUrl, onPhotoCapture, onPhotoRemove }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`📸 PhotoCapture: Archivo seleccionado para ${label}:`, file.name);
      
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        alert('⚠️ Las fotos en formato HEIC (iPhone) pueden no visualizarse correctamente en Windows. Por favor intenta cambiar la configuración de tu cámara a "Más compatible" (JPEG) o usa otra foto.');
      }
      
      setImageError(false);
      onPhotoCapture(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    if (!imageError) {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {photoUrl && !imageError ? (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src={photoUrl}
                alt={label}
                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-all"
                onClick={handleImageClick}
                onError={(e) => {
                  console.warn(`⚠️ No se pudo cargar la imagen ${label}:`, photoUrl);
                  setImageError(true);
                }}
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                onClick={handleImageClick}
              >
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCameraClick}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Cambiar
            </button>
            {onPhotoRemove && (
              <button
                type="button"
                onClick={onPhotoRemove}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCameraClick}
            className={`flex items-center gap-2 px-4 py-2 ${imageError ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'} rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border`}
          >
            {imageError ? (
              <>
                <ImageOff className="w-5 h-5" />
                <span className="text-sm">Error al cargar - Reintentar</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">Tomar foto de {label}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>

    {/* Modal para ver imagen en grande */}
    {showModal && photoUrl && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        onClick={handleCloseModal}
      >
        <div className="relative max-w-5xl max-h-[90vh] w-full">
          <button
            onClick={handleCloseModal}
            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={photoUrl}
            alt={label}
            className="w-full h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
            <p className="text-center font-medium">{label}</p>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
