document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const navItems = document.querySelectorAll('.nav-item');

    // State
    let currentUser = {
        role: 'admin',
        name: 'Administrador'
    };

    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = "https://bgqftoqsuhcmtxnsqqsq.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncWZ0b3FzdWhjbXR4bnNxcXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTMxNjksImV4cCI6MjA4Mzg4OTE2OX0.KFvYjkSMYTfwChRF4OJVoJSxJbJhgg6zlyzcsQcvDO4";

    // Initialize Supabase Client
    let supabase = null;
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (err) {
        console.error("Erro ao inicializar Supabase:", err);
    }

    // Mapping frontend collection names to Supabase table names
    const tableMap = {
        'sebitam-students': 'students',
        'sebitam-teachers': 'teachers',
        'sebitam-admins': 'admins',
        'sebitam-secretaries': 'secretaries'
    };

    // Mapping frontend fields to Supabase fields (for students)
    function mapToSupabase(item, collectionName) {
        if (tableMap[collectionName] === 'students') {
            return {
                full_name: item.fullName,
                module: parseInt(item.module),
                grade: parseInt(item.grade),
                plan: item.plan,
                email: item.email,
                phone: item.phone,
                subject_grades: item.subjectGrades || {},
                subject_freqs: item.subjectFreqs || {}
            };
        }
        return item; // For others, assume direct mapping or handle as needed
    }

    function mapFromSupabase(item, collectionName) {
        if (tableMap[collectionName] === 'students') {
            return {
                id: item.id,
                fullName: item.full_name,
                module: item.module,
                grade: item.grade,
                plan: item.plan,
                email: item.email,
                phone: item.phone,
                subjectGrades: item.subject_grades,
                subjectFreqs: item.subject_freqs
            };
        }
        return item;
    }

    // Database Helpers (Abstraction layer for Supabase)
    async function dbGet(collectionName) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) return JSON.parse(localStorage.getItem(collectionName) || '[]');
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw error;
            return data.map(item => mapFromSupabase(item, collectionName));
        } catch (e) {
            console.error("Error fetching from Supabase:", e);
            return JSON.parse(localStorage.getItem(collectionName) || '[]');
        }
    }

    async function dbAddItem(collectionName, item) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            list.push(item);
            localStorage.setItem(collectionName, JSON.stringify(list));
            return;
        }
        const mapped = mapToSupabase(item, collectionName);
        const { error } = await supabase.from(table).insert([mapped]);
        if (error) console.error("Error adding to Supabase:", error);
    }

    async function dbUpdateItem(collectionName, id, updates) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            const idx = list.findIndex(i => i.id == id);
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...updates };
                localStorage.setItem(collectionName, JSON.stringify(list));
            }
            return;
        }
        const mapped = mapToSupabase(updates, collectionName);
        const { error } = await supabase.from(table).update(mapped).eq('id', id);
        if (error) console.error("Error updating in Supabase:", error);
    }

    async function dbDeleteItem(collectionName, id) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            const filtered = list.filter(i => i.id != id);
            localStorage.setItem(collectionName, JSON.stringify(filtered));
            return;
        }
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.error("Error deleting from Supabase:", error);
    }

    // Role Mapping
    const roleDetails = {
        admin: { name: 'Diretoria SEBITAM', label: 'Administrador' },
        secretary: { name: 'Secretaria Acadêmica', label: 'Secretaria' },
        teacher: { name: 'Corpo Docente', label: 'Professor' },
        student: { name: 'Acesso Aluno', label: 'Aluno' }
    };

    // Theme Logic
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = `theme-${theme}`;
            localStorage.setItem('sebitam-theme', theme);
        });
    });

    const savedTheme = localStorage.getItem('sebitam-theme');
    if (savedTheme) {
        document.body.className = `theme-${savedTheme}`;
    }

    // Role selection change logic removed as name is now always visible

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedRole = document.querySelector('input[name="role"]:checked').value;
        const loginEmail = document.getElementById('login-email').value.trim().toLowerCase();
        const loginName = document.getElementById('login-name').value.trim().toLowerCase().replace(/\s+/g, ' ');

        if (!loginEmail || !loginName) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Table mapping for validation
        const storeKey = selectedRole === 'student' ? 'sebitam-students' :
            selectedRole === 'teacher' ? 'sebitam-teachers' :
                selectedRole === 'admin' ? 'sebitam-admins' : 'sebitam-secretaries';

        const usersStore = await dbGet(storeKey);

        // Find if user exists with both email and name
        const foundUser = usersStore.find(u => {
            const uName = (u.fullName || u.name || '').toLowerCase().replace(/\s+/g, ' ');
            const uEmail = (u.email || u.institutionalEmail || '').toLowerCase().trim();
            return uName === loginName && uEmail === loginEmail;
        });

        // MASTER BYPASS: Permissão total para o Luiz Eduardo (Super Admin)
        const isMaster = (loginEmail === 'edukadoshmda@gmail.com' &&
            (loginName.includes('luiz eduardo') || loginName === 'luiz eduardo santos da silva'));

        if (!foundUser && !isMaster) {
            alert('Acesso negado. E-mail ou Nome não conferem com nossos registros para este perfil. Verifique seus dados ou procure a secretaria.');
            return;
        }

        // Se for Master e não estiver no Supabase ainda, forçar dados
        if (isMaster && !foundUser) {
            currentUser.name = 'Luiz Eduardo Santos da Silva';
            currentUser.role = 'admin';
        } else {
            currentUser.name = foundUser.fullName || foundUser.name;
            currentUser.role = selectedRole;
        }

        updateDashboardForRole(selectedRole);
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        lucide.createIcons();
        await renderView('overview');
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        dashboardScreen.classList.remove('active');
        loginScreen.classList.add('active');
    });

    // Nav Item Clicks
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            if (item.classList.contains('external-nav')) return;
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const view = item.getAttribute('data-view');
            await renderView(view);
        });
    });

    function updateDashboardForRole(role) {
        userNameEl.textContent = currentUser.name;
        userRoleEl.textContent = roleDetails[role].label;
        const allNavs = document.querySelectorAll('.nav-item');
        allNavs.forEach(nav => {
            nav.style.display = 'flex';
            const view = nav.dataset.view;
            if (role === 'student') {
                if (['users', 'teachers', 'finance', 'enrollment'].includes(view)) {
                    nav.style.display = 'none';
                }
            }
        });
    }

    const subjectMap = {
        1: { title: 'Módulo 1: Fundamentos', subs: ['Bibliologia', 'Teontologia', 'Introdução N.T', 'Introdução A.T'] },
        2: { title: 'Módulo 2: Contexto Histórico', subs: ['Geografia Bíblica', 'Hermenêutica', 'Período Inter bíblico', 'Ética Cristã'] },
        3: { title: 'Módulo 3: Doutrinas Específica', subs: ['Soteriologia', 'Eclesiologia', 'Escatologia', 'Homilética'] },
        4: { title: 'Módulo 4: Teologia Aplicada', subs: ['Teologia Contemporânea', 'In. T. Bíblica A.T', 'In. T. Bíblica N.T', 'Teologia Pastoral'] },
        5: { title: 'Módulo 5: Prática Pastoral', subs: ['Exegese Bíblica', 'Psicologia Pastoral'] },
    };

    async function generateCertificate(studentId) {
        const students = await dbGet('sebitam-students');
        const student = students.find(item => item.id == studentId);
        if (!student) return alert('Aluno não encontrado.');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Certificado - ${student.fullName}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:wght@700&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4 landscape; margin: 0; }
                        body { margin: 0; font-family: 'Montserrat', sans-serif; }
                        .certificate { width: 297mm; height: 210mm; background: white; border: 25px solid #1a365d; box-sizing: border-box; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px; }
                        .inner-border { position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; border: 5px solid #d4af37; pointer-events: none; }
                        .logo { height: 120px; margin-bottom: 20px; }
                        .cert-title { font-family: 'Playfair Display', serif; font-size: 5rem; color: #1a365d; margin: 10px 0; text-transform: uppercase; }
                        .student-name { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: #d4af37; margin: 20px 0; border-bottom: 2px solid #1a365d; padding: 0 40px; }
                        .content { text-align: center; max-width: 85% }
                        .footer { width: 100%; display: flex; justify-content: space-around; margin-top: 50px; }
                        .sig-block { text-align: center; border-top: 1px solid #1a365d; width: 200px; padding-top: 5px; font-size: 0.8rem; }
                    </style>
                </head>
                <body>
                    <div class="certificate">
                        <div class="inner-border"></div>
                        <img src="logo.jpg" class="logo">
                        <h1 class="cert-title">Certificado</h1>
                        <div class="content">
                            <p>O Seminário Bíblico Teológico da Amazônia certifica que:</p>
                            <div class="student-name">${student.fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</div>
                            <p>concluiu com excelente aproveitamento todas as exigências do <strong>CURSO MÉDIO EM TEOLOGIA</strong>.</p>
                        </div>
                        <div class="footer">
                            <div class="sig-block">SECRETÁRIA</div>
                            <div class="sig-block">PR. PRESIDENTE</div>
                            <div class="sig-block">COORDENADOR</div>
                        </div>
                    </div>
                    <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    async function printAcademicHistory(studentId) {
        const students = await dbGet('sebitam-students');
        const student = students.find(item => item.id == studentId);
        if (!student) return alert('Aluno não encontrado.');

        const printWindow = window.open('', '_blank');
        const nameCap = student.fullName.toUpperCase();
        const date = new Date().toLocaleDateString('pt-BR');

        printWindow.document.write(`
            <html>
                <head>
                    <title> </title>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15mm; color: #1e293b; line-height: 1.2; }
                        .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 10px; margin-bottom: 15px; }
                        .logo { height: 132px; margin-bottom: 5px; }
                        h1 { color: #1a365d; margin: 0; font-size: 20px; text-transform: uppercase; }
                        .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                        th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
                        th { background: #1a365d; color: white; text-transform: uppercase; font-size: 10px; }
                        .module-row { background: #f1f5f9; font-weight: bold; color: #1a365d; font-size: 11px; }
                        .footer { margin-top: 20px; text-align: center; font-size: 11px; display: flex; justify-content: space-around; }
                        .signature { border-top: 1px solid #1a365d; width: 220px; padding-top: 3px; margin-top: 30px; }
                        .status-approved { color: #166534; font-weight: bold; }
                        .status-pending { color: #991b1b; font-weight: bold; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="logo.jpg" class="logo">
                        <h1>Histórico Acadêmico Oficial</h1>
                        <p>Seminário Bíblico Teológico da Amazônia - SEBITAM</p>
                    </div>

                    <div class="student-info">
                        <div><strong>ALUNO(A):</strong> ${nameCap}</div>
                        <div><strong>CURSO:</strong> MÉDIO EM TEOLOGIA</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Disciplina</th>
                                <th style="text-align:center; width: 35px;">Módulo</th>
                                <th style="text-align:center; width: 60px;">Nota</th>
                                <th style="text-align:center; width: 110px;">Carga Horária</th>
                                <th style="text-align:center; width: 100px;">Situação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(subjectMap).map(([module, data]) => {
            return `
                                    <tr class="module-row"><td colspan="5" style="padding: 4px 8px;">${data.title}</td></tr>
                                    ${data.subs.map(sub => {
                const grade = (student.subjectGrades && student.subjectGrades[sub]) || '-';
                const isApproved = grade >= 7;
                const status = grade === '-' ? 'CURSANDO' : (isApproved ? 'APROVADO' : 'REPROVADO');

                return `
                                            <tr>
                                                <td style="padding-right: 2px;">${sub}</td>
                                                <td style="text-align:center; width: 35px; padding-left: 0px; padding-right: 0px;">${module}</td>
                                                <td style="text-align:center"><strong>${grade}</strong></td>
                                                <td style="text-align:center">40h</td>
                                                <td class="${isApproved ? 'status-approved' : 'status-pending'}" style="text-align:center">${status}</td>
                                            </tr>
                                        `;
            }).join('')}
                                `;
        }).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="signature">DIRETORIA ACADÊMICA</div>
                        <div class="signature">SECRETARIA GERAL</div>
                    </div>
                    <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    async function renderGradeEditor(studentId) {
        const students = await dbGet('sebitam-students');
        const s = students.find(item => item.id == studentId);
        if (!s) return;
        const moduleNum = s.module || 1;
        const subjects = subjectMap[moduleNum] ? subjectMap[moduleNum].subs : [];
        const contentBody = document.getElementById('dynamic-content');

        contentBody.innerHTML = `
            <div class="view-header">
                <button class="btn-primary" id="back-to-classes" style="width: auto; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;"><i data-lucide="arrow-left"></i> Voltar</button>
                <h2>Lançamento de Notas: ${s.fullName.toUpperCase()}</h2>
            </div>
            <div class="form-container">
                <table class="data-table">
                    <thead><tr><th>Disciplina</th><th>Módulo</th><th>Nota</th><th>Freq %</th></tr></thead>
                    <tbody>
                        ${Object.entries(subjectMap).map(([mNum, mData]) => `
                            <tr style="background: #f1f5f9; font-weight: bold;"><td colspan="4">${mData.title}</td></tr>
                            ${mData.subs.map(sub => `
                                <tr>
                                    <td>${sub}</td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted);">Módulo ${mNum}</td>
                                    <td><input type="number" class="table-input subject-grade" data-subject="${sub}" value="${(s.subjectGrades && s.subjectGrades[sub]) || ''}" step="0.1" min="0" max="10"></td>
                                    <td><input type="number" class="table-input subject-freq" data-subject="${sub}" value="${(s.subjectFreqs && s.subjectFreqs[sub]) || '100'}" min="0" max="100"></td>
                                </tr>
                            `).join('')}
                        `).join('')}
                    </tbody>
                </table>
                <div class="form-actions" style="margin-top:20px; display:flex; gap:10px;">
                    <button id="save-grades" class="btn-primary">Salvar Boletim</button>
                    <button id="print-grades" class="btn-primary" style="background:var(--secondary)">Imprimir Histórico</button>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('back-to-classes').onclick = () => renderView('classes');
        document.getElementById('save-grades').onclick = async () => {
            const grades = {}, freqs = {};
            document.querySelectorAll('.subject-grade').forEach(i => grades[i.dataset.subject] = parseFloat(i.value));
            document.querySelectorAll('.subject-freq').forEach(i => freqs[i.dataset.subject] = parseInt(i.value));
            await dbUpdateItem('sebitam-students', studentId, { subjectGrades: grades, subjectFreqs: freqs });
            alert('Boletim salvo!');
            await renderView('classes');
        };
        document.getElementById('print-grades').onclick = () => printAcademicHistory(studentId);
    }

    async function renderEditStudent(studentId) {
        const students = await dbGet('sebitam-students');
        const s = students.find(item => item.id == studentId);
        if (!s) return;

        const contentBody = document.getElementById('dynamic-content');
        contentBody.innerHTML = `
            <div class="view-header">
                <button class="btn-primary" id="back-to-users" style="width: auto; margin-bottom: 20px;"><i data-lucide="arrow-left"></i> Voltar</button>
                <h2>Editar Cadastro: ${s.fullName}</h2>
            </div>
            <div class="form-container">
                <form id="edit-st-form">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>Nome Completo do Aluno</label>
                            <div class="input-field">
                                <i data-lucide="user"></i>
                                <input type="text" name="fullName" value="${s.fullName}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Módulo Atual</label>
                            <div class="input-field">
                                <i data-lucide="layers"></i>
                                <select name="module" style="padding-left: 48px;">
                                    <option value="1" ${s.module == '1' ? 'selected' : ''}>Módulo 1: Fundamentos</option>
                                    <option value="2" ${s.module == '2' ? 'selected' : ''}>Módulo 2: Contexto Histórico</option>
                                    <option value="3" ${s.module == '3' ? 'selected' : ''}>Módulo 3: Doutrinas Específica</option>
                                    <option value="4" ${s.module == '4' ? 'selected' : ''}>Módulo 4: Teologia Aplicada</option>
                                    <option value="5" ${s.module == '5' ? 'selected' : ''}>Módulo 5: Prática Pastoral</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Turma (1 a 10)</label>
                            <div class="input-field">
                                <i data-lucide="hash"></i>
                                <select name="grade" style="padding-left: 48px;">
                                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}" ${s.grade == n ? 'selected' : ''}>Turma ${n}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Plano Financeiro</label>
                            <div class="input-field">
                                <i data-lucide="credit-card"></i>
                                <select name="plan" style="padding-left: 48px;">
                                    <option value="integral" ${s.plan === 'integral' ? 'selected' : ''}>Integral</option>
                                    <option value="half" ${s.plan === 'half' ? 'selected' : ''}>Meia Mensalidade</option>
                                    <option value="scholarship" ${s.plan === 'scholarship' ? 'selected' : ''}>Bolsa Estudo</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>E-mail Pessoal</label>
                            <div class="input-field">
                                <i data-lucide="mail"></i>
                                <input type="email" name="email" value="${s.email || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Telefone / WhatsApp</label>
                            <div class="input-field">
                                <i data-lucide="phone"></i>
                                <input type="tel" name="phone" value="${s.phone || ''}" required>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary" style="margin-bottom: 0;">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;

        lucide.createIcons();
        document.getElementById('back-to-users').onclick = () => renderView('users');

        document.getElementById('edit-st-form').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            await dbUpdateItem('sebitam-students', studentId, data);
            alert('Cadastro atualizado com sucesso!');
            await renderView('users');
        };
    }

    async function renderView(view, data = null) {
        const contentBody = document.getElementById('dynamic-content');
        let html = '';
        switch (view) {
            case 'overview':
                const students = await dbGet('sebitam-students');
                const listTeachers = await dbGet('sebitam-teachers');
                const listAdmins = await dbGet('sebitam-admins');
                const listSecs = await dbGet('sebitam-secretaries');
                const countSt = students.length;

                html = `
                    <div class="welcome-card"><h1 style="color: white !important;">Olá, ${currentUser.name}!</h1><p>Bem-vindo ao centro de comando SEBITAM. Aqui está o resumo atualizado da instituição.</p></div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i data-lucide="users"></i></div>
                            <div class="stat-value">${countSt}</div>
                            <div class="stat-label">Alunos Matriculados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i data-lucide="graduation-cap"></i></div>
                            <div class="stat-value">${listTeachers.length}</div>
                            <div class="stat-label">Professores</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i data-lucide="layers"></i></div>
                            <div class="stat-value">5</div>
                            <div class="stat-label">Módulos Ativos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i data-lucide="trending-up"></i></div>
                            <div class="stat-value">98%</div>
                            <div class="stat-label">Média de Frequência</div>
                        </div>
                    </div>

                    <div class="view-header" style="margin-top: 40px;">
                        <h2>Corpo Administrativo e Docente</h2>
                        <p>Contatos rápidos da equipe de gestão e ensino.</p>
                    </div>

                    <div class="staff-contacts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px;">
                        <!-- ADM Card -->
                        <div class="stat-card" style="height: auto; align-items: flex-start; padding: 25px; background: white; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; width: 100%; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                                <i data-lucide="shield" style="color: var(--primary);"></i>
                                <h3 style="font-size: 1.1rem; font-weight: 700;">Administradores</h3>
                            </div>
                            <div style="width: 100%;">
                                ${listAdmins.length === 0 ? '<p style="font-size: 0.9rem; color: var(--text-muted);">Nenhum administrador cadastrado.</p>' :
                        listAdmins.map(a => `
                                        <div style="margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div>
                                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${a.name}</div>
                                                <div style="color: var(--primary); font-size: 0.85rem; display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                                    <i data-lucide="phone" style="width: 14px; height: 14px;"></i> <strong>${a.phone || 'Sem contato'}</strong>
                                                </div>
                                            </div>
                                            ${(currentUser.role === 'admin' || currentUser.role === 'secretary') ? `
                                            <button class="btn-icon red delete-staff-ov" data-id="${a.id}" data-type="admin" title="Excluir" style="padding: 4px; width: 28px; height: 28px;">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>` : ''}
                                        </div>
                                    `).join('')
                    }                   </div>
                        </div>

                        <!-- Sec Card -->
                        <div class="stat-card" style="height: auto; align-items: flex-start; padding: 25px; background: white; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; width: 100%; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                                <i data-lucide="briefcase" style="color: var(--primary);"></i>
                                <h3 style="font-size: 1.1rem; font-weight: 700;">Secretaria</h3>
                            </div>
                            <div style="width: 100%;">
                                ${listSecs.length === 0 ? '<p style="font-size: 0.9rem; color: var(--text-muted);">Nenhum secretário cadastrado.</p>' :
                        listSecs.map(s => `
                                        <div style="margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div>
                                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${s.name}</div>
                                                <div style="color: var(--primary); font-size: 0.85rem; display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                                    <i data-lucide="phone" style="width: 14px; height: 14px;"></i> <strong>${s.phone || 'Sem contato'}</strong>
                                                </div>
                                            </div>
                                            ${(currentUser.role === 'admin' || currentUser.role === 'secretary') ? `
                                            <button class="btn-icon red delete-staff-ov" data-id="${s.id}" data-type="secretary" title="Excluir" style="padding: 4px; width: 28px; height: 28px;">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>` : ''}
                                        </div>
                                    `).join('')
                    }                   </div>
                        </div>

                        <!-- Teacher Card -->
                        <div class="stat-card" style="height: auto; align-items: flex-start; padding: 25px; background: white; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; width: 100%; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                                <i data-lucide="graduation-cap" style="color: var(--primary);"></i>
                                <h3 style="font-size: 1.1rem; font-weight: 700;">Professores</h3>
                            </div>
                            <div style="width: 100%;">
                                ${listTeachers.length === 0 ? '<p style="font-size: 0.9rem; color: var(--text-muted);">Nenhum professor cadastrado.</p>' :
                        listTeachers.map(t => `
                                        <div style="margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div>
                                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${t.name}</div>
                                                <div style="color: var(--primary); font-size: 0.85rem; display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                                    <i data-lucide="phone" style="width: 14px; height: 14px;"></i> <strong>${t.phone || 'Sem contato'}</strong>
                                                </div>
                                            </div>
                                            ${(currentUser.role === 'admin' || currentUser.role === 'secretary') ? `
                                            <button class="btn-icon red delete-staff-ov" data-id="${t.id}" data-type="teacher" title="Excluir" style="padding: 4px; width: 28px; height: 28px;">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>` : ''}
                                        </div>
                                    `).join('')
                    }
                            </div>
                        </div>
                    </div>
                `;
                setTimeout(() => {
                    document.querySelectorAll('.delete-staff-ov').forEach(b => b.onclick = async () => {
                        const type = b.dataset.type;
                        const label = type === 'admin' ? 'Administrador' : type === 'teacher' ? 'Professor' : 'Secretário';
                        if (!confirm(`Tem certeza que deseja excluir este ${label}?`)) return;
                        const id = b.dataset.id;
                        const key = type === 'teacher' ? 'sebitam-teachers' : type === 'admin' ? 'sebitam-admins' : 'sebitam-secretaries';
                        await dbDeleteItem(key, id);
                        await renderView('overview');
                    });
                    lucide.createIcons();
                }, 0);
                break;
            case 'enrollment':
                const activeType = data && data.type ? data.type : 'student';
                html = `
                    <div class="view-header"><h2>Cadastro Institucional</h2></div>
                    <div class="tabs-container" style="display:flex; gap:10px; margin-bottom:20px;">
                        <button class="tab-btn ${activeType === 'student' ? 'active' : ''}" data-type="student">Alunos</button>
                        <button class="tab-btn ${activeType === 'teacher' ? 'active' : ''}" data-type="teacher">Professores</button>
                        <button class="tab-btn ${activeType === 'admin' ? 'active' : ''}" data-type="admin">Adm</button>
                        <button class="tab-btn ${activeType === 'secretary' ? 'active' : ''}" data-type="secretary">Secretaria</button>
                    </div>
                    <div id="reg-form-container"></div>
                `;
                setTimeout(() => {
                    const renderForm = (type) => {
                        const container = document.getElementById('reg-form-container');
                        let formHtml = '';
                        if (type === 'student') {
                            formHtml = `
                                <div class="form-container">
                                    <form id="form-st">
                                        <div class="form-grid">
                                            <div class="form-group full-width">
                                                <label>Nome Completo do Aluno</label>
                                                <div class="input-field">
                                                    <i data-lucide="user"></i>
                                                    <input type="text" name="fullName" placeholder="Ex: Luiz Eduardo Santos" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Módulo de Ingresso</label>
                                                <div class="input-field">
                                                    <i data-lucide="layers"></i>
                                                    <select name="module" style="padding-left: 48px;">
                                                        <option value="1">Módulo 1: Fundamentos</option>
                                                        <option value="2">Módulo 2: Contexto Histórico</option>
                                                        <option value="3">Módulo 3: Doutrinas Específica</option>
                                                        <option value="4">Módulo 4: Teologia Aplicada</option>
                                                        <option value="5">Módulo 5: Prática Pastoral</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Turma (1 a 10)</label>
                                                <div class="input-field">
                                                    <i data-lucide="hash"></i>
                                                    <select name="grade" style="padding-left: 48px;">
                                                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}">Turma ${n}</option>`).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Plano Financeiro</label>
                                                <div class="input-field">
                                                    <i data-lucide="credit-card"></i>
                                                    <select name="plan" style="padding-left: 48px;">
                                                        <option value="integral">Integral</option>
                                                        <option value="half">Meia Mensalidade</option>
                                                        <option value="scholarship">Bolsa Estudo</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>E-mail Pessoal</label>
                                                <div class="input-field">
                                                    <i data-lucide="mail"></i>
                                                    <input type="email" name="email" placeholder="aluno@email.com" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Telefone / WhatsApp</label>
                                                <div class="input-field">
                                                    <i data-lucide="phone"></i>
                                                    <input type="tel" name="phone" placeholder="(00) 00000-0000" required>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn-primary" style="margin-bottom: 0;">Confirmar Matrícula</button>
                                        </div>
                                    </form>
                                </div>`;
                        } else {
                            const extraLabel = type === 'teacher' ? 'Disciplina' : type === 'admin' ? 'Cargo' : 'Setor';
                            const extraIcon = type === 'teacher' ? 'book' : 'briefcase';
                            formHtml = `
                                <div class="form-container">
                                    <form id="form-other">
                                        <div class="form-grid">
                                            <div class="form-group full-width">
                                                <label>Nome Completo</label>
                                                <div class="input-field">
                                                    <i data-lucide="user"></i>
                                                    <input type="text" name="name" placeholder="Nome" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>E-mail Institucional</label>
                                                <div class="input-field">
                                                    <i data-lucide="mail"></i>
                                                    <input type="email" name="email" placeholder="email@sebitam.com" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Telefone / WhatsApp</label>
                                                <div class="input-field">
                                                    <i data-lucide="phone"></i>
                                                    <input type="tel" name="phone" placeholder="(00) 00000-0000" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>${extraLabel}</label>
                                                <div class="input-field">
                                                    <i data-lucide="${extraIcon}"></i>
                                                    <input type="text" name="extra" placeholder="${extraLabel}" required>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn-primary" style="margin-bottom: 0;">Salvar Cadastro</button>
                                        </div>
                                    </form>
                                </div>`;
                        }
                        container.innerHTML = formHtml;
                        lucide.createIcons();
                        const form = container.querySelector('form');
                        form.onsubmit = async (e) => {
                            e.preventDefault();
                            const fd = new FormData(form);
                            const val = Object.fromEntries(fd.entries());
                            val.id = Date.now();
                            const key = type === 'student' ? 'sebitam-students' : type === 'teacher' ? 'sebitam-teachers' : type === 'admin' ? 'sebitam-admins' : 'sebitam-secretaries';
                            await dbAddItem(key, val);
                            alert('Cadastrado com sucesso!');
                            await renderView('overview');
                        };
                    };
                    renderForm(activeType);
                    document.querySelectorAll('.tab-btn').forEach(b => b.onclick = () => renderView('enrollment', { type: b.dataset.type }));
                }, 0);
                break;
            case 'users':
                const activeUserTab = data && data.type ? data.type : 'student';
                const getStoreKey = (type) => {
                    switch (type) {
                        case 'student': return 'sebitam-students';
                        case 'teacher': return 'sebitam-teachers';
                        case 'admin': return 'sebitam-admins';
                        case 'secretary': return 'sebitam-secretaries';
                        default: return 'sebitam-students';
                    }
                };

                const usersList = await dbGet(getStoreKey(activeUserTab));
                const labelMap = { student: 'Aluno', teacher: 'Professor', admin: 'Adm', secretary: 'Secretaria' };

                html = `
                    <div class="view-header"><h2>Gestão de Usuários</h2></div>
                    <div class="tabs-container" style="display:flex; gap:10px; margin-bottom:20px;">
                        <button class="tab-btn ${activeUserTab === 'student' ? 'active' : ''}" data-type="student">Alunos</button>
                        <button class="tab-btn ${activeUserTab === 'teacher' ? 'active' : ''}" data-type="teacher">Professores</button>
                        <button class="tab-btn ${activeUserTab === 'admin' ? 'active' : ''}" data-type="admin">Administradores</button>
                        <button class="tab-btn ${activeUserTab === 'secretary' ? 'active' : ''}" data-type="secretary">Secretaria</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>${activeUserTab === 'student' ? 'Turma' : 'Cargo'}</th>
                                    <th>E-mail</th>
                                    <th>Telefone</th>
                                    <th class="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersList.map(u => {
                    const uName = u.fullName || u.name || 'Sem Nome';
                    const nameCap = uName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    const roleInfo = activeUserTab === 'student' ? `Turma ${u.grade || '-'}` : (labelMap[activeUserTab]);
                    const email = u.email || u.institutionalEmail || '-';
                    const phone = u.phone || '-';
                    return `
                                        <tr>
                                            <td><strong>${nameCap}</strong></td>
                                            <td><span class="badge" style="background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border);">${roleInfo}</span></td>
                                            <td style="font-size: 0.85rem;">${email}</td>
                                            <td style="font-size: 0.85rem;">${phone}</td>
                                            <td style="display: flex; gap: 10px; justify-content: flex-end;">
                                                ${activeUserTab === 'student' ? `
                                                    <button class="btn-icon edit-st" data-id="${u.id}" title="Editar Aluno">
                                                        <i data-lucide="edit"></i>
                                                    </button>
                                                ` : ''}
                                                ${(currentUser.role === 'admin' || currentUser.role === 'secretary') ? `
                                                    <button class="btn-icon red delete-user" data-id="${u.id}" data-type="${activeUserTab}" title="Excluir">
                                                        <i data-lucide="trash-2"></i>
                                                    </button>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
                                ${usersList.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum registro encontrado.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>`;
                setTimeout(() => {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.onclick = () => renderView('users', { type: b.dataset.type });
                    });

                    document.querySelectorAll('.delete-user').forEach(b => b.onclick = async () => {
                        const utype = b.dataset.type;
                        if (!confirm(`Tem certeza que deseja excluir este ${labelMap[utype]}?`)) return;
                        const uid = b.dataset.id;
                        const ukey = getStoreKey(utype);
                        await dbDeleteItem(ukey, uid);
                        await renderView('users', { type: utype });
                    });

                    document.querySelectorAll('.edit-st').forEach(b => b.onclick = () => {
                        renderEditStudent(b.dataset.id);
                    });
                    lucide.createIcons();
                }, 0);
                break;
            case 'classes':
                let allSt = await dbGet('sebitam-students');
                if (currentUser.role === 'student') {
                    allSt = allSt.filter(s => s.fullName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
                }
                html = `
                    <div class="view-header"><h2>Alunos</h2></div>
                    <div class="turmas-container">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => {
                    const inG = allSt.filter(s => s.grade == g);
                    if (inG.length === 0) return '';
                    return `
                                <div class="turma-section" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: var(--shadow);">
                                    <h3 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--border); padding-bottom: 10px;">Turma ${g}</h3>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Aluno</th>
                                                <th>Plano</th>
                                                <th>Financeiro</th>
                                                <th class="text-right" style="text-align: right;">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${inG.map(s => {
                        const nameCap = s.fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        const planLabel = s.plan === 'integral' ? 'Integral' : s.plan === 'half' ? 'Meia' : 'Bolsa';
                        const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
                        return `
                                                <tr>
                                                    <td><strong>${nameCap}</strong></td>
                                                    <td><span class="badge ${s.plan === 'integral' ? 'plan-integral' : s.plan === 'half' ? 'plan-half' : 'plan-scholarship'}">${planLabel}</span></td>
                                                    <td>
                                                        ${currentUser.role !== 'student' ?
                                `<div style="display: flex; gap: 5px;">
                                                                <button onclick="updatePaymentStatus(${s.id}, 'Pago')" class="btn-icon ${status === 'Pago' ? 'green' : ''}" title="Confirmar Pagamento" style="border: 1px solid ${status === 'Pago' ? '#22c55e' : '#cbd5e1'}; background: ${status === 'Pago' ? 'rgba(34, 197, 94, 0.1)' : 'transparent'}">
                                                                    <i data-lucide="check-circle" style="width: 14px; height: 14px; color: ${status === 'Pago' ? '#22c55e' : '#64748b'};"></i>
                                                                </button>
                                                                <button onclick="updatePaymentStatus(${s.id}, 'Pendente')" class="btn-icon ${status === 'Pendente' ? 'red' : ''}" title="Marcar como Pendente" style="border: 1px solid ${status === 'Pendente' ? '#ef4444' : '#cbd5e1'}; background: ${status === 'Pendente' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'}">
                                                                    <i data-lucide="alert-circle" style="width: 14px; height: 14px; color: ${status === 'Pendente' ? '#ef4444' : '#64748b'};"></i>
                                                                </button>
                                                                <span style="font-size: 0.75rem; font-weight: 600; color: ${status === 'Pago' ? '#16a34a' : '#dc2626'}; margin-left: 5px; align-self: center;">${status}</span>
                                                            </div>` :
                                `<span class="badge ${status === 'Pago' ? 'active' : 'plan-half'}" style="background: ${status === 'Pago' ? '#22c55e' : '#ef4444'}; color: white;">${status}</span>`
                            }
                                                    </td>
                                                    <td style="text-align: right;">
                                                        ${currentUser.role !== 'student' ? `
                                                        <button class="btn-primary btn-small" style="width: auto; display: inline-flex; align-items: center; gap: 5px;" onclick="renderGradeEditor(${s.id})">
                                                            <i data-lucide="edit" style="width: 14px; height: 14px;"></i> Notas
                                                        </button>
                                                        ` : ''}
                                                        <button class="btn-icon" title="Imprimir Certificado" onclick="generateCertificate(${s.id})">
                                                            <i data-lucide="printer"></i>
                                                        </button>
                                                        <button class="btn-icon" title="Ver Histórico Acadêmico" onclick="printAcademicHistory(${s.id})">
                                                            <i data-lucide="file-text"></i>
                                                        </button>
                                                    </td>
                                                </tr>`;
                    }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                }).join('')}
                    </div>`;
                setTimeout(() => lucide.createIcons(), 0);
                break;
            case 'modules':
                html = `
                    <div class="view-header">
                        <h2>Módulos do Curso</h2>
                        <p>Acesse o material didático em PDF para cada disciplina.</p>
                    </div>
                    <div class="modules-grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${Object.entries(subjectMap).map(([id, data]) => `
                            <div class="module-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border); transition: var(--transition);">
                                <div class="module-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 15px;">
                                    <div class="module-icon" style="width: 45px; height: 45px; border-radius: 12px; background: rgba(37, 99, 235, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="book-open"></i>
                                    </div>
                                    <h3 style="font-size: 1.1rem; font-weight: 700;">${data.title}</h3>
                                </div>
                                <ul class="subject-list" style="list-style: none; padding: 0; margin-bottom: 25px;">
                                    ${data.subs.map(sub => `
                                        <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">
                                            <i data-lucide="check-circle" style="width: 14px; height: 14px; color: var(--primary);"></i>
                                            ${sub}
                                        </li>
                                    `).join('')}
                                </ul>
                                <a href="https://drive.google.com/drive/folders/1ij80vwRTtx49bW_c28jOYULLP7Yw2Iao" target="_blank" class="btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 10px; text-decoration: none; margin-bottom: 0; font-size: 0.9rem; padding: 12px;">
                                    <i data-lucide="file-text"></i> Abrir Material (PDF)
                                </a>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
            case 'gallery':
                html = `
                    <div class="view-header">
                        <h2>Fotos & Vídeos</h2>
                        <p>Acesse nossa galeria oficial de registros institucionais.</p>
                    </div>
                    <div class="welcome-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px;">
                        <i data-lucide="image" style="width: 64px; height: 64px; opacity: 0.8;"></i>
                        <h3>Nossa Galeria no Drive</h3>
                        <p>Clique no botão abaixo para visualizar todas as fotos e vídeos de nossas aulas e eventos.</p>
                        <a href="https://drive.google.com/drive/folders/1bHiOrFojPoQOcaTerk23vi-y8jtKwTd5" target="_blank" class="btn-primary" style="width: auto; padding: 12px 30px; background: white; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="external-link"></i> Abrir Galeria Oficial
                        </a>
                    </div>
                `;
                break;
            case 'finance':
                const finStudents = await dbGet('sebitam-students');
                const planCounts = {
                    integral: finStudents.filter(s => s.plan === 'integral').length,
                    half: finStudents.filter(s => s.plan === 'half').length,
                    scholarship: finStudents.filter(s => s.plan === 'scholarship').length
                };

                const payments = {
                    paid: finStudents.filter(s => {
                        const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
                        return status === 'Pago';
                    }).length,
                    pending: finStudents.filter(s => {
                        const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
                        return status === 'Pendente';
                    }).length
                };

                html = `
                    <div class="view-header">
                        <h2>Painel Financeiro</h2>
                        <p>Visão de gestão de mensalidades e planos acadêmicos.</p>
                    </div>
                    
                    <div class="stats-grid" style="margin-bottom: 30px;">
                        <div class="stat-card" style="background: white;">
                            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #16a34a;"><i data-lucide="trending-up"></i></div>
                            <div class="stat-value">${payments.paid}</div>
                            <div class="stat-label">Pagamentos Confirmados</div>
                        </div>
                        <div class="stat-card" style="background: white;">
                            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #dc2626;"><i data-lucide="alert-circle"></i></div>
                            <div class="stat-value">${payments.pending}</div>
                            <div class="stat-label">Pagamentos Pendentes</div>
                        </div>
                        <div class="stat-card" style="background: white;">
                            <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;"><i data-lucide="users"></i></div>
                            <div class="stat-value">${finStudents.length}</div>
                            <div class="stat-label">Total de Alunos</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin-bottom: 40px;">
                        <!-- Gráfico de Planos -->
                        <div class="stat-card" style="display: block; height: auto; background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                                <i data-lucide="pie-chart" style="color: var(--primary);"></i> Distribuição por Plano
                            </h3>
                            <div style="height: 250px; width: 100%; position: relative;">
                                <canvas id="plansChart"></canvas>
                            </div>
                            <div style="margin-top: 20px; font-size: 0.9rem; color: var(--text-muted);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Integral:</span> <strong>${planCounts.integral}</strong></div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Meia Mensalidade:</span> <strong>${planCounts.half}</strong></div>
                                <div style="display: flex; justify-content: space-between;"><span>Bolsista:</span> <strong>${planCounts.scholarship}</strong></div>
                            </div>
                        </div>

                        <!-- Gráfico de Pagamentos -->
                        <div class="stat-card" style="display: block; height: auto; background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                                <i data-lucide="dollar-sign" style="color: var(--primary);"></i> Status de Adimplência
                            </h3>
                            <div style="height: 250px; width: 100%; position: relative;">
                                <canvas id="paymentsChart"></canvas>
                            </div>
                            <div style="margin-top: 20px; font-size: 0.9rem; color: var(--text-muted); text-align: center;">
                                <p>Detalhamento de recebíveis e pendências mensais.</p>
                            </div>
                        </div>
                    </div>
                `;

                setTimeout(() => {
                    if (typeof Chart === 'undefined') {
                        console.error('Chart.js não carregado.');
                        return;
                    }

                    const ctxPlans = document.getElementById('plansChart');
                    if (ctxPlans) {
                        new Chart(ctxPlans, {
                            type: 'doughnut',
                            data: {
                                labels: ['Integral', 'Meia', 'Bolsista'],
                                datasets: [{
                                    data: [planCounts.integral, planCounts.half, planCounts.scholarship],
                                    backgroundColor: ['#1a365d', '#3b82f6', '#94a3b8'],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', size: 11 } } }
                                }
                            }
                        });
                    }

                    const ctxPayments = document.getElementById('paymentsChart');
                    if (ctxPayments) {
                        new Chart(ctxPayments, {
                            type: 'pie',
                            data: {
                                labels: ['Pago', 'Pendente'],
                                datasets: [{
                                    data: [payments.paid, payments.pending],
                                    backgroundColor: ['#22c55e', '#ef4444'],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', size: 11 } } }
                                }
                            }
                        });
                    }
                    lucide.createIcons();
                }, 100);
                break;
            case 'theology-ai':
                html = `
                    <div class="view-header">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="ai-avatar-large">
                                <img src="ai-agent.png" alt="IA">
                            </div>
                            <div>
                                <h2 style="margin:0;">Antigravity - IA Teológica</h2>
                                <p style="margin:0; color:var(--text-muted); font-size:0.9rem;">Especialista em Teologia e Gestão SEBITAM</p>
                            </div>
                        </div>
                    </div>

                    <div class="chat-container">
                        <div class="chat-messages" id="chat-messages">
                            <div class="message ai">
                                <div class="msg-bubble shadow-sm">
                                    <h4 style="margin-bottom: 8px; color: var(--primary);">Saudações Teológicas!</h4>
                                    Sou <strong>Antigravity</strong>, sua inteligência especializada no ecossistema SEBITAM. Analiso doutrinas, organizo currículos e auxilio na exegese bíblica com precisão acadêmica. Como posso iluminar seus estudos ou facilitar a gestão institucional hoje?
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-input-area">
                            <div class="chat-input-wrapper" style="border-radius: 20px; align-items: flex-end; padding: 15px 25px; gap: 20px;">
                                <input type="file" id="ai-file-input" style="display: none;">
                                <button class="chat-action-btn" id="attach-file-btn" title="Anexar Material de Estudo" style="padding-bottom: 15px;"><i data-lucide="paperclip" style="width: 24px; height: 24px;"></i></button>
                                <textarea id="chat-input" placeholder="Digite sua dúvida teológica ou cole um texto para análise aqui..." style="flex: 1; border: none; outline: none; font-size: 1.1rem; padding: 10px 0; min-height: 120px; max-height: 400px; resize: none; background: transparent; font-family: inherit; line-height: 1.6;"></textarea>
                                <button class="chat-send-btn" id="send-chat-btn" style="margin-bottom: 10px; width: 55px; height: 55px;">
                                    <i data-lucide="send" style="width: 24px; height: 24px;"></i>
                                </button>
                            </div>
                            <div id="file-preview" style="margin-top: 15px; font-size: 0.9rem; color: var(--primary); display: none; align-items: center; gap: 8px; padding-left: 10px;">
                                <i data-lucide="file-text"></i> <span id="file-name"></span>
                            </div>
                        </div>
                    </div>
                `;

                setTimeout(() => {
                    const chatMessages = document.getElementById('chat-messages');
                    const chatInput = document.getElementById('chat-input');
                    const sendBtn = document.getElementById('send-chat-btn');
                    const attachBtn = document.getElementById('attach-file-btn');
                    const fileInput = document.getElementById('ai-file-input');
                    const filePreview = document.getElementById('file-preview');
                    const fileNameSpan = document.getElementById('file-name');

                    attachBtn.onclick = () => fileInput.click();
                    fileInput.onchange = () => {
                        if (fileInput.files.length > 0) {
                            fileNameSpan.textContent = `Arquivo: ${fileInput.files[0].name}`;
                            filePreview.style.display = 'flex';
                        }
                    };

                    const addMessage = (text, type) => {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = `message ${type}`;
                        msgDiv.innerHTML = `<div class="msg-bubble shadow-sm">${text}</div>`;
                        chatMessages.appendChild(msgDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        lucide.createIcons();
                    };

                    const handleSend = () => {
                        const text = chatInput.value.trim();
                        const hasFile = fileInput.files.length > 0;
                        if (!text && !hasFile) return;

                        if (hasFile) {
                            addMessage(`[Anexo: ${fileInput.files[0].name}]<br>${text}`, 'user');
                            fileInput.value = '';
                            filePreview.style.display = 'none';
                        } else {
                            addMessage(text, 'user');
                        }

                        chatInput.value = '';
                        chatInput.style.height = 'auto';

                        setTimeout(() => {
                            let response = "";
                            const lowText = text.toLowerCase();

                            // Sistema de Inteligência Baseado em Contexto
                            const contextMap = [
                                {
                                    keys: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'paz'],
                                    resp: "<strong>Paz seja convosco!</strong> Como seu assistente Antigravity, estou operando com capacidade analítica máxima. Posso realizar exegeses, orientar sua jornada acadêmica no SEBITAM ou discutir estratégias ministeriais. Por onde deseja começar?"
                                },
                                {
                                    keys: ['ministério', 'pastoral', 'liderança', 'igreja', 'culto', 'missões', 'prático'],
                                    resp: `
                                        <div style="margin-bottom: 15px;"><strong>Eixo Prático (Ministério):</strong> Notei seu interesse na área ministerial. No SEBITAM, a teologia deve frutificar em serviço.</div>
                                        <p>Para o desenvolvimento do seu ministério, recomendo focar em:
                                        <ul style="padding-left: 20px; margin: 10px 0;">
                                            <li><strong>Homilética:</strong> A arte da pregação bíblica (Módulo 3).</li>
                                            <li><strong>Teologia Pastoral:</strong> O cuidado com as almas (Módulo 4).</li>
                                            <li><strong>Psicologia Pastoral:</strong> Compreensão do rebanho (Módulo 5).</li>
                                        </ul>
                                        Deseja que eu aprofunde algum destes pilares ministeriais?</p>
                                    `
                                },
                                {
                                    keys: ['acadêmico', 'gestão', 'secretaria', 'coordenação', 'matrícula', 'frequência', 'sistema'],
                                    resp: `
                                        <div style="margin-bottom: 10px;"><strong>Eixo Acadêmico (Gestão):</strong> Compreendo. Para otimizar a gestão institucional:</div>
                                        <ul style="padding-left: 20px;">
                                            <li><strong>Dados:</strong> O controle de frequência e notas é automatizado via Supabase para evitar erros manuais.</li>
                                            <li><strong>Currículo:</strong> Seguimos uma formação média dividida em 5 módulos sequenciais.</li>
                                            <li><strong>Relatórios:</strong> A aba 'Financeiro' oferece indicadores em tempo real para tomada de decisão.</li>
                                        </ul>
                                        Qual área da coordenação acadêmica você deseja gerenciar agora?
                                    `
                                },
                                {
                                    keys: ['exegese', 'hermenêutica', 'grego', 'hebraico', 'interpretação', 'texto', 'bíblia', 'versículo'],
                                    resp: "<strong>Análise Exegética:</strong> Esta é uma das minhas especialidades. Posso analisar a transição entre o contexto original e a aplicação contemporânea. Estude o <em>Módulo 2 (Contexto Histórico)</em> para dominar as ferramentas de interpretação do SEBITAM. Quer que eu comente sobre algum texto bíblico específico?"
                                },
                                {
                                    keys: ['módulo', 'disciplina', 'estudar', 'curso', 'aula', 'matéria'],
                                    resp: "<strong>Organização Curricular:</strong> O SEBITAM organiza o conhecimento de forma progressiva. Se você está iniciando no <strong>Módulo 1 (Fundamentos)</strong>, foque em <em>Bibliologia</em>. Se está concluindo no <strong>Módulo 5</strong>, o foco é <em>Prática</em>. Posso detalhar o conteúdo de qualquer uma das nossas 20 disciplinas."
                                },
                                {
                                    keys: ['histórico', 'nota', 'boletim', 'certificado', 'documento', 'pdf', 'imprimir'],
                                    resp: "Sua documentação acadêmica é gerada instantaneamente. O administrador deve acessar a aba 'Alunos' e clicar nos ícones de impressora ou documento. O PDF gerado já está configurado com carga horária oficial de 40h por matéria e pronto para emissão."
                                },
                                {
                                    keys: ['teologia', 'doutrina', 'dogma', 'deus', 'jesus', 'espírito', 'fé', 'soteriologia', 'escatologia'],
                                    resp: "<strong>Análise Doutrinária:</strong> Minha base de dados compreende as principais sistemáticas (Soteriologia, Eclesiologia, Escatologia). No SEBITAM, prezamos pela profundidade bíblica e fidelidade ao texto. Qual destes temas dogmáticos você está pesquisando no momento?"
                                }
                            ];

                            // Buscar correspondência
                            const match = contextMap.find(c => c.keys.some(k => lowText.includes(k)));

                            if (match) {
                                response = match.resp;
                            } else if (hasFile) {
                                response = "<strong>Arquivo Recebido:</strong> Documento digitalizado com sucesso para análise. Estou cruzando as informações com as disciplinas do SEBITAM. Pode me fazer perguntas específicas sobre o material anexado.";
                            } else {
                                response = "Como sua IA teológica, analisei sua solicitação mas preciso de mais contexto. <br><br>Seu foco é <strong>Acadêmico</strong> (gestão), <strong>Doutrinário</strong> (ensino) ou <strong>Prático</strong> (ministério)? <br><br><em>Dica: Tente palavras como 'Gestão', 'Ministério', 'Exegese' ou 'Histórico'.</em>";
                            }
                            addMessage(response, 'ai');
                        }, 1000);
                    };

                    sendBtn.onclick = handleSend;
                    chatInput.onkeypress = (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    };
                    lucide.createIcons();
                }, 0);
                break;
        }
        if (html) contentBody.innerHTML = html;
        lucide.createIcons();
    }

    async function updatePaymentStatus(studentId, status) {
        await dbUpdateItem('sebitam-students', studentId, { paymentStatus: status });
        await renderView('classes');
    }

    // Export functions to window for onclick handlers
    window.renderGradeEditor = renderGradeEditor;
    window.generateCertificate = generateCertificate;
    window.printAcademicHistory = printAcademicHistory;
    window.updatePaymentStatus = updatePaymentStatus;

    // Profile Photo Upload Logic
    const avatarContainer = document.getElementById('profile-avatar-container');
    const profileUpload = document.getElementById('profile-upload');
    const userAvatarImg = document.getElementById('user-avatar-img');

    if (avatarContainer && profileUpload) {
        avatarContainer.onclick = () => profileUpload.click();
        profileUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    userAvatarImg.src = event.target.result;
                    // Optional: Save to localStorage for persistence across sessions
                    localStorage.setItem('sebitam-profile-pic', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };

        // Load saved profile pic on startup
        const savedPic = localStorage.getItem('sebitam-profile-pic');
        if (savedPic) userAvatarImg.src = savedPic;
    }

    // Super Admin Auto-Registration
    async function checkAndRegisterSuperAdmin() {
        if (!supabase) return;
        const superAdminEmail = 'edukadoshmda@gmail.com';
        const superAdminName = 'Luiz Eduardo Santos da Silva';

        try {
            const { data, error } = await supabase.from('admins').select('*').eq('email', superAdminEmail);
            if (error) throw error;

            if (data.length === 0) {
                console.log("Registrando Super Administrador...");
                await supabase.from('admins').insert([{
                    name: superAdminName,
                    email: superAdminEmail,
                    phone: 'Gestor'
                }]);
            }
        } catch (e) {
            console.error("Erro no auto-registro:", e);
        }
    }

    // Run check and initial view
    checkAndRegisterSuperAdmin().then(() => {
        renderView('overview');
    });
});
