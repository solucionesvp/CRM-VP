import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchContacts, fetchAllOpportunities } from '../../lib/api';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default function TaskForm({ task = null, contactId = null, opportunityId = null, onClose, onSaved }) {
  // Lists for association dropdowns
  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load association dropdowns
  useEffect(() => {
    async function loadAssociations() {
      try {
        const [contactsData, oppsData] = await Promise.all([
          fetchContacts({ size: 100 }),
          fetchAllOpportunities({ size: 100 })
        ]);
        setContacts(contactsData?.items || []);
        setOpportunities(oppsData?.items || []);
      } catch (err) {
        console.error('Error al cargar datos de asociación:', err);
      }
    }
    loadAssociations();
  }, []);

  // Initialize fields on task or prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTaskType(task.task_type || 'general');
      setPriority(task.priority || 'medium');
      setDueDate(formatDateForInput(task.due_date));
      setStatus(task.status || 'pending');
      setSelectedContact(task.contact_id || '');
      setSelectedOpportunity(task.opportunity_id || '');
    } else {
      setTitle('');
      setDescription('');
      setTaskType('general');
      setPriority('medium');
      setDueDate('');
      setStatus('pending');
      setSelectedContact(contactId || '');
      setSelectedOpportunity(opportunityId || '');
    }
  }, [task, contactId, opportunityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es requerido.');
      return;
    }

    setLoading(true);
    setError(null);

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      task_type: taskType,
      priority: priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      contact_id: selectedContact || null,
      opportunity_id: selectedOpportunity || null,
    };

    if (task) {
      // Include status when editing
      body.status = status;
    }

    try {
      const url = task ? `${API_BASE_URL}/tasks/${task.id}` : `${API_BASE_URL}/tasks/`;
      const method = task ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || 'Error al guardar la tarea');
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-[480px] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-background">
          <h3 className="font-heading text-sm font-bold text-text uppercase tracking-wider">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </h3>
          <button onClick={onClose} className="p-1 text-textMuted hover:text-text rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
              Título *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Enviar propuesta actualizada"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary transition-all font-sans"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales o notas..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary transition-all font-sans resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Tipo
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer font-sans"
              >
                <option value="general">General</option>
                <option value="call">Llamada</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="quote_follow_up">Cotización</option>
                <option value="visit">Visita</option>
                <option value="diagnosis">Diagnóstico</option>
                <option value="payment">Pago</option>
                <option value="delivery">Entrega</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer font-sans"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Vencimiento
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary transition-all font-sans"
              />
            </div>

            {/* Status (Only on Edit) */}
            {task && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer font-sans"
                >
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          {/* Contact Association */}
          {!contactId && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Contacto Asociado
              </label>
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer font-sans"
              >
                <option value="">Ninguno</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Opportunity Association */}
          {!opportunityId && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-textMuted">
                Oportunidad Asociada
              </label>
              <select
                value={selectedOpportunity}
                onChange={(e) => setSelectedOpportunity(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer font-sans"
              >
                <option value="">Ninguna</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3 bg-surface">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border text-textMuted hover:bg-background rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
