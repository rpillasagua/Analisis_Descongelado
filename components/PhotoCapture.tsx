'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ImageOff } from 'lucide-react';

interface PhotoCaptureProps {
  label: string;
  photoUrl?: string;
  onPhotoCapture: (file: File) => void;
  onPhotoRemove?: () => void;
  isUploading?: boolean;
}

export default function PhotoCapture({ label, photoUrl, onPhotoCapture, onPhotoRemove, isUploading = false }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errorType, setErrorType] = useState<'blob' | 'drive_auth' | 'drive_permissions' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para generar URLs alternativas de Google Drive
  const getAlternativeDriveUrl = (currentUrl: string): string | null => {
    const fileIdMatch = currentUrl.match(/[?&]id=([^&]+)/);
    if (!fileIdMatch) return null;
    
    const fileId = fileIdMatch[1];
    
    // Si es thumbnail, probar con uc export
    if (currentUrl.includes('/thumbnail?')) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Si es uc export, probar con thumbnail
    if (currentUrl.includes('uc?export=view')) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
    
    // URL por defecto
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  };

  useEffect(() => {
    setImageError(false);
    setErrorType('unknown');
    setIsLoading(!!photoUrl); // Mostrar loading si hay URL
    setIsRetrying(false);
    setRetryCount(0); // Reset retry count
  }, [photoUrl]);

  // Timeout de seguridad para prevenir loading infinito
  useEffect(() => {
    if (isLoading && photoUrl) {
      const timeout = setTimeout(() => {
        console.warn(`⏰ Timeout de carga excedido para ${label}, forzando fin de loading`);
        setIsLoading(false);
        setIsRetrying(false);
        // Si aún no hay error, marcar como error desconocido
        if (!imageError) {
          setImageError(true);
          setErrorType('unknown');
        }
      }, 10000); // 10 segundos máximo

      return () => clearTimeout(timeout);
    }
  }, [isLoading, photoUrl, label, imageError]);

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
      <div className="h-fit">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {photoUrl && !imageError ? (
          <div className="flex flex-col gap-2 h-fit">
            <div className="relative group flex-shrink-0 w-20 h-20 max-w-20 max-h-20 overflow-hidden">
              {(isLoading || isRetrying || isUploading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg z-10">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-1"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300 text-center px-1">
                    {isUploading ? 'Subiendo...' : isRetrying ? 'Reconectando...' : 'Cargando...'}
                  </span>
                </div>
              )}
              <img
                src={photoUrl}
                alt={label}
                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-all"
                onClick={handleImageClick}
                onError={async (e) => {
                  console.warn(`⚠️ No se pudo cargar la imagen ${label}:`, photoUrl);
                  console.warn('Error details:', e);
                  
                  // Determinar el tipo de URL y manejar el error apropiadamente
                  if (photoUrl.startsWith('blob:')) {
                    // URLs blob son temporales y expiran, no se pueden recuperar
                    console.warn('URL blob expirada, no se puede recuperar');
                    setErrorType('blob');
                    setImageError(true);
                    setIsLoading(false);
                    setIsRetrying(false);
                    return;
                  }
                  
                  // Si es una URL de Google Drive, intentar diferentes estrategias de recuperación
                  if (photoUrl.includes('drive.google.com') && retryCount < 2) {
                    setRetryCount(prev => prev + 1);
                    console.log(`🔄 Intento ${retryCount + 1} de recuperación para Google Drive`);
                    
                    // Primero intentar con URL alternativa sin autenticación
                    const altUrl = getAlternativeDriveUrl(photoUrl);
                    if (altUrl) {
                      console.log('🔄 Intentando con URL alternativa:', altUrl);
                      setTimeout(() => {
                        const img = e.target as HTMLImageElement;
                        img.src = altUrl + '?t=' + Date.now();
                      }, 500);
                      // NO HACEMOS RETURN AQUÍ - dejamos que continue la lógica
                    }
                    
                    // Si no hay URL alternativa, intentar refrescar permisos
                    try {
                      setIsRetrying(true);
                      const { googleDriveService } = await import('@/lib/googleDriveService');
                      const { googleAuthService } = await import('@/lib/googleAuthService');
                      
                      // Verificar si el usuario está autenticado
                      if (!googleAuthService.isAuthenticated()) {
                        console.warn('Usuario no autenticado, no se pueden refrescar permisos');
                        setErrorType('drive_auth');
                        setImageError(true);
                        setIsLoading(false);
                        setIsRetrying(false);
                        return;
                      }
                      
                      // Intentar refrescar permisos
                      const fileIdMatch = photoUrl.match(/[?&]id=([^&]+)/);
                      if (fileIdMatch) {
                        console.warn('Intentando refrescar permisos para archivo:', fileIdMatch[1]);
                        try {
                          await googleDriveService.makeFilePublic(fileIdMatch[1]);
                          console.log('✅ Permisos refrescados exitosamente');
                          
                          // Reintentar con la URL original después de refrescar permisos
                          setTimeout(() => {
                            const img = e.target as HTMLImageElement;
                            img.src = photoUrl + '?t=' + Date.now();
                            setIsRetrying(false);
                          }, 1000);
                          // NO HACEMOS RETURN AQUÍ - dejamos que continue la lógica
                        } catch (permissionError: any) {
                          console.warn('⚠️ No se pudieron refrescar los permisos:', permissionError.message);
                          
                          // Mostrar error de permisos
                          setErrorType('drive_permissions');
                          setImageError(true);
                          setIsLoading(false);
                          setIsRetrying(false);
                          return;
                        }
                      }
                      
                      setIsRetrying(false);
                    } catch (error) {
                      console.error('Error en recuperación de Google Drive:', error);
                      setErrorType('drive_permissions');
                      setImageError(true);
                      setIsLoading(false);
                      setIsRetrying(false);
                    }
                  } else if (photoUrl.includes('drive.google.com') && retryCount >= 2) {
                    // Máximo de reintentos alcanzado
                    console.warn('⚠️ Máximo de reintentos alcanzado para Google Drive');
                    setErrorType('drive_permissions');
                    setImageError(true);
                    setIsLoading(false);
                    setIsRetrying(false);
                  }
                  
                  // Para otros tipos de URLs o errores no manejados
                  setErrorType('unknown');
                  setImageError(true);
                  setIsLoading(false);
                  setIsRetrying(false);
                }}
                onLoad={() => {
                  console.log(`✅ Imagen cargada correctamente: ${label}`);
                  setImageError(false); // Reset error state on successful load
                  setErrorType('unknown'); // Reset error type
                  setIsLoading(false);
                  setIsRetrying(false);
                  setRetryCount(0); // Reset retry count
                }}
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                onClick={handleImageClick}
              >
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex gap-2 h-fit">
              <button
                type="button"
                onClick={handleCameraClick}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
              >
                Cambiar
              </button>
              {onPhotoRemove && (
                <button
                  type="button"
                  onClick={onPhotoRemove}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
      ) : (
        <div className="flex items-center gap-2 w-full h-fit">
          {imageError ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-2 text-red-600">
                <ImageOff className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {errorType === 'blob' 
                    ? 'Imagen temporal expirada'
                    : errorType === 'drive_auth'
                    ? 'Error de autenticación'
                    : errorType === 'drive_permissions'
                    ? 'Error de permisos'
                    : 'Error al cargar imagen'}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-2">
                {errorType === 'blob'
                  ? 'Esta imagen temporal ha expirado. Necesitas volver a tomar la foto.'
                  : errorType === 'drive_auth'
                  ? 'Tu sesión de Google ha expirado. Inicia sesión nuevamente para ver las fotos.'
                  : errorType === 'drive_permissions'
                  ? 'La imagen no se puede cargar. Puede que haya un problema con los permisos o la imagen haya sido eliminada.'
                  : 'La imagen puede estar dañada o no disponible'}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                {errorType === 'blob' ? (
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded text-white flex-1 transition-colors"
                  >
                    Tomar nueva foto
                  </button>
                ) : errorType === 'drive_auth' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`🔄 Reintentando cargar imagen: ${label}`);
                      setImageError(false); // Reset error state
                      setErrorType('unknown'); // Reset error type
                      setIsLoading(true); // Show loading
                      // Force reload by updating the src
                      setTimeout(() => {
                        const img = document.querySelector(`img[alt="${label}"]`) as HTMLImageElement;
                        if (img && photoUrl) {
                          img.src = photoUrl + '?t=' + Date.now();
                        }
                      }, 100);
                    }}
                    className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded text-white flex-1 transition-colors"
                  >
                    Reintentar carga
                  </button>
                ) : (
                  <div className="text-xs text-center py-2 text-gray-500">
                    No se puede recuperar automáticamente
                  </div>
                )}
                {photoUrl && photoUrl.startsWith('http') && errorType !== 'blob' && (
                  <a 
                    href={photoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-gray-700 inline-block text-center flex-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver en navegador
                  </a>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCameraClick}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border w-full"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm whitespace-nowrap">Tomar foto de {label}</span>
            </button>
          )}
        </div>
      )}
    </div>

    {/* Modal para ver imagen en grande */}
    {showModal && photoUrl && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleCloseModal}
      >
        <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <button
            onClick={handleCloseModal}
            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <img
              src={photoUrl}
              alt={label}
              className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.warn(`⚠️ Error cargando imagen en modal ${label}:`, photoUrl);
                console.warn('Modal error details:', e);
                // No seteamos imageError aquí para no cerrar el modal abruptamente,
                // pero podríamos mostrar un mensaje dentro del modal.
                // Por ahora, solo loggeamos el error
              }}
              onLoad={() => {
                console.log(`✅ Imagen del modal cargada correctamente: ${label}`);
              }}
            />
            <div className="bg-gray-900 text-white p-3">
              <p className="text-center font-medium text-sm">{label}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
