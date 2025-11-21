'use client';

import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { ProductType, PRODUCT_TYPE_LABELS } from '@/lib/types';

interface ProductTypeSelectorProps {
  selectedType?: ProductType;
  onSelect: (type: ProductType) => void;
}

export default function ProductTypeSelector({ selectedType, onSelect }: ProductTypeSelectorProps) {
  const [isEditing, setIsEditing] = useState(!selectedType);

  const productTypes: ProductType[] = ['ENTERO', 'COLA', 'VALOR_AGREGADO', 'CONTROL_PESOS'];

  if (selectedType && !isEditing) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-3xl">
            {selectedType === 'ENTERO' && '🦐'}
            {selectedType === 'COLA' && '🍤'}
            {selectedType === 'VALOR_AGREGADO' && '📦'}
            {selectedType === 'CONTROL_PESOS' && '⚖️'}
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium mb-0.5">Tipo de Producto Seleccionado</p>
            <p className="text-xl font-bold text-blue-900">{PRODUCT_TYPE_LABELS[selectedType]}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border-2 border-blue-300"
        >
          <Edit2 className="h-4 w-4" />
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-center mb-6" style={{ color: '#1a1a1a' }}>
        {selectedType ? 'Selecciona un nuevo tipo de producto *' : '¿Qué tipo de producto vas a descongelar? *'}
      </h2>

      {selectedType && isEditing && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Al cambiar el tipo de producto, los defectos registrados se perderán si no son compatibles.
          </p>
        </div>
      )}

      <div className="max-w-[450px] mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {productTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onSelect(type);
                setIsEditing(false);
              }}
              className={`
                relative p-6 rounded-xl transition-all duration-200
                ${selectedType === type
                  ? 'bg-blue-100 shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 hover:-translate-y-1 shadow-sm hover:shadow-md'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-3">
                  {type === 'ENTERO' && '🦐'}
                  {type === 'COLA' && '🍤'}
                  {type === 'VALOR_AGREGADO' && '📦'}
                  {type === 'CONTROL_PESOS' && '⚖️'}
                </div>
                <span className="text-base font-semibold leading-tight" style={{ color: '#1a1a1a' }}>
                  {PRODUCT_TYPE_LABELS[type]}
                </span>
              </div>

              {selectedType === type && (
                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedType && isEditing && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
