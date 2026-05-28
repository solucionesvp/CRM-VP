import React, { useState, useEffect } from 'react';
import { User, Building, Phone, Mail, Save, Edit } from 'lucide-react';
import { updateContact, fetchContactOpportunities, deleteOpportunity, updateOpportunityStage, fetchStages } from '../../lib/api';
import OpportunityList from './OpportunityList';
import OpportunityForm from './OpportunityForm';

export default function ContactDetail({ contact, onUpdate, onEdit }) {
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);

  // Opportunities States
  const [opps, setOpps] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [oppsError, setOppsError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Stage Picker States
  const [stages, setStages] = useState([]);
  const [activeStagePickerOppId, setActiveStagePickerOppId] = useState(null);

  // Load contact notes
  useEffect(() => {
    setNotes(contact?.notes || '');
    setShowAddForm(false);
    setActiveStagePickerOppId(null);
    if (contact) {
      loadOpportunities(contact.id);
    }
  }, [contact]);

  // Load stages on mount for the stage picker
  useEffect(() => {
    async function loadStages() {
      try {
        const stagesData = await fetchStages();
        setStages(stagesData);
      } catch (err) {
        console.error('Error al cargar etapas en detalle:', err);
      }
    }
    loadStages();
  }, []);

  const loadOpportunities = async (contactId) => {
    setLoadingOpps(true);
    setOppsError(null);
    try {
      const data = await fetchContactOpportunities(contactId);
      setOpps(data.items);
    } catch (err) {
      setOppsError(err.message);
    } finally {
      setLoadingOpps(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!contact) return;
    setSaving(true);
    try {
      const updated = await updateContact(contact.id, { notes });
      onUpdate(updated);
    } catch (err) {
      alert('Error al guardar notas: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOpportunitySave = (newOpp) => {
    setShowAddForm(false);
    loadOpportunities(contact.id);
  };

  const handleOpportunityDelete = async (oppId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta oportunidad?')) {
      try {
        await deleteOpportunity(oppId);
        loadOpportunities(contact.id);
      } catch (err) {
        alert('Error al eliminar la oportunidad: ' + err.message);
      }
    }
  };

  const handleStageChangeSelect = async (oppId, newStageId) => {
    try {
      await updateOpportunityStage(oppId, parseInt(newStageId));
      setActiveStagePickerOppId(null);
      loadOpportunities(contact.id);
    } catch (err) {
      alert('Error al actualizar la etapa: ' + err.message);
    }
  };

  if (!contact) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6 h-full flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
        <p className="text-sm text-textMuted font-bold tracking-wide">
          Selecciona un contacto de la lista para ver su información y notas comerciales.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm space-y-6 min-h-[450px]">
      {/* Contact Head */}
      <div className="border-b border-border pb-4 flex items-start justify-between gap-4">
        <div className="overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            {contact.type === 'company' ? (
              <Building className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <User className="w-6 h-6 text-primary shrink-0" />
            )}
            <h2 className="text-lg font-bold font-heading text-text truncate">{contact.name}</h2>
          </div>
          <p className="text-xs text-textMuted font-semibold uppercase tracking-wider truncate">
            ID: <span className="font-mono text-gray-400">{contact.id}</span>
          </p>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Edit className="w-3.5 h-3.5 text-primary" />
          Editar
        </button>
      </div>

      {/* Info Fields */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">Información de Contacto</h3>
        <div className="grid grid-cols-1 gap-3 text-sm">
          {contact.company_name && (
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-textMuted/70" />
              <span className="font-bold text-text">{contact.company_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-textMuted/70" />
            <span className="text-text font-medium">{contact.phone || 'Sin número registrado'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-textMuted/70" />
            <span className="text-text truncate font-medium">{contact.email || 'Sin correo registrado'}</span>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">Notas y Detalles Operativos</h3>
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe aquí notas sobre cotizaciones Evans, requerimientos técnicos o estados de taller..."
          className="w-full h-32 p-3 bg-background border border-border rounded text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all duration-150"
        />
      </div>

      {/* Opportunities Section */}
      <div className="border-t border-border pt-6 space-y-4">
        {showAddForm ? (
          <OpportunityForm
            contactId={contact.id}
            onSave={handleAddOpportunitySave}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <>
            <OpportunityList
              opportunities={opps}
              loading={loadingOpps}
              error={oppsError}
              onAddClick={() => setShowAddForm(true)}
              onDeleteClick={handleOpportunityDelete}
              onStageChangeClick={(opp) => setActiveStagePickerOppId(opp.id)}
            />

            {/* Inline Stage Picker Dropdown */}
            {activeStagePickerOppId && (
              <div className="p-3 bg-background border border-border rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-text">Selecciona nueva etapa:</p>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => handleStageChangeSelect(activeStagePickerOppId, e.target.value)}
                    defaultValue=""
                    className="flex-1 bg-white border border-border rounded px-2 py-1 cursor-pointer focus:outline-none"
                  >
                    <option value="" disabled>Selecciona etapa...</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActiveStagePickerOppId(null)}
                    className="px-2.5 py-1 border border-border rounded bg-white hover:bg-gray-50 font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
