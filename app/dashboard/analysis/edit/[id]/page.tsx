'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductTypeSelector from '@/components/ProductTypeSelector';
import PhotoCapture from '@/components/PhotoCapture';
import { 
  ProductType, 
  QualityAnalysis, 
  DEFECTOS_ENTERO, 
  DEFECTOS_COLA, 
  DEFECTOS_VALOR_AGREGADO,
  DEFECTO_LABELS,
  PRODUCT_TYPE_LABELS 
} from '@/lib/types';
import { getAnalysisById, updateAnalysis } from '@/lib/analysisService';

export default function EditAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params?.id as string;
  
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [formData, setFormData] = useState<Partial<QualityAnalysis>>({});
  const [photos, setPhotos] = useState<{[key: string]: File}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await getAnalysisById(analysisId);
      if (data) {
        setAnalysis(data);
        setFormData(data);
      } else {
        alert('Análisis no encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando análisis:', error);
      alert('Error al cargar el análisis');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoCapture = (field: string, file: File) => {
    setPhotos(prev => ({ ...prev, [field]: file }));
    // TODO: Upload to Google Drive
    const tempUrl = URL.createObjectURL(file);
    handleInputChange(field, tempUrl);
  };

  const handleDefectoChange = (defecto: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      defectos: {
        ...prev.defectos,
        [defecto]: numValue
      }
    }));
  };

  const getDefectosForProductType = () => {
    if (!analysis) return [];
    switch (analysis.productType) {
      case 'ENTERO': return DEFECTOS_ENTERO;
      case 'COLA': return DEFECTOS_COLA;
      case 'VALOR_AGREGADO': return DEFECTOS_VALOR_AGREGADO;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateAnalysis(analysisId, formData);
      
      // TODO: Upload new photos to Google Drive
      console.log('Photos to upload:', photos);

      alert('Análisis actualizado exitosamente');
      router.back();
    } catch (error) {
      console.error('Error actualizando análisis:', error);
      alert('Error al actualizar el análisis');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  // Determinar qué campos tienen datos (para mostrar solo los completados)
  const hasField = (field: string, value: any): boolean => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'object') {
      return Object.keys(value).length > 0 && Object.values(value).some(v => v !== undefined && v !== null && v !== '');
    }
    return true;
  };

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
    <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>{children}</div>;
  const CardHeader = ({ children }: { children: React.ReactNode }) => 
    <div className="p-4 sm:p-6">{children}</div>;
  const CardTitle = ({ children }: { children: React.ReactNode }) => 
    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{children}</h2>;
  const CardContent = ({ children }: { children: React.ReactNode }) => 
    <div className="p-4 sm:p-6">{children}</div>;
  const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => 
    <label {...props} className="text-xs sm:text-sm font-medium leading-tight text-gray-700 dark:text-gray-300" />;
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => 
    <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white" />;
  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => 
    <textarea {...props} className="flex min-h-20 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white" />;
  
  interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'default' | 'outline';
    disabled?: boolean;
  }
  
  const Button = ({ children, onClick, type = 'button', variant = 'default', disabled = false }: ButtonProps) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all h-9 sm:h-10 px-4 py-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
      default: 'bg-blue-500 text-white hover:bg-blue-600',
      outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    };
    return <button disabled={disabled} type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>{children}</button>;
  };

  return (
    <main className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Análisis - {PRODUCT_TYPE_LABELS[analysis.productType]}</CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <div>Código: <span className="font-semibold">{analysis.codigo}</span></div>
            <div>Lote: <span className="font-semibold">{analysis.lote}</span></div>
            <div>Fecha: <span className="font-semibold">{new Date(analysis.createdAt).toLocaleString('es-EC')}</span></div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            {(hasField('lote', analysis.lote) || hasField('codigo', analysis.codigo) || hasField('talla', analysis.talla)) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input 
                    id="lote" 
                    value={formData.lote || ''} 
                    onChange={(e) => handleInputChange('lote', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input 
                    id="codigo" 
                    value={formData.codigo || ''} 
                    onChange={(e) => handleInputChange('codigo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="talla">Talla</Label>
                  <Input 
                    id="talla" 
                    value={formData.talla || ''} 
                    onChange={(e) => handleInputChange('talla', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Pesos - Solo mostrar los que tienen datos */}
            {(hasField('pesoBruto', analysis.pesoBruto) || hasField('pesoCongelado', analysis.pesoCongelado) || hasField('pesoNeto', analysis.pesoNeto) || hasField('conteo', analysis.conteo)) && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-lg">Pesos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasField('pesoBruto', analysis.pesoBruto) && (
                    <div className="space-y-2">
                      <Label>Peso Bruto (kg)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={formData.pesoBruto?.valor || ''} 
                        onChange={(e) => handleInputChange('pesoBruto', { 
                          ...formData.pesoBruto, 
                          valor: parseFloat(e.target.value) 
                        })}
                      />
                      {formData.pesoBruto?.fotoUrl && (
                        <img src={formData.pesoBruto.fotoUrl} alt="Peso Bruto" className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  )}

                  {hasField('pesoCongelado', analysis.pesoCongelado) && (
                    <div className="space-y-2">
                      <Label>Peso Congelado (kg)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={formData.pesoCongelado?.valor || ''} 
                        onChange={(e) => handleInputChange('pesoCongelado', { 
                          ...formData.pesoCongelado, 
                          valor: parseFloat(e.target.value) 
                        })}
                      />
                      {formData.pesoCongelado?.fotoUrl && (
                        <img src={formData.pesoCongelado.fotoUrl} alt="Peso Congelado" className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  )}

                  {hasField('pesoNeto', analysis.pesoNeto) && (
                    <div className="space-y-2">
                      <Label>Peso Neto (kg)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={formData.pesoNeto?.valor || ''} 
                        onChange={(e) => handleInputChange('pesoNeto', { 
                          ...formData.pesoNeto, 
                          valor: parseFloat(e.target.value) 
                        })}
                      />
                      {formData.pesoNeto?.fotoUrl && (
                        <img src={formData.pesoNeto.fotoUrl} alt="Peso Neto" className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  )}

                  {hasField('conteo', analysis.conteo) && (
                    <div className="space-y-2">
                      <Label>Conteo</Label>
                      <Input 
                        type="number" 
                        value={formData.conteo || ''} 
                        onChange={(e) => handleInputChange('conteo', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Uniformidad - Solo si tiene datos */}
            {hasField('uniformidad', analysis.uniformidad) && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-lg">Uniformidad</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasField('uniformidad.grandes', analysis.uniformidad?.grandes) && (
                    <div className="space-y-2">
                      <Label>Grandes</Label>
                      <Input 
                        type="number" 
                        value={formData.uniformidad?.grandes?.valor || ''} 
                        onChange={(e) => handleInputChange('uniformidad', {
                          ...formData.uniformidad,
                          grandes: { ...formData.uniformidad?.grandes, valor: parseFloat(e.target.value) }
                        })}
                      />
                      {formData.uniformidad?.grandes?.fotoUrl && (
                        <img src={formData.uniformidad.grandes.fotoUrl} alt="Uniformidad Grandes" className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  )}

                  {hasField('uniformidad.pequenos', analysis.uniformidad?.pequenos) && (
                    <div className="space-y-2">
                      <Label>Pequeños</Label>
                      <Input 
                        type="number" 
                        value={formData.uniformidad?.pequenos?.valor || ''} 
                        onChange={(e) => handleInputChange('uniformidad', {
                          ...formData.uniformidad,
                          pequenos: { ...formData.uniformidad?.pequenos, valor: parseFloat(e.target.value) }
                        })}
                      />
                      {formData.uniformidad?.pequenos?.fotoUrl && (
                        <img src={formData.uniformidad.pequenos.fotoUrl} alt="Uniformidad Pequeños" className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Defectos - Solo mostrar los que tienen valores > 0 */}
            {hasField('defectos', analysis.defectos) && (
              <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-semibold text-lg">Defectos de Calidad</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getDefectosForProductType()
                    .filter(defecto => (analysis.defectos?.[defecto] ?? 0) > 0 || (formData.defectos?.[defecto] ?? 0) > 0)
                    .map((defecto) => (
                      <div key={defecto} className="space-y-1">
                        <Label>{DEFECTO_LABELS[defecto]}</Label>
                        <Input 
                          type="number" 
                          min="0"
                          value={formData.defectos?.[defecto] || ''} 
                          onChange={(e) => handleDefectoChange(defecto, e.target.value)}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Foto de calidad */}
            {hasField('fotoCalidad', analysis.fotoCalidad) && (
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-lg">Foto de Calidad</h3>
                {formData.fotoCalidad && (
                  <img src={formData.fotoCalidad} alt="Calidad" className="w-48 h-48 object-cover rounded" />
                )}
              </div>
            )}

            {/* Observaciones */}
            {hasField('observations', analysis.observations) && (
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea 
                  value={formData.observations || ''} 
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
