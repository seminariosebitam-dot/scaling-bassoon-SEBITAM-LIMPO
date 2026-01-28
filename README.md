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

### 3. Firebase Hosting
1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Inicialize (escolha Hosting): `firebase init`
4. Deploy: `firebase deploy`

---
**Nota sobre Dados:** Atualmente o sistema utiliza `localStorage`. Os dados ficam salvos localmente no navegador de cada usuário. Para compartilhamento de dados entre dispositivos, será necessário migrar para o Cloud Firestore (Firebase).
# scaling-bassoon-SEBITAM-LIMPO
