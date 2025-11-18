'use client';

import { useState } from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import PhotoCapture from './PhotoCapture';
import { PesoBrutoRegistro } from '@/lib/types';

interface ControlPesosBrutosProps {
  registros: PesoBrutoRegistro[];
  onChange: (registros: PesoBrutoRegistro[]) => void;
  onPhotoCapture: (registroId: string, file: File) => void;
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
  viewMode = 'SUELTA'
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
    <div className={`${isCompact ? 'space-y-3' : 'space-y-4'} ${isCompact ? 'p-3' : 'p-4'} bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isCompact ? 'text-base' : 'text-lg'} text-blue-900 dark:text-blue-100`}>
          Control de Pesos Brutos
        </h3>
        <button
          type="button"
          onClick={agregarRegistro}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar Peso
        </button>
      </div>

      {registros.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay registros de peso bruto</p>
          <p className="text-xs mt-1">Haz clic en "Agregar Peso" para comenzar</p>
        </div>
      ) : (
        <div className={`${isCompact ? 'space-y-3' : 'space-y-4'}`}>
          {registros.map((registro, index) => (
            <div 
              key={registro.id} 
              className={`${isCompact ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Registro #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarRegistro(registro.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
                {/* Peso Bruto */}
                <div className={isCompact ? 'space-y-1' : 'space-y-2'}>
                  <Label htmlFor={`peso-${registro.id}`}>Peso Bruto (kg) *</Label>
                  <Input
                    id={`peso-${registro.id}`}
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={registro.peso || ''}
                    onChange={(e) => actualizarRegistro(registro.id, 'peso', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Foto */}
                <div>
                  <PhotoCapture
                    label={`Peso Bruto #${index + 1}`}
                    photoUrl={registro.fotoUrl}
                    onPhotoCapture={(file) => onPhotoCapture(registro.id, file)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {registros.length > 0 && (
        <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total de registros:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {registros.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">
              Peso total:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {registros.reduce((sum, r) => sum + (r.peso || 0), 0).toFixed(2)} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
