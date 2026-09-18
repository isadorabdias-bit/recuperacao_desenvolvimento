const API_URL = 'http://localhost/recuperacao_desenvolvimento/api.php';

const form = document.getElementById('maintenanceForm');
const requestsList = document.getElementById('requestsList');
const totalRequests = document.getElementById('totalRequests');
const searchInput = document.getElementById('searchInput');
const feedbackMessage = document.getElementById('feedbackMessage');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const statusLabels = {
  aberto: 'Aberto',
  emManutencao: 'Em manutenção',
  concluido: 'Concluído'
};

let requests = [];
let editingId = null;

function normalizeRequestId(id) {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatus(status) {
  const aliases = {
    aberta: 'aberto',
    emAndamento: 'emManutencao',
    concluida: 'concluido',
    Aberto: 'aberto',
    'Em manutenção': 'emManutencao',
    Concluído: 'concluido'
  };

  return aliases[status] || status || 'aberto';
}

async function loadRequestsFromApi() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erro ao buscar ocorrências: ${response.status}`);
    }

    const data = await response.json();

    requests = Array.isArray(data)
      ? data.map((request) => ({
          ...request,
          id: normalizeRequestId(request.id),
          status: normalizeStatus(request.status)
        }))
      : [];

    renderRequests();
  } catch (error) {
    showFeedback(`Não foi possível carregar as ocorrências: ${error.message}`, 'error');
    requests = [];
    renderRequests();
  }
}

async function saveRequests() {
  return;
}

function priorityClass(priority) {
  if (priority === 'Alta') return 'high';
  if (priority === 'Média') return 'medium';
  return 'low';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showFeedback(message, type) {
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback ${type}`;
}

function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = 'Nova ocorrência';
  submitBtn.textContent = 'Salvar ocorrência';
  cancelEditBtn.classList.add('hidden');
}

function getFormData() {
  return {
    equipment: document.getElementById('equipment').value.trim(),
    sector: document.getElementById('sector').value.trim(),
    description: document.getElementById('description').value.trim(),
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    responsible: document.getElementById('responsible').value.trim()
  };
}

function validateRequest(data) {
  const fields = ['equipment', 'sector', 'description', 'responsible'];

  for (const field of fields) {
    if (!data[field]) {
      return 'Preencha todos os campos obrigatórios antes de salvar.';
    }
  }

  if (data.description.length < 10) {
    return 'A descrição do problema deve ter pelo menos 10 caracteres.';
  }

  return '';
}

function renderRequests() {
  const term = searchInput.value.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    const searchable = [
      request.equipment,
      request.sector,
      request.description,
      request.responsible,
      statusLabels[request.status]
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(term);
  });

  totalRequests.textContent = `${filteredRequests.length} / ${requests.length}`;

  if (filteredRequests.length === 0) {
    requestsList.innerHTML = `
      <div class="empty-state">
        Nenhuma ocorrência encontrada.
      </div>
    `;
    return;
  }

  requestsList.innerHTML = filteredRequests
    .map(
      (request) => `
        <article class="request-card">
          <div class="request-top">
            <div class="request-equipment">${request.equipment}</div>
            <span class="status-badge status-${request.status}">${statusLabels[request.status]}</span>
          </div>

          <p class="request-info"><strong>Setor:</strong> ${request.sector}</p>
          <p class="request-info"><strong>Responsável:</strong> ${request.responsible}</p>
          <p class="request-info"><strong>Prioridade:</strong> ${request.priority}</p>
          <p class="request-info"><strong>Cadastrada em:</strong> ${formatDate(request.registered_at || request.date)}</p>

          <p class="request-description"><strong>Problema:</strong> ${request.description}</p>

          <div class="request-actions">
            <label class="status-selector">
              <span>Status</span>
              <select class="status-select" data-id="${request.id}">
                <option value="aberto" ${request.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                <option value="emManutencao" ${request.status === 'emManutencao' ? 'selected' : ''}>Em manutenção</option>
                <option value="concluido" ${request.status === 'concluido' ? 'selected' : ''}>Concluído</option>
              </select>
            </label>

            <div class="action-buttons">
              <button type="button" class="edit-button" data-action="edit" data-id="${request.id}">Editar</button>
              <button type="button" class="delete-button" data-action="delete" data-id="${request.id}">Excluir</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

function loadRequestToForm(requestId) {
  const request = requests.find((item) => normalizeRequestId(item.id) === requestId);

  if (!request) {
    return;
  }

  editingId = requestId;
  formTitle.textContent = 'Editar ocorrência';
  submitBtn.textContent = 'Atualizar ocorrência';
  cancelEditBtn.classList.remove('hidden');

  document.getElementById('equipment').value = request.equipment;
  document.getElementById('sector').value = request.sector;
  document.getElementById('description').value = request.description;
  document.getElementById('priority').value = request.priority;
  document.getElementById('status').value = request.status;
  document.getElementById('responsible').value = request.responsible;

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateStatus(requestId, newStatus) {
  try {
    const response = await fetch(`${API_URL}?id=${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao atualizar status.');
    }

    await loadRequestsFromApi();
    showFeedback('Status atualizado com sucesso!', 'success');
  } catch (error) {
    showFeedback(`Não foi possível atualizar o status: ${error.message}`, 'error');
  }
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const data = getFormData();
  const validationError = validateRequest(data);

  if (validationError) {
    showFeedback(validationError, 'error');
    return;
  }

  try {
    let response;

    if (editingId) {
      response = await fetch(`${API_URL}?id=${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao salvar a ocorrência.');
    }

    await loadRequestsFromApi();
    showFeedback(
      editingId ? 'Ocorrência atualizada com sucesso!' : 'Ocorrência cadastrada com sucesso!',
      'success'
    );
    resetForm();
  } catch (error) {
    showFeedback(`Não foi possível salvar a ocorrência: ${error.message}`, 'error');
  }
});

requestsList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const requestId = Number(button.dataset.id);

  if (button.dataset.action === 'edit') {
    loadRequestToForm(requestId);
    return;
  }

  if (button.dataset.action === 'delete') {
    const request = requests.find((item) => normalizeRequestId(item.id) === requestId);

    if (!request) {
      return;
    }

    const confirmed = window.confirm(`Deseja excluir a ocorrência de ${request.equipment}?`);

    if (!confirmed) {
      return;
    }

    fetch(`${API_URL}?id=${requestId}`, {
      method: 'DELETE'
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erro ao excluir a ocorrência.');
        }

        if (editingId === requestId) {
          resetForm();
        }

        return loadRequestsFromApi();
      })
      .then(() => {
        showFeedback('Ocorrência excluída com sucesso!', 'success');
      })
      .catch((error) => {
        showFeedback(`Não foi possível excluir a ocorrência: ${error.message}`, 'error');
      });
  }
});

requestsList.addEventListener('change', function (event) {
  const select = event.target.closest('.status-select');

  if (!select) {
    return;
  }

  updateStatus(Number(select.dataset.id), select.value);
});

searchInput.addEventListener('input', renderRequests);
cancelEditBtn.addEventListener('click', resetForm);

loadRequestsFromApi();
