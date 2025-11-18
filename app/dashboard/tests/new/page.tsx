'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductTypeSelector from '@/components/ProductTypeSelector';
import PhotoCapture from '@/components/PhotoCapture';
import { 
  ProductType, 
  QualityAnalysis, 
  DEFECTOS_ENTERO, 
  DEFECTOS_COLA, 
  DEFECTOS_VALOR_AGREGADO,
  DEFECTO_LABELS 
} from '@/lib/types';
import { getWorkShift, formatDate, generateId } from '@/lib/utils';

// Componentes UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>{children}</p>;
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
    default: 'bg-blue-500 text-white hover:bg-blue-600 border-0',
    outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  };
  return <button disabled={disabled} type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => 
  <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all placeholder:text-gray-400" />;
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => 
  <label {...props} className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300" />;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => 
  <textarea {...props} className="flex min-h-20 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all placeholder:text-gray-400" />;

export default function NewAnalysisPage() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>();
  const [formData, setFormData] = useState<Partial<QualityAnalysis>>({});
  const [photos, setPhotos] = useState<{[key: string]: File}>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoCapture = (field: string, file: File) => {
    setPhotos(prev => ({ ...prev, [field]: file }));
    // TODO: Upload to Google Drive and get URL
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
    if (!productType) return [];
    switch (productType) {
      case 'ENTERO': return DEFECTOS_ENTERO;
      case 'COLA': return DEFECTOS_COLA;
      case 'VALOR_AGREGADO': return DEFECTOS_VALOR_AGREGADO;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const now = new Date();
      const analysis: QualityAnalysis = {
        id: generateId(),
        productType: productType!,
        lote: formData.lote || '',
        codigo: formData.codigo || '',
        talla: formData.talla,
        pesoBruto: formData.pesoBruto,
        pesoCongelado: formData.pesoCongelado,
        pesoNeto: formData.pesoNeto,
        conteo: formData.conteo,
        uniformidad: formData.uniformidad,
        defectos: formData.defectos,
        fotoCalidad: formData.fotoCalidad,
        observations: formData.observations,
        createdAt: now.toISOString(),
        createdBy: 'current-user', // TODO: Get from auth
        shift: getWorkShift(now),
        date: formatDate(now)
      };

      // TODO: Save to Firestore and upload photos to Google Drive
      console.log('Saving analysis:', analysis);
      console.log('Photos to upload:', photos);

      alert('Análisis guardado exitosamente');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Error al guardar el análisis');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Análisis de Calidad</CardTitle>
          <CardDescription>
            Complete la información del producto a analizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de tipo de producto */}
            <ProductTypeSelector 
              selectedType={productType} 
              onSelect={setProductType} 
            />

            {productType && (
              <>
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="lote">Lote *</Label>
                    <Input 
                      id="lote" 
                      placeholder="Ej: L-12345" 
                      required 
                      value={formData.lote || ''}
                      onChange={(e) => handleInputChange('lote', e.target.value)}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="talla">Talla</Label>
                    <Input 
                      id="talla" 
                      placeholder="Ej: 16/20" 
                      value={formData.talla || ''}
                      onChange={(e) => handleInputChange('talla', e.target.value)}
                    />
                  </div>
                </div>

                {/* Pesos */}
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-lg">Pesos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                      <PhotoCapture 
                        label="Peso Bruto"
                        photoUrl={formData.pesoBruto?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoBruto.fotoUrl', file)}
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
                      />
                      <PhotoCapture 
                        label="Peso Congelado"
                        photoUrl={formData.pesoCongelado?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoCongelado.fotoUrl', file)}
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
                      />
                      <PhotoCapture 
                        label="Peso Neto"
                        photoUrl={formData.pesoNeto?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('pesoNeto.fotoUrl', file)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conteo">Conteo</Label>
                      <Input 
                        id="conteo" 
                        type="number" 
                        value={formData.conteo || ''}
                        onChange={(e) => handleInputChange('conteo', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Uniformidad */}
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-lg">Uniformidad</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                      <PhotoCapture 
                        label="Grandes"
                        photoUrl={formData.uniformidad?.grandes?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('uniformidad.grandes.fotoUrl', file)}
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
                      />
                      <PhotoCapture 
                        label="Pequeños"
                        photoUrl={formData.uniformidad?.pequenos?.fotoUrl}
                        onPhotoCapture={(file) => handlePhotoCapture('uniformidad.pequenos.fotoUrl', file)}
                      />
                    </div>
                  </div>
                </div>

                {/* Defectos */}
                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-semibold text-lg">Defectos de Calidad</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getDefectosForProductType().map((defecto) => (
                      <div key={defecto} className="space-y-1">
                        <Label htmlFor={defecto}>{DEFECTO_LABELS[defecto]}</Label>
                        <Input 
                          id={defecto}
                          type="number" 
                          min="0"
                          value={formData.defectos?.[defecto] || ''}
                          onChange={(e) => handleDefectoChange(defecto, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foto de calidad general */}
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-semibold text-lg">Foto de Calidad General</h3>
                  <PhotoCapture 
                    label="Calidad"
                    photoUrl={formData.fotoCalidad}
                    onPhotoCapture={(file) => handlePhotoCapture('fotoCalidad', file)}
                  />
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea 
                    id="observations" 
                    placeholder="Observaciones adicionales..."
                    value={formData.observations || ''}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Análisis'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
