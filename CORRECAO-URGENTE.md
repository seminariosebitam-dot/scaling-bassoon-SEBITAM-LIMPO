# 🔧 CORREÇÃO URGENTE - Script SQL Atualizado

## ❌ Problema Identificado
O erro "Could not find the table" acontece porque:
1. As tabelas ainda não foram criadas no Supabase
2. O nome `secretárias` tinha acento (problema no PostgreSQL)

## ✅ Solução Aplicada

### 1. Script SQL Corrigido
- Removi acentos dos nomes das tabelas
- Adicionei `DROP TABLE` para limpar tabelas antigas
- Incluí inserção automática do Super Admin

### 2. Código JavaScript Atualizado
- Corrigido `tableMap` para usar `secretarias` (sem acento)

---

## 🚀 EXECUTE AGORA (Passo a Passo)

### Passo 1: Abrir o Supabase
1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto **vwruogwdtbsareighmoc**
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**

### Passo 2: Copiar e Executar o Script
1. Abra o arquivo `supabase-schema.sql` (está na pasta do projeto)
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)
5. Clique em **RUN** (ou Ctrl+Enter)

### Passo 3: Verificar o Resultado
Você deve ver no final da execução uma tabela mostrando:
```
table_name
-----------------
estudantes
professores
administradores
secretarias
```

Se aparecer isso, **SUCESSO!** ✅

---

## 🧪 Teste Imediato

Após executar o SQL:

1. **Recarregue a página** do SEBITAM (F5)
2. Faça login novamente
3. Vá em **Cadastro** → **Secretaria**
4. Tente cadastrar: "Pedro Paulo" / "pedropaulo@gmail.com" / "(91) 99282-7566" / "administrativo"
5. Clique em **Salvar Cadastro**

**Resultado esperado**: "Cadastrado com sucesso!" ✅

---

## 📊 Verificar no Supabase

1. No Supabase, clique em **Table Editor**
2. Clique na tabela **secretarias**
3. Você deve ver o registro "Pedro Paulo" lá!

---

## ⚠️ Se Ainda Der Erro

Abra o Console do navegador (F12) e me envie:
- A mensagem de erro completa em vermelho
- Um print da aba **Network** mostrando a requisição que falhou

---

**Execute o script SQL AGORA e me avise o resultado!** 🎯
