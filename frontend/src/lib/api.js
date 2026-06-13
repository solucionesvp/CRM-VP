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
