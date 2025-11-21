'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export type ViewMode = 'SUELTA' | 'COMPACTA';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

/**
 * Componente para seleccionar el modo de vista
 */
export default function ViewModeSelector({ viewMode, onModeChange }: ViewModeSelectorProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        onClick={() => onModeChange('SUELTA')}
        className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'SUELTA'
            ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        title="Vista Detallada"
      >
        <Maximize2 size={18} />
        <span className="text-xs font-medium hidden sm:inline">Detallada</span>
      </button>
      <button
        onClick={() => onModeChange('COMPACTA')}
        className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'COMPACTA'
            ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        title="Vista Compacta"
      >
        <Minimize2 size={18} />
        <span className="text-xs font-medium hidden sm:inline">Compacta</span>
      </button>
    </div>
  );
}

/**
 * Hook para manejar la persistencia del modo de vista
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('SUELTA');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Cargar modo guardado
    const saved = localStorage.getItem('viewMode');
    if (saved === 'SUELTA' || saved === 'COMPACTA') {
      setViewMode(saved);
    }
    setIsLoaded(true);
  }, []);

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  return { viewMode, setViewMode: updateViewMode, isLoaded };
}
