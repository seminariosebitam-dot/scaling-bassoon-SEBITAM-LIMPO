-- =====================================================
-- SEBITAM - CORREÇÃO FINAL - RESETAR TUDO
-- =====================================================
-- Este script vai limpar e recriar TUDO do zero
-- Execute no SQL Editor do Supabase

-- 1. REMOVER TUDO (começar do zero)
DROP TABLE IF EXISTS estudantes CASCADE;
DROP TABLE IF EXISTS professores CASCADE;
DROP TABLE IF EXISTS administradores CASCADE;
DROP TABLE IF EXISTS secretarias CASCADE;

-- 2. CRIAR TABELA DE ESTUDANTES
CREATE TABLE estudantes (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    module INTEGER DEFAULT 1,
    grade INTEGER DEFAULT 1,
    plan TEXT DEFAULT 'integral',
    subject_grades JSONB DEFAULT '{}'::jsonb,
    subject_freqs JSONB DEFAULT '{}'::jsonb,
    payment_status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR TABELA DE PROFESSORES
CREATE TABLE professores (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    extra TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR TABELA DE ADMINISTRADORES
CREATE TABLE administradores (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    extra TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAR TABELA DE SECRETARIAS
CREATE TABLE secretarias (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    extra TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GARANTIR QUE AS TABELAS ESTÃO NO SCHEMA PUBLIC
ALTER TABLE estudantes SET SCHEMA public;
ALTER TABLE professores SET SCHEMA public;
ALTER TABLE administradores SET SCHEMA public;
ALTER TABLE secretarias SET SCHEMA public;

-- 7. DESABILITAR RLS (Row Level Security) COMPLETAMENTE
ALTER TABLE estudantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE professores DISABLE ROW LEVEL SECURITY;
ALTER TABLE administradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE secretarias DISABLE ROW LEVEL SECURITY;

-- 8. REMOVER TODAS AS POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Enable read access for all users" ON estudantes;
DROP POLICY IF EXISTS "Enable insert for all users" ON estudantes;
DROP POLICY IF EXISTS "Enable update for all users" ON estudantes;
DROP POLICY IF EXISTS "Enable delete for all users" ON estudantes;

DROP POLICY IF EXISTS "Enable read access for all users" ON professores;
DROP POLICY IF EXISTS "Enable insert for all users" ON professores;
DROP POLICY IF EXISTS "Enable update for all users" ON professores;
DROP POLICY IF EXISTS "Enable delete for all users" ON professores;

DROP POLICY IF EXISTS "Enable read access for all users" ON administradores;
DROP POLICY IF EXISTS "Enable insert for all users" ON administradores;
DROP POLICY IF EXISTS "Enable update for all users" ON administradores;
DROP POLICY IF EXISTS "Enable delete for all users" ON administradores;

DROP POLICY IF EXISTS "Enable read access for all users" ON secretarias;
DROP POLICY IF EXISTS "Enable insert for all users" ON secretarias;
DROP POLICY IF EXISTS "Enable update for all users" ON secretarias;
DROP POLICY IF EXISTS "Enable delete for all users" ON secretarias;

-- 9. GARANTIR PERMISSÕES TOTAIS PARA ANON (chave pública)
GRANT ALL ON estudantes TO anon;
GRANT ALL ON professores TO anon;
GRANT ALL ON administradores TO anon;
GRANT ALL ON secretarias TO anon;

GRANT ALL ON estudantes TO authenticated;
GRANT ALL ON professores TO authenticated;
GRANT ALL ON administradores TO authenticated;
GRANT ALL ON secretarias TO authenticated;

-- 10. GARANTIR PERMISSÕES NAS SEQUENCES (para auto-increment funcionar)
GRANT USAGE, SELECT ON SEQUENCE estudantes_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE professores_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE administradores_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE secretarias_id_seq TO anon;

GRANT USAGE, SELECT ON SEQUENCE estudantes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE professores_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE administradores_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE secretarias_id_seq TO authenticated;

-- 11. CRIAR ÍNDICES
CREATE INDEX idx_estudantes_email ON estudantes(email);
CREATE INDEX idx_estudantes_grade ON estudantes(grade);
CREATE INDEX idx_professores_email ON professores(email);
CREATE INDEX idx_administradores_email ON administradores(email);
CREATE INDEX idx_secretarias_email ON secretarias(email);

-- 12. INSERIR ADMIN PADRÃO
INSERT INTO administradores (name, email, phone, extra)
VALUES ('Luiz Eduardo Santos da Silva', 'edukadoshmda@gmail.com', 'Gestor', 'Diretor Geral')
ON CONFLICT DO NOTHING;

-- 13. INSERIR ALUNO DE TESTE
INSERT INTO estudantes (full_name, email, phone, module, grade, plan)
VALUES ('João da Silva Teste', 'joao@teste.com', '(91) 99999-9999', 1, 1, 'integral');

-- 14. VERIFICAR SE TUDO FOI CRIADO
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('estudantes', 'professores', 'administradores', 'secretarias');

-- 15. VERIFICAR PERMISSÕES
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('estudantes', 'professores', 'administradores', 'secretarias')
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 16. CONTAR REGISTROS
SELECT 'estudantes' as tabela, COUNT(*) as total FROM estudantes
UNION ALL
SELECT 'professores', COUNT(*) FROM professores
UNION ALL
SELECT 'administradores', COUNT(*) FROM administradores
UNION ALL
SELECT 'secretarias', COUNT(*) FROM secretarias;
