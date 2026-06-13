/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { User, Building, Phone, Mail, Save, Edit, MessageSquare, FileText, MapPin, Activity, CreditCard, Truck, CheckSquare, CheckCircle, Edit2, Trash2, Plus } from 'lucide-react';
import { updateContact, fetchContactOpportunities, deleteOpportunity, updateOpportunityStage, fetchStages } from '../../lib/api';
import OpportunityList from './OpportunityList';
import OpportunityForm from './OpportunityForm';
import TaskForm from '../tasks/TaskForm';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const PRIORITY_STYLES = {
  low: { label: 'Baja', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgente', color: 'bg-red-50 text-red-700 border-red-200' },
};

const STATUS_STYLES = {
  pending: { label: 'Pendiente', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completado', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

const TYPE_STYLES = {
  call: { label: 'Llamada', icon: Phone, color: 'text-blue-500' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  quote_follow_up: { label: 'Cotización', icon: FileText, color: 'text-orange-500' },
  visit: { label: 'Visita', icon: MapPin, color: 'text-purple-500' },
  diagnosis: { label: 'Diagnóstico', icon: Activity, color: 'text-red-500' },
  payment: { label: 'Pago', icon: CreditCard, color: 'text-emerald-500' },
  delivery: { label: 'Entrega', icon: Truck, color: 'text-sky-500' },
  general: { label: 'General', icon: CheckSquare, color: 'text-gray-500' },
};

export default function ContactDetail({ contact, onUpdate, onEdit }) {
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('opportunities');

  // Opportunities States
  const [opps, setOpps] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [oppsError, setOppsError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Tasks States
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Stage Picker States
  const [stages, setStages] = useState([]);
  const [activeStagePickerOppId, setActiveStagePickerOppId] = useState(null);

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

  const loadTasks = async (contactId) => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/tasks`);
      if (!response.ok) throw new Error('Error al obtener la lista de seguimientos');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Load contact notes
  useEffect(() => {
    setNotes(contact?.notes || '');
    setShowAddForm(false);
    setActiveStagePickerOppId(null);
    if (contact) {
      loadOpportunities(contact.id);
      if (activeTab === 'tasks') {
        loadTasks(contact.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Fetch tasks when tab changes to tasks
  useEffect(() => {
    if (contact && activeTab === 'tasks') {
      loadTasks(contact.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const handleAddOpportunitySave = () => {
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

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al completar la tarea');
      loadTasks(contact.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta tarea?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la tarea');
      loadTasks(contact.id);
    } catch (err) {
      alert(err.message);
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

      {/* Tabs Header */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'opportunities'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            Oportunidades
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'tasks'
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-text'
            }`}
          >
            Seguimientos
          </button>
        </div>

        {/* Tab Content: Opportunities */}
        {activeTab === 'opportunities' && (
          showAddForm ? (
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
                      {(() => {
                        const activeOpp = opps.find(o => o.id === activeStagePickerOppId);
                        return stages
                          .filter((s) => activeOpp && s.pipeline_id === activeOpp.pipeline_id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ));
                      })()}
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
          )
        )}

        {/* Tab Content: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-textMuted">Tareas de Seguimiento</h4>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
              >
                <Plus className="w-3 h-3" />
                Seguimiento
              </button>
            </div>

            {loadingTasks ? (
              <div className="p-8 text-center text-xs text-textMuted">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Cargando seguimientos...
              </div>
            ) : tasksError ? (
              <div className="p-4 bg-red-50 text-red-600 rounded text-xs">
                {tasksError}
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-lg text-center text-xs text-textMuted">
                Sin seguimientos para este contacto
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const typeInfo = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                  const Icon = typeInfo.icon;
                  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                  const statusInfo = STATUS_STYLES[task.status] || STATUS_STYLES.pending;

                  return (
                    <div key={task.id} className="p-3 bg-background border border-border rounded-lg flex items-center justify-between gap-4 hover:border-primary/20 transition-colors text-xs font-medium">
                      <div className="overflow-hidden space-y-1">
                        <div className="font-bold text-text truncate" title={task.title}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-textMuted truncate" title={task.description}>
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] text-text">
                            <Icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                            {typeInfo.label}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          {task.due_date && (
                            <span className={`text-[10px] ${task.is_overdue ? 'text-red-600 font-bold' : 'text-textMuted'}`}>
                              Vence:{' '}
                              {new Date(task.due_date).toLocaleString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            title="Completar"
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          title="Editar"
                          className="p-1 text-textMuted hover:text-primary rounded hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Eliminar"
                          className="p-1 text-textMuted hover:text-red-600 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskModal && (
        <TaskForm
          task={editingTask}
          contactId={contact.id}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            loadTasks(contact.id);
          }}
        />
      )}
    </div>
  );
}
