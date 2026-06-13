import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ currentView, onViewChange, onNavigateToContact, children }) {
  return (
    <div className="flex bg-background min-h-screen font-sans text-text">
      {/* Fixed Sidebar */}
      <Sidebar currentView={currentView} onViewChange={onViewChange} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <Header currentView={currentView} onNavigateToContact={onNavigateToContact} />


        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
