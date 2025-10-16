/**
 * Servidor Principal - Express.js
 * Sistema de Controle de Compras de Equipamentos
 * Versão Node.js com integração Supabase
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Importar módulos locais
const { testConnection } = require('./src/config/database');
const apiRoutes = require('./src/routes/api');
const { 
    generateCSRF, 
    requestLogger, 
    errorHandler,
    rateLimiters 
} = require('./src/middleware/security');
const { SETORES, STATUS_OPTIONS } = require('./src/utils/helpers');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configurações de Segurança
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

/**
 * Configurações de CORS
 */
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || false
        : true,
    credentials: true
}));

/**
 * Configurações de Sessão
 */
app.use(session({
    secret: process.env.CSRF_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

/**
 * Middleware de Parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Middleware de Logging
 */
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(requestLogger);

/**
 * Rate Limiting Geral
 */
app.use(rateLimiters.general);

/**
 * Middleware de CSRF
 */
app.use(generateCSRF);

/**
 * Servir arquivos estáticos
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Configurar engine de template (EJS)
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Rotas da API
 */
app.use('/api', apiRoutes);

/**
 * Rota principal - Dashboard
 */
app.get('/', async (req, res) => {
    try {
        res.render('index', {
            title: process.env.APP_NAME || 'Sistema de Controle de Compras',
            csrfToken: res.locals.csrfToken,
            setores: SETORES,
            statusOptions: STATUS_OPTIONS,
            appVersion: process.env.APP_VERSION || '2.0.0'
        });
    } catch (error) {
        console.error('❌ Erro ao renderizar página principal:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/**
 * Rota de informações do sistema
 */
app.get('/info', (req, res) => {
    res.json({
        name: process.env.APP_NAME || 'Sistema de Controle de Compras',
        version: process.env.APP_VERSION || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/**
 * Middleware de tratamento de rotas não encontradas
 */
/**
 * Middleware de tratamento de rotas não encontradas
 */
app.use((req, res, next) => { // <-- CORREÇÃO APLICADA AQUI
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint não encontrado',
            statusCode: 404,
            timestamp: new Date().toISOString()
        });
    }
    
    res.status(404).render('404', {
        title: 'Página não encontrada',
        message: 'A página que você está procurando não foi encontrada.'
    });
});
/**
 * Middleware de tratamento de erros
 */
app.use(errorHandler);

/**
 * Função para inicializar o servidor
 */
async function startServer() {
    try {
        // Testar conexão com o banco de dados
        console.log('🔍 Testando conexão com o banco de dados...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Falha na conexão com o banco de dados');
            process.exit(1);
        }

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado com sucesso!');
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Versão: ${process.env.APP_VERSION || '2.0.0'}`);
            console.log('─'.repeat(50));
        });

        // Configurar graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor...`);
            
            server.close(() => {
                console.log('✅ Servidor HTTP encerrado');
                process.exit(0);
            });

            // Forçar encerramento após 10 segundos
            setTimeout(() => {
                console.error('❌ Forçando encerramento do servidor');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Inicializar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
    startServer();
}

module.exports = app;
