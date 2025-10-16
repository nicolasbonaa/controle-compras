-- Script SQL para criar a tabela 'solicitacoes' no Supabase (PostgreSQL)
-- Versão simplificada sem autenticação e sem Row Level Security (RLS)

-- 1. Criar a tabela de solicitações
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id SERIAL PRIMARY KEY,
    nome_pessoa VARCHAR(255) NOT NULL,
    setor VARCHAR(100) NOT NULL,
    centro_custo VARCHAR(50) NOT NULL,
    equipamento TEXT NOT NULL,
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_setor ON public.solicitacoes(setor);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON public.solicitacoes(data_solicitacao);

-- 3. Desabilitar RLS (Row Level Security)
-- Isso permite que qualquer usuário (incluindo o anônimo) acesse os dados
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes DISABLE ROW LEVEL SECURITY;

-- 4. Conceder permissões de acesso total para o papel 'anon' e 'authenticated'
-- ATENÇÃO: ISSO TORNA A TABELA PÚBLICA.
GRANT ALL ON public.solicitacoes TO anon;
GRANT ALL ON public.solicitacoes TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN public TO authenticated;

-- 5. Inserir dados de exemplo (opcional)
INSERT INTO public.solicitacoes (nome_pessoa, setor, centro_custo, equipamento, status) VALUES
('JOÃO DA SILVA', 'SAESHIA DO SUCESSO - GRADUAÇÃO', 'CC-1001', 'NOTEBOOK DELL INSPIRON 15', 'Pendente'),
('MARIA SOUZA', 'SAESHIA DO PROPÓSITO', 'CC-2005', 'MONITOR ULTRA WIDE 34 POLEGADAS', 'Em Andamento'),
('PEDRO ALVES', 'SAESHIA DA UNIÃO', 'CC-3010', 'CADEIRA ERGONÔMICA PROFISSIONAL', 'Comprado'),
('ANA OLIVEIRA', 'SAESHIA DA MAGIA', 'CC-4002', 'IMPRESSORA LASER COLORIDA', 'Cancelado'),
('CARLOS SANTOS', 'POLO JOINVILLE', 'CC-5008', 'PROJETOR MULTIMÍDIA 4K', 'Pendente');
