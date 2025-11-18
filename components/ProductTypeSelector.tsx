'use client';

import { ProductType, PRODUCT_TYPE_LABELS } from '@/lib/types';

interface ProductTypeSelectorProps {
  selectedType?: ProductType;
  onSelect: (type: ProductType) => void;
}

export default function ProductTypeSelector({ selectedType, onSelect }: ProductTypeSelectorProps) {
  const productTypes: ProductType[] = ['ENTERO', 'COLA', 'VALOR_AGREGADO'];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        ¿Qué tipo de producto vas a descongelar? *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {productTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`
              relative p-6 rounded-lg border-2 transition-all duration-200
              ${selectedType === type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={`
                text-4xl mb-3
                ${selectedType === type ? 'scale-110' : 'scale-100'}
                transition-transform duration-200
              `}>
                {type === 'ENTERO' && '🦐'}
                {type === 'COLA' && '🍤'}
                {type === 'VALOR_AGREGADO' && '📦'}
              </div>
              <span className={`
                text-lg font-semibold
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
    </div>
  );
}
