'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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

// Helper para crear un análisis vacío
const createEmptyAnalysis = (numero: number): Analysis => ({
    numero,
    pesosBrutos: [],
    defectos: {}
});

// Componentes UI Modernizados (Clean & Professional)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
    <div className={`card overflow-hidden ${className}`}>{children}</div>;

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
    <div className={`px-6 py-4 border-b border-slate-800 bg-slate-900/50 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
    <h2 className={`text-lg font-semibold text-slate-100 flex items-center gap-2 ${className}`}>{children}</h2>;

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
    <p className={`text-sm text-slate-400 mt-0.5 ${className}`}>{children}</p>;

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) =>
    <div className={`p-6 ${className}`}>{children}</div>;

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false }: ButtonProps) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        default: 'btn-primary shadow-sm',
        outline: 'btn-secondary',
        ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
    };
    return <button disabled={disabled} type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    <input {...props} className="modern-input w-full px-3 py-2 text-sm" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    <label {...props} className="text-sm font-medium text-slate-300 mb-1.5 block" />;

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
    <textarea {...props} className="modern-input w-full px-3 py-2 text-sm min-h-[100px]" />;

export default function NewMultiAnalysisPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

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
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load existing analysis if id parameter is present
    useEffect(() => {
        const loadExistingAnalysis = async () => {
            const idParam = searchParams.get('id');

            if (idParam) {
                setIsLoading(true);
                try {
                    const { getAnalysisById } = await import('@/lib/analysisService');
                    const existingAnalysis = await getAnalysisById(idParam);

                    if (existingAnalysis) {
                        // Populate all fields with existing data
                        setAnalysisId(existingAnalysis.id);
                        setProductType(existingAnalysis.productType);
                        setLote(existingAnalysis.lote);
                        setCodigo(existingAnalysis.codigo);
                        setTalla(existingAnalysis.talla || '');
                        setAnalystColor(existingAnalysis.analystColor);

                        // Load analyses array if it exists, otherwise create empty one
                        if (existingAnalysis.analyses && existingAnalysis.analyses.length > 0) {
                            setAnalyses(existingAnalysis.analyses);
                        }

                        // Mark basics as completed since we loaded existing data
                        setBasicsCompleted(true);

                        console.log('✅ Loaded existing analysis:', existingAnalysis.id);
                    } else {
                        console.warn('⚠️ Analysis not found:', idParam);
                    }
                } catch (error) {
                    console.error('❌ Error loading analysis:', error);
                    setSaveError('Error al cargar el análisis');
                } finally {
                    setIsLoading(false);
                }
            } else {
                // New analysis - generate ID
                if (!analysisId) {
                    setAnalysisId(generateId());
                }
            }
        };

        loadExistingAnalysis();
    }, [searchParams]);

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
            setLastSaved(now);
            setSaveError(null);
            console.log('✅ Document saved');
        } catch (error) {
            console.error('Error saving:', error);
            setSaveError('Error al guardar');
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
        setUploadingPhotos(prev => new Set(prev).add(key));

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
                const currentFieldValue = currentAnalysis[field as keyof Analysis] as any;
                updateCurrentAnalysis({
                    [field]: {
                        ...(currentFieldValue || {}),
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
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin"></div>
                    <div className="text-slate-400 font-medium">Cargando análisis...</div>
                </div>
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
                        onSelect={(type) => setProductType(type)}
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
    const colorHex = analystColor ? ANALYST_COLOR_HEX[analystColor] : '#0ea5e9';

    return (
        <div className="min-h-screen p-4 pb-20">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Minimalist Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span className="text-sm font-medium">Volver</span>
                            </button>
                            <div className="h-5 w-px bg-slate-800"></div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-slate-100">
                                    Análisis de Calidad
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                                    {productType}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <AutoSaveIndicatorNew
                                isSaving={isSaving}
                                lastSaved={lastSaved}
                                error={saveError}
                            />
                            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                                <div
                                    className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
                                    style={{ backgroundColor: colorHex }}
                                    title={`Color del analista: ${analystColor}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Compact Info Bar */}
                    <div className="flex items-center gap-6 text-sm px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Lote</span>
                            <span className="text-slate-200 font-mono">{lote}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Código</span>
                            <span className="text-slate-200 font-mono">{codigo}</span>
                        </div>
                        {talla && (
                            <>
                                <div className="w-px h-3 bg-slate-800"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Talla</span>
                                    <span className="text-slate-200 font-mono">{talla}</span>
                                </div>
                            </>
                        )}
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Peso Bruto */}
                                    <div className="space-y-3">
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
                                    <div className="space-y-3">
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
                                    <div className="space-y-3">
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
                                </div>

                                {/* Conteo */}
                                <div className="pt-4 border-t border-slate-800">
                                    <div className="max-w-xs">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Grandes */}
                                    <div className="space-y-3">
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
                                    <div className="space-y-3">
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
                                placeholder="Escribe cualquier observación adicional aquí..."
                                value={currentAnalysis.observations || ''}
                                onChange={(e) => updateCurrentAnalysis({ observations: e.target.value })}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
