import { useState } from 'react';
import { X } from 'lucide-react';
import OpportunityDetail from '../opportunities/OpportunityDetail';
import OpportunityEditForm from '../opportunities/OpportunityEditForm';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

export default function OpportunityForm({ contactId, opportunity = null, onSave, onCancel }) {
  const [mode, setMode] = useState(opportunity ? 'view' : 'edit');

  const handleSaved = (saved) => {
    onSave(saved);
    setMode('view');
  };

  const handleDelete = async (oppId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta oportunidad?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${oppId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la oportunidad');
      onCancel(); // Close the form/modal on delete
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h3 className="font-bold text-sm text-text">
          {mode === 'view' ? 'Detalle de Oportunidad' : opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-textMuted hover:text-text hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {mode === 'view' && opportunity ? (
        <OpportunityDetail
          opportunity={opportunity}
          onEdit={() => setMode('edit')}
          onDelete={handleDelete}
        />
      ) : (
        <OpportunityEditForm
          contactId={contactId}
          opportunity={opportunity}
          onSave={handleSaved}
          onCancel={opportunity ? () => setMode('view') : onCancel}
        />
      )}
    </div>
  );
}
