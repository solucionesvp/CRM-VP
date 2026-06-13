/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Phone, MessageSquare, FileText, MapPin, Activity, CreditCard, Truck, CheckSquare, CheckCircle, Trash2 } from 'lucide-react';
import { fetchPipelines, fetchStages, createOpportunity, fetchProductServices, fetchContacts } from '../../lib/api';
import TaskForm from '../tasks/TaskForm';
import OpportunityActivityFeed from '../opportunities/OpportunityActivityFeed';

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

export default function OpportunityForm({ contactId: initialContactId, opportunity = null, onSave, onCancel }) {
  // Fields
  const [title, setTitle] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [productServiceId, setProductServiceId] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [contactId, setContactId] = useState(initialContactId || '');

  // Dropdown options loaded from backend
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [productServices, setProductServices] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Tasks States
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // States
  const [loadingData, setLoadingData] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const loadTasks = async () => {
    if (!opportunity?.id) return;
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${opportunity.id}/tasks`);
      if (!response.ok) throw new Error('Error al obtener la lista de seguimientos');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Load pipelines and stages dynamically
  useEffect(() => {
    async function loadOptions() {
      try {
        const [pipelinesData, stagesData, productsData] = await Promise.all([
          fetchPipelines(),
          fetchStages(),
          fetchProductServices({ active_only: true })
        ]);
        setPipelines(pipelinesData);
        setStages(stagesData);
        setProductServices(productsData);

        // Preselect first pipeline/stage on create mode
        if (!opportunity) {
          if (pipelinesData.length > 0) {
            const firstPipelineId = pipelinesData[0].id.toString();
            setPipelineId(firstPipelineId);
            const firstPipelineStages = stagesData.filter(s => s.pipeline_id.toString() === firstPipelineId);
            if (firstPipelineStages.length > 0) {
              setStageId(firstPipelineStages[0].id.toString());
            } else {
              setStageId('');
            }
          }
        }
      } catch (err) {
        setSubmitError('Error al cargar opciones desde el servidor: ' + err.message);
      } finally {
        setLoadingData(false);
      }
    }
    loadOptions();
  }, [opportunity]);

  // Load contacts if this is a global creation
  useEffect(() => {
    async function loadContacts() {
      if (!initialContactId) {
        setLoadingContacts(true);
        try {
          const data = await fetchContacts({ size: 100 });
          setContacts(data.items || data || []);
        } catch (err) {
          console.error("Error al cargar contactos:", err);
        } finally {
          setLoadingContacts(false);
        }
      }
    }
    loadContacts();
  }, [initialContactId]);

  // Load opportunity values if in edit mode
  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title || '');
      setProductInterest(opportunity.product_interest || '');
      setProductServiceId(opportunity.product_service_id || '');
      setPipelineId(opportunity.pipeline_id?.toString() || '');
      setStageId(opportunity.stage_id?.toString() || '');
      setExpectedValue(opportunity.expected_value?.toString() || '');
      setPriority(opportunity.priority || 'medium');
      setExpectedCloseDate(opportunity.expected_close_date ? opportunity.expected_close_date.split('T')[0] : '');
      setContactId(opportunity.contact_id || initialContactId || '');
      loadTasks();
    } else {
      setTitle('');
      setProductInterest('');
      setProductServiceId('');
      setExpectedValue('');
      setPriority('medium');
      setExpectedCloseDate('');
      setContactId(initialContactId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity, initialContactId]);

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al completar la tarea');
      loadTasks();
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
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePipelineChange = (newPipelineId) => {
    setPipelineId(newPipelineId);
    if (!newPipelineId) {
      setStageId('');
      return;
    }
    const pipelineStages = stages.filter(s => s.pipeline_id.toString() === newPipelineId.toString());
    if (pipelineStages.length > 0) {
      setStageId(pipelineStages[0].id.toString());
    } else {
      setStageId('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'El título de la oportunidad es obligatorio';
    }
    if (!productInterest.trim()) {
      newErrors.product_interest = 'El equipo/producto de interés es obligatorio';
    }
    if (!pipelineId) {
      newErrors.pipeline_id = 'Debes seleccionar un pipeline';
    }
    if (!stageId) {
      newErrors.stage_id = 'Debes seleccionar una etapa inicial';
    }
    if (!contactId) {
      newErrors.contact_id = 'Debes seleccionar un contacto relacionado';
    }
    if (expectedValue && isNaN(Number(expectedValue))) {
      newErrors.expected_value = 'El valor estimado debe ser un número válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      contact_id: contactId,
      title: title.trim(),
      product_interest: productInterest.trim(),
      product_service_id: productServiceId ? productServiceId : null,
      pipeline_id: parseInt(pipelineId),
      stage_id: parseInt(stageId),
      expected_value: expectedValue.trim() ? parseFloat(expectedValue) : null,
      priority,
      expected_close_date: expectedCloseDate || null,
    };

    try {
      let saved;
      if (opportunity) {
        // Fallback or update handling if needed, though createOpportunity was original action
        const url = `${API_BASE_URL}/opportunities/${opportunity.id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.detail || 'Error al actualizar la oportunidad.');
        }
        saved = await response.json();
      } else {
        saved = await createOpportunity(payload);
      }
      onSave(saved);
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar la oportunidad.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="border border-border rounded-lg p-6 bg-white space-y-4">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-textMuted text-center font-medium">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h3 className="font-bold text-sm text-text">
          {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-textMuted hover:text-text hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded p-2.5 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Contact Selector (only when initialContactId is not provided) */}
        {!initialContactId && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Contacto Relacionado *
            </label>
            {loadingContacts ? (
              <p className="text-[10px] text-textMuted">Cargando contactos...</p>
            ) : (
              <select
                value={contactId}
                required
                onChange={(e) => setContactId(e.target.value)}
                className={`w-full px-2 py-2 bg-background border rounded text-text font-medium focus:outline-none focus:ring-1 transition-all ${
                  errors.contact_id
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-border focus:border-primary focus:ring-primary/20'
                }`}
              >
                <option value="">-- Seleccionar Contacto --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.contact_id && <p className="text-[10px] text-red-500 mt-1">{errors.contact_id}</p>}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Título de la Oportunidad *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Compra de motobombas Evans"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.title
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Product / Catalog */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Catálogo Comercial (Opcional)
            </label>
            <select
              value={productServiceId}
              onChange={(e) => {
                setProductServiceId(e.target.value);
                const selected = productServices.find(p => p.id === e.target.value);
                if (selected && !productInterest) {
                  setProductInterest(selected.name);
                }
              }}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- Seleccionar --</option>
              {productServices.map(ps => (
                <option key={ps.id} value={ps.id}>{ps.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Detalle / Equipo de Interés *
            </label>
            <input
              type="text"
              value={productInterest}
              onChange={(e) => setProductInterest(e.target.value)}
              placeholder="Ej. Bomba Autocebante 3 HP Evans"
              className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
                errors.product_interest
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            {errors.product_interest && (
              <p className="text-[10px] text-red-500 mt-1">{errors.product_interest}</p>
            )}
          </div>
        </div>

        {/* Pipeline & Stage Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Pipeline *
            </label>
            <select
              value={pipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="" disabled>-- Seleccionar --</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Etapa Inicial *
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              disabled={!pipelineId}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
            >
              {stages.filter(s => s.pipeline_id.toString() === pipelineId.toString()).length === 0 && (
                <option value="">-- Sin etapas --</option>
              )}
              {stages
                .filter(s => s.pipeline_id.toString() === pipelineId.toString())
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Expected Value & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Valor Estimado (MXN)
            </label>
            <input
              type="text"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              placeholder="Ej. 12500"
              className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
                errors.expected_value
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            {errors.expected_value && (
              <p className="text-[10px] text-red-500 mt-1">{errors.expected_value}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        {/* Close Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Fecha Estimada de Cierre
          </label>
          <input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          />
        </div>

        {/* Seguimientos Section (Only visible when opportunity.id exists) */}
        {opportunity?.id && (
          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
                Seguimientos
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="px-2.5 py-1 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                + Seguimiento
              </button>
            </div>

            {loadingTasks ? (
              <p className="text-[10px] text-textMuted">Cargando seguimientos...</p>
            ) : tasksError ? (
              <p className="text-[10px] text-red-500">{tasksError}</p>
            ) : tasks.length === 0 ? (
              <p className="text-[10px] text-textMuted italic">Sin seguimientos aún</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const typeInfo = TYPE_STYLES[t.task_type] || TYPE_STYLES.general;
                  const Icon = typeInfo.icon;
                  const priorityInfo = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium;
                  const statusInfo = STATUS_STYLES[t.status] || STATUS_STYLES.pending;

                  return (
                    <div
                      key={t.id}
                      className="p-2 bg-background border border-border rounded flex items-center justify-between gap-3 text-[11px]"
                    >
                      <div className="overflow-hidden space-y-0.5">
                        <div className="font-bold text-text truncate flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${typeInfo.color}`} />
                          <span className="truncate">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                          <span className={`font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          {t.due_date && (
                            <span className={t.is_overdue ? 'text-red-600 font-bold' : 'text-textMuted'}>
                              {new Date(t.due_date).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          )}
                          <span className={`font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {t.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteTask(t.id)}
                            title="Completar"
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          title="Eliminar"
                          className="p-1 text-textMuted hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Historial de Actividad Section */}
        {opportunity?.id && (
          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
              Historial de Actividad
            </h4>
            <OpportunityActivityFeed opportunityId={opportunity.id} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      {/* Task Form Modal */}
      {showTaskModal && (
        <TaskForm
          task={editingTask}
          contactId={contactId}
          opportunityId={opportunity?.id}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}
