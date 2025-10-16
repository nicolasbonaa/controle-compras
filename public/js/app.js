/**
 * JavaScript Principal da Aplicação
 * Sistema de Controle de Compras de Equipamentos
 * Versão Node.js
 */

// Variáveis globais
let currentPage = 1;
let currentFilters = {};
let currentStatusMenuId = null;

// Configurações
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = '/api';

/**
 * Inicialização da aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializar aplicação
 */
function initializeApp() {
    setupEventListeners();
    loadStats();
    loadSolicitacoes();
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Formulário de criação
    const createForm = document.getElementById('create-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateSubmit);
    }

    // Formulário de busca
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }

    // Botão limpar filtros
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', clearFilters);
    }

    // Formulário de edição
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }

    // Fechar modal ao clicar no fundo
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditModal();
            }
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });

    // Fechar menus ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.relative')) {
            closeAllStatusMenus();
        }
    });
}

/**
 * Fazer requisições AJAX
 */
async function makeRequest(url, options = {}) {
    try {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

/**
 * Mostrar notificações
 */
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg mb-4 ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2"></i>
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(notification);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Carregar estatísticas
 */
async function loadStats() {
    try {
        const response = await makeRequest(`${API_BASE_URL}/solicitacoes/stats`);
        renderStats(response.data);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

/**
 * Renderizar estatísticas
 */
function renderStats(data) {
    const container = document.getElementById('stats-container');
    if (!container) return;

    const { stats, total } = data;
    
    const statusColors = {
        'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Em Andamento': 'bg-blue-100 text-blue-800 border-blue-200',
        'Comprado': 'bg-green-100 text-green-800 border-green-200',
        'Cancelado': 'bg-red-100 text-red-800 border-red-200'
    };

    let html = `
        <div class="bg-white p-6 rounded-lg shadow-sm border">
            <div class="flex items-center">
                <div class="p-3 rounded-full bg-blue-100">
                    <i class="fas fa-shopping-cart text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Total</p>
                    <p class="text-2xl font-semibold text-gray-900">${total}</p>
                </div>
            </div>
        </div>
    `;

    stats.forEach(stat => {
        const colorClass = statusColors[stat.status] || 'bg-gray-100 text-gray-800 border-gray-200';
        html += `
            <div class="bg-white p-6 rounded-lg shadow-sm border">
                <div class="flex items-center">
                    <div class="p-3 rounded-full ${colorClass}">
                        <i class="fas fa-circle text-sm"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">${stat.status}</p>
                        <p class="text-2xl font-semibold text-gray-900">${stat.quantidade}</p>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Carregar solicitações
 */
async function loadSolicitacoes(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: ITEMS_PER_PAGE.toString(),
            ...filters
        });

        const response = await makeRequest(`${API_BASE_URL}/solicitacoes?${params}`);
        renderSolicitacoes(response.data);
        
        currentPage = page;
        currentFilters = filters;
        
    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        showError();
    }
}

/**
 * Mostrar loading
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('solicitacoes-table').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

/**
 * Mostrar erro
 */
function showError() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('solicitacoes-table').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

/**
 * Renderizar solicitações
 */
function renderSolicitacoes(data) {
    const { solicitacoes, pagination } = data;
    
    document.getElementById('loading').classList.add('hidden');
    
    // Atualizar contador
    const totalCount = document.getElementById('total-count');
    if (totalCount) {
        const text = pagination.total_items > 0 
            ? `(${pagination.total_items} encontrada${pagination.total_items > 1 ? 's' : ''})`
            : '';
        totalCount.textContent = text;
    }

    if (solicitacoes.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
        document.getElementById('solicitacoes-table').classList.add('hidden');
        document.getElementById('pagination').classList.add('hidden');
        return;
    }

    // Renderizar tabela
    const tbody = document.getElementById('solicitacoes-tbody');
    if (tbody) {
        tbody.innerHTML = solicitacoes.map(solicitacao => renderSolicitacaoRow(solicitacao)).join('');
    }

    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('solicitacoes-table').classList.remove('hidden');

    // Renderizar paginação
    renderPagination(pagination);
}

/**
 * Renderizar linha da solicitação
 */
function renderSolicitacaoRow(solicitacao) {
    const statusClass = getStatusClass(solicitacao.status);
    const formattedDate = formatDate(solicitacao.data_solicitacao);

    return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${solicitacao.id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${escapeHtml(solicitacao.nome_pessoa)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${escapeHtml(solicitacao.setor)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${escapeHtml(solicitacao.centro_custo)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                ${escapeHtml(solicitacao.equipamento)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formattedDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="relative">
                    <button onclick="toggleStatusMenu(${solicitacao.id})" 
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} hover:opacity-80 transition-opacity">
                        ${escapeHtml(solicitacao.status)}
                        <i class="fas fa-chevron-down ml-1"></i>
                    </button>
                    <div id="status-menu-${solicitacao.id}" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden">
                        <div class="py-1">
                            <button onclick="updateStatus(${solicitacao.id}, 'Pendente')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pendente</button>
                            <button onclick="updateStatus(${solicitacao.id}, 'Em Andamento')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Em Andamento</button>
                            <button onclick="updateStatus(${solicitacao.id}, 'Comprado')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Comprado</button>
                            <button onclick="updateStatus(${solicitacao.id}, 'Cancelado')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancelado</button>
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="editSolicitacao(${solicitacao.id})" 
                            class="text-blue-600 hover:text-blue-900 transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSolicitacao(${solicitacao.id})" 
                            class="text-red-600 hover:text-red-900 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Renderizar paginação
 */
function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container) return;

    if (pagination.total_pages <= 1) {
        container.classList.add('hidden');
        return;
    }

    let html = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                Mostrando página ${pagination.current_page} de ${pagination.total_pages} 
                (${pagination.total_items} total)
            </div>
            <div class="flex space-x-2">
    `;

    // Botão anterior
    if (pagination.has_previous) {
        html += `
            <button onclick="loadSolicitacoes(${pagination.current_page - 1}, currentFilters)" 
                    class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <i class="fas fa-chevron-left mr-1"></i>Anterior
            </button>
        `;
    }

    // Números das páginas
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === pagination.current_page;
        html += `
            <button onclick="loadSolicitacoes(${i}, currentFilters)" 
                    class="px-3 py-2 text-sm ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-md">
                ${i}
            </button>
        `;
    }

    // Botão próximo
    if (pagination.has_next) {
        html += `
            <button onclick="loadSolicitacoes(${pagination.current_page + 1}, currentFilters)" 
                    class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Próximo<i class="fas fa-chevron-right ml-1"></i>
            </button>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.classList.remove('hidden');
}

/**
 * Manipuladores de eventos
 */

// Criar solicitação
async function handleCreateSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        await makeRequest(`${API_BASE_URL}/solicitacoes`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        showNotification('Solicitação criada com sucesso!');
        e.target.reset();
        loadSolicitacoes(1, currentFilters);
        loadStats();
    } catch (error) {
        showNotification(`Erro ao criar solicitação: ${error.message}`, 'error');
    }
}

// Buscar solicitações
function handleSearchSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const filters = {};
    
    for (const [key, value] of formData.entries()) {
        if (value.trim()) {
            filters[key] = value.trim();
        }
    }

    loadSolicitacoes(1, filters);
}

// Limpar filtros
function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('setor-filter').value = '';
    document.getElementById('status-filter').value = '';
    loadSolicitacoes(1, {});
}

// Editar solicitação
async function editSolicitacao(id) {
    try {
        const response = await makeRequest(`${API_BASE_URL}/solicitacoes/${id}`);
        const data = response.data;

        // Preencher formulário
        document.getElementById('edit_id').value = data.id;
        document.getElementById('edit_nome_pessoa').value = data.nome_pessoa;
        document.getElementById('edit_setor').value = data.setor;
        document.getElementById('edit_centro_custo').value = data.centro_custo;
        document.getElementById('edit_equipamento').value = data.equipamento;
        document.getElementById('edit_status').value = data.status;

        // Mostrar modal
        document.getElementById('editModal').classList.remove('hidden');
    } catch (error) {
        showNotification(`Erro ao carregar dados da solicitação: ${error.message}`, 'error');
    }
}

// Salvar edição
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;
    delete data.id;

    try {
        await makeRequest(`${API_BASE_URL}/solicitacoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        showNotification('Solicitação atualizada com sucesso!');
        closeEditModal();
        loadSolicitacoes(currentPage, currentFilters);
        loadStats();
    } catch (error) {
        showNotification(`Erro ao salvar alterações: ${error.message}`, 'error');
    }
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Alternar menu de status
function toggleStatusMenu(id) {
    closeAllStatusMenus();
    const menu = document.getElementById(`status-menu-${id}`);
    if (menu) {
        menu.classList.toggle('hidden');
        currentStatusMenuId = menu.classList.contains('hidden') ? null : id;
    }
}

// Fechar todos os menus de status
function closeAllStatusMenus() {
    if (currentStatusMenuId) {
        const menu = document.getElementById(`status-menu-${currentStatusMenuId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        currentStatusMenuId = null;
    }
}

// Atualizar status
async function updateStatus(id, status) {
    try {
        const csrfToken = document.querySelector('input[name="csrf_token"]').value;
        
        await makeRequest(`${API_BASE_URL}/solicitacoes/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, csrf_token: csrfToken })
        });

        showNotification('Status atualizado com sucesso!');
        closeAllStatusMenus();
        loadSolicitacoes(currentPage, currentFilters);
        loadStats();
    } catch (error) {
        showNotification(`Erro ao atualizar status: ${error.message}`, 'error');
    }
}

// Excluir solicitação
async function deleteSolicitacao(id) {
    if (!confirm('Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const csrfToken = document.querySelector('input[name="csrf_token"]').value;
        
        await makeRequest(`${API_BASE_URL}/solicitacoes/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ csrf_token: csrfToken })
        });

        showNotification('Solicitação excluída com sucesso!');
        loadSolicitacoes(currentPage, currentFilters);
        loadStats();
    } catch (error) {
        showNotification(`Erro ao excluir solicitação: ${error.message}`, 'error');
    }
}

/**
 * Funções utilitárias
 */

// Escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Obter classe CSS do status
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'pendente':
            return 'bg-yellow-100 text-yellow-800';
        case 'comprado':
            return 'bg-green-100 text-green-800';
        case 'cancelado':
            return 'bg-red-100 text-red-800';
        case 'em andamento':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
