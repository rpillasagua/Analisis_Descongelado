'use client';

import { Save, Check, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export default function AutoSaveIndicator({ isSaving, lastSaved, error }: AutoSaveIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-300">{error}</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-500 border-t-transparent"></div>
        <span className="text-sm text-slate-300">Guardando...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-300">Guardado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Save className="w-4 h-4 text-slate-400" />
      <span className="text-sm text-slate-400">Sin guardar</span>
    </div>
  );
}
