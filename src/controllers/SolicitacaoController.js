/**
 * Controlador para Solicitações de Compra
 * Equivalente ao arquivo ajax.php do projeto PHP
 */

const SolicitacaoModel = require('../models/SolicitacaoModel');
const { 
    createSuccessResponse, 
    createErrorResponse, 
    sanitizeInput, 
    normalizeString,
    asyncHandler,
    logError,
    STATUS_OPTIONS
} = require('../utils/helpers');

class SolicitacaoController {
    /**
     * Buscar solicitação por ID
     * GET /api/solicitacoes/:id
     */
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json(
                createErrorResponse('ID da solicitação é obrigatório e deve ser um número', 400)
            );
        }

        const solicitacao = await SolicitacaoModel.getById(parseInt(id));

        if (!solicitacao) {
            return res.status(404).json(
                createErrorResponse('Solicitação não encontrada', 404)
            );
        }

        res.json(createSuccessResponse(solicitacao));
    });

    /**
     * Listar todas as solicitações com filtros e paginação
     * GET /api/solicitacoes
     */
    static getAll = asyncHandler(async (req, res) => {
        const {
            search = '',
            status = '',
            setor = '',
            page = 1,
            limit = 10,
            orderBy = 'data_solicitacao DESC'
        } = req.query;

        // Sanitizar e validar parâmetros
        const filters = {};
        if (search) filters.search = sanitizeInput(search);
        if (status) filters.status = sanitizeInput(status);
        if (setor) filters.setor = sanitizeInput(setor);

        const currentPage = Math.max(1, parseInt(page) || 1);
        const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Máximo 100 itens por página
        const offset = (currentPage - 1) * itemsPerPage;

        // Buscar dados
        const [solicitacoes, totalItems] = await Promise.all([
            SolicitacaoModel.getAll(filters, orderBy, itemsPerPage, offset),
            SolicitacaoModel.count(filters)
        ]);

        // Calcular paginação
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const pagination = {
            current_page: currentPage,
            total_pages: totalPages,
            total_items: totalItems,
            items_per_page: itemsPerPage,
            has_previous: currentPage > 1,
            has_next: currentPage < totalPages
        };

        res.json(createSuccessResponse({
            solicitacoes,
            pagination
        }));
    });

    /**
     * Criar nova solicitação
     * POST /api/solicitacoes
     */
    static create = asyncHandler(async (req, res) => {
        // Sanitizar dados de entrada
        const data = sanitizeInput(req.body);

        // Normalizar campos de texto
        if (data.nome_pessoa) data.nome_pessoa = normalizeString(data.nome_pessoa);
        if (data.equipamento) data.equipamento = normalizeString(data.equipamento);
        if (data.centro_custo) data.centro_custo = normalizeString(data.centro_custo);
        if (data.setor) data.setor = normalizeString(data.setor);

        // Validar dados
        const errors = SolicitacaoModel.validateData(data, false);
        if (errors.length > 0) {
            return res.status(400).json(
                createErrorResponse('Dados inválidos', 400, { errors })
            );
        }

        // Criar solicitação
        const id = await SolicitacaoModel.create(data);

        res.status(201).json(createSuccessResponse(
            { id },
            'Solicitação criada com sucesso'
        ));
    });

    /**
     * Atualizar solicitação
     * PUT /api/solicitacoes/:id
     */
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json(
                createErrorResponse('ID da solicitação é obrigatório e deve ser um número', 400)
            );
        }

        // Verificar se a solicitação existe
        const solicitacao = await SolicitacaoModel.getById(parseInt(id));
        if (!solicitacao) {
            return res.status(404).json(
                createErrorResponse('Solicitação não encontrada', 404)
            );
        }

        // Sanitizar dados de entrada
        const data = sanitizeInput(req.body);

        // Normalizar campos de texto se fornecidos
        if (data.nome_pessoa) data.nome_pessoa = normalizeString(data.nome_pessoa);
        if (data.equipamento) data.equipamento = normalizeString(data.equipamento);
        if (data.centro_custo) data.centro_custo = normalizeString(data.centro_custo);
        if (data.setor) data.setor = normalizeString(data.setor);

        // Validar dados
        const errors = SolicitacaoModel.validateData(data, true);
        if (errors.length > 0) {
            return res.status(400).json(
                createErrorResponse('Dados inválidos', 400, { errors })
            );
        }

        // Atualizar solicitação
        await SolicitacaoModel.update(parseInt(id), data);

        res.json(createSuccessResponse(
            null,
            'Solicitação atualizada com sucesso'
        ));
    });

    /**
     * Atualizar apenas o status da solicitação
     * PATCH /api/solicitacoes/:id/status
     */
    static updateStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json(
                createErrorResponse('ID da solicitação é obrigatório e deve ser um número', 400)
            );
        }

        if (!status) {
            return res.status(400).json(
                createErrorResponse('Status é obrigatório', 400)
            );
        }

        // Verificar se a solicitação existe
        const solicitacao = await SolicitacaoModel.getById(parseInt(id));
        if (!solicitacao) {
            return res.status(404).json(
                createErrorResponse('Solicitação não encontrada', 404)
            );
        }

        // Validar status
        const statusValidos = Object.keys(STATUS_OPTIONS);
        if (!statusValidos.includes(status)) {
            return res.status(400).json(
                createErrorResponse('Status inválido', 400, { 
                    valid_status: statusValidos 
                })
            );
        }

        // Atualizar status
        await SolicitacaoModel.updateStatus(parseInt(id), status);

        res.json(createSuccessResponse(
            null,
            'Status atualizado com sucesso'
        ));
    });

    /**
     * Excluir solicitação
     * DELETE /api/solicitacoes/:id
     */
    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json(
                createErrorResponse('ID da solicitação é obrigatório e deve ser um número', 400)
            );
        }

        // Verificar se a solicitação existe
        const solicitacao = await SolicitacaoModel.getById(parseInt(id));
        if (!solicitacao) {
            return res.status(404).json(
                createErrorResponse('Solicitação não encontrada', 404)
            );
        }

        // Excluir solicitação
        await SolicitacaoModel.delete(parseInt(id));

        res.json(createSuccessResponse(
            null,
            'Solicitação excluída com sucesso'
        ));
    });

    /**
     * Obter estatísticas das solicitações
     * GET /api/solicitacoes/stats
     */
    static getStats = asyncHandler(async (req, res) => {
        const stats = await SolicitacaoModel.getStats();

        // Calcular total geral
        const totalSolicitacoes = stats.reduce((total, stat) => total + parseInt(stat.quantidade), 0);

        // Adicionar informações extras
        const statsWithPercentage = stats.map(stat => ({
            ...stat,
            quantidade: parseInt(stat.quantidade),
            percentual: totalSolicitacoes > 0 ? 
                Math.round((parseInt(stat.quantidade) / totalSolicitacoes) * 100) : 0
        }));

        res.json(createSuccessResponse({
            stats: statsWithPercentage,
            total: totalSolicitacoes
        }));
    });

    /**
     * Criar tabela de solicitações (endpoint administrativo)
     * POST /api/admin/create-table
     */
    static createTable = asyncHandler(async (req, res) => {
        await SolicitacaoModel.createTable();

        res.json(createSuccessResponse(
            null,
            'Tabela de solicitações criada/verificada com sucesso'
        ));
    });

    /**
     * Endpoint de saúde da API
     * GET /api/health
     */
    static health = asyncHandler(async (req, res) => {
        // Testar conexão com o banco
        try {
            await SolicitacaoModel.count();
            
            res.json(createSuccessResponse({
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
                version: process.env.APP_VERSION || '2.0.0'
            }));
        } catch (error) {
            logError('Erro no health check:', error);
            res.status(503).json(createErrorResponse(
                'Serviço indisponível - erro na conexão com o banco de dados',
                503
            ));
        }
    });
}

module.exports = SolicitacaoController;
