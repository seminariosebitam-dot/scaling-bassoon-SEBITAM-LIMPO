# 🚀 Configuração da API Supabase - SEBITAM

## ✅ Passos Concluídos

### 1. Chave API Configurada
- **URL do Projeto**: `https://vwruogwdtbsareighmoc.supabase.co`
- **Chave Publicável**: Configurada no arquivo `main.js`

### 2. Script SQL Criado
O arquivo `supabase-schema.sql` foi criado com todas as tabelas necessárias.

---

## 📋 Próximos Passos (IMPORTANTE)

### Passo 1: Executar o Script SQL no Supabase

1. Acesse seu painel do Supabase: https://supabase.com/dashboard
2. Selecione o projeto **SEBITAM** (vwruogwdtbsareighmoc)
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase-schema.sql`
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione Ctrl+Enter)

**Resultado esperado**: Você verá a mensagem "Success. No rows returned" - isso é normal! As tabelas foram criadas.

### Passo 2: Verificar as Tabelas Criadas

1. No menu lateral do Supabase, clique em **Table Editor**
2. Você deve ver 4 tabelas:
   - ✅ `estudantes`
   - ✅ `professores`
   - ✅ `administradores`
   - ✅ `secretárias`

### Passo 3: Testar a Aplicação

1. Abra o arquivo `index.html` no navegador
2. Faça login com:
   - **Email**: edukadoshmda@gmail.com
   - **Senha**: 123456
3. Tente cadastrar um aluno de teste
4. Verifique no **Table Editor** do Supabase se o aluno apareceu na tabela `estudantes`

---

## 🔧 Estrutura das Tabelas

### Tabela: `estudantes`
- `id` - Identificador único (auto-incremento)
- `full_name` - Nome completo do aluno
- `email` - E-mail pessoal
- `phone` - Telefone/WhatsApp
- `module` - Módulo atual (1-5)
- `grade` - Turma (1-10)
- `plan` - Plano financeiro (integral/half/scholarship)
- `subject_grades` - Notas por disciplina (JSON)
- `subject_freqs` - Frequências por disciplina (JSON)
- `payment_status` - Status de pagamento (Pago/Pendente)

### Tabelas: `professores`, `administradores`, `secretárias`
- `id` - Identificador único
- `name` - Nome completo
- `email` - E-mail institucional
- `phone` - Telefone/WhatsApp
- `extra` - Campo adicional (Disciplina/Cargo/Setor)

---

## 🎯 Benefícios da Migração para Supabase

✅ **Dados em Nuvem**: Acessíveis de qualquer dispositivo
✅ **Backup Automático**: Seus dados estão seguros
✅ **Sincronização em Tempo Real**: Múltiplos usuários podem acessar simultaneamente
✅ **Escalabilidade**: Suporta crescimento ilimitado de alunos
✅ **Preparado para Deploy**: Funciona perfeitamente no Vercel

---

## ⚠️ Importante

- A chave **publishable** é segura para uso público no frontend
- A chave **secret** NUNCA deve ser exposta no código do navegador
- O RLS (Row Level Security) está desabilitado para facilitar os testes iniciais
- Após confirmar que tudo funciona, podemos habilitar políticas de segurança

---

## 🆘 Problemas Comuns

### "Error fetching from Supabase"
- Verifique se executou o script SQL
- Confirme se as tabelas foram criadas no Table Editor

### "Unauthorized" ou "Invalid API Key"
- Verifique se a chave foi copiada corretamente
- Certifique-se de usar a chave **publishable**, não a secret

### Dados não aparecem
- Abra o Console do navegador (F12)
- Procure por mensagens de erro em vermelho
- Verifique se o Supabase está inicializado (deve aparecer "Supabase inicializado com sucesso")

---

**Após executar o script SQL, me avise para testarmos juntos!** 🎉
