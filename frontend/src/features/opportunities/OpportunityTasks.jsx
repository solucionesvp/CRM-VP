import { useState, useEffect } from 'react';
import { Phone, MessageSquare, FileText, MapPin, Activity, CreditCard, Truck, CheckSquare, CheckCircle, Trash2 } from 'lucide-react';
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

export default function OpportunityTasks({ opportunityId, contactId }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = async () => {
    if (!opportunityId) return;
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/tasks`);
      if (!response.ok) throw new Error('Error al obtener la lista de seguimientos');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

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

  return (
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

      {showTaskModal && (
        <TaskForm
          task={editingTask}
          contactId={contactId}
          opportunityId={opportunityId}
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
