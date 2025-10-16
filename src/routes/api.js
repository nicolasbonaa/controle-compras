/**
 * Rotas da API para Solicitações de Compra
 * Equivalente aos endpoints do ajax.php do projeto PHP
 */

const express = require('express');
const router = express.Router();

const SolicitacaoController = require('../controllers/SolicitacaoController');
const { 
    rateLimiters, 
    csrfProtection, 
    handleValidationErrors, 
    solicitacaoValidators,
    requireAjax,
    sanitizeInput
} = require('../middleware/security');

// Middleware aplicado a todas as rotas da API
router.use(sanitizeInput);
router.use(rateLimiters.api);

/**
 * Rota de health check
 * GET /api/health
 */
router.get('/health', SolicitacaoController.health);

/**
 * Rotas para estatísticas
 * GET /api/solicitacoes/stats
 */
router.get('/solicitacoes/stats', SolicitacaoController.getStats);

/**
 * Rotas CRUD para solicitações
 */

// Listar todas as solicitações com filtros e paginação
// GET /api/solicitacoes
router.get('/solicitacoes', SolicitacaoController.getAll);

// Buscar solicitação por ID
// GET /api/solicitacoes/:id
router.get('/solicitacoes/:id', SolicitacaoController.getById);

// Criar nova solicitação
// POST /api/solicitacoes
router.post('/solicitacoes', 
    rateLimiters.strict,
    requireAjax,
    csrfProtection,
    solicitacaoValidators.create,
    handleValidationErrors,
    SolicitacaoController.create
);

// Atualizar solicitação completa
// PUT /api/solicitacoes/:id
router.put('/solicitacoes/:id',
    rateLimiters.strict,
    requireAjax,
    csrfProtection,
    solicitacaoValidators.update,
    handleValidationErrors,
    SolicitacaoController.update
);

// Atualizar apenas o status da solicitação
// PATCH /api/solicitacoes/:id/status
router.patch('/solicitacoes/:id/status',
    rateLimiters.strict,
    requireAjax,
    csrfProtection,
    solicitacaoValidators.updateStatus,
    handleValidationErrors,
    SolicitacaoController.updateStatus
);

// Excluir solicitação
// DELETE /api/solicitacoes/:id
router.delete('/solicitacoes/:id',
    rateLimiters.strict,
    requireAjax,
    csrfProtection,
    SolicitacaoController.delete
);

/**
 * Rotas administrativas
 */

// Criar/verificar tabela de solicitações
// POST /api/admin/create-table
router.post('/admin/create-table',
    rateLimiters.strict,
    csrfProtection,
    SolicitacaoController.createTable
);

/**
 * Middleware de tratamento de rotas não encontradas para a API
 */
router.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint da API não encontrado',
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
