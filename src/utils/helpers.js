/**
 * Funções utilitárias para o Sistema de Controle de Compras
 * Equivalente ao arquivo functions.php do projeto PHP
 */

const crypto = require('crypto');

/**
 * Gera um token CSRF
 * @returns {string} - Token CSRF
 */
function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifica o token CSRF
 * @param {string} token - Token a ser verificado
 * @param {string} sessionToken - Token da sessão
 * @returns {boolean} - True se válido
 */
function verifyCSRFToken(token, sessionToken) {
    if (!token || !sessionToken) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}

/**
 * Sanitiza dados de entrada
 * @param {any} data - Dados para sanitizar
 * @returns {any} - Dados sanitizados
 */
function sanitizeInput(data) {
    if (typeof data === 'string') {
        return data.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(data)) {
        return data.map(sanitizeInput);
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Valida se todos os campos obrigatórios estão preenchidos
 * @param {Object} data - Dados para validar
 * @param {Array} required - Campos obrigatórios
 * @returns {Array} - Array de erros
 */
function validateRequiredFields(data, required) {
    const errors = [];
    for (const field of required) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`O campo '${field}' é obrigatório`);
        }
    }
    return errors;
}

/**
 * Formata data para exibição
 * @param {Date|string} date - Data para formatar
 * @param {string} format - Formato desejado ('pt-BR' por padrão)
 * @returns {string} - Data formatada
 */
function formatDate(date, format = 'pt-BR') {
    if (!date) return '';
    
    try {
        const dateObj = new Date(date);
        
        if (format === 'pt-BR') {
            return dateObj.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return dateObj.toISOString();
    } catch (error) {
        console.error('❌ Erro ao formatar data:', error.message);
        return date.toString();
    }
}

/**
 * Gera opções HTML para select
 * @param {Object} options - Opções do select
 * @param {string} selected - Valor selecionado
 * @returns {string} - HTML das opções
 */
function generateSelectOptions(options, selected = null) {
    let html = '';
    for (const [value, label] of Object.entries(options)) {
        const selectedAttr = (value === selected) ? 'selected' : '';
        html += `<option value="${escapeHtml(value)}" ${selectedAttr}>${escapeHtml(label)}</option>`;
    }
    return html;
}

/**
 * Gera classe CSS baseada no status
 * @param {string} status - Status da solicitação
 * @returns {string} - Classes CSS
 */
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

/**
 * Valida email
 * @param {string} email - Email para validar
 * @returns {boolean} - True se válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Log de erros personalizado
 * @param {string} message - Mensagem de erro
 * @param {Object} context - Contexto adicional
 */
function logError(message, context = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    
    if (Object.keys(context).length > 0) {
        console.error(logMessage, context);
    } else {
        console.error(logMessage);
    }
}

/**
 * Paginação simples
 * @param {number} totalItems - Total de itens
 * @param {number} itemsPerPage - Itens por página
 * @param {number} currentPage - Página atual
 * @returns {Object} - Dados de paginação
 */
function paginate(totalItems, itemsPerPage, currentPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
    const offset = (validCurrentPage - 1) * itemsPerPage;
    
    return {
        total_pages: totalPages,
        current_page: validCurrentPage,
        offset: offset,
        limit: itemsPerPage,
        has_previous: validCurrentPage > 1,
        has_next: validCurrentPage < totalPages,
        total_items: totalItems
    };
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto para escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Gera um ID único
 * @returns {string} - ID único
 */
function generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Converte string para maiúsculo e remove espaços extras
 * @param {string} str - String para processar
 * @returns {string} - String processada
 */
function normalizeString(str) {
    if (typeof str !== 'string') {
        return str;
    }
    return str.trim().toUpperCase();
}

/**
 * Valida se um valor está em uma lista de valores permitidos
 * @param {any} value - Valor para validar
 * @param {Array} allowedValues - Valores permitidos
 * @returns {boolean} - True se válido
 */
function isValidValue(value, allowedValues) {
    return allowedValues.includes(value);
}

/**
 * Cria uma resposta de erro padronizada
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código de status HTTP
 * @param {Object} details - Detalhes adicionais
 * @returns {Object} - Objeto de erro
 */
function createErrorResponse(message, statusCode = 500, details = {}) {
    return {
        success: false,
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
        ...details
    };
}

/**
 * Cria uma resposta de sucesso padronizada
 * @param {any} data - Dados da resposta
 * @param {string} message - Mensagem de sucesso
 * @returns {Object} - Objeto de sucesso
 */
function createSuccessResponse(data, message = 'Operação realizada com sucesso') {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
}

/**
 * Middleware para capturar erros assíncronos
 * @param {Function} fn - Função assíncrona
 * @returns {Function} - Middleware do Express
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Delay assíncrono (para testes ou rate limiting)
 * @param {number} ms - Milissegundos para aguardar
 * @returns {Promise} - Promise que resolve após o delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lista de setores disponíveis (equivalente ao array do PHP)
 */
const SETORES = {
    'SAESHIA do Sucesso - Graduação': 'SAESHIA do Sucesso - Graduação',
    'SAESHIA do Sucesso - Pós-Graduação': 'SAESHIA do Sucesso - Pós-Graduação',
    'SAESHIA do Propósito': 'SAESHIA do Propósito',
    'SAESHIA das Experiências': 'SAESHIA das Experiências',
    'SAESHIA da Engenharia da Aprendizagem': 'SAESHIA da Engenharia da Aprendizagem',
    'SAESHIA da Oportunidade': 'SAESHIA da Oportunidade',
    'SAESHIA da União': 'SAESHIA da União',
    'SAESHIA da Magia': 'SAESHIA da Magia',
    'SAESHIA do Equilibrio': 'SAESHIA do Equilibrio',
    'SAESHIA da Integridade': 'SAESHIA da Integridade',
    'SAESHIA da Gente': 'SAESHIA da Gente',
    'SAESHIA da Segurança': 'SAESHIA da Segurança',
    'SAESHIA da Imaginação': 'SAESHIA da Imaginação',
    'SAESHIA da Conquista': 'SAESHIA da Conquista',
    'SAESHIA da Ciência': 'SAESHIA da Ciência',
    'Polo Joinville': 'Polo Joinville',
    'Conectativo': 'Conectativo',
    'Medicina': 'Medicina'
};

/**
 * Lista de status disponíveis
 */
const STATUS_OPTIONS = {
    'Pendente': 'Pendente',
    'Em Andamento': 'Em Andamento',
    'Comprado': 'Comprado',
    'Cancelado': 'Cancelado'
};

module.exports = {
    generateCSRFToken,
    verifyCSRFToken,
    sanitizeInput,
    validateRequiredFields,
    formatDate,
    generateSelectOptions,
    getStatusClass,
    isValidEmail,
    logError,
    paginate,
    escapeHtml,
    generateUniqueId,
    normalizeString,
    isValidValue,
    createErrorResponse,
    createSuccessResponse,
    asyncHandler,
    delay,
    SETORES,
    STATUS_OPTIONS
};
