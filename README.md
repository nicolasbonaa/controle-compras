# Sistema de Controle de Compras de Equipamentos (Node.js/Express/Supabase)

Este projeto é uma conversão completa do sistema de controle de compras originalmente desenvolvido em PHP, agora implementado em **Node.js** utilizando o framework **Express.js** para o backend, **PostgreSQL** (via Supabase) como banco de dados e **Tailwind CSS** para o frontend.

O sistema foi simplificado para operar como uma aplicação de página única (SPA) com um backend de API REST, sem a necessidade de autenticação de usuários.

## 🚀 Funcionalidades

- **CRUD Completo de Solicitações:** Criação, leitura, atualização e exclusão de solicitações de compra.
- **Filtros e Busca:** Filtragem por status e setor, além de busca por nome da pessoa ou equipamento.
- **Paginação:** Paginação dinâmica para lidar com grandes volumes de dados.
- **Estatísticas em Tempo Real:** Dashboard com contagem total e por status das solicitações.
- **Interface Moderna:** Design responsivo e profissional utilizando Tailwind CSS.
- **API REST:** Backend robusto e seguro com endpoints dedicados para todas as operações.

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Backend** | Node.js | Ambiente de execução JavaScript. |
| **Framework** | Express.js | Framework web rápido e minimalista para Node.js. |
| **Banco de Dados** | PostgreSQL | Banco de dados relacional robusto (hospedado no Supabase). |
| **Driver DB** | `pg` | Cliente PostgreSQL para Node.js. |
| **Frontend** | HTML5, JavaScript | Lógica de interface e requisições AJAX. |
| **Estilização** | Tailwind CSS | Framework CSS utilitário para design rápido. |
| **Template Engine** | EJS | Template engine simples para renderização de views. |

## ⚙️ Configuração e Instalação

### 1. Pré-requisitos

Você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) (gerenciador de pacotes do Node.js)
- Uma conta no [Supabase](https://supabase.com) com um projeto configurado.

### 2. Configuração do Banco de Dados (Supabase)

1.  **Crie a Tabela:** No seu projeto Supabase, vá para o **SQL Editor** e execute o script SQL contido no arquivo `docs/database_setup_simple.sql` (não fornecido neste README, mas deve ser criado separadamente). Este script cria a tabela `solicitacoes` e desabilita o RLS para acesso público.
2.  **Obtenha as Credenciais:**
    *   **DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD:** Credenciais de conexão direta com o PostgreSQL (encontradas em `Settings > Database`).
    *   **SUPABASE_URL, SUPABASE_ANON_KEY:** Credenciais da API (encontradas em `Settings > API`).

### 3. Configuração do Projeto Node.js

1.  **Clone o Repositório:**
    \`\`\`bash
    git clone [URL_DO_REPOSITORIO]
    cd controle-compras-nodejs
    \`\`\`
2.  **Instale as Dependências:**
    \`\`\`bash
    npm install
    \`\`\`
3.  **Configure as Variáveis de Ambiente:**
    *   Crie um arquivo chamado `.env` na raiz do projeto.
    *   Copie o conteúdo do arquivo `.env.example` para o `.env`.
    *   Preencha as variáveis com as credenciais obtidas no Supabase.

    \`\`\`dotenv
    # Exemplo de .env
    PORT=3000
    DB_HOST=aws-1-us-east-1.pooler.supabase.com
    DB_PORT=5432
    DB_NAME=postgres
    DB_USER=postgres.seu-projeto
    DB_PASSWORD=sua-senha-do-banco
    # ... outras variáveis
    \`\`\`

### 4. Execução

Para iniciar o servidor em modo de desenvolvimento (com `nodemon` para recarga automática):

\`\`\`bash
npm run dev
\`\`\`

Para iniciar o servidor em modo de produção:

\`\`\`bash
npm start
\`\`\`

O servidor estará acessível em \`http://localhost:3000\` (ou na porta que você definiu em `PORT`).

## 📂 Estrutura do Projeto

\`\`\`
controle-compras-nodejs/
├── node_modules/
├── public/
│   ├── js/app.js           # Lógica do Frontend (AJAX)
│   └── ...                 # Arquivos estáticos (CSS, imagens)
├── src/
│   ├── config/database.js  # Configuração de conexão com PostgreSQL
│   ├── controllers/        # Lógica de negócio da API (CRUD)
│   ├── middleware/         # Middlewares de segurança (CSRF, Rate Limit)
│   ├── models/             # Modelo de dados (CRUD)
│   ├── routes/api.js       # Definição das rotas da API
│   └── utils/helpers.js    # Funções utilitárias
├── views/
│   ├── index.ejs           # Template principal (Dashboard)
│   └── 404.ejs             # Página de erro 404
├── .env.example            # Exemplo de variáveis de ambiente
├── package.json            # Dependências e scripts
└── server.js               # Arquivo principal do servidor Express
\`\`\`

## ⚠️ Nota de Segurança

Este projeto foi simplificado para fins de demonstração, removendo a autenticação e desabilitando o RLS no banco de dados. **Não utilize esta configuração em um ambiente de produção** onde a segurança e a privacidade dos dados são necessárias. Para produção, o RLS deve ser ativado e a API deve ser protegida por autenticação (JWT, por exemplo).

---

Desenvolvido por **Manus AI** em 2025.

