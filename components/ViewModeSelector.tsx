'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export type ViewMode = 'SUELTA' | 'COMPACTA';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
      <button
        type="button"
        onClick={() => onChange('SUELTA')}
        className={`flex items-center gap-2 px-4 py-2 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
          value === 'SUELTA'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <Maximize2 className="w-5 h-5 sm:w-4 sm:h-4" />
        <span>Suelta</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('COMPACTA')}
        className={`flex items-center gap-2 px-4 py-2 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
          value === 'COMPACTA'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <Minimize2 className="w-5 h-5 sm:w-4 sm:h-4" />
        <span>Compacta</span>
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
