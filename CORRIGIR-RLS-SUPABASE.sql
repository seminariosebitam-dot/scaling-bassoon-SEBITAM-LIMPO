-- ================================================================
-- CORREÇÃO URGENTE: POLÍTICAS RLS DO SUPABASE
-- ================================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- IMPORTANTE: Desabilitar RLS temporariamente OU criar políticas permissivas

-- OPÇÃO 1: DESABILITAR RLS (mais rápido para testar)
-- Execute uma por vez:

ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE secretaries DISABLE ROW LEVEL SECURITY;


-- OPÇÃO 2: CRIAR POLÍTICAS PERMISSIVAS (recomendado para produção)
-- Se preferir manter RLS ativo, execute isso:

-- Para students
DROP POLICY IF EXISTS "Enable all for students" ON students;
CREATE POLICY "Enable all for students" ON students
FOR ALL
USING (true)
WITH CHECK (true);

-- Para teachers
DROP POLICY IF EXISTS "Enable all for teachers" ON teachers;
CREATE POLICY "Enable all for teachers" ON teachers
FOR ALL
USING (true)
WITH CHECK (true);

-- Para admins
DROP POLICY IF EXISTS "Enable all for admins" ON admins;
CREATE POLICY "Enable all for admins" ON admins
FOR ALL
USING (true)
WITH CHECK (true);

-- Para secretaries
DROP POLICY IF EXISTS "Enable all for secretaries" ON secretaries;
CREATE POLICY "Enable all for secretaries" ON secretaries
FOR ALL
USING (true)
WITH CHECK (true);


-- ================================================================
-- VERIFICAÇÃO: Execute depois para confirmar que funcionou
-- ================================================================

-- Ver status do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('students', 'teachers', 'admins', 'secretaries');

-- Ver políticas ativas
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
