/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { 
  User, Building, Phone, Mail, Save, Edit, MessageSquare, FileText, 
  MapPin, Activity, CreditCard, Truck, CheckSquare, CheckCircle, 
  Edit2, Trash2, Plus, X, Clock, TrendingUp, AlertCircle, ExternalLink 
} from 'lucide-react';
import { 
  updateContact, fetchContactOpportunities, deleteOpportunity, 
  updateOpportunityStage, fetchStages, fetchContactActivities,
  fetchTags, fetchContactTags, assignContactTags, removeContactTag
} from '../../lib/api';
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

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  if (diffDays === 1) return 'ayer';
  return `hace ${diffDays} días`;
}

export default function ContactDetail({ contact, onUpdate, onEdit }) {
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);

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

  // Contact Activities States
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  // Tags States
  const [contactTags, setContactTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Modals States
  const [showAllOpps, setShowAllOpps] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('resumen');

  const loadOpportunities = async (contactId) => {
    setLoadingOpps(true);
    setOppsError(null);
    try {
      const data = await fetchContactOpportunities(contactId);
      setOpps(data.items || []);
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

  const loadActivities = async (contactId) => {
    setLoadingActivities(true);
    setActivitiesError(null);
    try {
      const data = await fetchContactActivities(contactId);
      setActivities(data || []);
    } catch (err) {
      setActivitiesError(err.message);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadContactTags = async (contactId) => {
    try {
      const tagsData = await fetchContactTags(contactId);
      setContactTags(tagsData || []);
    } catch (err) {
      console.error('Error al cargar etiquetas del contacto:', err);
    }
  };

  const handleAssignTag = async (tagId) => {
    const updatedTagIds = [...contactTags.map(t => t.id), tagId];
    try {
      const updatedTags = await assignContactTags(contact.id, updatedTagIds);
      setContactTags(updatedTags);
      setShowTagDropdown(false);
      loadActivities(contact.id);
    } catch (err) {
      alert('Error al asignar etiqueta: ' + err.message);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await removeContactTag(contact.id, tagId);
      setContactTags(prev => prev.filter(t => t.id !== tagId));
      loadActivities(contact.id);
    } catch (err) {
      alert('Error al quitar la etiqueta: ' + err.message);
    }
  };

  // Reload everything when contact changes
  useEffect(() => {
    setNotes(contact?.notes || '');
    setShowAddForm(false);
    setActiveTab('resumen');
    setActiveStagePickerOppId(null);
    setShowTagDropdown(false);
    if (contact) {
      loadOpportunities(contact.id);
      loadTasks(contact.id);
      loadActivities(contact.id);
      loadContactTags(contact.id);
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
    async function loadAllTagsList() {
      try {
        const tagsData = await fetchTags();
        setAllTags(tagsData);
      } catch (err) {
        console.error('Error al cargar etiquetas:', err);
      }
    }
    loadStages();
    loadAllTagsList();
  }, []);

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
    loadActivities(contact.id);
  };

  const handleOpportunityDelete = async (oppId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta oportunidad?')) {
      try {
        await deleteOpportunity(oppId);
        loadOpportunities(contact.id);
        loadActivities(contact.id);
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
      loadActivities(contact.id);
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
      loadActivities(contact.id);
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
      loadActivities(contact.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const checkIsOverdue = (task) => {
    if (task.status !== 'pending') return false;
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  const getWhatsAppLink = (num) => {
    if (!num) return null;
    const cleanNum = num.replace(/\D/g, '');
    return `https://wa.me/${cleanNum.startsWith('52') ? cleanNum : '52' + cleanNum}`;
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

  // Calculate metrics
  const totalOpps = opps.length;
  const openOpps = opps.filter(o => o.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => checkIsOverdue(t)).length;
  const lastActivity = activities[0] ? getRelativeTime(activities[0].created_at) : 'Sin actividad';

  // Filtered lists for preview (max 3)
  const previewOpps = opps.slice(0, 3);
  const previewTasks = [...tasks]
    .sort((a, b) => {
      const overdueA = checkIsOverdue(a);
      const overdueB = checkIsOverdue(b);
      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;
      return 0;
    })
    .slice(0, 3);

  // Filtered activities (max 5 for preview)
  const previewActivities = activities.slice(0, 5);

  // Filter logic for full activity modal
  const filteredActivities = activities.filter(act => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'oportunidades') {
      return act.action_type === 'created' || act.action_type === 'closed_won' || act.action_type === 'closed_lost';
    }
    if (activityFilter === 'seguimientos') {
      return act.action_type === 'follow_up';
    }
    if (activityFilter === 'notas') {
      return act.action_type === 'note_added';
    }
    if (activityFilter === 'etapas') {
      return act.action_type === 'stage_change';
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. ENCABEZADO OPERATIVO DEL CONTACTO (Ultra-Compacto) */}
      <div className="bg-white rounded-lg border border-border p-3.5 shadow-sm space-y-2 animate-fadeIn">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {contact.type === 'company' ? (
                <Building className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-text truncate max-w-[140px]" title={contact.name}>
                {contact.name}
              </h2>
              {contact.company_name && (
                <p className="text-[10px] text-textMuted font-semibold truncate max-w-[130px]">{contact.company_name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-0.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0"
          >
            <Edit className="w-2.5 h-2.5 text-primary" />
            Editar
          </button>
        </div>

        {/* Compact Info Badges/Rows */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-2 border-t border-border/50">
          <span className="font-bold text-textMuted uppercase mr-1">Contacto:</span>
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline font-bold bg-gray-50 border px-1.5 py-0.5 rounded">
              <Phone className="w-2.5 h-2.5" />
              {contact.phone}
            </a>
          )}
          {(contact.whatsapp || contact.phone) && (
            <a
              href={getWhatsAppLink(contact.whatsapp || contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 rounded transition-colors font-bold"
            >
              <MessageSquare className="w-2.5 h-2.5 fill-current" />
              WA
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-text font-semibold bg-gray-50 border px-1.5 py-0.5 rounded truncate max-w-[150px]" title={contact.email}>
              <Mail className="w-2.5 h-2.5 text-textMuted" />
              Correo
            </a>
          )}
        </div>

        {/* Tags and Primary Interest */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
          <span className="text-[9px] text-textMuted font-bold uppercase tracking-wider mr-1">Interés/Etiquetas:</span>
          {contact.primary_interest && (
            <span className="bg-orange-50 text-primary border border-orange-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
              {contact.primary_interest}
            </span>
          )}
          
          {contactTags.length === 0 ? (
            <span className="text-[10px] text-gray-400 font-semibold italic mr-1">Sin etiquetas</span>
          ) : (
            contactTags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider relative group"
                style={{
                  backgroundColor: tag.color + '12',
                  color: tag.color,
                  borderColor: tag.color + '30',
                }}
              >
                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                {tag.label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag.id); }}
                  className="ml-1 text-current hover:opacity-100 opacity-60 transition-opacity font-extrabold focus:outline-none"
                  title="Eliminar"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}

          <div className="relative inline-block ml-1">
            <button
              type="button"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-border bg-white text-textMuted hover:text-text hover:bg-gray-50 transition-colors"
              title="Agregar etiqueta"
            >
              <Plus className="w-3 h-3" />
            </button>
            
            {showTagDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-gray-50/50">
                  <span className="text-[9px] font-bold text-textMuted uppercase">Etiquetas disponibles</span>
                  <button type="button" onClick={() => setShowTagDropdown(false)}>
                    <X className="w-2.5 h-2.5 text-textMuted hover:text-text" />
                  </button>
                </div>
                {allTags.filter(t => t.is_active && !contactTags.some(ct => ct.id === t.id)).length === 0 ? (
                  <p className="text-[10px] text-textMuted italic p-2 text-center">No hay etiquetas para agregar</p>
                ) : (
                  allTags
                    .filter(t => t.is_active && !contactTags.some(ct => ct.id === t.id))
                    .map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAssignTag(t.id)}
                        className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-2 border-b border-border/20 last:border-0"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="truncate flex-1" style={{ color: t.color }}>{t.label}</span>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MÉTRICAS RÁPIDAS DEL CONTACTO (Fila Horizontal Única) */}
      <div className="bg-white rounded-lg border border-border p-2 shadow-sm grid grid-cols-4 gap-1.5 text-center">
        <div className="p-1.5 bg-gray-50 border border-gray-100/50 rounded flex flex-col justify-center items-center">
          <div className="text-sm font-bold text-text">{totalOpps}</div>
          <div className="text-[8px] text-textMuted font-bold uppercase tracking-wider">Total Opps</div>
        </div>
        <div className="p-1.5 bg-gray-50 border border-gray-100/50 rounded flex flex-col justify-center items-center">
          <div className="text-sm font-bold text-primary">{openOpps}</div>
          <div className="text-[8px] text-textMuted font-bold uppercase tracking-wider">Abiertas</div>
        </div>
        <div className="p-1.5 bg-gray-50 border border-gray-100/50 rounded flex flex-col justify-center items-center">
          <div className="text-sm font-bold text-text">{pendingTasks}</div>
          <div className="text-[8px] text-textMuted font-bold uppercase tracking-wider">Tareas</div>
        </div>
        <div className={`p-1.5 border rounded flex flex-col justify-center items-center ${overdueTasks > 0 ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-gray-50 border-gray-100/50'}`}>
          <div className={`text-sm font-bold ${overdueTasks > 0 ? 'text-red-600' : 'text-text'}`}>{overdueTasks}</div>
          <div className="text-[8px] text-textMuted font-bold uppercase tracking-wider">Vencidad</div>
        </div>
      </div>

      {/* 3. TABS DE CONTROL OPERATIVO */}
      <div className="flex border-b border-border bg-white rounded-t-lg p-0.5 gap-0.5 text-[10px] font-bold uppercase tracking-wider">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'oportunidades', label: `Opps (${totalOpps})` },
          { id: 'seguimientos', label: `Tareas (${pendingTasks})` },
          { id: 'actividad', label: 'Historial' },
          { id: 'notas', label: 'Notas' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5 rounded-t font-extrabold'
                : 'border-transparent text-textMuted hover:text-text hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. CONTENIDO ACTIVO DE TABS */}
      <div className="bg-white rounded-b-lg border-x border-b border-border p-4 space-y-4 min-h-[220px]">
        {activeTab === 'resumen' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Próxima Acción Importante */}
            <div className="space-y-1.5">
              <h4 className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Próxima Acción</h4>
              {(() => {
                const overdueTasksList = tasks.filter(t => checkIsOverdue(t));
                const pendingTasksList = tasks.filter(t => t.status === 'pending').sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                const nextTask = overdueTasksList.length > 0 ? overdueTasksList[0] : pendingTasksList[0];

                if (!nextTask) {
                  return (
                    <div className="p-3 border border-dashed border-border rounded-lg text-center bg-background/50 space-y-2">
                      <p className="text-xs text-textMuted">Sin seguimientos pendientes</p>
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setShowTaskModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Agregar Seguimiento
                      </button>
                    </div>
                  );
                }

                const typeInfo = TYPE_STYLES[nextTask.task_type] || TYPE_STYLES.general;
                const Icon = typeInfo.icon;
                const isOverdue = checkIsOverdue(nextTask);

                return (
                  <div className={`p-2.5 border rounded-lg flex items-center justify-between gap-3 text-xs ${isOverdue ? 'bg-red-50/20 border-red-200 animate-pulse' : 'bg-background border-border'}`}>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isOverdue && <span className="bg-red-100 text-red-700 px-1 py-0.2 rounded text-[8px] font-bold uppercase mr-1">Vencido</span>}
                        <span className="font-bold text-text truncate block">{nextTask.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-textMuted">
                        <span className="inline-flex items-center gap-0.5 font-semibold">
                          <Icon className={`w-3 h-3 ${typeInfo.color}`} />
                          {typeInfo.label}
                        </span>
                        {nextTask.due_date && (
                          <span className={`font-semibold ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                            {new Date(nextTask.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleCompleteTask(nextTask.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Completar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTask(nextTask);
                          setShowTaskModal(true);
                        }}
                        className="p-1 text-textMuted hover:text-primary rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Oportunidad Destacada */}
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <h4 className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Última Oportunidad Activa</h4>
              {(() => {
                const activeOpps = opps.filter(o => o.status === 'active');
                const latestOpp = activeOpps[0];

                if (!latestOpp) {
                  return (
                    <div className="p-3 border border-dashed border-border rounded-lg text-center bg-background/50 space-y-2">
                      <p className="text-xs text-textMuted">Sin oportunidades activas</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Nueva Oportunidad
                      </button>
                    </div>
                  );
                }

                const stageColor = latestOpp.stage?.color || '#6B7280';

                return (
                  <div className="bg-white border border-border rounded-lg p-2.5 shadow-sm relative overflow-hidden text-xs">
                    <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ backgroundColor: stageColor }} />
                    <div className="flex justify-between items-start gap-2 pt-0.5">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-text truncate block">{latestOpp.title}</span>
                        <span className="text-[10px] text-textMuted font-semibold block truncate">
                          {latestOpp.stage?.name} • {latestOpp.pipeline?.name || 'Venta'}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-primary text-right shrink-0">
                        {latestOpp.expected_value
                          ? new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: latestOpp.currency || 'MXN',
                              maximumFractionDigits: 0
                            }).format(latestOpp.expected_value)
                          : 'Sin cotizar'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'oportunidades' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Oportunidades</span>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>

            {showAddForm ? (
              <OpportunityForm
                contactId={contact.id}
                onSave={handleAddOpportunitySave}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <div className="space-y-2.5">
                <OpportunityList
                  opportunities={opps.slice(0, 2)}
                  loading={loadingOpps}
                  error={oppsError}
                  onAddClick={() => setShowAddForm(true)}
                  onDeleteClick={handleOpportunityDelete}
                  onStageChangeClick={(opp) => setActiveStagePickerOppId(opp.id)}
                  isCompact={true}
                />

                {/* Inline Stage Picker Dropdown */}
                {activeStagePickerOppId && (
                  <div className="p-2.5 bg-background border border-border rounded-lg space-y-1.5 text-xs">
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
                        className="px-2 py-0.5 border border-border rounded bg-white hover:bg-gray-50 font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {totalOpps > 2 && (
                  <button
                    onClick={() => setShowAllOpps(true)}
                    className="w-full text-center py-1.5 border border-dashed border-border/80 rounded text-[10px] font-bold text-primary hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    Ver todas ({totalOpps})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'seguimientos' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Tareas de Seguimiento</span>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>

            {loadingTasks ? (
              <div className="p-4 text-center text-xs text-textMuted">Cargando...</div>
            ) : tasksError ? (
              <div className="p-3 bg-red-50 text-red-600 rounded text-xs">{tasksError}</div>
            ) : tasks.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center text-xs text-textMuted bg-background/50">
                Sin seguimientos pendientes
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="space-y-2">
                  {previewTasks.slice(0, 3).map((task) => {
                    const typeInfo = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                    const Icon = typeInfo.icon;
                    const isOverdue = checkIsOverdue(task);

                    return (
                      <div 
                        key={task.id} 
                        className={`p-2.5 border rounded-lg flex items-center justify-between gap-3 text-xs font-medium transition-colors ${
                          isOverdue ? 'bg-red-50/20 border-red-200 animate-pulse' : 'bg-background border-border'
                        }`}
                      >
                        <div className="overflow-hidden space-y-0.5 min-w-0 flex-1">
                          <div className="font-bold text-text truncate" title={task.title}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px]">
                            <span className="inline-flex items-center gap-1 text-textMuted text-[9px]">
                              <Icon className={`w-3 h-3 ${typeInfo.color}`} />
                              {typeInfo.label}
                            </span>
                            {task.due_date && (
                              <span className={`text-[9px] ${isOverdue ? 'text-red-600 font-bold' : 'text-textMuted'}`}>
                                {isOverdue ? 'Vencido' : 'Vence'}: {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              title="Completar"
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            title="Editar"
                            className="p-1 text-textMuted hover:text-primary rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {tasks.length > 3 && (
                  <button
                    onClick={() => setShowAllTasks(true)}
                    className="w-full text-center py-1.5 border border-dashed border-border/80 rounded text-[10px] font-bold text-primary hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    Ver todos ({tasks.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actividad' && (
          <div className="space-y-3 animate-fadeIn">
            <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block border-b border-border/50 pb-2">Actividad Reciente</span>

            {loadingActivities ? (
              <div className="p-4 text-center text-xs text-textMuted">Cargando...</div>
            ) : activitiesError ? (
              <div className="p-3 bg-red-50 text-red-600 rounded text-xs">{activitiesError}</div>
            ) : previewActivities.length === 0 ? (
              <p className="text-xs text-textMuted italic text-center py-4">Sin movimientos comerciales</p>
            ) : (
              <div className="space-y-3">
                <div className="relative border-l border-border pl-4 ml-2 space-y-3 text-xs">
                  {previewActivities.slice(0, 4).map((act) => (
                    <div key={act.id} className="relative">
                      <span className="absolute -left-[23px] top-0.5 bg-white p-0.5 rounded-full border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                      </span>
                      <div>
                        <p className="text-text font-semibold leading-tight">{act.description || 'Actividad comercial'}</p>
                        <p className="text-[9px] text-textMuted font-bold mt-0.5">
                          {act.opportunity_title && <span className="text-gray-400 mr-1.5">[{act.opportunity_title}]</span>}
                          {getRelativeTime(act.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activities.length > 4 && (
                  <button
                    onClick={() => setShowAllActivities(true)}
                    className="w-full text-center py-1.5 border border-dashed border-border/80 rounded text-[10px] font-bold text-primary hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    Ver historial completo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notas' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Bitácora de Notas</span>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe notas operativas sobre cotizaciones Evans o estado de equipos en taller..."
              className="w-full h-28 p-2 bg-background border border-border rounded text-xs text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
            />

            {/* Previous notes rendering */}
            {contact.notes && (
              <div className="border-t border-border/50 pt-2.5 space-y-1.5">
                <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Notas Guardadas</span>
                <div className="p-2 bg-background border border-border rounded text-[11px] text-textMuted overflow-y-auto max-h-24 whitespace-pre-wrap leading-relaxed">
                  {contact.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- OVERLAY MODALS --- */}

      {/* A. MODAL: TODAS LAS OPORTUNIDADES */}
      {showAllOpps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl p-6 relative">
            <button
              onClick={() => setShowAllOpps(false)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 text-textMuted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text border-b pb-3 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Todas las Oportunidades ({contact.name})
            </h3>
            
            <OpportunityList
              opportunities={opps}
              loading={loadingOpps}
              error={oppsError}
              onAddClick={() => {
                setShowAllOpps(false);
                setShowAddForm(true);
              }}
              onDeleteClick={handleOpportunityDelete}
              onStageChangeClick={(opp) => setActiveStagePickerOppId(opp.id)}
            />

            {/* Stage Picker Dropdown in Modal */}
            {activeStagePickerOppId && (
              <div className="p-3 bg-background border border-border rounded-lg mt-4 space-y-2 text-xs">
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
          </div>
        </div>
      )}

      {/* B. MODAL: TODOS LOS SEGUIMIENTOS */}
      {showAllTasks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl p-6 relative">
            <button
              onClick={() => setShowAllTasks(false)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 text-textMuted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text border-b pb-3 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Todos los Seguimientos ({contact.name})
            </h3>
            
            <div className="space-y-3">
              {tasks.map((task) => {
                const typeInfo = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                const Icon = typeInfo.icon;
                const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                const statusInfo = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
                const isOverdue = checkIsOverdue(task);

                return (
                  <div 
                    key={task.id} 
                    className={`p-3 border rounded-lg flex items-center justify-between gap-4 text-xs font-medium transition-colors ${
                      isOverdue ? 'bg-red-50/20 border-red-200' : 'bg-background border-border'
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      <div className="font-bold text-text truncate" title={task.title}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-textMuted truncate">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="inline-flex items-center gap-1 text-textMuted">
                          <Icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                          {typeInfo.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        {task.due_date && (
                          <span className={`${isOverdue ? 'text-red-600 font-bold' : 'text-textMuted'}`}>
                            {isOverdue ? 'Vencido: ' : 'Vence: '}
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
          </div>
        </div>
      )}

      {/* C. MODAL: HISTORIAL COMPLETO DE ACTIVIDADES */}
      {showAllActivities && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl p-6 relative">
            <button
              onClick={() => setShowAllActivities(false)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 text-textMuted hover:text-text"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text border-b pb-3 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Historial Completo de Actividad ({contact.name})
            </h3>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 text-[10px] font-bold uppercase tracking-wider border-b">
              {['all', 'oportunidades', 'seguimientos', 'notas', 'etapas'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-3 py-1.5 rounded-full border transition-all ${
                    activityFilter === filter
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-textMuted border-border hover:bg-gray-50'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : filter}
                </button>
              ))}
            </div>

            {filteredActivities.length === 0 ? (
              <p className="text-xs text-textMuted italic text-center py-8">No se encontraron movimientos para esta categoría</p>
            ) : (
              <div className="relative border-l border-border pl-4 ml-2 space-y-5 text-xs font-medium">
                {filteredActivities.map((act) => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-[23px] top-0.5 bg-white p-0.5 rounded-full border border-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                    </span>
                    <div>
                      <p className="text-text font-bold">{act.display_text}</p>
                      {act.description && act.action_type !== 'created' && act.action_type !== 'stage_change' && (
                        <p className="text-textMuted font-medium mt-0.5">{act.description}</p>
                      )}
                      <p className="text-[10px] text-textMuted font-semibold mt-1 flex items-center gap-2">
                        {act.opportunity_title && (
                          <span className="bg-gray-100 text-gray-600 px-1 rounded">
                            {act.opportunity_title}
                          </span>
                        )}
                        <span>{new Date(act.created_at).toLocaleString('es-MX')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskModal && (
        <TaskForm
          task={editingTask}
          contactId={contact.id}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            loadTasks(contact.id);
            loadActivities(contact.id);
          }}
        />
      )}
    </div>
  );
}
