-- =====================================================
-- SEBITAM - LIMPEZA COMPLETA E RECRIAÇÃO
-- =====================================================
-- Execute este script COMPLETO de uma vez só

-- PASSO 1: REMOVER TODAS AS TABELAS ANTIGAS (português e inglês)
DROP TABLE IF EXISTS alunos CASCADE;
DROP TABLE IF EXISTS professores CASCADE;
DROP TABLE IF EXISTS administradores CASCADE;
DROP TABLE IF EXISTS secretarios CASCADE;
DROP TABLE IF EXISTS secretarias CASCADE;
DROP TABLE IF EXISTS estudantes CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS secretaries CASCADE;

-- PASSO 2: CRIAR TABELAS NOVAS (inglês)

-- Tabela de Alunos
CREATE TABLE students (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  module int,
  grade int,
  plan text,
  email text,
  phone text,
  subject_grades jsonb default '{}'::jsonb,
  subject_freqs jsonb default '{}'::jsonb,
  payment_status text default 'Pendente',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Professores
CREATE TABLE teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  extra text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Admins
CREATE TABLE admins (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  extra text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Secretários
CREATE TABLE secretaries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  extra text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PASSO 3: DESABILITAR RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE secretaries DISABLE ROW LEVEL SECURITY;

-- PASSO 4: GARANTIR PERMISSÕES TOTAIS
GRANT ALL ON students TO anon, authenticated;
GRANT ALL ON teachers TO anon, authenticated;
GRANT ALL ON admins TO anon, authenticated;
GRANT ALL ON secretaries TO anon, authenticated;

-- PASSO 5: CRIAR ÍNDICES
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_secretaries_email ON secretaries(email);

-- PASSO 6: INSERIR DADOS INICIAIS
INSERT INTO admins (name, email, phone, extra)
VALUES ('Luiz Eduardo Santos da Silva', 'edukadoshmda@gmail.com', 'Gestor', 'Diretor Geral');

INSERT INTO students (full_name, email, phone, module, grade, plan)
VALUES ('Maria Silva Teste', 'maria@teste.com', '(91) 98888-8888', 1, 1, 'integral');

-- PASSO 7: VERIFICAÇÕES FINAIS

-- Listar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'teachers', 'admins', 'secretaries')
ORDER BY table_name;

-- Verificar permissões
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('students', 'teachers', 'admins', 'secretaries')
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- Contar registros
SELECT 'students' as tabela, COUNT(*) as total FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'secretaries', COUNT(*) FROM secretaries
ORDER BY tabela;

-- SUCESSO! Se você viu as 3 tabelas acima, está tudo pronto!
