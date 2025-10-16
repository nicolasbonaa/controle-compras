/**
 * Modelo de Dados para Solicitações de Compra
 * Equivalente à classe SolicitacaoManager.php do projeto PHP
 */

const { query, transaction } = require('../config/database');

class SolicitacaoModel {
    /**
     * Cria uma nova solicitação
     * @param {Object} data - Dados da solicitação
     * @returns {Promise<number>} - ID da solicitação criada
     */
    static async create(data) {
        try {
            // Validar dados obrigatórios
            const required = ['nome_pessoa', 'setor', 'centro_custo', 'equipamento'];
            for (const field of required) {
                if (!data[field] || data[field].trim() === '') {
                    throw new Error(`Campo obrigatório não informado: ${field}`);
                }
            }

            const sql = `
                INSERT INTO solicitacoes (nome_pessoa, setor, centro_custo, equipamento, data_solicitacao, status) 
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

            const values = [
                data.nome_pessoa.trim(),
                data.setor.trim(),
                data.centro_custo.trim(),
                data.equipamento.trim(),
                data.data_solicitacao || new Date(),
                data.status || 'Pendente'
            ];

            const result = await query(sql, values);
            
            if (result.rows.length > 0) {
                return result.rows[0].id;
            } else {
                throw new Error('Erro ao inserir solicitação no banco de dados');
            }

        } catch (error) {
            console.error('❌ Erro ao criar solicitação:', error.message);
            throw new Error(`Erro ao salvar solicitação: ${error.message}`);
        }
    }

    /**
     * Busca todas as solicitações com filtros opcionais
     * @param {Object} filters - Filtros de busca
     * @param {string} orderBy - Ordenação
     * @param {number} limit - Limite de resultados
     * @param {number} offset - Offset para paginação
     * @returns {Promise<Array>} - Lista de solicitações
     */
    static async getAll(filters = {}, orderBy = 'data_solicitacao DESC', limit = null, offset = 0) {
        try {
            let sql = 'SELECT * FROM solicitacoes';
            const params = [];
            const conditions = [];
            let paramIndex = 1;

            // Aplicar filtros
            if (filters.status) {
                conditions.push(`status = $${paramIndex}`);
                params.push(filters.status);
                paramIndex++;
            }

            if (filters.setor) {
                conditions.push(`setor = $${paramIndex}`);
                params.push(filters.setor);
                paramIndex++;
            }

            if (filters.search) {
                conditions.push(`(nome_pessoa ILIKE $${paramIndex} OR equipamento ILIKE $${paramIndex})`);
                params.push(`%${filters.search}%`);
                paramIndex++;
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            sql += ` ORDER BY ${orderBy}`;

            if (limit) {
                sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                params.push(limit, offset);
            }

            const result = await query(sql, params);
            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar solicitações:', error.message);
            throw new Error('Erro ao buscar solicitações no banco de dados');
        }
    }

    /**
     * Busca uma solicitação por ID
     * @param {number} id - ID da solicitação
     * @returns {Promise<Object|null>} - Solicitação encontrada ou null
     */
    static async getById(id) {
        try {
            const sql = 'SELECT * FROM solicitacoes WHERE id = $1';
            const result = await query(sql, [id]);
            
            return result.rows.length > 0 ? result.rows[0] : null;

        } catch (error) {
            console.error('❌ Erro ao buscar solicitação por ID:', error.message);
            throw new Error('Erro ao buscar solicitação no banco de dados');
        }
    }

    /**
     * Atualiza uma solicitação
     * @param {number} id - ID da solicitação
     * @param {Object} data - Dados para atualizar
     * @returns {Promise<boolean>} - True se atualizou com sucesso
     */
    static async update(id, data) {
        try {
            // Campos que podem ser atualizados
            const allowedFields = ['nome_pessoa', 'setor', 'centro_custo', 'equipamento', 'status'];
            const updateFields = [];
            const params = [];
            let paramIndex = 1;

            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    updateFields.push(`${field} = $${paramIndex}`);
                    params.push(data[field]);
                    paramIndex++;
                }
            }

            if (updateFields.length === 0) {
                throw new Error('Nenhum campo para atualizar foi fornecido');
            }

            // Adicionar updated_at
            updateFields.push(`updated_at = $${paramIndex}`);
            params.push(new Date());
            paramIndex++;

            // Adicionar ID no final
            params.push(id);

            const sql = `
                UPDATE solicitacoes 
                SET ${updateFields.join(', ')} 
                WHERE id = $${paramIndex}
            `;

            const result = await query(sql, params);

            if (result.rowCount > 0) {
                return true;
            } else {
                throw new Error('Solicitação não encontrada ou nenhuma alteração foi feita');
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar solicitação:', error.message);
            throw new Error(`Erro ao atualizar solicitação: ${error.message}`);
        }
    }

    /**
     * Atualiza apenas o status de uma solicitação
     * @param {number} id - ID da solicitação
     * @param {string} status - Novo status
     * @returns {Promise<boolean>} - True se atualizou com sucesso
     */
    static async updateStatus(id, status) {
        return this.update(id, { status });
    }

    /**
     * Exclui uma solicitação
     * @param {number} id - ID da solicitação
     * @returns {Promise<boolean>} - True se excluiu com sucesso
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM solicitacoes WHERE id = $1';
            const result = await query(sql, [id]);

            if (result.rowCount > 0) {
                return true;
            } else {
                throw new Error('Solicitação não encontrada');
            }

        } catch (error) {
            console.error('❌ Erro ao excluir solicitação:', error.message);
            throw new Error('Erro ao excluir solicitação do banco de dados');
        }
    }

    /**
     * Conta o total de solicitações com filtros opcionais
     * @param {Object} filters - Filtros de busca
     * @returns {Promise<number>} - Total de solicitações
     */
    static async count(filters = {}) {
        try {
            let sql = 'SELECT COUNT(*) as total FROM solicitacoes';
            const params = [];
            const conditions = [];
            let paramIndex = 1;

            // Aplicar os mesmos filtros do método getAll
            if (filters.status) {
                conditions.push(`status = $${paramIndex}`);
                params.push(filters.status);
                paramIndex++;
            }

            if (filters.setor) {
                conditions.push(`setor = $${paramIndex}`);
                params.push(filters.setor);
                paramIndex++;
            }

            if (filters.search) {
                conditions.push(`(nome_pessoa ILIKE $${paramIndex} OR equipamento ILIKE $${paramIndex})`);
                params.push(`%${filters.search}%`);
                paramIndex++;
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            const result = await query(sql, params);
            return parseInt(result.rows[0].total);

        } catch (error) {
            console.error('❌ Erro ao contar solicitações:', error.message);
            throw new Error('Erro ao contar solicitações no banco de dados');
        }
    }

    /**
     * Obtém estatísticas das solicitações
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<Array>} - Estatísticas por status
     */
    static async getStats(filters = {}) {
        try {
            let sql = `
                SELECT 
                    status,
                    COUNT(*) as quantidade
                FROM solicitacoes
            `;
            const params = [];
            const conditions = [];

            // Aplicar filtros se necessário (para futuras extensões)
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            sql += ' GROUP BY status ORDER BY quantidade DESC';

            const result = await query(sql, params);
            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error.message);
            throw new Error('Erro ao buscar estatísticas no banco de dados');
        }
    }

    /**
     * Cria a tabela de solicitações se não existir
     * @returns {Promise<boolean>} - True se criou com sucesso
     */
    static async createTable() {
        try {
            const sql = `
                CREATE TABLE IF NOT EXISTS solicitacoes (
                    id SERIAL PRIMARY KEY,
                    nome_pessoa VARCHAR(255) NOT NULL,
                    setor VARCHAR(100) NOT NULL,
                    centro_custo VARCHAR(50) NOT NULL,
                    equipamento TEXT NOT NULL,
                    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'Pendente',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await query(sql);

            // Criar índices para melhor performance
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status)',
                'CREATE INDEX IF NOT EXISTS idx_solicitacoes_setor ON solicitacoes(setor)',
                'CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON solicitacoes(data_solicitacao)'
            ];

            for (const indexSql of indexes) {
                await query(indexSql);
            }

            console.log('✅ Tabela solicitacoes criada/verificada com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro ao criar tabela:', error.message);
            throw new Error('Erro ao criar tabela no banco de dados');
        }
    }

    /**
     * Valida os dados de uma solicitação
     * @param {Object} data - Dados para validar
     * @param {boolean} isUpdate - Se é uma atualização (campos opcionais)
     * @returns {Array} - Array de erros (vazio se válido)
     */
    static validateData(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            // Validações para criação (todos os campos obrigatórios)
            const required = ['nome_pessoa', 'setor', 'centro_custo', 'equipamento'];
            for (const field of required) {
                if (!data[field] || data[field].trim() === '') {
                    errors.push(`O campo '${field}' é obrigatório`);
                }
            }
        } else {
            // Validações para atualização (campos opcionais, mas se fornecidos devem ser válidos)
            if (data.nome_pessoa !== undefined && (!data.nome_pessoa || data.nome_pessoa.trim() === '')) {
                errors.push('Nome da pessoa não pode estar vazio');
            }
            if (data.setor !== undefined && (!data.setor || data.setor.trim() === '')) {
                errors.push('Setor não pode estar vazio');
            }
            if (data.centro_custo !== undefined && (!data.centro_custo || data.centro_custo.trim() === '')) {
                errors.push('Centro de custo não pode estar vazio');
            }
            if (data.equipamento !== undefined && (!data.equipamento || data.equipamento.trim() === '')) {
                errors.push('Equipamento não pode estar vazio');
            }
        }

        // Validar status se fornecido
        if (data.status) {
            const statusValidos = ['Pendente', 'Em Andamento', 'Comprado', 'Cancelado'];
            if (!statusValidos.includes(data.status)) {
                errors.push('Status inválido');
            }
        }

        // Validar tamanhos máximos
        if (data.nome_pessoa && data.nome_pessoa.length > 255) {
            errors.push('Nome da pessoa deve ter no máximo 255 caracteres');
        }
        if (data.setor && data.setor.length > 100) {
            errors.push('Setor deve ter no máximo 100 caracteres');
        }
        if (data.centro_custo && data.centro_custo.length > 50) {
            errors.push('Centro de custo deve ter no máximo 50 caracteres');
        }

        return errors;
    }
}

module.exports = SolicitacaoModel;
