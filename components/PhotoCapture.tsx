'use client';

import { useState, useRef } from 'react';

interface PhotoCaptureProps {
  label: string;
  photoUrl?: string;
  onPhotoCapture: (file: File) => void;
  onPhotoRemove?: () => void;
}

export default function PhotoCapture({ label, photoUrl, onPhotoCapture, onPhotoRemove }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoCapture(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {photoUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={photoUrl}
            alt={label}
            className="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
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
        <button
          type="button"
          onClick={handleCameraClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">Tomar foto de {label}</span>
        </button>
      )}
    </div>
  );
}
