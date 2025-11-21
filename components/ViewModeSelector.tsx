'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export type ViewMode = 'SUELTA' | 'COMPACTA';

interface ViewModeSelectorProps {
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
