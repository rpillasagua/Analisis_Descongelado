'use client';

import { ProductType, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';

interface ProductTypeSelectorProps {
  selectedType?: ProductType;
  onSelect: (type: ProductType) => void;
}

export default function ProductTypeSelector({ selectedType, onSelect }: ProductTypeSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const productTypes: ProductType[] = ['ENTERO', 'COLA', 'VALOR_AGREGADO', 'CONTROL_PESOS'];

  // Si ya hay un tipo seleccionado y no estamos editando, mostrar solo el seleccionado
  if (selectedType && !isEditing) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tipo de producto seleccionado
        </label>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {selectedType === 'ENTERO' && '🦐'}
                {selectedType === 'COLA' && '🍤'}
                {selectedType === 'VALOR_AGREGADO' && '📦'}
                {selectedType === 'CONTROL_PESOS' && '⚖️'}
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-200">
                  {PRODUCT_TYPE_LABELS[selectedType]}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  Los campos del formulario se ajustan a este tipo de producto
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Cambiar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar selector completo si no hay selección o si está editando
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {selectedType ? 'Selecciona un nuevo tipo de producto *' : '¿Qué tipo de producto vas a descongelar? *'}
      </label>
      {selectedType && isEditing && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Al cambiar el tipo de producto, los defectos registrados se perderán si no son compatibles.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {productTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              onSelect(type);
              setIsEditing(false);
            }}
            className={`
              relative p-4 sm:p-6 rounded-lg border-2 transition-all duration-200
              ${selectedType === type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`
                text-3xl sm:text-4xl mb-2 sm:mb-3
                ${selectedType === type ? 'scale-110' : 'scale-100'}
                transition-transform duration-200
              `}>
                {type === 'ENTERO' && '🦐'}
                {type === 'COLA' && '🍤'}
                {type === 'VALOR_AGREGADO' && '📦'}
                {type === 'CONTROL_PESOS' && '⚖️'}
              </div>
              <span className={`
                text-base sm:text-lg font-semibold leading-tight
                ${selectedType === type
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}>
                {PRODUCT_TYPE_LABELS[type]}
              </span>
            </div>
            {selectedType === type && (
              <div className="absolute top-2 right-2">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedType && isEditing && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
