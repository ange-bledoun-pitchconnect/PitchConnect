'use client';

import { useAdvancedFilter, type FilterOptions } from '@/hooks/useGlobalSearch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface AdvancedFilterProps {
  onFiltersChange?: (filters: FilterOptions) => void;
  className?: string;
}

/**
 * Advanced Filter Component
 * Multi-filter support with combinations
 */
export function AdvancedFilter({
  onFiltersChange,
  className = '',
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, updateFilter, clearFilters } = useAdvancedFilter();

  const handleTypeChange = (type: 'player' | 'club' | 'league' | 'match') => {
    const current = filters.type || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateFilter('type', updated);
    onFiltersChange?.({ ...filters, type: updated });
  };

  const handlePositionChange = (position: string) => {
    const current = filters.position || [];
    const updated = current.includes(position)
      ? current.filter((p) => p !== position)
      : [...current, position];
    updateFilter('position', updated);
    onFiltersChange?.({ ...filters, position: updated });
  };

  const handleClearFilters = () => {
    clearFilters();
    onFiltersChange?.(
    );
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => (Array.isArray(v) ? v.length : v) > 0,
  ).length;

  return (
    <div className={className}>
      {/* Filter Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="primary" className="ml-2 bg-blue-600">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="absolute top-12 left-0 w-96 max-w-full p-6 shadow-lg z-50">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Advanced Filters
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type Filter */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                Result Type
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {['player', 'club', 'league', 'match'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      (filters.type || []).includes(type as any)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Filter (if player selected) */}
            {(filters.type || []).includes('player') && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Player Position
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {['GK', 'DEF', 'MID', 'FWD'].map((position) => (
                    <button
                      key={position}
                      onClick={() => handlePositionChange(position)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        (filters.position || []).includes(position)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Filter */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                Rating Range
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Min Rating: {filters.minRating || 0}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.minRating || 0}
                    onChange={(e) =>
                      updateFilter('minRating', parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Max Rating: {filters.maxRating || 10}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.maxRating || 10}
                    onChange={(e) =>
                      updateFilter('maxRating', parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Clear Button */}
            {activeFilterCount > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdvancedFilter;
