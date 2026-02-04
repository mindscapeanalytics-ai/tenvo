'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export function AdvancedSearch({ onSearch, filters = [], placeholder = 'Search...' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value, activeFilters);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    onSearch?.(searchTerm, newFilters);
  };

  const clearFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    onSearch?.(searchTerm, newFilters);
  };

  const clearAll = () => {
    setSearchTerm('');
    setActiveFilters({});
    onSearch?.('', {});
  };

  const activeFilterCount = Object.keys(activeFilters).filter(key => activeFilters[key]).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
          />
        </div>
        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2 border border-gray-300 rounded-lg hover:border-wine transition ${
              activeFilterCount > 0 ? 'bg-wine text-white border-wine' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
        {(searchTerm || activeFilterCount > 0) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 text-gray-600 hover:text-wine"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
                  >
                    <option value="">All</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
                  />
                ) : (
                  <input
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
                  />
                )}
                {activeFilters[filter.key] && (
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="mt-1 text-xs text-wine hover:text-wine/80"
                  >
                    Clear
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find(f => f.key === key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-wine/10 text-wine rounded-full text-sm"
              >
                {filter?.label}: {value}
                <button
                  onClick={() => clearFilter(key)}
                  className="hover:text-wine/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}








