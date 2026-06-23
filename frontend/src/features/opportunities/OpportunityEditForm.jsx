/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { fetchPipelines, fetchStages, createOpportunity, fetchProductServices, fetchContacts } from '../../lib/api';
import OpportunityFormFields from './OpportunityFormFields';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

export default function OpportunityEditForm({ contactId: initialContactId, opportunity = null, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [productServiceId, setProductServiceId] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [contactId, setContactId] = useState(initialContactId || '');
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [productServices, setProductServices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

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
        if (!opportunity && pipelinesData.length > 0) {
          const firstPipelineId = pipelinesData[0].id.toString();
          setPipelineId(firstPipelineId);
          const firstPipelineStages = stagesData.filter(s => s.pipeline_id.toString() === firstPipelineId);
          if (firstPipelineStages.length > 0) {
            setStageId(firstPipelineStages[0].id.toString());
          } else {
            setStageId('');
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
    } else {
      setTitle('');
      setProductInterest('');
      setProductServiceId('');
      setExpectedValue('');
      setPriority('medium');
      setExpectedCloseDate('');
      setContactId(initialContactId || '');
    }
  }, [opportunity, initialContactId]);

  const handlePipelineChange = (newPipelineId) => {
    setPipelineId(newPipelineId);
    if (!newPipelineId) {
      setStageId('');
      return;
    }
    const pipelineStages = stages.filter(s => s.pipeline_id.toString() === newPipelineId.toString());
    setStageId(pipelineStages.length > 0 ? pipelineStages[0].id.toString() : '');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'El título de la oportunidad es obligatorio';
    if (!productInterest.trim()) newErrors.product_interest = 'El equipo/producto de interés es obligatorio';
    if (!pipelineId) newErrors.pipeline_id = 'Debes seleccionar un pipeline';
    if (!stageId) newErrors.stage_id = 'Debes seleccionar una etapa inicial';
    if (!contactId) newErrors.contact_id = 'Debes seleccionar un contacto relacionado';
    if (expectedValue && isNaN(Number(expectedValue))) newErrors.expected_value = 'El valor estimado debe ser un número válido';
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
      product_service_id: productServiceId || null,
      pipeline_id: parseInt(pipelineId),
      stage_id: parseInt(stageId),
      expected_value: expectedValue.trim() ? parseFloat(expectedValue) : null,
      priority,
      expected_close_date: expectedCloseDate || null,
    };
    try {
      let saved;
      if (opportunity) {
        const url = `${API_BASE_URL}/opportunities/${opportunity.id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded p-2.5 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <OpportunityFormFields
          initialContactId={initialContactId}
          contactId={contactId}
          setContactId={setContactId}
          contacts={contacts}
          loadingContacts={loadingContacts}
          title={title}
          setTitle={setTitle}
          productServiceId={productServiceId}
          setProductServiceId={setProductServiceId}
          productServices={productServices}
          productInterest={productInterest}
          setProductInterest={setProductInterest}
          pipelineId={pipelineId}
          handlePipelineChange={handlePipelineChange}
          pipelines={pipelines}
          stageId={stageId}
          setStageId={setStageId}
          stages={stages}
          expectedValue={expectedValue}
          setExpectedValue={setExpectedValue}
          priority={priority}
          setPriority={setPriority}
          expectedCloseDate={expectedCloseDate}
          setExpectedCloseDate={setExpectedCloseDate}
          errors={errors}
        />
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
    </div>
  );
}
