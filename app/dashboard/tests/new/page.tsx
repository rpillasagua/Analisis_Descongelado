'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductTypeSelector from '@/components/ProductTypeSelector';
import PhotoCapture from '@/components/PhotoCapture';
import ControlPesosBrutos from '@/components/ControlPesosBrutos';
import AutoSaveIndicatorNew from '@/components/AutoSaveIndicatorNew';
import DefectSelector from '@/components/DefectSelector';
import { useAutoSaveAnalysis } from '@/lib/useAutoSaveAnalysis';
import {
  ProductType,
  QualityAnalysis,
  PesoBrutoRegistro
} from '@/lib/types';
import { getWorkShift, formatDate, generateId } from '@/lib/utils';
import { getAnalysisById } from '@/lib/analysisService';

export const dynamic = 'force-dynamic';

// Componentes UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`glass-card border border-[rgba(6,182,212,0.2)] rounded-lg transition-all ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`p-4 sm:p-6 border-b border-[rgba(6,182,212,0.1)] ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <h2 className={`text-xl sm:text-2xl font-semibold text-[#f3f4f6] ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <p className={`text-xs sm:text-sm text-[#9ca3af] mt-1 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all h-9 sm:h-10 px-4 py-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    default: 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white hover:from-[#0891b2] hover:to-[#067e8f]',
    outline: 'border-2 border-[rgba(6,182,212,0.3)] bg-[rgba(6,182,212,0.05)] text-[#06b6d4] hover:bg-[rgba(6,182,212,0.1)]',
    ghost: 'hover:bg-[rgba(6,182,212,0.1)] text-[#06b6d4]',
  };
  return <button disabled={disabled} type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-[rgba(6,182,212,0.2)] bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4] shadow-sm transition-all placeholder:text-[#6b7280]" />;
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
  <label {...props} className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#f3f4f6]" />;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
  <textarea {...props} className="flex min-h-20 w-full rounded-lg border-2 border-[rgba(6,182,212,0.2)] bg-[rgba(6,182,212,0.05)] text-[#f3f4f6] px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4] shadow-sm transition-all placeholder:text-[#6b7280]" />;

export default function NewAnalysisPage() {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [productType, setProductType] = useState<ProductType>();
  const [formData, setFormData] = useState<Partial<QualityAnalysis>>({});
  const [photos, setPhotos] = useState<{ [key: string]: File }>({});
  const [pesosBrutos, setPesosBrutos] = useState<PesoBrutoRegistro[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isDocumentCreated, setIsDocumentCreated] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(new Set());

  // Helper para determinar si un campo específico está siendo subido
  const isFieldUploading = (field: string) => {
    return uploadingPhotos.has(field);
  };

  // Obtener ID del URL en el cliente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    setEditId(id);
  }, []);

  // Cargar análisis existente o generar nuevo ID
  useEffect(() => {
    if (editId) {
      loadExistingAnalysis(editId);
    } else if (editId === null && !analysisId) {
      setAnalysisId(generateId());
    }
  }, [editId]);

  const loadExistingAnalysis = async (id: string) => {
    setIsLoading(true);
    try {
      const analysis = await getAnalysisById(id);
      if (analysis) {
        setAnalysisId(analysis.id);
        setProductType(analysis.productType);
        setFormData(analysis);
        // Cast to any to support both legacy and new structure during migration
        const analysisData = analysis as any;
        if (analysisData.pesosBrutos) {
          setPesosBrutos(analysisData.pesosBrutos);
        } else if (analysis.analyses && analysis.analyses.length > 0) {
          // Fallback for new structure if needed in legacy page
          if (analysis.analyses[0].pesosBrutos) {
            setPesosBrutos(analysis.analyses[0].pesosBrutos);
          }
        }
        setIsDocumentCreated(true); // Ya existe en Firestore
      } else {
        alert('Análisis no encontrado');
        router.push('/');
      }
    } catch (error) {
      console.error('Error cargando análisis:', error);
      alert('Error al cargar el análisis');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-guardado
  const handleAutoSave = async (data: any) => {
    if (!analysisId) return;

    try {
      const { saveAnalysis, updateAnalysis } = await import('@/lib/analysisService');
      const { googleAuthService } = await import('@/lib/googleAuthService');
      const user = googleAuthService.getUser();
      const now = new Date();

      const analysis: any = {
        id: analysisId,
        productType: productType!,
        lote: data.lote || '',
        codigo: data.codigo || '',
        talla: data.talla,
        pesoBruto: data.pesoBruto,
        pesoCongelado: data.pesoCongelado,
        pesoNeto: data.pesoNeto,
        pesosBrutos: productType === 'CONTROL_PESOS' ? pesosBrutos : undefined,
        conteo: data.conteo,
        uniformidad: data.uniformidad,
        defectos: data.defectos,
        fotoCalidad: data.fotoCalidad,
        observations: data.observations,
        createdAt: data.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: user?.email || 'unknown',
        shift: getWorkShift(now),
        date: formatDate(now),
        status: 'EN_PROGRESO'
      };

      // Si es la primera vez, crear el documento con setDoc
      if (!isDocumentCreated) {
        await saveAnalysis(analysis);
        setIsDocumentCreated(true);
      } else {
        // Si ya existe, solo actualizar con updateDoc
        await updateAnalysis(analysisId, analysis);
      }
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  };

  const autoSaveState = useAutoSaveAnalysis({
    data: { ...formData, productType },
    onSave: handleAutoSave,
    delay: 500,
    enabled: !!productType && !!formData.codigo && !!formData.lote && uploadingPhotos.size === 0
  });

  // Helper para obtener valores anidados (ej: "pesoBruto.fotoUrl")
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper para setear valores anidados (ej: "pesoBruto.fotoUrl")
  const setNestedValue = (obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return { ...obj };
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Campo anidado (ej: "pesoBruto.fotoUrl")
      setFormData(prev => setNestedValue({ ...prev }, field, value));
    } else {
      // Campo simple
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFieldBlur = async () => {
    if (productType && formData.codigo && formData.lote && analysisId) {
      await handleAutoSave({ ...formData, productType });
    }
  };

  const handlePhotoCapture = async (field: string, file: File) => {
    console.log(`📸 Capturando foto para campo: ${field}`);
    console.log(`📁 Archivo: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Marcar que esta foto se está subiendo
    setUploadingPhotos(prev => new Set(prev).add(field));

    // Guardar la URL anterior para poder revertir en caso de error
    const previousUrl = getNestedValue(formData, field);

    try {
      // Obtener URL anterior de la foto antes de reemplazarla
      const oldPhotoUrl = getNestedValue(formData, field);
      console.log(`🔗 URL anterior:`, oldPhotoUrl);

      // Revocar URL blob anterior si existe para liberar memoria
      if (oldPhotoUrl && oldPhotoUrl.startsWith('blob:')) {
        // Retrasar la revocación para evitar errores de carga en la UI antes de que se actualice el estado
        setTimeout(() => URL.revokeObjectURL(oldPhotoUrl), 1000);
      }

      // Crear URL temporal para preview inmediato
      const tempUrl = URL.createObjectURL(file);
      console.log(`🖼️ URL temporal creada:`, tempUrl);

      handleInputChange(field, tempUrl);
      setPhotos(prev => ({ ...prev, [field]: file }));

      // Subir foto inmediatamente a Google Drive
      const { googleDriveService } = await import('@/lib/googleDriveService');
      const { googleAuthService } = await import('@/lib/googleAuthService');

      // Inicializar servicios de Google si no están inicializados
      if (typeof window !== 'undefined') {
        await googleAuthService.initialize();
      }

      if (!googleAuthService.isAuthenticated()) {
        console.warn('⚠️ Usuario no autenticado, intentando login automático...');
        alert('Necesitas iniciar sesión con Google para subir fotos. Redirigiendo al login...');
        router.push('/');
        return;
      }

      // Verificar que el token sea válido antes de subir
      try {
        await googleAuthService.ensureValidToken();
        console.log('✅ Token válido, procediendo con la subida...');
      } catch (tokenError) {
        console.warn('⚠️ Token expirado, redirigiendo al login...');
        alert('Tu sesión de Google ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        router.push('/');
        return;
      }

      console.log(`⬆️ Subiendo foto a Google Drive...`);
      await googleDriveService.initialize();

      const codigo = formData.codigo || 'temp';
      const lote = formData.lote || 'temp';
      const photoType = field.replace(/\./g, '_');

      // Pasar la URL anterior para que se elimine
      const driveUrl = await googleDriveService.uploadAnalysisPhoto(
        file,
        codigo,
        lote,
        photoType,
        oldPhotoUrl
      );

      console.log(`✅ Foto ${photoType} subida a Drive:`, driveUrl);

      // Actualizar con URL de Drive
      handleInputChange(field, driveUrl);
      console.log(`📝 Estado actualizado con URL de Drive`);

      // Guardar automáticamente con la nueva URL
      if (analysisId && productType && formData.codigo && formData.lote) {
        console.log(`💾 Auto-guardando análisis...`);
        await handleFieldBlur();
        console.log(`✅ Auto-guardado completado`);
      }
    } catch (error: any) {
      console.error('❌ Error subiendo foto:', error);

      // Revertir a la URL anterior si la subida falló
      console.warn('🔄 Revirtiendo a URL anterior debido a error de subida');
      handleInputChange(field, previousUrl);

      // Revocar la URL temporal que se creó
      if (getNestedValue(formData, field) && getNestedValue(formData, field).startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(getNestedValue(formData, field)), 100);
      }

      // Mostrar mensaje de error específico
      if (error.message?.includes('Error de conexión') || error.message?.includes('Google Drive')) {
        alert('Error de conexión con Google Drive. Verifica tu conexión a internet o permisos de Google Drive. La foto se guardará localmente.');
      } else if (error.message?.includes('Sesión expirada') || error.message?.includes('Token inválido') || error.message?.includes('401')) {
        alert('Tu sesión de Google ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        router.push('/');
      } else {
        alert(`Error al subir la foto ${field}. La foto se guardará localmente, pero no estará disponible después de recargar la página.`);
      }
    } finally {
      // Marcar que terminó la subida
      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const handlePesoBrutoPhotoCapture = async (registroId: string, file: File) => {
    const photoField = `pesoBruto_${registroId}`;

    // Marcar que esta foto se está subiendo
    setUploadingPhotos(prev => new Set(prev).add(photoField));

    // Guardar la URL anterior para poder revertir en caso de error
    const registro = pesosBrutos.find(r => r.id === registroId);
    const previousUrl = registro?.fotoUrl;

    try {
      // Obtener URL anterior de la foto del registro
      const oldPhotoUrl = pesosBrutos.find(r => r.id === registroId)?.fotoUrl;

      // Revocar URL blob anterior si existe
      if (oldPhotoUrl && oldPhotoUrl.startsWith('blob:')) {
        const urlToRevoke = oldPhotoUrl;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 1000);
      }

      // Crear URL temporal para preview inmediato
      const tempUrl = URL.createObjectURL(file);
      setPesosBrutos(prev => prev.map(r =>
        r.id === registroId ? { ...r, fotoUrl: tempUrl } : r
      ));
      setPhotos(prev => ({ ...prev, [photoField]: file }));

      // Subir foto inmediatamente a Google Drive
      const { googleDriveService } = await import('@/lib/googleDriveService');
      const { googleAuthService } = await import('@/lib/googleAuthService');

      // Inicializar servicios de Google si no están inicializados
      if (typeof window !== 'undefined') {
        await googleAuthService.initialize();
      }

      if (!googleAuthService.isAuthenticated()) {
        console.warn('Usuario no autenticado, foto no se subirá');
        alert('Necesitas iniciar sesión con Google para subir fotos. Redirigiendo al login...');
        router.push('/');
        return;
      }

      // Verificar que el token sea válido antes de subir
      try {
        await googleAuthService.ensureValidToken();
        console.log('✅ Token válido, procediendo con la subida...');
      } catch (tokenError) {
        console.warn('⚠️ Token expirado, redirigiendo al login...');
        alert('Tu sesión de Google ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        router.push('/');
        return;
      }

      await googleDriveService.initialize();

      const codigo = formData.codigo || 'temp';
      const lote = formData.lote || 'temp';
      const photoType = photoField;

      // Pasar la URL anterior para que se elimine
      const driveUrl = await googleDriveService.uploadAnalysisPhoto(
        file,
        codigo,
        lote,
        photoType,
        oldPhotoUrl
      );

      console.log(`✅ Foto peso bruto subida a Drive:`, driveUrl);

      // Actualizar con URL de Drive
      setPesosBrutos(prev => prev.map(r =>
        r.id === registroId ? { ...r, fotoUrl: driveUrl } : r
      ));

      // Guardar automáticamente con la nueva URL
      if (analysisId && productType && formData.codigo && formData.lote) {
        await handleFieldBlur();
      }
    } catch (error: any) {
      console.error('Error subiendo foto de peso bruto:', error);

      // Revertir a la URL anterior si la subida falló
      console.warn('🔄 Revirtiendo foto de peso bruto a URL anterior debido a error de subida');
      setPesosBrutos(prev => prev.map(r =>
        r.id === registroId ? { ...r, fotoUrl: previousUrl } : r
      ));

      // Revocar la URL temporal que se creó
      const currentRegistro = pesosBrutos.find(r => r.id === registroId);
      if (currentRegistro?.fotoUrl && currentRegistro.fotoUrl.startsWith('blob:')) {
        const urlToRevoke = currentRegistro.fotoUrl;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 100);
      }

      // Mostrar mensaje de error específico
      if (error.message?.includes('Error de conexión') || error.message?.includes('Google Drive')) {
        alert('Error de conexión con Google Drive. Verifica tu conexión a internet o permisos de Google Drive. La foto se guardará localmente.');
      } else if (error.message?.includes('Sesión expirada') || error.message?.includes('Token inválido') || error.message?.includes('401')) {
        alert('Tu sesión de Google ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        router.push('/');
      } else {
        alert(`Error al subir la foto de peso bruto. La foto se guardará localmente, pero no estará disponible después de recargar la página.`);
      }
    } finally {
      // Marcar que terminó la subida
      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoField);
        return newSet;
      });
    }
  };

  const handleDefectsChange = useCallback((defects: { [key: string]: number }) => {
    setFormData(prev => ({
      ...prev,
      defectos: defects
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const now = new Date();
      const codigo = formData.codigo || '';
      const lote = formData.lote || '';

      // Verificar autenticación
      const { googleAuthService } = await import('@/lib/googleAuthService');
      const user = googleAuthService.getUser();

      if (!user) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        router.push('/');
        return;
      }

      // Las fotos ya están subidas, solo usar formData y pesosBrutos actuales

      const analysis: QualityAnalysis = {
        id: analysisId || generateId(),
        productType: productType!,
        lote: lote,
        codigo: codigo,
        talla: formData.talla,
        pesoBruto: formData.pesoBruto,
        pesoCongelado: formData.pesoCongelado,
        pesoNeto: formData.pesoNeto,
        pesosBrutos: productType === 'CONTROL_PESOS' ? pesosBrutos : undefined,
        conteo: formData.conteo,
        uniformidad: formData.uniformidad,
        defectos: formData.defectos,
        fotoCalidad: formData.fotoCalidad,
        observations: formData.observations,
        createdAt: now.toISOString(),
        createdBy: user.email || 'unknown',
        shift: getWorkShift(now),
        date: formatDate(now),
        status: 'COMPLETADO',
        completedAt: now.toISOString()
      };

      // Guardar en Firestore
      const { saveAnalysis } = await import('@/lib/analysisService');
      await saveAnalysis(analysis);

      alert('Análisis guardado exitosamente');
      router.push('/');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Error al guardar el análisis');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4] mx-auto mb-4"></div>
          <p className="text-[#9ca3af]">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847] overflow-x-hidden">
      {/* Header fijo superior */}
      <div className="sticky top-0 z-10 glass-card m-0 rounded-none border-b border-[rgba(6,182,212,0.2)]">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[rgba(6,182,212,0.1)] rounded-lg transition-colors text-[#9ca3af] hover:text-[#06b6d4]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f3f4f6] truncate">
                  {editId ? '✏️ Editar Análisis' : '📋 Nuevo Análisis de Calidad'}
                </h1>
                {formData.codigo && formData.lote && (
                  <p className="text-xs sm:text-sm text-[#9ca3af] truncate">
                    {formData.codigo} - {formData.lote} {formData.talla && `| Talla: ${formData.talla}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {productType && formData.codigo && formData.lote && (
                <AutoSaveIndicatorNew
                  isSaving={autoSaveState.isSaving}
                  lastSaved={autoSaveState.lastSaved}
                  error={autoSaveState.error}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con layout de 2 columnas en pantallas grandes */}
      <div className="max-w-[1920px] mx-auto p-2 xs:p-3 sm:p-4 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">{/* Selector de tipo de producto - Tarjetas horizontales en desktop */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tipo de Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductTypeSelector
                selectedType={productType}
                onSelect={setProductType}
              />
            </CardContent>
          </Card>

          {productType && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 xs:gap-3 lg:gap-6">
              {/* Columna izquierda - Información principal (8 columnas en LG+) */}
              <div className="lg:col-span-8 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Información básica */}
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">📝 Información Básica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 xs:gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="lote">Lote *</Label>
                        <Input
                          id="lote"
                          placeholder="Ej: L-12345"
                          required
                          value={formData.lote || ''}
                          onChange={(e) => handleInputChange('lote', e.target.value)}
                          onBlur={handleFieldBlur}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigo">Código *</Label>
                        <Input
                          id="codigo"
                          placeholder="Ej: C-789"
                          required
                          value={formData.codigo || ''}
                          onChange={(e) => handleInputChange('codigo', e.target.value)}
                          onBlur={handleFieldBlur}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="talla">Talla</Label>
                        <Input
                          id="talla"
                          placeholder="Ej: 16/20"
                          value={formData.talla || ''}
                          onChange={(e) => handleInputChange('talla', e.target.value)}
                          onBlur={handleFieldBlur}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Control de Pesos Brutos (Solo para tipo CONTROL_PESOS) */}
                {productType === 'CONTROL_PESOS' && (
                  <ControlPesosBrutos
                    registros={pesosBrutos}
                    onChange={setPesosBrutos}
                    onPhotoCapture={handlePesoBrutoPhotoCapture}
                    isPhotoUploading={(registroId) => isFieldUploading(`pesoBruto_${registroId}`)}
                  />
                )}

                {/* Pesos (Solo para otros tipos) */}
                {productType !== 'CONTROL_PESOS' && (<div className="space-y-2 p-2 xs:p-3 bg-[rgba(6,182,212,0.05)] border border-[rgba(6,182,212,0.2)] rounded-lg">
                  <h3 className="font-semibold text-base text-[#f3f4f6]">Pesos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 xs:gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pesoBruto">Peso Bruto (kg)</Label>
                      <Input
                        id="pesoBruto"
                        type="number"
                        step="0.01"
                        value={formData.pesoBruto?.valor || ''}
                        onChange={(e) => handleInputChange('pesoBruto', {
                          ...formData.pesoBruto,
                          valor: parseFloat(e.target.value)
                        })}
                        onBlur={handleFieldBlur}
                      />
                      <PhotoCapture
                        label="Peso Bruto"
                        photoUrl={formData.pesoBruto?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoBruto.fotoUrl', file)}
                        isUploading={isFieldUploading('pesoBruto.fotoUrl')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pesoCongelado">Peso Congelado (kg)</Label>
                      <Input
                        id="pesoCongelado"
                        type="number"
                        step="0.01"
                        value={formData.pesoCongelado?.valor || ''}
                        onChange={(e) => handleInputChange('pesoCongelado', {
                          ...formData.pesoCongelado,
                          valor: parseFloat(e.target.value)
                        })}
                        onBlur={handleFieldBlur}
                      />
                      <PhotoCapture
                        label="Peso Congelado"
                        photoUrl={formData.pesoCongelado?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoCongelado.fotoUrl', file)}
                        isUploading={isFieldUploading('pesoCongelado.fotoUrl')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pesoNeto">Peso Neto (kg)</Label>
                      <Input
                        id="pesoNeto"
                        type="number"
                        step="0.01"
                        value={formData.pesoNeto?.valor || ''}
                        onChange={(e) => handleInputChange('pesoNeto', {
                          ...formData.pesoNeto,
                          valor: parseFloat(e.target.value)
                        })}
                        onBlur={handleFieldBlur}
                      />
                      <PhotoCapture
                        label="Peso Neto"
                        photoUrl={formData.pesoNeto?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoNeto.fotoUrl', file)}
                        isUploading={isFieldUploading('pesoNeto.fotoUrl')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conteo">Conteo</Label>
                      <Input
                        id="conteo"
                        type="number"
                        value={formData.conteo || ''}
                        onChange={(e) => handleInputChange('conteo', parseInt(e.target.value))}
                        onBlur={handleFieldBlur}
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* Uniformidad */}
                {productType !== 'CONTROL_PESOS' && (
                  <div className="space-y-2 p-2 xs:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-base">Uniformidad</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 xs:gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="grandes">Grandes</Label>
                        <Input
                          id="grandes"
                          type="number"
                          value={formData.uniformidad?.grandes?.valor || ''}
                          onChange={(e) => handleInputChange('uniformidad', {
                            ...formData.uniformidad,
                            grandes: { ...formData.uniformidad?.grandes, valor: parseFloat(e.target.value) }
                          })}
                          onBlur={handleFieldBlur}
                        />
                        <PhotoCapture
                          label="Grandes"
                          photoUrl={formData.uniformidad?.grandes?.fotoUrl}
                          onPhotoCapture={(file) => handlePhotoCapture('uniformidad.grandes.fotoUrl', file)}
                          isUploading={isFieldUploading('uniformidad.grandes.fotoUrl')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pequenos">Pequeños</Label>
                        <Input
                          id="pequenos"
                          type="number"
                          value={formData.uniformidad?.pequenos?.valor || ''}
                          onChange={(e) => handleInputChange('uniformidad', {
                            ...formData.uniformidad,
                            pequenos: { ...formData.uniformidad?.pequenos, valor: parseFloat(e.target.value) }
                          })}
                          onBlur={handleFieldBlur}
                        />
                        <PhotoCapture
                          label="Pequeños"
                          photoUrl={formData.uniformidad?.pequenos?.fotoUrl}
                          onPhotoCapture={(file) => handlePhotoCapture('uniformidad.pequenos.fotoUrl', file)}
                          isUploading={isFieldUploading('uniformidad.pequenos.fotoUrl')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Defectos */}
                {productType !== 'CONTROL_PESOS' && (
                  <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">🐛 Defectos de Calidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DefectSelector
                        productType={productType}
                        selectedDefects={formData.defectos || {}}
                        onDefectsChange={handleDefectsChange}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Foto de calidad general */}
                {productType !== 'CONTROL_PESOS' && (
                  <div className="space-y-2 p-2 xs:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-base">📸 Foto General</h3>
                    <PhotoCapture
                      label="Calidad General"
                      photoUrl={formData.fotoCalidad}
                      onPhotoCapture={(file) => handlePhotoCapture('fotoCalidad', file)}
                      isUploading={isFieldUploading('fotoCalidad')}
                    />
                  </div>
                )}

              </div>

              {/* Columna derecha - Acciones y Observaciones (4 columnas en LG+) */}
              <div className="lg:col-span-4 space-y-3 sm:space-y-4 lg:space-y-6">

                {/* Panel de Acciones - Sticky */}
                <div className="sticky top-24 z-10">
                  <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                      <CardTitle className="text-lg">Acciones</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <Button type="submit" disabled={isSaving} className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]">
                        {isSaving ? 'Guardando...' : '💾 Guardar Análisis'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
                        Cancelar
                      </Button>
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                        {autoSaveState.lastSaved ? `Guardado: ${autoSaveState.lastSaved.toLocaleTimeString()}` : 'Cambios sin guardar'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Observaciones */}
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">📝 Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="observations"
                      placeholder="Escribe aquí cualquier observación relevante..."
                      value={formData.observations || ''}
                      onChange={(e) => handleInputChange('observations', e.target.value)}
                      onBlur={handleFieldBlur}
                      className="min-h-[150px]"
                    />
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
