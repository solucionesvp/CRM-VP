const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

// Helper to handle API response and extract detailed backend errors
async function handleResponse(response, defaultMsg) {
  if (!response.ok) {
    let errorDetail = defaultMsg;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch (e) {
      // JSON parsing failed or body empty
    }
    throw new Error(errorDetail);
  }
  if (response.status === 204) {
    return true;
  }
  return response.json();
}

// --- Contacts API ---
export async function fetchContacts({ page = 1, size = 10, q = '', assigned_to = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (q) params.append('q', q);
  if (assigned_to) params.append('assigned_to', assigned_to);

  const response = await fetch(`${API_BASE_URL}/contacts/?${params.toString()}`);
  return handleResponse(response, 'Error al obtener la lista de contactos');
}

export async function fetchContactById(contactId) {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`);
  return handleResponse(response, 'Error al obtener detalles del contacto');
}

export async function createContact(data) {
  const response = await fetch(`${API_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear el contacto');
}

export async function updateContact(contactId, data) {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar el contacto');
}

export async function deleteContact(contactId) {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al eliminar el contacto');
}

// --- Opportunities API ---
export async function fetchContactOpportunities(contactId, page = 1, size = 20) {
  const params = new URLSearchParams();
  params.append('contact_id', contactId);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const response = await fetch(`${API_BASE_URL}/opportunities/?${params.toString()}`);
  return handleResponse(response, 'Error al obtener las oportunidades del contacto');
}

export async function fetchAllOpportunities({ page = 1, size = 50, pipeline_id = '', stage_id = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (pipeline_id) params.append('pipeline_id', pipeline_id.toString());
  if (stage_id) params.append('stage_id', stage_id.toString());

  const response = await fetch(`${API_BASE_URL}/opportunities/?${params.toString()}`);
  return handleResponse(response, 'Error al obtener la lista global de oportunidades');
}

export async function createOpportunity(data) {
  const response = await fetch(`${API_BASE_URL}/opportunities/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear la oportunidad');
}

export async function updateOpportunityStage(oppId, stageId) {
  const response = await fetch(`${API_BASE_URL}/opportunities/${oppId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stage_id: stageId }),
  });
  return handleResponse(response, 'Error al actualizar la etapa de la oportunidad');
}

export async function deleteOpportunity(oppId) {
  const response = await fetch(`${API_BASE_URL}/opportunities/${oppId}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al eliminar la oportunidad');
}

// --- Pipelines CRUD API ---
export async function fetchPipelines() {
  const response = await fetch(`${API_BASE_URL}/pipelines/`);
  return handleResponse(response, 'Error al obtener la lista de pipelines');
}

export async function createPipeline(data) {
  const response = await fetch(`${API_BASE_URL}/pipelines/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear el pipeline');
}

export async function updatePipeline(id, data) {
  const response = await fetch(`${API_BASE_URL}/pipelines/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar el pipeline');
}

export async function deletePipeline(id) {
  const response = await fetch(`${API_BASE_URL}/pipelines/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al desactivar el pipeline');
}

// --- Stages CRUD API ---
export async function fetchStages(pipelineId = null) {
  const params = new URLSearchParams();
  if (pipelineId !== null && pipelineId !== undefined) {
    params.append('pipeline_id', pipelineId.toString());
  }
  const response = await fetch(`${API_BASE_URL}/stages/?${params.toString()}`);
  return handleResponse(response, 'Error al obtener la lista de etapas');
}

export async function createStage(data) {
  const response = await fetch(`${API_BASE_URL}/stages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear la etapa');
}

export async function updateStage(id, data) {
  const response = await fetch(`${API_BASE_URL}/stages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar la etapa');
}

export async function deleteStage(id) {
  const response = await fetch(`${API_BASE_URL}/stages/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al desactivar la etapa');
}

// --- Global Search API ---
export async function fetchGlobalSearch(q) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);

  const response = await fetch(`${API_BASE_URL}/search/?${params.toString()}`);
  return handleResponse(response, 'Error al realizar la búsqueda global');
}

// --- Product/Services API ---
export async function fetchProductServices({ active_only = false, search = '' } = {}) {
  const params = new URLSearchParams();
  if (active_only) params.append('active_only', 'true');
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/product-services?${params.toString()}`);
  return handleResponse(response, 'Error al obtener productos y servicios');
}

export async function createProductService(data) {
  const response = await fetch(`${API_BASE_URL}/product-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear producto o servicio');
}

export async function updateProductService(id, data) {
  const response = await fetch(`${API_BASE_URL}/product-services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar producto o servicio');
}

export async function deleteProductService(id) {
  const response = await fetch(`${API_BASE_URL}/product-services/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al desactivar/eliminar producto o servicio');
}

// --- Contact Activities API ---
export async function fetchContactActivities(contactId) {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/activities`);
  return handleResponse(response, 'Error al obtener actividades del contacto');
}

// --- Conversations API ---
export async function fetchConversations({ status = '', department = '', bot_active = '', search = '', page = 1, size = 30 } = {}) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  if (status) params.append('status', status);
  if (department) params.append('assigned_department', department);
  if (bot_active !== '') params.append('bot_active', bot_active);
  if (search) params.append('search', search);
  const response = await fetch(`${API_BASE_URL}/conversations/?${params}`);
  return handleResponse(response, 'Error al obtener conversaciones');
}

export async function fetchConversationById(id) {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`);
  return handleResponse(response, 'Error al obtener conversación');
}

export async function fetchConversationMessages(id, page = 1, size = 200) {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}/messages?page=${page}&size=${size}`);
  return handleResponse(response, 'Error al obtener mensajes');
}

export async function sendConversationMessage(id, text) {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return handleResponse(response, 'Error al enviar mensaje');
}

export async function updateConversation(id, data) {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar conversación');
}

export async function assignConversation(id, department, userId) {
  const body = {};
  if (department) body.department = department;
  if (userId) body.user_id = userId;
  const response = await fetch(`${API_BASE_URL}/conversations/${id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response, 'Error al asignar conversación');
}

export async function createConversationOpportunity(id, data) {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear oportunidad');
}

// --- Departments API ---
export async function fetchDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments/`);
  return handleResponse(response, 'Error al obtener departamentos');
}

export async function createDepartment(data) {
  const response = await fetch(`${API_BASE_URL}/departments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear departamento');
}

export async function updateDepartment(id, data) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar departamento');
}

export async function deleteDepartment(id) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, { method: 'DELETE' });
  return handleResponse(response, 'Error al eliminar departamento');
}

// --- WhatsApp API ---
export async function fetchWhatsAppStatus() {
  const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
  return handleResponse(response, 'Error al obtener el estado de WhatsApp');
}

export async function connectWhatsApp(phoneNumber) {
  const response = await fetch(`${API_BASE_URL}/whatsapp/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
  return handleResponse(response, 'Error al conectar con WhatsApp');
}

// --- Tags API ---
export async function fetchTags() {
  const response = await fetch(`${API_BASE_URL}/tags/?include_inactive=true`);
  return handleResponse(response, 'Error al obtener las etiquetas');
}

export async function createTag(data) {
  const response = await fetch(`${API_BASE_URL}/tags/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al crear la etiqueta');
}

export async function updateTag(id, data) {
  const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response, 'Error al actualizar la etiqueta');
}

export async function deleteTag(id) {
  const response = await fetch(`${API_BASE_URL}/tags/${id}`, { method: 'DELETE' });
  return handleResponse(response, 'Error al desactivar la etiqueta');
}

export async function fetchContactTags(contactId) {
  const response = await fetch(`${API_BASE_URL}/tags/contact/${contactId}`);
  return handleResponse(response, 'Error al obtener las etiquetas del contacto');
}

export async function assignContactTags(contactId, tagIds, assignedBy = 'agent') {
  const response = await fetch(`${API_BASE_URL}/tags/contact/${contactId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_ids: tagIds, assigned_by: assignedBy }),
  });
  return handleResponse(response, 'Error al asignar las etiquetas al contacto');
}

export async function removeContactTag(contactId, tagId) {
  const response = await fetch(`${API_BASE_URL}/tags/contact/${contactId}/${tagId}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Error al remover la etiqueta del contacto');
}


