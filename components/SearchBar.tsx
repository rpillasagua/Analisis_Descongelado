'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Buscar por lote, proveedor o piscina..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-md sm:max-w-full search-container">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="block w-full px-4 py-2.5 border-2 border-blue-500 rounded-lg bg-gray-900 dark:bg-gray-800 text-white font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 hover:border-blue-400"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:scale-110 transition-transform"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-5 w-5 text-blue-400 hover:text-blue-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;