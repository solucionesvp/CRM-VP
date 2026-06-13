import React from 'react';
import { Network, HelpCircle, Bell } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

export default function Header({ currentView, onNavigateToContact }) {
  const getViewTitle = () => {
    switch (currentView) {
      case 'contacts':
        return 'Control de Contactos';
      case 'opportunities':
        return 'Oportunidades Comerciales';
      case 'settings':
        return 'Configuración del Sistema';
      default:
        return 'CRM VP';
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Title / Context */}
      <div className="flex items-center gap-4 shrink-0">
        <h1 className="text-lg font-bold font-heading text-text tracking-wide m-0">
          {getViewTitle()}
        </h1>
        <span className="text-xs px-2.5 py-1 rounded bg-background text-textMuted font-medium border border-border">
          Evans Distribuidor Autorizado
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <GlobalSearch onNavigateToContact={onNavigateToContact} />
      </div>

      {/* Action / Status Utilities */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Connection Health Indicator */}
        <div className="flex items-center gap-2 text-xs text-textMuted bg-gray-100 px-3 py-1.5 rounded border border-border">

          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-semibold text-[11px] tracking-wide">CONECTADO AL BACKEND</span>
        </div>

        {/* Notifications and Help placeholders */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-textMuted hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-textMuted hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
