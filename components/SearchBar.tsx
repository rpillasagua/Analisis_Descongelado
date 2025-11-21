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
          className="block w-full px-4 py-2.5 bg-[#efefef] border-none rounded-lg text-[#262626] placeholder-[#8e8e8e] focus:ring-0 focus:bg-white focus:shadow-sm transition-all duration-200 text-sm"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-4 hover:scale-110 transition-transform"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-6 w-6 sm:h-5 sm:w-5 text-blue-400 hover:text-blue-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;