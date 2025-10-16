/**
 * Configuração do Banco de Dados PostgreSQL/Supabase
 * Equivalente ao arquivo supabase.php do projeto PHP
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuração do pool de conexões PostgreSQL
 */
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    // Configurações do pool
    max: 20, // máximo de conexões no pool
    idleTimeoutMillis: 30000, // tempo limite para conexões inativas
    connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
});

/**
 * Testa a conexão com o banco de dados
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Conexão com PostgreSQL estabelecida:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
        return false;
    }
}

/**
 * Executa uma query no banco de dados
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Object>} - Resultado da query
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log da query em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Query executada:', {
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: result.rowCount
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            error: error.message,
            params
        });
        throw error;
    }
}

/**
 * Executa uma transação no banco de dados
 * @param {Function} callback - Função que executa as queries da transação
 * @returns {Promise<any>} - Resultado da transação
 */
async function transaction(callback) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Classe para fazer requisições à API REST do Supabase
 * Equivalente aos métodos apiRequest e authRequest do PHP
 */
class SupabaseAPI {
    constructor() {
        this.baseURL = process.env.SUPABASE_URL;
        this.anonKey = process.env.SUPABASE_ANON_KEY;
        this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    /**
     * Faz uma requisição para a API REST do Supabase
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP
     * @param {Object} data - Dados para enviar
     * @param {boolean} useServiceRole - Usar service role key
     * @returns {Promise<Object>} - Resposta da API
     */
    async apiRequest(endpoint, method = 'GET', data = null, useServiceRole = false) {
        const url = `${this.baseURL}/rest/v1/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.anonKey,
            'Authorization': `Bearer ${useServiceRole ? this.serviceRoleKey : this.anonKey}`
        };

        const options = {
            method,
            headers
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na API do Supabase: HTTP ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro na API do Supabase:', error.message);
            throw error;
        }
    }

    /**
     * Faz autenticação via API do Supabase
     * @param {string} endpoint - Endpoint de autenticação
     * @param {Object} data - Dados de autenticação
     * @returns {Promise<Object>} - Resposta da autenticação
     */
    async authRequest(endpoint, data) {
        const url = `${this.baseURL}/auth/v1/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.anonKey
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.error_description || result.message || 'Erro desconhecido';
                throw new Error(`Erro de autenticação: ${errorMsg}`);
            }

            return result;
        } catch (error) {
            console.error('❌ Erro na autenticação do Supabase:', error.message);
            throw error;
        }
    }
}

// Instância singleton da API do Supabase
const supabaseAPI = new SupabaseAPI();

/**
 * Encerra o pool de conexões (para uso em testes ou shutdown da aplicação)
 */
async function closePool() {
    await pool.end();
    console.log('🔌 Pool de conexões PostgreSQL encerrado');
}

// Manipulador de eventos para encerrar o pool quando a aplicação for finalizada
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando aplicação...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando aplicação...');
    await closePool();
    process.exit(0);
});

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    supabaseAPI,
    closePool
};
