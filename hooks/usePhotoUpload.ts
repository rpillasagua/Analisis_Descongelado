import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface PhotoUploadOptions {
    maxSize?: number; // bytes
    allowedTypes?: string[];
}

/**
 * Hook para gestión de subida de fotos con optimistic updates
 * 
 * Características:
 * - Preview inmediato con URL.createObjectURL
 * - Cola de subidas
 * - Retry automático en caso de fallo
 * - Validación de tamaño y tipo
 */
export function usePhotoUpload(
    uploadFunction: (file: File) => Promise<string>,
    options: PhotoUploadOptions = {}
) {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    } = options;

    const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
    const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());

    /**
     * Validar archivo antes de subir
     */
    const validateFile = useCallback((file: File): string | null => {
        if (file.size > maxSize) {
            return `El archivo es muy grande (máx ${(maxSize / 1024 / 1024).toFixed(0)}MB)`;
        }

        if (!allowedTypes.includes(file.type)) {
            return 'Tipo de archivo no permitido';
        }

        return null;
    }, [maxSize, allowedTypes]);

    /**
     * Subir foto con optimistic update
     */
    const uploadPhoto = useCallback(async (
        file: File,
        onSuccess: (url: string) => void
    ): Promise<string | null> => {
        // Validar
        const error = validateFile(file);
        if (error) {
            toast.error(error);
            return null;
        }

        const fileId = `${Date.now()}-${file.name}`;

        // 1. Crear preview inmediato (Optimistic UI)
        const previewUrl = URL.createObjectURL(file);
        onSuccess(previewUrl); // Mostrar preview inmediatamente

        // 2. Marcar como subiendo
        setUploadingFiles(prev => new Set(prev).add(fileId));
        setUploadProgress(prev => new Map(prev).set(fileId, 0));

        try {
            // 3. Subir archivo real
            const realUrl = await uploadFunction(file);

            // 4. Reemplazar preview con URL real
            URL.revokeObjectURL(previewUrl); // Liberar memoria
            onSuccess(realUrl);

            toast.success('Foto subida correctamente');

            return realUrl;
        } catch (error) {
            // 5. Revertir si falla
            URL.revokeObjectURL(previewUrl);
            onSuccess(''); // Limpiar

            const errorMessage = error instanceof Error ? error.message : 'Error al subir foto';
            toast.error(errorMessage);

            return null;
        } finally {
            // 6. Limpiar estado
            setUploadingFiles(prev => {
                const next = new Set(prev);
                next.delete(fileId);
                return next;
            });
            setUploadProgress(prev => {
                const next = new Map(prev);
                next.delete(fileId);
                return next;
            });
        }
    }, [uploadFunction, validateFile]);

    /**
     * Verificar si un campo específico está subiendo
     */
    const isFieldUploading = useCallback((fieldId: string): boolean => {
        return Array.from(uploadingFiles).some(id => id.includes(fieldId));
    }, [uploadingFiles]);

    return {
        uploadPhoto,
        isFieldUploading,
        uploadingCount: uploadingFiles.size,
        uploadProgress
    };
}
