# SEBITAM - Portal Acadêmico Luxo

Sistema de gestão institucional e teológica para o SEBITAM.

## 🚀 Preparação para Deploy

Este projeto está configurado para ser hospedado em diversas plataformas.

### 1. GitHub
Para subir o código:
1. Crie um repositório novo no GitHub.
2. No seu terminal, execute:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M mainu
   git remote add origin SEU_LINK_DO_GITHUB
   git push -u origin main
   ```

### 2. Vercel
1. Conecte sua conta do GitHub à Vercel.
2. Importe o repositório criado.
3. A Vercel detectará as configurações automaticamente via `vercel.json`.

### Hospedagem e Banco de Dados

#### 1. Banco de Dados (Supabase)
O sistema utiliza o **Supabase** para persistência de dados em nuvem. As tabelas necessárias são:
- `students`
- `teachers`
- `admins`
- `secretaries`

#### 2. Deploy (Vercel)
1. Conecte seu repositório GitHub à **Vercel**.
2. O deploy será feito automaticamente a cada push na branch `main`.

**Nota sobre Dados:** O sistema possui um fallback para `localStorage`. Se o Supabase não estiver disponível, os dados serão lidos e salvos localmente no navegador.
# scaling-bassoon-SEBITAM-LIMPO
