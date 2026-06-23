import React, { useState } from 'react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({
  stage,
  opportunities,
  contactMap,
  onOpportunityMove,
  onDragStartCard,
  onSelectOpportunity,
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId && onOpportunityMove) {
      onOpportunityMove(oppId, stage.id);
    }
  };

  // Calculate total column value
  const totalValue = opportunities.reduce((acc, curr) => {
    return acc + (curr.expected_value ? parseFloat(curr.expected_value) : 0);
  }, 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-72 rounded-lg bg-[#F8F9FA] border-2 transition-all duration-150 h-[calc(100vh-210px)] select-none ${
        isOver
          ? 'border-primary/50 bg-primary/[0.02] shadow-sm'
          : 'border-border/60'
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/60 bg-white rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Stage color dot */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-bold text-xs text-text truncate max-w-[130px]" title={stage.name}>
            {stage.name}
          </h3>
          <span className="bg-gray-100 text-textMuted text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {opportunities.length}
          </span>
        </div>

        {/* Expected value total */}
        {totalValue > 0 && (
          <span className="text-[10px] font-bold text-primary">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              maximumFractionDigits: 0,
            }).format(totalValue)}
          </span>
        )}
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {opportunities.length === 0 ? (
          <div className="h-28 border border-dashed border-border/80 rounded-lg flex flex-col items-center justify-center text-center p-3">
            <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
              Sin procesos
            </span>
          </div>
        ) : (
          opportunities.map((opp) => (
            <KanbanCard
              key={opp.id}
              opportunity={opp}
              contactName={contactMap[opp.contact_id]}
              onDragStart={onDragStartCard}
              onSelectOpportunity={onSelectOpportunity}
            />
          ))
        )}
      </div>
    </div>
  );
}
