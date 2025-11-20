'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductTypeSelector from '@/components/ProductTypeSelector';
import InitialForm from '@/components/InitialForm';
import AnalysisTabs from '@/components/AnalysisTabs';
import PhotoCapture from '@/components/PhotoCapture';
import ControlPesosBrutos from '@/components/ControlPesosBrutos';
import DefectSelector from '@/components/DefectSelector';
import AutoSaveIndicatorNew from '@/components/AutoSaveIndicatorNew';
import {
    ProductType,
    QualityAnalysis,
    AnalystColor,
    Analysis,
    PesoBrutoRegistro,
    ANALYST_COLOR_HEX
} from '@/lib/types';
import { getWorkShift, formatDate, generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Helper para crear un análisis vacío
const createEmptyAnalysis = (numero: number): Analysis => ({
    numero,
    pesosBrutos: [],
    defectos: {}
});

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

export default function NewMultiAnalysisPage() {
    const router = useRouter();

    // Basic document info
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [productType, setProductType] = useState<ProductType>();

    // Multi-analysis state
    const [basicsCompleted, setBasicsCompleted] = useState(false);
    const [lote, setLote] = useState('');
    const [codigo, setCodigo] = useState('');
    const [talla, setTalla] = useState('');
    const [analystColor, setAnalystColor] = useState<AnalystColor | null>(null);

    // Analyses array and active tab
    const [analyses, setAnalyses] = useState<Analysis[]>([createEmptyAnalysis(1)]);
    const [activeAnalysisIndex, setActiveAnalysisIndex] = useState(0);

    // Photo management
    const [photos, setPhotos] = useState<{ [key: string]: File }>({});
    const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(new Set());

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Generate ID on mount
    useEffect(() => {
        if (!analysisId) {
            setAnalysisId(generateId());
        }
    }, []);

    // Handle initial form completion
    const handleInitialFormComplete = async (data: {
        lote: string;
        codigo: string;
        talla: string;
        color: AnalystColor;
    }) => {
        setLote(data.lote);
        setCodigo(data.codigo);
        setTalla(data.talla);
        setAnalystColor(data.color);
        setBasicsCompleted(true);

        // Auto-save basic info to Firestore
        await saveDocument();
    };

    // Add new analysis tab
    const handleAddAnalysis = () => {
        const newAnalysis = createEmptyAnalysis(analyses.length + 1);
        setAnalyses([...analyses, newAnalysis]);
        setActiveAnalysisIndex(analyses.length); // Switch to new tab
    };

    // Get current active analysis
    const currentAnalysis = analyses[activeAnalysisIndex];

    // Update current analysis
    const updateCurrentAnalysis = (updates: Partial<Analysis>) => {
        setAnalyses(prev => prev.map((analysis, index) =>
            index === activeAnalysisIndex
                ? { ...analysis, ...updates }
                : analysis
        ));
    };

    // Auto-save document
    const saveDocument = async () => {
        if (!analysisId || !productType || !analystColor) return;

        try {
            setIsSaving(true);
            const { saveAnalysis } = await import('@/lib/analysisService');
            const { googleAuthService } = await import('@/lib/googleAuthService');
            const user = googleAuthService.getUser();
            const now = new Date();

            const document: QualityAnalysis = {
                id: analysisId,
                productType,
                lote,
                codigo,
                talla: talla || undefined,
                analystColor,
                analyses,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                createdBy: user?.email || 'unknown',
                shift: getWorkShift(now),
                date: formatDate(now),
                status: 'EN_PROGRESO'
            };

            await saveAnalysis(document);
            console.log('✅ Document saved');
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save when analyses change
    useEffect(() => {
        if (basicsCompleted && analysisId) {
            const timer = setTimeout(() => {
                saveDocument();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [analyses, basicsCompleted]);

    // Photo upload handlers
    const handlePhotoCapture = async (field: string, file: File) => {
        const key = `${activeAnalysisIndex}-${field}`;
        setPhotos(prev => ({ ...prev, [key]: file }));
        setUploadingPhotos(prev = new Set(prev).add(key));

        try {
            const { googleDriveService } = await import('@/lib/googleDriveService');
            await googleDriveService.initialize();

            const url = await googleDriveService.uploadAnalysisPhoto(
                file,
                codigo,
                lote,
                `${field}_analysis${activeAnalysisIndex + 1}`
            );

            // Update analysis with photo URL
            if (field === 'fotoCalidad') {
                updateCurrentAnalysis({ fotoCalidad: url });
            } else if (field.startsWith('uniformidad_')) {
                const tipo = field.split('_')[1] as 'grandes' | 'pequenos';
                updateCurrentAnalysis({
                    uniformidad: {
                        ...currentAnalysis.uniformidad,
                        [tipo]: {
                            ...currentAnalysis.uniformidad?.[tipo],
                            fotoUrl: url
                        }
                    }
                });
            } else {
                // pesoBruto, pesoCongelado, pesoNeto
                updateCurrentAnalysis({
                    [field]: {
                        ...currentAnalysis[field as keyof Analysis],
                        fotoUrl: url
                    } as any
                });
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error al subir la foto');
        } finally {
            setUploadingPhotos(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const isFieldUploading = (field: string) => {
        const key = `${activeAnalysisIndex}-${field}`;
        return uploadingPhotos.has(key);
    };

    // Handler for pesos brutos
    const handlePesosBrutosChange = (registros: PesoBrutoRegistro[]) => {
        updateCurrentAnalysis({ pesosBrutos: registros });
    };

    const handlePesoBrutoPhotoCapture = async (registroId: string, file: File) => {
        const key = `${activeAnalysisIndex}-pesobruto-${registroId}`;
        setUploadingPhotos(prev => new Set(prev).add(key));

        try {
            const { googleDriveService } = await import('@/lib/googleDriveService');
            await googleDriveService.initialize();

            const url = await googleDriveService.uploadAnalysisPhoto(
                file,
                codigo,
                lote,
                `peso_bruto_${registroId}_analysis${activeAnalysisIndex + 1}`
            );

            // Update the specific registro
            updateCurrentAnalysis({
                pesosBrutos: currentAnalysis.pesosBrutos?.map(r =>
                    r.id === registroId ? { ...r, fotoUrl: url } : r
                )
            });
        } catch (error) {
            console.error('Error uploading peso bruto photo:', error);
            alert('Error al subir la foto');
        } finally {
            setUploadingPhotos(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const isPesoBrutoUploading = (registroId: string) => {
        const key = `${activeAnalysisIndex}-pesobruto-${registroId}`;
        return uploadingPhotos.has(key);
    };

    // Handler for defects
    const handleDefectsChange = (defects: { [key: string]: number }) => {
        updateCurrentAnalysis({ defectos: defects });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Cargando...</div>
            </div>
        );
    }

    // Step 1: Product Type Selection
    if (!productType) {
        return (
            <div className="min-h-screen p-4">
                <div className="max-w-4xl mx-auto">
                    <ProductTypeSelector
                        selectedType={productType}
                        onTypeSelect={(type) => setProductType(type)}
                    />
                </div>
            </div>
        );
    }

    // Step 2: Initial Form (Lote, Código, Talla, Color)
    if (!basicsCompleted) {
        return (
            <div className="min-h-screen p-4">
                <InitialForm onComplete={handleInitialFormComplete} />
            </div>
        );
    }

    // Step 3: Multi-Analysis Form with Tabs
    const colorHex = analystColor ? ANALYST_COLOR_HEX[analystColor] : '#06b6d4';

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with color indicator */}
                <div className="glass-card rounded-2xl p-6" style={{ borderLeft: `4px solid ${colorHex}` }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                📋 Análisis de Calidad - {productType}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-300">
                                <span>🏷️ Lote: <strong>{lote}</strong></span>
                                <span>📦 Código: <strong>{codigo}</strong></span>
                                {talla && <span>📏 Talla: <strong>{talla}</strong></span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <AutoSaveIndicatorNew isSaving={isSaving} />
                            <div
                                className="w-12 h-12 rounded-full border-4 border-white"
                                style={{ backgroundColor: colorHex }}
                                title={`Color del analista: ${analystColor}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis Tabs */}
                <AnalysisTabs
                    analysesCount={analyses.length}
                    activeTab={activeAnalysisIndex}
                    onTabChange={setActiveAnalysisIndex}
                    onAddAnalysis={handleAddAnalysis}
                    analystColor={analystColor!}
                />

                {/* Current Analysis Form */}
                <div className="space-y-6">
                    {/* Pesos Section */}
                    {productType !== 'CONTROL_PESOS' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>⚖️ Pesos</CardTitle>
                                <CardDescription>Registra los pesos con fotos</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Peso Bruto */}
                                <div className="space-y-2">
                                    <Label htmlFor="peso-bruto">Peso Bruto (kg)</Label>
                                    <Input
                                        id="peso-bruto"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentAnalysis.pesoBruto?.valor || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            pesoBruto: {
                                                ...currentAnalysis.pesoBruto,
                                                valor: parseFloat(e.target.value) || undefined
                                            }
                                        })}
                                    />
                                    <PhotoCapture
                                        label="Foto Peso Bruto"
                                        photoUrl={currentAnalysis.pesoBruto?.fotoUrl}
                                        onPhotoCapture={(file) => handlePhotoCapture('pesoBruto', file)}
                                        isUploading={isFieldUploading('pesoBruto')}
                                    />
                                </div>

                                {/* Peso Congelado */}
                                <div className="space-y-2">
                                    <Label htmlFor="peso-congelado">Peso Congelado (kg)</Label>
                                    <Input
                                        id="peso-congelado"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentAnalysis.pesoCongelado?.valor || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            pesoCongelado: {
                                                ...currentAnalysis.pesoCongelado,
                                                valor: parseFloat(e.target.value) || undefined
                                            }
                                        })}
                                    />
                                    <PhotoCapture
                                        label="Foto Peso Congelado"
                                        photoUrl={currentAnalysis.pesoCongelado?.fotoUrl}
                                        onPhotoCapture={(file) => handlePhotoCapture('pesoCongelado', file)}
                                        isUploading={isFieldUploading('pesoCongelado')}
                                    />
                                </div>

                                {/* Peso Neto */}
                                <div className="space-y-2">
                                    <Label htmlFor="peso-neto">Peso Neto (kg)</Label>
                                    <Input
                                        id="peso-neto"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentAnalysis.pesoNeto?.valor || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            pesoNeto: {
                                                ...currentAnalysis.pesoNeto,
                                                valor: parseFloat(e.target.value) || undefined
                                            }
                                        })}
                                    />
                                    <PhotoCapture
                                        label="Foto Peso Neto"
                                        photoUrl={currentAnalysis.pesoNeto?.fotoUrl}
                                        onPhotoCapture={(file) => handlePhotoCapture('pesoNeto', file)}
                                        isUploading={isFieldUploading('pesoNeto')}
                                    />
                                </div>

                                {/* Conteo */}
                                <div className="space-y-2">
                                    <Label htmlFor="conteo">Conteo</Label>
                                    <Input
                                        id="conteo"
                                        type="number"
                                        placeholder="0"
                                        value={currentAnalysis.conteo || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            conteo: parseInt(e.target.value) || undefined
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Control de Pesos Brutos */}
                    {productType === 'CONTROL_PESOS' && (
                        <ControlPesosBrutos
                            registros={currentAnalysis.pesosBrutos || []}
                            onChange={handlePesosBrutosChange}
                            onPhotoCapture={handlePesoBrutoPhotoCapture}
                            isPhotoUploading={isPesoBrutoUploading}
                        />
                    )}

                    {/* Uniformidad (Solo Entero y Cola) */}
                    {(productType === 'ENTERO' || productType === 'COLA') && (
                        <Card>
                            <CardHeader>
                                <CardTitle>📏 Uniformidad</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Grandes */}
                                <div className="space-y-2">
                                    <Label>Grandes (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentAnalysis.uniformidad?.grandes?.valor || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            uniformidad: {
                                                ...currentAnalysis.uniformidad,
                                                grandes: {
                                                    ...currentAnalysis.uniformidad?.grandes,
                                                    valor: parseFloat(e.target.value) || undefined
                                                }
                                            }
                                        })}
                                    />
                                    <PhotoCapture
                                        label="Foto Grandes"
                                        photoUrl={currentAnalysis.uniformidad?.grandes?.fotoUrl}
                                        onPhotoCapture={(file) => handlePhotoCapture('uniformidad_grandes', file)}
                                        isUploading={isFieldUploading('uniformidad_grandes')}
                                    />
                                </div>

                                {/* Pequeños */}
                                <div className="space-y-2">
                                    <Label>Pequeños (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentAnalysis.uniformidad?.pequenos?.valor || ''}
                                        onChange={(e) => updateCurrentAnalysis({
                                            uniformidad: {
                                                ...currentAnalysis.uniformidad,
                                                pequenos: {
                                                    ...currentAnalysis.uniformidad?.pequenos,
                                                    valor: parseFloat(e.target.value) || undefined
                                                }
                                            }
                                        })}
                                    />
                                    <PhotoCapture
                                        label="Foto Pequeños"
                                        photoUrl={currentAnalysis.uniformidad?.pequenos?.fotoUrl}
                                        onPhotoCapture={(file) => handlePhotoCapture('uniformidad_pequenos', file)}
                                        isUploading={isFieldUploading('uniformidad_pequenos')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Defectos de Calidad */}
                    {productType !== 'CONTROL_PESOS' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>🐛 Defectos de Calidad</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DefectSelector
                                    productType={productType}
                                    selectedDefects={currentAnalysis.defectos || {}}
                                    onDefectsChange={handleDefectsChange}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Foto de Calidad General */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📸 Foto de Calidad General</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PhotoCapture
                                label="Foto General"
                                photoUrl={currentAnalysis.fotoCalidad}
                                onPhotoCapture={(file) => handlePhotoCapture('fotoCalidad', file)}
                                isUploading={isFieldUploading('fotoCalidad')}
                            />
                        </CardContent>
                    </Card>

                    {/* Observaciones */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📝 Observaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Observaciones adicionales..."
                                value={currentAnalysis.observations || ''}
                                onChange={(e) => updateCurrentAnalysis({ observations: e.target.value })}
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="flex-1"
                        >
                            ← Volver al Dashboard
                        </Button>
                        <Button
                            onClick={() => {
                                saveDocument();
                                alert('Análisis guardado exitosamente');
                            }}
                            className="flex-1"
                        >
                            💾 Guardar Análisis
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
