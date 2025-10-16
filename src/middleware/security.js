/**
 * Middleware de Segurança
 * Implementa CSRF, validação e outras medidas de segurança
 */

const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { 
    generateCSRFToken, 
    verifyCSRFToken, 
    createErrorResponse,
    logError 
} = require('../utils/helpers');

/**
 * Middleware de Rate Limiting
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return rateLimit({
        windowMs,
        max,
        message: createErrorResponse(
            'Muitas requisições. Tente novamente mais tarde.',
            429
        ),
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logError(`Rate limit excedido para IP: ${req.ip}`);
            res.status(429).json(createErrorResponse(
                'Muitas requisições. Tente novamente mais tarde.',
                429
            ));
        }
    });
};

/**
 * Rate limiters específicos
 */
const rateLimiters = {
    // Rate limiter geral (mais permissivo)
    general: createRateLimiter(15 * 60 * 1000, 100), // 100 req/15min
    
    // Rate limiter para APIs (mais restritivo)
    api: createRateLimiter(15 * 60 * 1000, 50), // 50 req/15min
    
    // Rate limiter para criação/modificação (muito restritivo)
    strict: createRateLimiter(15 * 60 * 1000, 20) // 20 req/15min
};

/**
 * Middleware de CSRF Token
 */
const csrfProtection = (req, res, next) => {
    // Pular verificação CSRF para métodos GET, HEAD, OPTIONS
    const token = req.body.csrf_token || req.headers['x-csrf-token']; // Esta linha já está correta
    const sessionToken = req.session?.csrfToken;
    if (!verifyCSRFToken(token, sessionToken)) {
        logError('Token CSRF inválido', { 
            ip: req.ip, 
            path: req.path,
            method: req.method 
        });
        
        return res.status(403).json(
            createErrorResponse('Token de segurança inválido', 403)
        );
    }

    next();
};

/**
 * Middleware para gerar token CSRF
 */
const generateCSRF = (req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    
    // Disponibilizar o token para as views
    res.locals.csrfToken = req.session.csrfToken;
    
    next();
};

/**
 * Middleware de validação de entrada
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        
        return res.status(400).json(
            createErrorResponse('Dados inválidos', 400, {
                errors: errorMessages
            })
        );
    }
    
    next();
};

/**
 * Validadores para solicitações
 */
const solicitacaoValidators = {
    create: [
        body('nome_pessoa')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Nome da pessoa é obrigatório e deve ter no máximo 255 caracteres'),
        
        body('setor')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Setor é obrigatório e deve ter no máximo 100 caracteres'),
        
        body('centro_custo')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Centro de custo é obrigatório e deve ter no máximo 50 caracteres'),
        
        body('equipamento')
            .trim()
            .isLength({ min: 1 })
            .withMessage('Equipamento é obrigatório'),
        
        body('status')
            .optional()
            .isIn(['Pendente', 'Em Andamento', 'Comprado', 'Cancelado'])
            .withMessage('Status inválido')
    ],
    
    update: [
        body('nome_pessoa')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Nome da pessoa deve ter no máximo 255 caracteres'),
        
        body('setor')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Setor deve ter no máximo 100 caracteres'),
        
        body('centro_custo')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Centro de custo deve ter no máximo 50 caracteres'),
        
        body('equipamento')
            .optional()
            .trim()
            .isLength({ min: 1 })
            .withMessage('Equipamento não pode estar vazio'),
        
        body('status')
            .optional()
            .isIn(['Pendente', 'Em Andamento', 'Comprado', 'Cancelado'])
            .withMessage('Status inválido')
    ],
    
    updateStatus: [
        body('status')
            .isIn(['Pendente', 'Em Andamento', 'Comprado', 'Cancelado'])
            .withMessage('Status é obrigatório e deve ser válido')
    ]
};

/**
 * Middleware de log de requisições
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        if (res.statusCode >= 400) {
            logError('Requisição com erro', logData);
        } else if (process.env.NODE_ENV === 'development') {
            console.log('📝 Requisição:', logData);
        }
    });
    
    next();
};

/**
 * Middleware de tratamento de erros
 */
const errorHandler = (error, req, res, next) => {
    logError('Erro não tratado:', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    // Erro de validação do banco de dados
    if (error.code === '23505') { // Unique violation
        return res.status(409).json(
            createErrorResponse('Dados duplicados', 409)
        );
    }
    
    // Erro de conexão com o banco
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json(
            createErrorResponse('Serviço temporariamente indisponível', 503)
        );
    }
    
    // Erro genérico
    const statusCode = error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : error.message;
    
    res.status(statusCode).json(
        createErrorResponse(message, statusCode)
    );
};

/**
 * Middleware para verificar se é uma requisição AJAX
 */
const requireAjax = (req, res, next) => {
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' ||
                   req.get('Content-Type') === 'application/json' ||
                   req.path.startsWith('/api/');
    
    if (!isAjax && !req.path.startsWith('/api/')) {
        return res.status(400).json(
            createErrorResponse('Requisição inválida', 400)
        );
    }
    
    next();
};

/**
 * Middleware de sanitização de entrada
 */
const sanitizeInput = (req, res, next) => {
    // Sanitizar query parameters
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
        }
    }
    
    // Sanitizar body parameters
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
        }
    }
    
    next();
};

module.exports = {
    rateLimiters,
    csrfProtection,
    generateCSRF,
    handleValidationErrors,
    solicitacaoValidators,
    requestLogger,
    errorHandler,
    requireAjax,
    sanitizeInput
};
