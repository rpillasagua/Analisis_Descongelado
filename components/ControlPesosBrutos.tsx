'use client';

import { useState } from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
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

  const agregarRegistro = () => {
    const nuevoRegistro: PesoBrutoRegistro = {
      id: `pb-${Date.now()}`,
      peso: 0,
      timestamp: new Date().toISOString()
    };
    onChange([...registros, nuevoRegistro]);
  };

  const eliminarRegistro = (id: string) => {
    onChange(registros.filter(r => r.id !== id));
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
        <button
          type="button"
          onClick={agregarRegistro}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-semibold hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agregar Peso
        </button>
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
                <button
                  type="button"
                  onClick={() => eliminarRegistro(registro.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
