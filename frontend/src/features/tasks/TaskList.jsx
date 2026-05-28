import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Edit2, Trash2, CheckCircle, Plus, Phone, MessageSquare, FileText, MapPin, Activity, CreditCard, Truck, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { fetchContacts, fetchAllOpportunities } from '../../lib/api';
import TaskForm from './TaskForm';

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

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [contactMap, setContactMap] = useState({});
  const [opportunityMap, setOpportunityMap] = useState({});

  // Filters State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dueToday, setDueToday] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [contactsData, oppsData] = await Promise.all([
          fetchContacts({ size: 100 }),
          fetchAllOpportunities({ size: 100 })
        ]);

        const cMap = {};
        if (contactsData?.items) {
          contactsData.items.forEach(c => { cMap[c.id] = c.name; });
        }
        setContactMap(cMap);

        const oMap = {};
        if (oppsData?.items) {
          oppsData.items.forEach(o => { oMap[o.id] = o.title; });
        }
        setOpportunityMap(oMap);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    }
    loadCatalogs();
  }, []);

  // Fetch Tasks from backend
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedType) params.append('task_type', selectedType);
      if (dueToday) params.append('due_today', 'true');

      const response = await fetch(`${API_BASE_URL}/tasks/?${params.toString()}`);
      if (!response.ok) throw new Error('Error al obtener la lista de tareas');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedStatus, selectedPriority, selectedType, dueToday]);

  const handleComplete = async (taskId) => {
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

  const handleDelete = async (taskId) => {
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

  const handleOpenCreate = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleFormSaved = () => {
    setShowModal(false);
    loadTasks();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Seguimientos de Venta</h2>
          <p className="text-xs text-textMuted mt-1">
            Planifica y supervisa llamadas, visitas, diagnósticos de taller y entregas para tus oportunidades.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold items-center">
        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer font-sans"
          >
            <option value="">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidos</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer font-sans"
          >
            <option value="">Todas las Prioridades</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer font-sans"
          >
            <option value="">Todos los Tipos</option>
            <option value="call">Llamada</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="quote_follow_up">Cotización</option>
            <option value="visit">Visita</option>
            <option value="diagnosis">Diagnóstico</option>
            <option value="payment">Pago</option>
            <option value="delivery">Entrega</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Due Today Switch */}
        <div className="flex justify-end md:justify-start">
          <button
            onClick={() => setDueToday(!dueToday)}
            className={`px-4 py-2 border rounded font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5 ${
              dueToday
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-textMuted border-border hover:bg-gray-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Hoy
          </button>
        </div>
      </div>

      {/* List Table */}
      {loading ? (
        <div className="bg-surface border border-border rounded-lg p-16 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-textMuted font-bold tracking-wide">Cargando tareas...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center text-sm text-red-600 font-bold">
          Error al obtener tareas: {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-16 text-center shadow-sm">
          <p className="text-base font-bold text-text mb-1">Sin seguimientos para los filtros seleccionados</p>
          <p className="text-xs text-textMuted">
            Ajusta los filtros o crea una nueva tarea para iniciar el seguimiento.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background text-textMuted text-xs font-bold uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-4">Título / Descripción</th>
                  <th className="px-6 py-4">Asociado a</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Prioridad</th>
                  <th className="px-6 py-4">Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {tasks.map((task) => {
                  const typeInfo = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                  const Icon = typeInfo.icon;
                  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                  const statusInfo = STATUS_STYLES[task.status] || STATUS_STYLES.pending;

                  const contactName = contactMap[task.contact_id];
                  const opportunityTitle = opportunityMap[task.opportunity_id];

                  return (
                    <tr key={task.id} className="hover:bg-primary/[0.01] transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-text truncate" title={task.title}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-textMuted font-medium truncate" title={task.description}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {opportunityTitle && (
                          <div className="font-bold text-text">Op: {opportunityTitle}</div>
                        )}
                        {contactName && (
                          <div className="text-textMuted">Cl: {contactName}</div>
                        )}
                        {!opportunityTitle && !contactName && <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-text">
                          <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {task.due_date ? (
                          <span className={`flex items-center gap-1 text-xs font-semibold ${task.is_overdue ? 'text-red-600 font-bold' : 'text-textMuted'}`}>
                            {task.is_overdue && <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
                            {new Date(task.due_date).toLocaleString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleComplete(task.id)}
                              title="Completar tarea"
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(task)}
                            title="Editar tarea"
                            className="p-1.5 text-textMuted hover:text-primary rounded hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            title="Eliminar tarea"
                            className="p-1.5 text-textMuted hover:text-red-600 rounded hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <TaskForm
          task={editingTask}
          onClose={() => setShowModal(false)}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
