className = "flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border-2 border-blue-300"
  >
  <Edit2 className="h-4 w-4" />
Cambiar
            </button >
          </div >
        </div >
      </div >
    );
  }

// Mostrar selector completo si no hay selección o si está editando
return (
  <div className="mb-6">
    <label className="block text-base font-bold text-gray-900 mb-3">
      {selectedType ? 'Selecciona un nuevo tipo de producto *' : '¿Qué tipo de producto vas a descongelar? *'}
    </label>
    {selectedType && isEditing && (
      <div className="mb-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
        <p className="text-sm text-yellow-800 font-medium">
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
              relative p-4 sm:p-6 rounded-2xl border-3 transition-all duration-200 hover:scale-105 active:scale-95
              ${selectedType === type
              ? 'border-blue-600 bg-blue-50 shadow-xl ring-4 ring-blue-200'
              : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-gray-50 shadow-md'
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
                text-base sm:text-lg font-bold leading-tight
                ${selectedType === type
                ? 'text-blue-700'
                : 'text-gray-700'
              }
              `}>
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
    {selectedType && isEditing && (
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border-2 border-gray-300"
        >
          Cancelar
        </button>
      </div>
    )}
  </div>
);
}
