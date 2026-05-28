import React from 'react';
import { Search } from 'lucide-react';

export default function ContactFilters({ q, onSearchChange }) {
  return (
    <div className="bg-surface p-4 rounded-lg border border-border flex items-center justify-between mb-6 shadow-sm">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-textMuted" />
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
        />
      </div>

      {/* Filter Stats badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-textMuted font-medium">Filtro activo:</span>
        <span className="text-xs bg-primary/15 text-primary px-3 py-1 rounded-full font-bold border border-primary/20">
          Ventas Generales
        </span>
      </div>
    </div>
  );
}
