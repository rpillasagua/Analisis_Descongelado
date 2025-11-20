'use client';

import { useState } from 'react';
import { Plus, Trash2, Camera, Edit2, Check } from 'lucide-react';
import PhotoCapture from './PhotoCapture';
import { PesoBrutoRegistro } from '@/lib/types';

interface ControlPesosBrutosProps {
  registros: PesoBrutoRegistro[];
  onChange: (registros: PesoBrutoRegistro[]) => void;
  onPhotoCapture: (registroId: string, file: File) => void;
  isPhotoUploading?: (registroId: string) => boolean;
  viewMode?: 'SUELTA' | 'COMPACTA';
}

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all placeholder:text-gray-400" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
  <label {...props} className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300" />;

export default function ControlPesosBrutos({
  registros,
  onChange,
  onPhotoCapture,
  isPhotoUploading = () => false,
  viewMode = 'COMPACTA'
}: ControlPesosBrutosProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const agregarRegistro = () => {
    const nuevoRegistro: PesoBrutoRegistro = {
      id: `pb-${Date.now()}`,
      peso: 0,
      timestamp: new Date().toISOString()
    };
    onChange([...registros, nuevoRegistro]);
  };

  const eliminarRegistro = async (id: string) => {
    const registro = registros.find(r => r.id === id);

    // Si el registro tiene foto, intentar eliminarla de Google Drive
    if (registro?.fotoUrl && !registro.fotoUrl.startsWith('blob:')) {
      try {
        const { googleDriveService } = await import('@/lib/googleDriveService');

        // Extraer el ID del archivo desde la URL
        const fileId = extractFileIdFromUrl(registro.fotoUrl);

        if (fileId) {
          await googleDriveService.deleteFile(fileId);
          console.log('✅ Foto de peso bruto eliminada de Google Drive');
        }
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la foto de Google Drive:', error);
        // Continuar con la eliminación del registro aunque falle la eliminación de la foto
      }
    }

    // Eliminar el registro del array
    onChange(registros.filter(r => r.id !== id));
  };

  // Helper para extraer ID de archivo de URL de Google Drive
  const extractFileIdFromUrl = (url: string): string | null => {
    if (!url) return null;

    // Formato: https://drive.google.com/uc?export=view&id=FILE_ID
    // o https://drive.google.com/thumbnail?id=FILE_ID&sz=w800
    const match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];

    // Formato: https://drive.google.com/file/d/FILE_ID/view
    const match2 = url.match(/\/file\/d\/([^/]+)/);
    if (match2) return match2[1];

    return null;
  };

  const actualizarRegistro = (id: string, campo: keyof PesoBrutoRegistro, valor: any) => {
    onChange(registros.map(r =>
      r.id === id ? { ...r, [campo]: valor } : r
    ));
  };

  const isCompact = viewMode === 'COMPACTA';

  return (
    <div className={`${isCompact ? 'space-y-3' : 'space-y-4'} ${isCompact ? 'p-3' : 'p-6'} glass-panel rounded-2xl`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-bold ${isCompact ? 'text-base' : 'text-xl'} text-white tracking-tight`}>
          Control de Pesos Brutos
        </h3>
        <div className="flex items-center gap-2">
          {registros.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isEditMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              title={isEditMode ? 'Finalizar edición' : 'Editar registros'}
            >
              {isEditMode ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Finalizar</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={agregarRegistro}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Agregar Peso
          </button>
        </div>
      </div>

      {registros.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-300">No hay registros de peso bruto</p>
          <p className="text-xs mt-1 text-gray-500">Haz clic en "Agregar Peso" para comenzar</p>
        </div>
      ) : (
        <div className={`${isCompact ? 'space-y-3' : 'space-y-4'}`}>
          {registros.map((registro, index) => (
            <div
              key={registro.id}
              className={`${isCompact ? 'p-3' : 'p-5'} glass-card rounded-xl border border-white/5`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                  Registro #{index + 1}
                </span>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => eliminarRegistro(registro.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className={isCompact ? 'space-y-3' : 'space-y-4'}>
                {/* Peso Bruto */}
                <div className="space-y-2">
                  <Label htmlFor={`peso-${registro.id}`} className="text-gray-300">Peso Bruto (kg) *</Label>
                  <div className="relative">
                    <Input
                      id={`peso-${registro.id}`}
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={registro.peso || ''}
                      onChange={(e) => actualizarRegistro(registro.id, 'peso', parseFloat(e.target.value) || 0)}
                      className="modern-input w-full pl-4 pr-12 py-3 rounded-xl font-mono text-lg"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">kg</span>
                  </div>
                </div>

                {/* Foto */}
                <div>
                  <PhotoCapture
                    label={`Peso Bruto #${index + 1}`}
                    photoUrl={registro.fotoUrl}
                    onPhotoCapture={(file) => onPhotoCapture(registro.id, file)}
                    isUploading={isPhotoUploading(registro.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {registros.length > 0 && (
        <div className="pt-4 border-t border-white/10 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Total de registros:
            </span>
            <span className="font-bold text-white">
              {registros.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-400">
              Peso total:
            </span>
            <span className="font-bold text-blue-400 text-lg">
              {registros.reduce((sum, r) => sum + (r.peso || 0), 0).toFixed(2)} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
