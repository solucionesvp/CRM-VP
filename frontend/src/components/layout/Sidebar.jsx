import React from 'react';
import { Users, BarChart2, Columns, Settings, Shield } from 'lucide-react';

export default function Sidebar({ currentView, onViewChange }) {
  const menuItems = [
    { id: 'contacts', name: 'Contactos', icon: Users, active: true },
    { id: 'opportunities', name: 'Oportunidades', icon: BarChart2, active: true },
    { id: 'kanban', name: 'Tablero Kanban', icon: Columns, active: true },
    { id: 'settings', name: 'Configuración', icon: Settings, active: true },
  ];

  return (
    <aside className="w-64 bg-secondary text-white flex flex-col min-h-screen border-r border-border/10">
      {/* Brand Logo Container */}
      <div className="p-6 border-b border-border/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-lg text-white">
          VP
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-sm tracking-wide text-white">VP EQUIPOS</span>
          <span className="text-[10px] text-textMuted uppercase tracking-widest font-semibold">& Soluciones</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.active && onViewChange(item.id)}
              disabled={!item.active}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : item.active
                    ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                    : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] bg-white/10 text-primary px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Info Placeholder */}
      <div className="p-4 border-t border-border/10 bg-black/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
          V
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-semibold text-gray-200 truncate">Vendedor General</span>
          <span className="text-[10px] text-textMuted flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3 text-primary" /> Ventas Tepic
          </span>
        </div>
      </div>
    </aside>
  );
}
