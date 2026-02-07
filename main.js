document.addEventListener('DOMContentLoaded', () => {
    console.log("SEBITAM v5.1 Loaded (SSH Enabled)");
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
    // Navigation History
    let viewHistory = [];
    let currentView = 'login';
    let currentData = null;

    // --- CONFIGURAÇÃO SUPABASE ---
    // URL do projeto
    const SUPABASE_URL = "https://vwruogwdtbsareighmoc.supabase.co";

    // Chave Publicável (Publishable Key) - Segura para uso no frontend
    const SUPABASE_ANON_KEY = "sb_publishable__1Y1EwVreZS7LEaExgwrew_hIDT-ECZ";

    // Inicialização do Cliente Supabase
    let supabase = null;
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase inicializado com sucesso.");
        } else {
            console.warn("SDK do Supabase não encontrado. Usando modo offline (localStorage).");
        }
    } catch (err) {
        console.error("Erro crítico ao inicializar Supabase:", err);
    }

    // Mapping frontend collection names to Supabase table names
    // Usando nomes em inglês (padrão do Supabase)
    const tableMap = {
        'sebitam-students': 'students',
        'sebitam-teachers': 'teachers',
        'sebitam-admins': 'admins',
        'sebitam-secretaries': 'secretaries'
    };

    // Mapping frontend fields to Supabase fields (for students)
    function mapToSupabase(item, collectionName) {
        if (!item) return item;
        const mappedTable = tableMap[collectionName];
        if (mappedTable === 'students') {
            const mapped = {};
            // Accept both camelCase and snake_case from incoming object
            const fullName = item.fullName || item.full_name;
            const moduleVal = item.module;
            const gradeVal = item.grade;

            if (fullName !== undefined) mapped.full_name = fullName;
            if (moduleVal !== undefined) mapped.module = parseInt(moduleVal) || 1;
            if (gradeVal !== undefined) mapped.grade = parseInt(gradeVal) || 1;
            if (item.plan !== undefined) mapped.plan = item.plan;
            if (item.email !== undefined) mapped.email = item.email;
            if (item.phone !== undefined) mapped.phone = item.phone;
            if (item.subjectGrades !== undefined) mapped.subject_grades = item.subjectGrades;
            if (item.subjectFreqs !== undefined) mapped.subject_freqs = item.subjectFreqs;
            if (item.paymentStatus !== undefined) mapped.payment_status = item.paymentStatus;
            return mapped;
        }
        return item; // For others, assume direct mapping or handle as needed
    }

    function mapFromSupabase(item, collectionName) {
        if (!item) return item;
        const mappedTable = tableMap[collectionName];
        if (mappedTable === 'students') {
            return {
                id: item.id,
                fullName: item.full_name || item.fullName || 'Aluno Sem Nome',
                module: item.module || 1,
                grade: item.grade || 1,
                plan: item.plan || 'integral',
                email: item.email || '',
                phone: item.phone || '',
                subjectGrades: item.subject_grades || {},
                subjectFreqs: item.subject_freqs || {},
                paymentStatus: item.payment_status || null
            };
        }
        return item;
    }

    // Database Helpers (Abstraction layer for Supabase)
    async function dbGet(collectionName) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) return JSON.parse(localStorage.getItem(collectionName) || '[]');
        try {
            console.log(`dbGet: Buscando dados de ${table}...`);
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`dbGet Erro (${table}):`, error);
                throw error;
            }
            console.log(`dbGet: ${data.length} registros encontrados em ${table}`);
            return data.map(item => mapFromSupabase(item, collectionName));
        } catch (e) {
            console.error("Error fetching from Supabase fallback:", e);
            return JSON.parse(localStorage.getItem(collectionName) || '[]');
        }
    }

    async function dbAddItem(collectionName, item) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            // Ensure ID is present for localStorage fallback
            if (!item.id) item.id = Date.now();
            list.push(item);
            localStorage.setItem(collectionName, JSON.stringify(list));
            return;
        }
        // For students, we let Supabase generate the ID
        // For others, if the table has an auto-increment ID, we should remove our temporary ID
        const itemToInsert = { ...item };
        if (tableMap[collectionName] === 'students' || itemToInsert.id) {
            delete itemToInsert.id;
        }

        const mapped = mapToSupabase(itemToInsert, collectionName);
        const { error } = await supabase.from(table).insert([mapped]);
        if (error) {
            console.error("Error adding to Supabase:", error);
            alert("Erro ao salvar no banco de dados: " + error.message);
            throw error;
        }
    }

    async function dbUpdateItem(collectionName, id, updates) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            const idx = list.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...updates };
                localStorage.setItem(collectionName, JSON.stringify(list));
            }
            return;
        }
        const mapped = mapToSupabase(updates, collectionName);
        // Supabase often expects numeric IDs for integer primary keys
        const queryId = isNaN(id) ? id : parseInt(id);
        const { error } = await supabase.from(table).update(mapped).eq('id', queryId);
        if (error) {
            console.error("Error updating in Supabase:", error);
            throw error;
        }
    }

    async function dbDeleteItem(collectionName, id) {
        const table = tableMap[collectionName] || collectionName;
        if (!supabase) {
            const list = await dbGet(collectionName);
            const filtered = list.filter(i => String(i.id) !== String(id));
            localStorage.setItem(collectionName, JSON.stringify(filtered));
            return;
        }
        // Use numeric ID if possible to avoid type mismatch with SERIAL columns
        const queryId = isNaN(id) ? id : parseInt(id);
        const { error } = await supabase.from(table).delete().eq('id', queryId);
        if (error) {
            console.error("Error deleting from Supabase:", error);
            alert("Erro ao excluir do banco de dados: " + error.message);
            throw error;
        }
    }

    // Role Mapping
    const roleDetails = {
        admin: { name: 'Diretoria SEBITAM', label: 'Administrador' },
        secretary: { name: 'Secretaria Acadêmica', label: 'Secretaria' },
        teacher: { name: 'Corpo Docente', label: 'Professor' },
        student: { name: 'Acesso Aluno', label: 'Aluno' }
    };

    // Theme Logic
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('sebitam-theme') || 'professional';
        document.body.classList.remove('theme-man', 'theme-woman', 'theme-professional', 'theme-elegant');
        document.body.classList.add(`theme-${savedTheme}`);
    }

    function setLoginTheme() {
        document.body.classList.remove('theme-man', 'theme-woman', 'theme-professional', 'theme-elegant');
        document.body.classList.add('theme-man');
    }

    // Inicialmente, manter o tema preto para o login
    setLoginTheme();

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginEmail = document.getElementById('login-email').value.trim().toLowerCase();
        const loginName = document.getElementById('login-name').value.trim();

        if (!loginEmail || !loginName) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Armazenar email do usuário
        currentUser.email = loginEmail;
        currentUser.name = loginName;

        let userFound = false;

        // 1. Verificar Super Admin
        if (loginEmail === 'edukadoshmda@gmail.com') {
            currentUser.role = 'admin';
            currentUser.name = 'Luiz Eduardo';
            userFound = true;
        } else {
            // 2. Buscar em todas as tabelas do banco de dados
            try {
                const tables = [
                    { key: 'sebitam-admins', role: 'admin' },
                    { key: 'sebitam-secretaries', role: 'secretary' },
                    { key: 'sebitam-teachers', role: 'teacher' },
                    { key: 'sebitam-students', role: 'student' }
                ];

                for (const t of tables) {
                    const data = await dbGet(t.key);
                    const match = data.find(u => (u.email && u.email.toLowerCase() === loginEmail));
                    if (match) {
                        currentUser.role = t.role;
                        currentUser.name = match.fullName || match.name || loginName;
                        currentUser.id = match.id;
                        currentUser.photo = match.photo || null;
                        userFound = true;
                        break;
                    }
                }
            } catch (err) {
                console.error("Erro ao verificar usuário no banco:", err);
            }
        }

        if (!userFound) {
            // Se não encontrado em nenhuma tabela, define como estudante por padrão para novo cadastro
            currentUser.role = 'student';
        }

        refreshUIPermissions(currentUser.role);
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        applySavedTheme();
        lucide.createIcons();

        if (userFound) {
            console.log(`Usuário conhecido (${currentUser.role}) logado - Indo para Visão Geral`);
            await renderView('overview');
        } else {
            console.log('Novo usuário detectado - Redirecionando para Cadastro');
            await renderView('enrollment');
        }
    });

    // Logout Logic

    const handleLogout = () => {
        dashboardScreen.classList.remove('active');
        loginScreen.classList.add('active');
        setLoginTheme();
        // Clear all role-specific classes from body
        document.body.classList.remove('user-role-admin', 'user-role-secretary', 'user-role-teacher', 'user-role-student');

        // Reset History
        viewHistory = [];
        currentView = 'login';
        currentData = null;
    };

    logoutBtn.addEventListener('click', handleLogout);
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', handleLogout);
    }



    // Header Back Button Logic
    const headBackBtn = document.getElementById('back-btn');
    if (headBackBtn) {
        headBackBtn.addEventListener('click', () => {
            if (viewHistory.length > 0) {
                const lastState = viewHistory.pop();
                renderView(lastState.view, lastState.data, false);
            } else {
                renderView('overview', null, false);
            }
        });
    }

    // Nav Item Clicks
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            if (item.classList.contains('external-nav')) return;
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Mobile: Close sidebar on selection
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }

            const view = item.getAttribute('data-view');
            await renderView(view);
        });
    });

    // Mobile Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    function refreshUIPermissions(role) {
        console.log("Applying UI Permissions for role:", role);
        userNameEl.textContent = currentUser.name;
        userRoleEl.textContent = roleDetails[role].label;

        // Update Avatar
        if (window.updateAvatarUI) {
            window.updateAvatarUI(currentUser);
        }

        // Remove all previous role classes from body
        document.body.classList.remove('user-role-admin', 'user-role-secretary', 'user-role-teacher', 'user-role-student');
        // Add current role class
        document.body.classList.add(`user-role-${role}`);

        // Re-trigger lucide to ensure icons show on updated elements
        if (window.lucide) window.lucide.createIcons();
    }

    const subjectMap = {
        1: { title: 'Módulo 1: Fundamentos', subs: ['Bibliologia', 'Teontologia', 'Introdução N.T', 'Introdução A.T'] },
        2: { title: 'Módulo 2: Contexto Histórico', subs: ['Geografia Bíblica', 'Hermenêutica', 'Período Inter bíblico', 'Ética Cristã'] },
        3: { title: 'Módulo 3: Doutrinas Específica', subs: ['Soteriologia', 'Eclesiologia', 'Escatologia', 'Homilética'] },
        4: { title: 'Módulo 4: Teologia Aplicada', subs: ['Teologia Contemporânea', 'In. T. Bíblica A.T', 'In. T. Bíblica N.T', 'Teologia Pastoral'] },
        5: { title: 'Módulo 5: Prática Pastoral', subs: ['Exegese Bíblica', 'Psicologia Pastoral'] },
    };

    async function generateCertificate(studentId) {
        console.log("Gerando certificado para ID:", studentId);
        const students = await dbGet('sebitam-students');
        const student = students.find(item => String(item.id) === String(studentId));
        if (!student) {
            alert('Erro: Aluno não encontrado para gerar certificado (ID: ' + studentId + ')');
            return;
        }

        // Gerar matrícula automática se não existir
        if (!student.enrollment) {
            const enrollmentNumber = `SEBITAM-${String(student.id).padStart(4, '0')}`;
            student.enrollment = enrollmentNumber;
            await dbUpdateItem('sebitam-students', studentId, { enrollment: enrollmentNumber });
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor, libere os pop-ups para imprimir o certificado.');
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
                        .student-name { font-family: 'Playfair Display', serif; font-size: 3.8rem; color: #d4af37; margin: 20px 0; border-bottom: 2px solid #1a365d; padding: 0 40px; white-space: nowrap; width: 95%; text-align: center; }
                        .enrollment { font-size: 0.9rem; color: #64748b; margin-top: 5px; font-weight: 600; }
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
                    <script>
                        window.onload = () => {
                            const studentName = document.querySelector('.student-name');
                            const maxWidth = studentName.parentElement.offsetWidth * 0.95;
                            let fontSize = 3.8; // rem
                            
                            // Criar um elemento invisível para medir a largura real do texto
                            const measure = document.createElement('span');
                            measure.style.fontFamily = getComputedStyle(studentName).fontFamily;
                            measure.style.fontSize = fontSize + 'rem';
                            measure.style.whiteSpace = 'nowrap';
                            measure.style.visibility = 'hidden';
                            measure.style.position = 'absolute';
                            measure.innerText = studentName.innerText;
                            document.body.appendChild(measure);

                            // Reduzir a fonte até que o texto caiba na largura máxima
                            while (measure.offsetWidth > maxWidth && fontSize > 1.5) {
                                fontSize -= 0.1;
                                measure.style.fontSize = fontSize + 'rem';
                            }
                            
                            studentName.style.fontSize = fontSize + 'rem';
                            document.body.removeChild(measure);

                            setTimeout(() => window.print(), 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    async function printAcademicHistory(studentId) {
        console.log("Gerando histórico para ID:", studentId);
        const students = await dbGet('sebitam-students');
        const student = students.find(item => String(item.id) === String(studentId));
        if (!student) {
            alert('Erro: Aluno não encontrado para o histórico (ID: ' + studentId + ')');
            return;
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor, libere os pop-ups para ver o histórico.');
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

    async function printFinancialReport(monthIndex, year) {
        console.log(`Gerando relatório financeiro: Mês ${monthIndex}, Ano ${year}`);
        const students = await dbGet('sebitam-students');
        const monthName = new Date(year, monthIndex).toLocaleString('pt-BR', { month: 'long' });
        const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // Calcular totais
        const PRICES = { integral: 70, half: 35, scholarship: 0 };
        let totalExpected = 0;
        let totalReceived = 0;

        const reportData = students.map(s => {
            const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
            const value = PRICES[s.plan] || 0;
            totalExpected += value;
            if (status === 'Pago') totalReceived += value;
            return { ...s, status, value };
        });

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor, libere os pop-ups para imprimir o relatório.');

        const dateStr = new Date().toLocaleDateString('pt-BR');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório Financeiro - ${monthNameCap}/${year}</title>
                    <style>
                        @page { size: A4; margin: 15mm; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 15px; margin-bottom: 20px; }
                        .logo { height: 80px; margin-bottom: 10px; }
                        h1 { color: #1a365d; margin: 5px 0; font-size: 24px; text-transform: uppercase; }
                        h2 { color: #64748b; margin: 0; font-size: 16px; font-weight: normal; }
                        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-around; }
                        .summary-item { text-align: center; }
                        .summary-val { display: block; font-size: 18px; font-weight: bold; color: #0f172a; }
                        .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                        th { background: #1a365d; color: white; text-transform: uppercase; font-size: 11px; }
                        tr:nth-child(even) { background-color: #f1f5f9; }
                        .status-pago { color: #166534; font-weight: bold; }
                        .status-pendente { color: #991b1b; font-weight: bold; }
                        .audit-info { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 5px; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="logo.jpg" class="logo">
                        <h1>Relatório Financeiro Mensal</h1>
                        <h2>Referência: ${monthNameCap} de ${year}</h2>
                    </div>

                    <div class="summary-box">
                        <div class="summary-item">
                            <span class="summary-val">R$ ${totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span class="summary-label">Previsão de Receita</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-val" style="color: #16a34a;">R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span class="summary-label">Total Recebido</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-val" style="color: #dc2626;">R$ ${(totalExpected - totalReceived).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span class="summary-label">Inadimplência</span>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Turma</th>
                                <th>Plano</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.map(s => `
                                <tr>
                                    <td>${s.fullName}</td>
                                    <td>${s.grade || '-'}</td>
                                    <td>${s.plan === 'integral' ? 'Integral' : s.plan === 'half' ? 'Meia' : 'Bolsa'}</td>
                                    <td>R$ ${s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td class="${s.status === 'Pago' ? 'status-pago' : 'status-pendente'}">${s.status.toUpperCase()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="audit-info">
                        Relatório gerado em ${dateStr} pelo usuário ${currentUser.name} (${currentUser.role}).<br>
                        Sistema de Gestão SEBITAM.
                    </div>
                    <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();

        console.log("Abrindo editor de notas para ID:", studentId);
        const students = await dbGet('sebitam-students');
        const s = students.find(item => String(item.id) === String(studentId));
        if (!s) {
            alert('Erro: Aluno não encontrado (ID: ' + studentId + ')');
            return;
        }
        const moduleNum = s.module || 1;
        const subjects = subjectMap[moduleNum] ? subjectMap[moduleNum].subs : [];
        const contentBody = document.getElementById('dynamic-content');

        contentBody.innerHTML = `
            <div class="view-header">
                <button class="btn-primary" id="back-to-classes" style="width: auto; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;"><i data-lucide="arrow-left"></i> Voltar</button>
                <h2>${currentUser.role === 'student' ? 'Meu Boletim' : 'Lançamento de Notas'}: ${s.fullName.toUpperCase()}</h2>
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
                                    <td><input type="number" class="table-input subject-grade" data-subject="${sub}" value="${(s.subjectGrades && s.subjectGrades[sub]) || ''}" step="0.1" min="0" max="10" ${currentUser.role === 'student' ? 'disabled' : ''}></td>
                                    <td><input type="number" class="table-input subject-freq" data-subject="${sub}" value="${(s.subjectFreqs && s.subjectFreqs[sub]) || '100'}" min="0" max="100" ${currentUser.role === 'student' ? 'disabled' : ''}></td>
                                </tr>
                            `).join('')}
                        `).join('')}
                    </tbody>
                </table>
                <div class="form-actions" style="margin-top:20px; display:flex; gap:10px;">
                    ${currentUser.role !== 'student' ? '<button id="save-grades" class="btn-primary">Salvar Boletim</button>' : ''}
                    <button id="print-grades" class="btn-primary" style="background:var(--secondary)">Imprimir Histórico</button>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('back-to-classes').onclick = () => renderView('classes');
        const saveBtn = document.getElementById('save-grades');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const grades = {}, freqs = {};
                document.querySelectorAll('.subject-grade').forEach(i => grades[i.dataset.subject] = parseFloat(i.value));
                document.querySelectorAll('.subject-freq').forEach(i => freqs[i.dataset.subject] = parseInt(i.value));
                await dbUpdateItem('sebitam-students', studentId, { subjectGrades: grades, subjectFreqs: freqs });
                alert('Boletim salvo!');
                await renderView('classes');
            };
        }
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
                                    <option value="integral" ${s.plan === 'integral' ? 'selected' : ''}>Integral (R$ 70,00)</option>
                                    <option value="half" ${s.plan === 'half' ? 'selected' : ''}>Parcial (R$ 35,00)</option>
                                    <option value="scholarship" ${s.plan === 'scholarship' ? 'selected' : ''}>Bolsista</option>
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

    async function renderView(view, data = null, addToHistory = true) {
        // Handle History
        if (addToHistory && currentView && currentView !== 'login' && currentView !== view) {
            viewHistory.push({ view: currentView, data: currentData });
        }
        currentView = view;
        currentData = data;



        // Header Back Button Logic
        const headBackBtn = document.getElementById('back-btn');
        const headMenuBtn = document.getElementById('menu-toggle');

        if (headBackBtn && headMenuBtn) {
            if (view === 'overview') {
                headBackBtn.style.display = 'none';
                headMenuBtn.style.display = 'flex'; // Show menu on home
            } else {
                headBackBtn.style.display = 'flex';
                // Optional: Hide menu button on deep pages if desired, user asked for back icon
                // Keeping menu accessible is usually better, but let's prioritize the back button requested.
                // headMenuBtn.style.display = 'none'; 
            }
        }

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
                    <div class="welcome-card"><h1 style="color: white !important;">Olá, ${currentUser.name}!</h1></div>
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
                                            ${currentUser.role !== 'student' ? `
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
                                            ${currentUser.role !== 'student' ? `
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
                                            ${currentUser.role !== 'student' ? `
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
                    document.querySelectorAll('.delete-staff-ov').forEach(b => {
                        b.onclick = async () => {
                            const type = b.dataset.type;
                            const id = b.dataset.id;
                            console.log(`Deleting staff member: ${type} with id ${id}`);
                            const label = type === 'admin' ? 'Administrador' : type === 'teacher' ? 'Professor' : 'Secretário';
                            if (!confirm(`Tem certeza que deseja excluir este ${label}?`)) return;
                            const key = type === 'teacher' ? 'sebitam-teachers' : type === 'admin' ? 'sebitam-admins' : 'sebitam-secretaries';
                            await dbDeleteItem(key, id);
                            await renderView('overview');
                        };
                    });
                    lucide.createIcons();
                }, 0);
                break;
            case 'enrollment':
                const activeType = data && data.type ? data.type : 'student';
                html = `
                    <div class="view-header" style="margin-bottom: 30px;">
                        <h2 style="font-size: 2.22rem; font-weight: 800; color: var(--text-main);">Cadastro Institucional</h2>
                        <span style="background: var(--primary); color: white; padding: 5px 12px; border-radius: 4px; font-size: 0.9rem; font-weight: 500; display: inline-block; margin-top: 5px;">Selecione o perfil que deseja cadastrar no sistema.</span>
                    </div>
                    
                    <div class="registration-role-selector" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 35px;">
                        ${['student', 'teacher', 'admin', 'secretary'].map(type => {
                    const icons = { student: 'user', teacher: 'graduation-cap', admin: 'shield-check', secretary: 'briefcase' };
                    const labels = { student: 'Aluno', teacher: 'Professor', admin: 'Administrador', secretary: 'Secretária' };
                    const isActive = activeType === type;
                    return `
                                <label class="role-option" style="text-align: center; cursor: pointer;">
                                    <input type="radio" name="reg-role" value="${type}" ${isActive ? 'checked' : ''} style="margin-bottom: 12px; transform: scale(1.3); accent-color: var(--primary);">
                                    <div class="role-box" style="padding: 25px 10px; border: 1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}; border-radius: 15px; background: white; transition: all 0.3s; box-shadow: ${isActive ? '0 4px 15px rgba(0,0,0,0.05)' : 'none'}; position: relative;">
                                        <i data-lucide="${icons[type]}" style="width: 24px; height: 24px; color: ${isActive ? 'var(--primary)' : 'var(--text-muted)'}; margin-bottom: 8px;"></i>
                                        <span style="display: block; font-weight: 600; font-size: 0.85rem; color: ${isActive ? 'var(--text-main)' : 'var(--text-muted)'};">${labels[type]}</span>
                                    </div>
                                </label>
                            `;
                }).join('')}
                    </div>

                    <div id="reg-form-container"></div>
                `;
                setTimeout(() => {
                    const renderForm = (type) => {
                        const container = document.getElementById('reg-form-container');
                        const roleNames = { student: 'Aluno', teacher: 'Professor(a)', admin: 'Administrador(a)', secretary: 'Secretário(a)' };
                        const nameLabel = `Nome Completo do(a) ${roleNames[type]}`;

                        let formHtml = `
                            <div class="form-container" style="max-width: 900px; padding: 45px; background: white; border-radius: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid var(--border); margin-top: 20px;">
                                <form id="unified-reg-form">
                                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div class="form-group full-width" style="grid-column: 1 / -1; margin-bottom: 20px;">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">${nameLabel}</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="user" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <input type="text" name="${type === 'student' ? 'fullName' : 'name'}" placeholder="Nome completo" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid var(--border); background: white;" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">Telefone / WhatsApp</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="phone" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <input type="tel" name="phone" placeholder="(00) 00000-0000" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid var(--border); background: white;" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">E-mail</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="mail" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <input type="email" name="email" placeholder="email@exemplo.com" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid var(--border); background: white;" required>
                                            </div>
                                        </div>
                        `;

                        if (type === 'student') {
                            formHtml += `
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">Turma (1 a 10)</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="hash" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <select name="grade" style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 10px; border: 1.5px solid var(--border); background: white;">
                                                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}">Turma ${n}</option>`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                         <div class="form-group">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">Módulo (1 a 5)</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="layers" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <select name="module" style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 10px; border: 1.5px solid var(--border); background: white;">
                                                    <option value="1">Módulo 1</option><option value="2">Módulo 2</option><option value="3">Módulo 3</option><option value="4">Módulo 4</option><option value="5">Módulo 5</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">Plano Financeiro</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="credit-card" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <select name="plan" style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 10px; border: 1.5px solid var(--border); background: white;">
                                                    <option value="integral">Integral (R$ 70,00)</option>
                                                    <option value="half">Parcial (R$ 35,00)</option>
                                                    <option value="scholarship">Bolsista</option>
                                                </select>
                                            </div>
                                        </div>
                            `;
                        } else {
                            const extraIcon = type === 'teacher' ? 'graduation-cap' : (type === 'admin' ? 'shield-check' : 'briefcase');
                            formHtml += `
                                        <div class="form-group full-width" style="grid-column: 1 / -1; margin-top: 10px;">
                                            <label style="font-weight: 700; color: var(--text-main); margin-bottom: 8px; display: block; font-size: 0.9rem;">Função / Cargo</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="${extraIcon}" style="position: absolute; left: 16px; top: 12px; width: 18px; color: var(--text-main);"></i>
                                                <input type="text" name="extra" placeholder="Ex: Financeiro" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid var(--border); background: white;" required>
                                            </div>
                                        </div>
                            `;
                        }

                        formHtml += `
                                    </div>
                                    <div class="form-actions" style="border:none; margin-top: 40px;">
                                        <button type="submit" class="btn-primary" style="width: auto; padding: 15px 40px; border-radius: 10px; font-weight: 700; font-size: 1rem; color: white; border: none; cursor: pointer;">Salvar Cadastro</button>
                                    </div>
                                </form>
                            </div>
                        `;
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

                            const userEmail = (val.email || currentUser.email || 'unknown').toLowerCase();
                            const userKey = `sebitam-user-${userEmail}`;
                            localStorage.setItem(userKey, 'registered');

                            alert('Cadastrado com sucesso! Você será direcionado para a Visão Geral.');
                            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                            const overviewNav = document.querySelector('.nav-item[data-view="overview"]');
                            if (overviewNav) overviewNav.classList.add('active');
                            await renderView('overview');
                        };
                    };

                    renderForm(activeType);
                    document.querySelectorAll('input[name="reg-role"]').forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            renderForm(e.target.value);
                            // Visual transition handled by CSS variables indirectly or manual refresh
                            const currentThemePrimary = getComputedStyle(document.body).getPropertyValue('--primary').trim();
                            const currentThemeTextMain = getComputedStyle(document.body).getPropertyValue('--text-main').trim();

                            document.querySelectorAll('.role-box').forEach(box => {
                                box.style.borderColor = 'var(--border)';
                                box.style.boxShadow = 'none';
                                box.querySelector('i').style.color = 'var(--text-muted)';
                                box.querySelector('span').style.color = 'var(--text-muted)';
                            });
                            const selectedBox = e.target.parentElement.querySelector('.role-box');
                            selectedBox.style.borderColor = 'var(--primary)';
                            selectedBox.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                            selectedBox.querySelector('i').style.color = 'var(--primary)';
                            selectedBox.querySelector('span').style.color = 'var(--text-main)';
                        });
                    });
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
                        <div class="view-header" > <h2>Gestão de Usuários</h2></div>
                    <div class="tabs-container" style="display:flex; flex-wrap: wrap; gap:10px; margin-bottom:20px;">
                        <button class="tab-btn ${activeUserTab === 'admin' ? 'active' : ''}" data-type="admin">Administradores</button>
                        <button class="tab-btn ${activeUserTab === 'secretary' ? 'active' : ''}" data-type="secretary">Secretaria</button>
                        <button class="tab-btn ${activeUserTab === 'teacher' ? 'active' : ''}" data-type="teacher">Professores</button>
                        <button class="tab-btn ${activeUserTab === 'student' ? 'active' : ''}" data-type="student">Alunos</button>
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
                    const roleInfo = activeUserTab === 'student' ? `Turma&nbsp;${u.grade || '-'}` : (labelMap[activeUserTab]);
                    const email = u.email || u.institutionalEmail || '-';
                    const phone = u.phone || '-';

                    let badgeStyle = 'background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border);';
                    if (activeUserTab === 'student') {
                        if (u.plan === 'scholarship') {
                            badgeStyle = 'background: rgba(168, 85, 247, 0.1); color: #a855f7; border: 1px solid #a855f7;';
                        } else if (u.plan === 'half') {
                            badgeStyle = 'background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f6;';
                        } else if (u.plan === 'integral') {
                            badgeStyle = 'background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid #16a34a;';
                        }
                    }

                    return `
                                        <tr>
                                            <td><strong>${nameCap}</strong></td>
                                            <td><span class="badge" style="${badgeStyle}">${roleInfo}</span></td>
                                            <td style="font-size: 0.85rem;">${email}</td>
                                            <td style="font-size: 0.85rem; white-space: nowrap;">${phone}</td>
                                            <td class="actions-cell">
                                                <div class="actions-wrapper">
                                                    ${currentUser.role !== 'student' ? `
                                                        <button class="btn-icon" style="color: #64748b;" title="Editar/Configurar" onclick="${activeUserTab === 'student' ? `renderEditStudent('${u.id}')` : `alert('Função em desenvolvimento para este perfil')`}">
                                                            <i data-lucide="settings"></i>
                                                        </button>
                                                        <button class="btn-icon red delete-user" data-id="${u.id}" data-type="${activeUserTab}" title="Excluir">
                                                            <i data-lucide="trash-2"></i>
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
                                ${usersList.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum registro encontrado.</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>`;
                setTimeout(() => {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.onclick = () => renderView('users', { type: b.dataset.type });
                    });

                    document.querySelectorAll('.delete-user').forEach(b => {
                        b.onclick = async () => {
                            const utype = b.dataset.type;
                            const uid = b.dataset.id;
                            console.log(`Deleting user: ${utype} with id ${uid} `);
                            if (!confirm(`Tem certeza que deseja excluir este ${labelMap[utype]}?`)) return;
                            const ukey = getStoreKey(utype);
                            await dbDeleteItem(ukey, uid);
                            await renderView('users', { type: utype });
                        };
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
                        <div class="view-header" > <h2>Alunos</h2></div>
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
                                                ${currentUser.role !== 'student' ? '<th>Plano</th><th>Financeiro</th>' : ''}
                                                <th class="text-right" style="text-align: right;">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${inG.map(s => {
                        const nameCap = (s.fullName || 'Sem Nome').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        const planLabel = s.plan === 'integral' ? 'Integral' : s.plan === 'half' ? 'Parcial' : 'Bolsista';
                        const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');

                        let stColor, stIcon, stBg, stLabel;
                        if (s.plan === 'scholarship') {
                            stLabel = 'Bolsista';
                            stColor = '#a855f7'; // Purple
                            stBg = 'rgba(168, 85, 247, 0.1)';
                            stIcon = 'graduation-cap';
                        } else if (status === 'Pago') {
                            stLabel = 'Pago';
                            if (s.plan === 'half') {
                                stColor = '#3b82f6'; // Blue
                                stBg = 'rgba(59, 130, 246, 0.1)';
                            } else { // Integral
                                stColor = '#16a34a'; // Green
                                stBg = 'rgba(34, 197, 94, 0.1)';
                            }
                            stIcon = 'check-circle';
                        } else {
                            stLabel = 'Pendente';
                            stColor = '#dc2626'; // Red
                            stBg = 'rgba(239, 68, 68, 0.1)';
                            stIcon = 'alert-circle';
                        }

                        return `
                                                <tr>
                                                    <td>
                                                        <div style="display:flex; align-items:center; gap:8px;">
                                                             <div style="background: ${stBg}; padding: 4px; border-radius: 50%; display: flex; text-align: center; justify-content: center;">
                                                                <i data-lucide="${stIcon}" style="width: 14px; height: 14px; color: ${stColor};"></i>
                                                            </div>
                                                            <strong>${nameCap}</strong>
                                                        </div>
                                                    </td>
                                                    ${currentUser.role !== 'student' ? `
                                                    <td><span class="badge" style="background:transparent; border:1px solid #cbd5e1; color:#64748b;">${planLabel}</span></td>
                                                    <td>
                                                        <div style="display: flex; gap: 5px; align-items: center;">
                                                            <button onclick="updatePaymentStatus('${s.id}', 'Pago')" class="btn-icon" title="Confirmar Pagamento" style="border: 1px solid #22c55e; background: rgba(34, 197, 94, 0.1);">
                                                                <i data-lucide="check-circle" style="width: 14px; height: 14px; color: #22c55e;"></i>
                                                            </button>
                                                            <button onclick="updatePaymentStatus('${s.id}', 'Pendente')" class="btn-icon" title="Marcar como Pendente" style="border: 1px solid #ef4444; background: rgba(239, 68, 68, 0.1);">
                                                                <i data-lucide="alert-circle" style="width: 14px; height: 14px; color: #ef4444;"></i>
                                                            </button>
                                                            <span class="badge" style="background: ${stBg}; color: ${stColor}; border: 1px solid ${stColor}; margin-left: 5px;">
                                                                ${stLabel}
                                                            </span>
                                                        </div>
                                                    </td>` : ''}
                                                    <td class="actions-cell">
                                                        <div class="actions-wrapper">
                                                             <button class="btn-icon" style="color: var(--primary); background: rgba(37, 99, 235, 0.1);" title="${currentUser.role === 'student' ? 'Ver Meu Boletim' : 'Lançar Notas'}" onclick="renderGradeEditor('${s.id}')">
                                                                <i data-lucide="${currentUser.role === 'student' ? 'eye' : 'edit-3'}"></i>
                                                            </button>
                                                            <button class="btn-icon" title="Imprimir Certificado" onclick="generateCertificate('${s.id}')">
                                                                <i data-lucide="printer"></i>
                                                            </button>
                                                            <button class="btn-icon" title="Ver Histórico Acadêmico" onclick="printAcademicHistory('${s.id}')">
                                                                <i data-lucide="file-text"></i>
                                                            </button>
                                                            ${currentUser.role !== 'student' ? `
                                                            <button class="btn-icon" style="color: #64748b;" title="Editar Cadastro" onclick="renderEditStudent('${s.id}')">
                                                                <i data-lucide="settings"></i>
                                                            </button>
                                                            <button class="btn-icon red delete-st-class" data-id="${s.id}" title="Excluir Aluno">
                                                                <i data-lucide="trash-2"></i>
                                                            </button>` : ''}
                                                        </div>
                                                    </td>
                                                </tr>`;
                    }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                }).join('')}
                            </div>`;
                setTimeout(() => {
                    document.querySelectorAll('.delete-st-class').forEach(b => {
                        b.onclick = async () => {
                            const uid = b.dataset.id;
                            console.log(`Deleting student from class view: id ${uid} `);
                            if (!confirm('Tem certeza que deseja excluir permanentemente este aluno?')) return;
                            await dbDeleteItem('sebitam-students', uid);
                            await renderView('classes');
                        };
                    });
                    lucide.createIcons();
                }, 0);
                break;
            case 'didatico':
                const subView = data && data.tab ? data.tab : 'modules';
                html = `
                    <div class="view-header">
                        <h2>Didático Professores e Alunos</h2>
                        <p>Acesse materiais, módulos e produções acadêmicas.</p>
                    </div>
                    <div class="tabs-container" style="display:flex; gap:10px; margin-bottom:20px; flex-wrap: wrap;">
                        <button class="tab-btn ${subView === 'modules' ? 'active' : ''}" data-tab="modules">Módulos do Curso</button>
                        <button class="tab-btn ${subView === 'prod-teo' ? 'active' : ''}" data-tab="prod-teo">Produção Teológica (PDF)</button>
                        <button class="tab-btn ${subView === 'trabalhos' ? 'active' : ''}" data-tab="trabalhos">Trabalhos Alunos</button>
                        <button class="tab-btn ${subView === 'material-prof' ? 'active' : ''}" data-tab="material-prof">Material Professores</button>
                    </div>
                `;

                if (subView === 'modules') {
                    html += `
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
                } else {
                    const links = {
                        'prod-teo': { url: 'https://drive.google.com/drive/folders/110x1MEaHbcaY7wOpIduiTobnt7Smeggj', title: 'Produção Teológica (PDF)', icon: 'book-marked' },
                        'trabalhos': { url: 'https://drive.google.com/drive/folders/1HXSZPrzEdqbZiVtHmVcRwN3dODs1qASS', title: 'Trabalhos Alunos', icon: 'folder-kanban' },
                        'material-prof': { url: 'https://drive.google.com/drive/folders/1xQbSx_GCR9IqF3k-d7ESNJ8S2C4UcrIF', title: 'Material Professores', icon: 'graduation-cap' }
                    };
                    const activeLink = links[subView];
                    html += `
                        <div class="welcome-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; padding: 60px;">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                                <i data-lucide="${activeLink.icon}" style="width: 40px; height: 40px; color: white;"></i>
                            </div>
                            <h3>${activeLink.title}</h3>
                            <p>Clique no botão abaixo para acessar a pasta oficial no Google Drive contendo todo o material de ${activeLink.title}.</p>
                            <a href="${activeLink.url}" target="_blank" class="btn-primary" style="width: auto; padding: 15px 40px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                                <i data-lucide="external-link"></i> Abrir no Google Drive
                            </a>
                        </div>
                    `;
                }

                setTimeout(() => {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.onclick = () => renderView('didatico', { tab: b.dataset.tab });
                    });
                    lucide.createIcons();
                }, 0);
                break;

            case 'mensalidades': {
                const allFinanceSt = await dbGet('sebitam-students');
                let displayStudents = allFinanceSt;
                if (currentUser.role === 'student') {
                    displayStudents = allFinanceSt.filter(s => s.fullName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
                }

                const today = new Date();
                // Logic: Start from February. If today is Jan, show Feb. Else show current month.
                // 0=Jan, 1=Feb. If month is 0, set to 1. Else keep as is.
                if (today.getMonth() === 0) {
                    today.setMonth(1);
                }
                const currentMonth = today.toLocaleString('pt-BR', { month: 'long' });
                const currentMonthCapitalized = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
                const currentYear = today.getFullYear();

                html = `
                    <div class="view-header">
                        <h2>Sebitam Mensalidades</h2>
                        <p>Controle financeiro e monitoramento de mensalidades.</p>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th>Mês</th>
                                    <th>Ano</th>
                                    <th>Status</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${displayStudents.map(s => {
                    const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
                    const planText = s.plan === 'integral' ? 'Integral' : s.plan === 'half' ? 'Meia' : 'Bolsa';
                    return `
                                        <tr>
                                            <td><strong>${s.fullName}</strong></td>
                                            <td style="text-transform: capitalize;">${currentMonth}</td>
                                            <td>${currentYear}</td>
                                            <td>
                                                <span class="badge" style="background: ${status === 'Pago' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${status === 'Pago' ? '#16a34a' : '#dc2626'}; border: 1px solid ${status === 'Pago' ? '#22c55e' : '#ef4444'}; display: inline-flex; align-items: center; gap: 5px;">
                                                    <i data-lucide="${status === 'Pago' ? 'check-circle' : 'alert-circle'}" style="width: 12px; height: 12px;"></i>
                                                    ${status}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge" style="background: ${s.plan === 'integral' ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}; border: 1px solid ${s.plan === 'integral' ? '#2563eb' : s.plan === 'scholarship' ? '#9333ea' : '#eab308'}; color: ${s.plan === 'integral' ? '#2563eb' : s.plan === 'scholarship' ? '#9333ea' : '#eab308'}; display: inline-flex; align-items: center;">
                                                    ${s.plan === 'scholarship' ? '<i data-lucide="graduation-cap" style="width:14px; height:14px; margin-right:4px;"></i>' : ''} 
                                                    ${planText}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
                                ${displayStudents.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 30px;">Nenhum registro financeiro encontrado.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 20px; padding: 20px; background: rgba(37, 99, 235, 0.05); border-radius: 12px; border: 1px solid var(--border);">
                        <p style="font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="info" style="width: 16px;"></i>
                            Nota: Esta tabela reflete o status de pagamento confirmado na aba de gerenciamento de alunos.
                        </p>
                    </div>
                `;
                setTimeout(() => lucide.createIcons(), 0);
                break;
            }

            case 'themes':
                html = `
                    <div class="view-header">
                        <h2>Personalizar Aparência</h2>
                        <p>Escolha o tema visual do sistema que melhor lhe agrada.</p>
                    </div>
                    <div class="form-container" style="text-align: center; max-width: 700px; padding: 40px;">
                        <h3 style="margin-bottom: 30px; color: var(--text-main);">Selecione um Tema</h3>
                        <div class="theme-selector-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 20px;">
                             <button class="theme-option-card" data-theme="professional" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #2563eb; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Profissional</span>
                            </button>
                            <button class="theme-option-card" data-theme="man" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #0f172a; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Elegante Dark</span>
                            </button>
                            <button class="theme-option-card" data-theme="woman" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #be185d; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Sofisticado</span>
                            </button>
                            <button class="theme-option-card" data-theme="elegant" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #d4af37; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Luxo Dourado</span>
                            </button>
                            <button class="theme-option-card" data-theme="nature" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #15803d; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Natureza</span>
                            </button>
                            <button class="theme-option-card" data-theme="spiritual" style="padding: 20px; border: 2px solid var(--border); border-radius: 15px; background: white; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 50px; height: 50px; border-radius: 50%; background: #7e22ce; margin-bottom: 15px; border: 2px solid #e2e8f0;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">Espiritual</span>
                            </button>
                        </div>
                    </div>
                `;
                setTimeout(() => {
                    document.querySelectorAll('.theme-option-card').forEach(btn => {
                        // Highlight current theme
                        const currentTheme = localStorage.getItem('sebitam-theme') || 'professional';
                        if (btn.dataset.theme === currentTheme) {
                            btn.style.borderColor = 'var(--primary)';
                            btn.style.background = 'rgba(var(--primary-rgb), 0.05)';
                        }

                        btn.onclick = () => {
                            const theme = btn.dataset.theme;
                            // Safe class removal to preserve user role and other classes
                            document.body.classList.remove('theme-man', 'theme-woman', 'theme-professional', 'theme-elegant', 'theme-nature', 'theme-spiritual');
                            document.body.classList.add(`theme-${theme}`);

                            localStorage.setItem('sebitam-theme', theme);

                            // Visual feedback
                            document.querySelectorAll('.theme-option-card').forEach(b => {
                                b.style.borderColor = 'var(--border)';
                                b.style.background = 'white';
                            });
                            btn.style.borderColor = 'var(--primary)';
                            btn.style.background = 'rgba(var(--primary-rgb), 0.05)';

                            alert(`Tema ${btn.querySelector('span').textContent} aplicado!`);
                        };
                    });
                    lucide.createIcons();
                }, 0);
                break;

            case 'institucional':
                html = `
                    <div class="view-header">
                        <h2>Sebitam Institucional</h2>
                        <p>Nossa missão, visão e compromisso com o Reino.</p>
                    </div>
                    <div class="welcome-card" style="line-height: 1.8; text-align: left; padding: 40px; margin-bottom: 40px;">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <h3 style="color: white; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; font-size: 1.5rem;">Identidade e Propósito</h3>
                            
                            <p style="margin-bottom: 20px; font-size: 1.1rem;">
                                O <strong>SEBITAM</strong> é um seminário bíblico teológico comprometido com o Reino de Deus. 
                                Fundado para servir à Igreja de Jesus e além dela, seu propósito é formar líderes cristãos íntegros e relevantes.
                            </p>

                            <div style="background: rgba(0,0,0,0.2); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 4px solid var(--primary);">
                                <p style="margin-bottom: 15px;"><strong>O SEBITAM existe para glorificar a Deus em tudo o que faz.</strong></p>
                                <p>Promove o estudo sério e fiel das Escrituras Sagradas, valorizando a missão integral da Igreja no mundo.</p>
                            </div>

                            <p style="margin-bottom: 20px;">
                                Sua missão é capacitar homens e mulheres para o serviço cristão, preparando-os para ensinar, pastorear e servir com excelência. 
                                Buscamos o desenvolvimento espiritual, acadêmico e humano, cultivando caráter, ética e compromisso com o amor ao próximo.
                            </p>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
                                    <h4 style="color: white; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="target" style="width: 18px;"></i> Visão
                                    </h4>
                                    <p style="font-size: 0.9rem;">Ser referência em educação teológica na Amazônia, reconhecido pela fidelidade bíblica e relevância missional.</p>
                                </div>
                                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
                                    <h4 style="color: white; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="heart" style="width: 18px;"></i> Valores
                                    </h4>
                                    <p style="font-size: 0.9rem;">Unidade, humildade, excelência no serviço, responsabilidade social e fidelidade às Escrituras.</p>
                                </div>
                            </div>

                            <p style="margin-bottom: 20px;">
                                Estimulamos o pensamento crítico à luz da Palavra de Deus, promovendo unidade, humildade e espírito de serviço. 
                                Atuamos com responsabilidade social e sensibilidade cultural, formando discípulos que façam discípulos.
                            </p>

                            <p style="font-style: italic; opacity: 0.9; margin-top: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
                                "Desejamos ver a Igreja fortalecida e saudável e proclamar a esperança transformadora de Jesus ao mundo."
                            </p>
                        </div>
                    </div>
                `;
                setTimeout(() => lucide.createIcons(), 0);
                break;

            case 'termo':
                html = `
                    <div class="view-header">
                        <h2>Normas Sebitam</h2>
                        <p>Documentação oficial, diretrizes acadêmicas e regimento interno.</p>
                    </div>
                    
                    <div class="rules-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin-top: 20px;">
                        
                        <!-- Card 1: Termo de Responsabilidade -->
                        <div class="rule-card" style="background: white; padding: 40px; border-radius: 25px; box-shadow: var(--shadow); border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; text-align: center; transition: var(--transition);">
                            <div class="rule-icon-box" style="width: 80px; height: 80px; border-radius: 20px; background: rgba(37, 99, 235, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
                                <i data-lucide="file-signature" style="width: 38px; height: 38px;"></i>
                            </div>
                            <h3 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 15px;">Normas Sebitam</h3>
                            <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 30px; line-height: 1.6;">
                                Documento oficial que estabelece os compromissos éticos e acadêmicos entre o aluno e a instituição.
                            </p>
                            <a href="https://drive.google.com/drive/folders/1us4CjRi8zJBbuLf9x4CjYTVUa-VT9UD3" target="_blank" class="btn-primary" style="width: 100%; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; padding: 15px;">
                                <i data-lucide="file-text"></i> Acessar PDF (Termo)
                            </a>
                        </div>

                        <!-- Card 2: Regimento Interno -->
                        <div class="rule-card" style="background: white; padding: 40px; border-radius: 25px; box-shadow: var(--shadow); border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; text-align: center; transition: var(--transition);">
                            <div class="rule-icon-box" style="width: 80px; height: 80px; border-radius: 20px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
                                <i data-lucide="book-open-check" style="width: 38px; height: 38px;"></i>
                            </div>
                            <h3 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 15px;">Regimento Interno</h3>
                            <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 30px; line-height: 1.6;">
                                Conjunto de normas que regem o funcionamento acadêmico, administrativo e disciplinar do SEBITAM.
                            </p>
                            <a href="https://drive.google.com/drive/folders/1us4CjRi8zJBbuLf9x4CjYTVUa-VT9UD3" target="_blank" class="btn-primary" style="width: 100%; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; padding: 15px; background: #10b981;">
                                <i data-lucide="scroll"></i> Acessar PDF (Regimento)
                            </a>
                        </div>

                    </div>

                    <div style="margin-top: 40px; text-align: center; padding: 25px; background: rgba(30, 41, 59, 0.03); border-radius: 15px; border: 1.5px dashed #cbd5e1;">
                        <p style="font-size: 0.9rem; color: #64748b;">
                            <i data-lucide="info" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;"></i>
                            Esses documentos são fundamentais para o bom convívio e organização da nossa comunidade acadêmica.
                        </p>
                    </div>
                `;
                setTimeout(() => lucide.createIcons(), 0);
                break;

            case 'finance': {
                const allFinanceSt = await dbGet('sebitam-students');
                const selectedGrade = data && data.grade ? data.grade : 'all';

                const finStudents = selectedGrade === 'all'
                    ? allFinanceSt
                    : allFinanceSt.filter(s => s.grade == selectedGrade);

                // Definição de valores monetários por plano
                const PRICES = { integral: 70, half: 35, scholarship: 0 };

                let totalExpected = 0;
                let totalReceived = 0;

                const processedPayments = finStudents.map(s => {
                    const status = s.paymentStatus || (['integral', 'scholarship'].includes(s.plan) ? 'Pago' : 'Pendente');
                    const value = PRICES[s.plan] || 0;
                    totalExpected += value;
                    if (status === 'Pago') totalReceived += value;
                    return { ...s, status, value };
                });

                const numPaid = processedPayments.filter(p => p.status === 'Pago').length;
                const numPending = processedPayments.filter(p => p.status === 'Pendente').length;

                const today = new Date();
                today.setDate(1); // Set to 1st to prevent overflow
                // Logic: Start from February. If today is Jan, show Feb (1). Else show current month.
                // Note: getMonth() is 0-indexed.
                if (today.getMonth() === 0) {
                    today.setMonth(1);
                }
                const displayMonth = today.toLocaleString('pt-BR', { month: 'long' });
                const displayMonthCapitalized = displayMonth.charAt(0).toUpperCase() + displayMonth.slice(1);

                html = `
                    <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
                        <div>
                            <h2>Painel Financeiro</h2>
                            <p>Visão de recebíveis com valores monetários e filtros.</p>
                        </div>
                        <div style="background: white; padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; gap: 10px;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Filtrar por Turma:</label>
                            <select id="finance-grade-filter" style="border: none; outline: none; background: transparent; font-weight: 700; color: var(--primary); cursor: pointer;">
                                <option value="all" ${selectedGrade === 'all' ? 'selected' : ''}>Todas as Turmas</option>
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => `<option value="${g}" ${selectedGrade == g ? 'selected' : ''}>Turma ${g}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    

                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; margin-bottom: 40px; align-items: start;">
                        
                        <!-- Left Column: Stats & Chart -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            
                            <!-- Stats Cards -->

                            <!-- Stats Cards -->
                            <div class="stat-card" style="background: white; border: 2px solid var(--primary); background: rgba(37, 99, 235, 0.05);">
                                <div class="stat-icon" style="background: var(--primary); color: white;"><i data-lucide="wallet"></i></div>
                                <div>
                                    <div class="stat-value" style="font-size: 1.8rem; color: var(--primary);">R$ ${allFinanceSt.reduce((acc, s) => acc + (PRICES[s.plan] || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div class="stat-label">Total Geral (Todas as Turmas) - ${displayMonthCapitalized}</div>
                                </div>
                            </div>

                            <div class="stat-card" style="background: white;">
                                <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #16a34a;"><i data-lucide="dollar-sign"></i></div>
                                <div>
                                    <div class="stat-value" style="font-size: 1.5rem;">R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div class="stat-value" style="font-size: 1.5rem;">R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div class="stat-label">Total Recebido (${displayMonthCapitalized})</div>
                                </div>
                            </div>

                            <div class="stat-card" style="background: white;">
                                <!-- Icon removed as requested -->
                                <div>
                                    <div class="stat-value" style="font-size: 1.5rem;">R$ ${(totalExpected - totalReceived).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div class="stat-label">Total em Aberto (Seleção)</div>
                                </div>
                            </div>

                            <div class="stat-card" style="background: white;">
                                <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;"><i data-lucide="pie-chart"></i></div>
                                <div>
                                    <div class="stat-value" style="font-size: 1.5rem;">${((totalReceived / (totalExpected || 1)) * 100).toFixed(1)}%</div>
                                    <div class="stat-label">Taxa de Adimplência</div>
                                </div>
                            </div>

                            <!-- Payment Chart -->
                            <div class="stat-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                                <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                                    <i data-lucide="pie-chart" style="color: var(--primary); width: 18px; height: 18px;"></i> Panorama de Pagamentos
                                </h3>
                                <div style="height: 250px; width: 100%; position: relative;">
                                    <canvas id="paymentsChart"></canvas>
                                </div>
                                <div style="margin-top: 25px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                        <span style="color: #16a34a; font-weight: 600;">Pagos (${numPaid}):</span>
                                        <strong>R$ ${totalReceived.toLocaleString('pt-BR')}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                        <span style="color: #dc2626; font-weight: 600;">Pendentes (${numPending}):</span>
                                        <strong>R$ ${(totalExpected - totalReceived).toLocaleString('pt-BR')}</strong>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Right Column: Spreadsheet -->
                        <div class="stat-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border); height: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="display: flex; align-items: center; gap: 10px; font-weight: 700;">
                                    <i data-lucide="table" style="color: var(--primary);"></i> Recebimentos por Aluno
                                </h3>
                                <span class="badge" style="background: var(--primary-light); color: var(--primary);">${finStudents.length} Alunos</span>
                            </div>
                            <div class="table-container" style="max-height: 800px; overflow-y: auto;">
                                <table class="data-table" style="font-size: 0.85rem;">
                                    <thead>
                                        <tr>
                                            <th>Aluno</th>
                                            <th>Plano</th>
                                            <th>Valor</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${processedPayments.map(p => {
                    let stColor, stIcon, stBg, stLabel;

                    if (p.plan === 'scholarship') {
                        stLabel = 'Bolsista';
                        stColor = '#a855f7'; // Purple
                        stBg = 'rgba(168, 85, 247, 0.1)';
                        stIcon = 'graduation-cap';
                    } else if (p.status === 'Pago') {
                        stLabel = 'Pago';
                        if (p.plan === 'half') {
                            stColor = '#3b82f6'; // Blue
                            stBg = 'rgba(59, 130, 246, 0.1)';
                        } else {
                            stColor = '#16a34a'; // Green
                            stBg = 'rgba(34, 197, 94, 0.1)';
                        }
                        stIcon = 'check-circle';
                    } else {
                        stLabel = 'Pendente';
                        stColor = '#dc2626'; // Red
                        stBg = 'rgba(239, 68, 68, 0.1)';
                        stIcon = 'alert-circle';
                    }

                    return `
                                            <tr>
                                                <td style="display: flex; align-items: center; gap: 8px;">
                                                    <div style="background: ${stBg}; padding: 4px; border-radius: 50%; display: flex; text-align: center; justify-content: center;">
                                                        <i data-lucide="${stIcon}" style="width: 14px; height: 14px; color: ${stColor};"></i>
                                                    </div>
                                                    <strong>${p.fullName}</strong>
                                                </td>
                                                <td>
                                                    <span class="badge" style="background: transparent; border: 1px solid #cbd5e1; color: #64748b; font-size: 0.7rem; display: inline-flex; align-items: center;">
                                                        ${p.plan === 'scholarship' ? '<i data-lucide="graduation-cap" style="width:12px; height:12px; margin-right:4px;"></i>' : ''}
                                                        ${p.plan === 'integral' ? 'Integral' : p.plan === 'half' ? 'Parcial' : 'Bolsista'}
                                                    </span>
                                                </td>
                                                <td>R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    <span class="badge" style="background: ${stBg}; color: ${stColor}; border: 1px solid ${stColor}; display: inline-flex; align-items: center; gap: 5px;">
                                                        <i data-lucide="${stIcon}" style="width: 12px; height: 12px;"></i>
                                                        ${stLabel}
                                                    </span>
                                                </td>
                                            </tr>
                                        `;
                }).join('')}
                                        ${processedPayments.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 30px;">Nenhum aluno encontrado para esta turma.</td></tr>' : ''}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 40px; background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border);">
                        <div class="view-header" style="margin-bottom: 20px;">
                            <h3 style="display: flex; align-items: center; gap: 10px; font-weight: 700;">
                                <i data-lucide="file-text" style="color: var(--primary);"></i> Relatórios Mensais
                            </h3>
                            <p>Gere e imprima relatórios financeiros detalhados por mês.</p>
                        </div>
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Mês</th>
                                        <th>Ano</th>
                                        <th>Status do Relatório</th>
                                        <th class="text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), i, 1);
                    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
                    const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    const year = date.getFullYear();
                    const isPastOrCurrent = i <= new Date().getMonth();

                    return `
                                            <tr>
                                                <td style="font-weight: 600;">${monthNameCap}</td>
                                                <td>${year}</td>
                                                <td>
                                                    <span class="badge" style="background: ${isPastOrCurrent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(241, 245, 249, 1)'}; color: ${isPastOrCurrent ? '#16a34a' : '#64748b'}; border: 1px solid ${isPastOrCurrent ? '#22c55e' : '#cbd5e1'};">
                                                        ${isPastOrCurrent ? 'Disponível' : 'Futuro'}
                                                    </span>
                                                </td>
                                                <td class="actions-cell">
                                                    <button class="btn-icon" title="Imprimir Relatório" onclick="printFinancialReport(${i}, ${year})" style="color: var(--primary); background: rgba(37, 99, 235, 0.1);">
                                                        <i data-lucide="printer"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;


                setTimeout(() => {
                    if (typeof Chart === 'undefined') return;

                    const filter = document.getElementById('finance-grade-filter');
                    if (filter) {
                        filter.onchange = (e) => renderView('finance', { grade: e.target.value });
                    }

                    const ctxPayments = document.getElementById('paymentsChart');
                    if (ctxPayments) {
                        new Chart(ctxPayments, {
                            type: 'doughnut',
                            data: {
                                labels: ['Recebido', 'Inadimplência'],
                                datasets: [{
                                    data: [totalReceived, totalExpected - totalReceived],
                                    backgroundColor: ['#22c55e', '#ef4444'],
                                    borderWidth: 0,
                                    hoverOffset: 15
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', size: 12 } } }
                                }
                            }
                        });
                    }
                    lucide.createIcons();
                }, 100);
                break;
            }
            case 'theology-ai':
                html = `
                        <div class="view-header" >
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div class="ai-avatar-large" style="width: 60px; height: 60px; border-radius: 50%; background: rgba(37, 99, 235, 0.1); display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="bot" style="width: 32px; height: 32px; color: #2563eb;"></i>
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
                            fileNameSpan.textContent = `Arquivo: ${fileInput.files[0].name} `;
                            filePreview.style.display = 'flex';
                        }
                    };

                    const addMessage = (text, type) => {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = `message ${type} `;
                        msgDiv.innerHTML = `<div class="msg-bubble shadow-sm" > ${text}</div> `;
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

                        setTimeout(async () => {
                            const lowText = text.toLowerCase();

                            // Sistema de InteligÃªncia Baseado em Contexto
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
                                },
                                {
                                    keys: ['pagamento', 'mensalidade', 'financeiro', 'bolsa', 'valor', 'pagar', 'taxa', 'custo'],
                                    resp: `
                        <div style="margin-bottom: 10px;"><strong>Gestão Financeira:</strong> O SEBITAM oferece diferentes planos de pagamento:</div>
                        <ul style="padding-left: 20px;">
                            <li><strong>Integral:</strong> Mensalidade completa</li>
                            <li><strong>Meia Mensalidade:</strong> 50% de desconto</li>
                            <li><strong>Bolsa Integral:</strong> Gratuidade total para casos especiais</li>
                        </ul>
                        <p>Os administradores podem acompanhar o status de pagamento na aba 'Financeiro' e atualizar diretamente na lista de 'Alunos'. Para dúvidas sobre seu plano específico, consulte a secretaria.</p>
                        `
                                },
                                {
                                    keys: ['matrícula', 'inscrição', 'cadastro', 'novo aluno', 'como entrar', 'requisitos', 'documentos'],
                                    resp: `
                        <strong>Processo de Matrícula:</strong> Para ingressar no SEBITAM:
                        <ol style="padding-left: 20px; margin: 10px 0;">
                            <li>O administrador ou secretário acessa a aba <strong>'Cadastro'</strong></li>
                            <li>Seleciona o perfil <strong>'Aluno'</strong></li>
                            <li>Preenche: Nome completo, telefone, e-mail, módulo inicial e plano financeiro</li>
                            <li>Após salvar, o aluno recebe uma matrícula automática (formato: SEBITAM-XXXX)</li>
                        </ol>
                        <p>O sistema já está integrado com Supabase para armazenamento seguro dos dados. Dúvidas sobre documentação? Consulte a secretaria acadêmica.</p>
                        `
                                },
                                {
                                    keys: ['professor', 'docente', 'ensino', 'quem ensina', 'corpo docente', 'educador'],
                                    resp: `
                        <strong>Corpo Docente SEBITAM:</strong> Nossos professores são especialistas em suas áreas teológicas.
                        <p>Para visualizar a lista completa de professores, acesse a aba <strong>'Visão Geral'</strong> onde você encontrará:</p>
                        <ul style="padding-left: 20px;">
                            <li>Nome completo de cada professor</li>
                            <li>Contato direto (telefone/WhatsApp)</li>
                            <li>Área de atuação</li>
                        </ul>
                        <p>Administradores podem gerenciar o cadastro de professores na aba 'Cadastro', selecionando o perfil 'Professor'. Materiais didáticos estão disponíveis na aba 'Material Didático Professores'.</p>
                        `
                                },
                                {
                                    keys: ['ajuda', 'help', 'socorro', 'não entendi', 'como usar', 'tutorial', 'suporte'],
                                    resp: `
                        <div style="margin-bottom: 15px;"><strong>Central de Ajuda SEBITAM:</strong> Estou aqui para orientar você! Veja o que posso fazer:</div>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 10px 0;">
                            <p style="margin: 5px 0;"><strong>📚 Acadêmico:</strong> Módulos, disciplinas, histórico, certificados</p>
                            <p style="margin: 5px 0;"><strong>👥 Gestão:</strong> Cadastro de alunos, professores, notas, frequência</p>
                            <p style="margin: 5px 0;"><strong>💰 Financeiro:</strong> Planos, pagamentos, relatórios</p>
                            <p style="margin: 5px 0;"><strong>⛪ Teológico:</strong> Doutrinas, exegese, ministério pastoral</p>
                        </div>
                        <p><em>Dica: Seja específico! Pergunte sobre 'notas', 'matrícula', 'certificado', 'módulo 3', etc.</em></p>
                        `
                                },
                                {
                                    keys: ['oração', 'orar', 'intercessão', 'espiritualidade', 'devoção', 'vida espiritual', 'comunhão'],
                                    resp: `
                        <strong>Vida Espiritual no SEBITAM:</strong> A formação teológica deve estar enraizada em uma vida de oração e comunhão com Deus.
                        <p>Enquanto você estuda as doutrinas e disciplinas, lembre-se:</p>
                        <blockquote style="border-left: 4px solid var(--primary); padding-left: 15px; margin: 15px 0; font-style: italic; color: var(--text-muted);">
                            "Conhecimento sem devoção infla; devoção sem conhecimento desvia. Busque ambos em equilíbrio." 
                        </blockquote>
                        <p>O SEBITAM não é apenas um centro de ensino, mas um espaço de formação integral. Cultive sua espiritualidade enquanto aprofunda seus estudos teológicos.</p>
                        `
                                },
                                {
                                    keys: ['módulo 1', 'fundamentos', 'bibliologia', 'teontologia', 'novo testamento', 'antigo testamento'],
                                    resp: "<strong>Módulo 1 - Fundamentos:</strong> Este módulo foca nas bases bíblicas e doutrinárias iniciais. Disciplinas: Bibliologia, Teontologia, Introdução ao N.T e Introdução ao A.T. É a base de todo o curso médio."
                                },
                                {
                                    keys: ['módulo 2', 'contexto histórico', 'geografia bíblica', 'hermenêutica', 'período interbíblico', 'ética cristã'],
                                    resp: "<strong>Módulo 2 - Contexto Histórico:</strong> Explora o ambiente das Escrituras e ferramentas de interpretação. Disciplinas: Geografia Bíblica, Hermenêutica, Período Interbíblico e Ética Cristã."
                                },
                                {
                                    keys: ['módulo 3', 'doutrinas específicas', 'soteriologia', 'eclesiologia', 'escatologia', 'homilética'],
                                    resp: "<strong>Módulo 3 - Doutrinas Específicas:</strong> Aprofundamento dogmático e arte da pregação. Disciplinas: Soteriologia (Salvação), Eclesiologia (Igreja), Escatologia (Fim dos Tempos) e Homilética (Pregação)."
                                },
                                {
                                    keys: ['módulo 4', 'teologia aplicada', 'teologia contemporânea', 'teologia pastoral'],
                                    resp: "<strong>Módulo 4 - Teologia Aplicada:</strong> Foca na conexão da teologia com a realidade atual e o cuidado pastoral. Disciplinas: Teologia Contemporânea, Introdução Teológica Bíblica A.T/N.T e Teologia Pastoral."
                                },
                                {
                                    keys: ['módulo 5', 'prática pastoral', 'exegese bíblica', 'psicologia pastoral'],
                                    resp: "<strong>Módulo 5 - Prática Pastoral:</strong> Estágio final focado em exegese profunda e cuidado emocional/espiritual. Disciplinas: Exegese Bíblica e Psicologia Pastoral."
                                },
                                {
                                    keys: ['critério', 'aprovação', 'mínimo', 'média', 'passar', 'frequência mínima'],
                                    resp: "<strong>Critérios de Aprovação SEBITAM:</strong> Para ser aprovado, o aluno deve atingir: 1) Nota mínima de 7.0 em cada disciplina; 2) Frequência mínima de 75% das aulas presenciais/atividades."
                                },
                                {
                                    keys: ['segurança', 'privacidade', 'nuvem', 'supabase', 'dados', 'proteção'],
                                    resp: "<strong>Segurança de Dados:</strong> O SEBITAM utiliza tecnologia de ponta com o Supabase. Seus dados são criptografados e armazenados em nuvem com backup automático, garantindo que o histórico escolar nunca se perca."
                                },
                                {
                                    keys: ['liderança', 'líder', 'gestor', 'presidência', 'coordenação'],
                                    resp: "<strong>Liderança Ministerial:</strong> O curso médio capacita líderes para servirem nas igrejas locais com excelência administrativa e equilíbrio teológico. A diretoria supervisiona o progresso de cada vocacionado."
                                },
                                {
                                    keys: ['missão', 'missiologia', 'evangelismo', 'ide', 'povos'],
                                    resp: "<strong>Missões e Evangelismo:</strong> O 'Ide' de Jesus é o motor do SEBITAM. Nossas disciplinas visam não apenas o conhecimento, mas a expansão do Reino de Deus em toda a Amazônia e além."
                                },
                                {
                                    keys: ['ética', 'comportamento', 'caráter', 'cristão no mundo'],
                                    resp: "<strong>Ética Cristã:</strong> Estudamos como os valores do Reino de Deus se aplicam às decisões morais contemporâneas, preparando o aluno para ser sal e luz na sociedade."
                                }
                            ];

                            // --- INTEGRAÇÃO SEGURA COM SUPABASE EDGE FUNCTIONS ---
                            async function callGeminiAI(userText) {
                                if (!supabase) return "Sinto muito, o sistema está em modo offline.";

                                try {
                                    // Chama a Edge Function 'gemini-chat' configurada no Supabase
                                    const { data, error } = await supabase.functions.invoke('gemini-chat', {
                                        body: {
                                            question: userText,
                                            userProfile: {
                                                name: currentUser.name,
                                                role: currentUser.role
                                            }
                                        }
                                    });

                                    if (error) throw error;
                                    return data.response || "Não recebi uma resposta válida da IA.";
                                } catch (err) {
                                    console.error("Erro ao invocar Edge Function:", err);
                                    return "Sinto muito, houve uma falha na conexão segura com a IA. Verifique se a Edge Function foi implantada corretamente.";
                                }
                            }

                            // Buscar correspondência local (Filtro Rápido)
                            const match = contextMap.find(c => c.keys.some(k => lowText.includes(k)));

                            if (match) {
                                addMessage(match.resp, 'ai');
                            } else {
                                // Se não houver palavra-chave, chama a IA de Verdade
                                addMessage("<em>Antigravity está consultando os registros teológicos...</em>", 'ai-loading');
                                const aiResponse = await callGeminiAI(text);

                                // Remover mensagem de loading e adicionar resposta real
                                const loadingMsg = document.querySelector('.message.ai-loading');
                                if (loadingMsg) loadingMsg.remove();

                                addMessage(aiResponse, 'ai');
                            }
                        }, 500);
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
        try {
            console.log(`Atualizando pagamento: ID ${studentId} para ${status}`);
            await dbUpdateItem('sebitam-students', studentId, { paymentStatus: status });
            console.log("Pagamento atualizado com sucesso!");
            alert(`Status de pagamento alterado para: ${status}`);
            await renderView('classes');
        } catch (err) {
            console.error("Erro ao atualizar pagamento:", err);
            alert("Erro ao atualizar pagamento: " + err.message);
        }
    }

    // Export functions to window for onclick handlers
    window.renderGradeEditor = renderGradeEditor;
    window.generateCertificate = generateCertificate;
    window.printAcademicHistory = printAcademicHistory;
    window.updatePaymentStatus = updatePaymentStatus;
    window.printFinancialReport = printFinancialReport;
    window.renderEditStudent = renderEditStudent;

    // Profile Icon Logic (Restored)
    const avatarContainer = document.getElementById('profile-avatar-container');
    const profileUpload = document.getElementById('profile-upload');
    const userAvatarIcon = document.getElementById('user-avatar-icon');

    if (avatarContainer && profileUpload) {
        avatarContainer.addEventListener('click', () => {
            profileUpload.click();
        });

        profileUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target.result;

                // Update UI immediately
                if (userAvatarIcon) {
                    // Create img if doesn't exist or update
                    let img = avatarContainer.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                        avatarContainer.appendChild(img);
                        userAvatarIcon.style.display = 'none'; // Hide icon
                    }
                    img.src = base64;
                }

                // Update Data
                if (currentUser) {
                    currentUser.photo = base64;

                    // Determine collection
                    let collection = 'sebitam-students'; // default
                    if (currentUser.role === 'admin') collection = 'sebitam-admins';
                    if (currentUser.role === 'teacher') collection = 'sebitam-teachers';
                    if (currentUser.role === 'secretary') collection = 'sebitam-secretaries';

                    try {
                        await dbUpdateItem(collection, currentUser.id, { photo: base64 });
                        // Also update local storage user key if used
                        const userKey = `sebitam-user-${currentUser.email}`;
                        if (localStorage.getItem(userKey)) {
                            // Logic to update stored user if needed, usually we re-fetch on login
                        }
                    } catch (err) {
                        console.error('Error saving photo:', err);
                        alert('Erro ao salvar foto.');
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Function to show avatar if exists
    function updateAvatarUI(user) {
        if (!avatarContainer) return;
        const existingImg = avatarContainer.querySelector('img');
        if (existingImg) existingImg.remove();
        const icon = document.getElementById('user-avatar-icon');

        if (user && user.photo) {
            const img = document.createElement('img');
            img.src = user.photo;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            avatarContainer.appendChild(img);
            if (icon) icon.style.display = 'none';
        } else {
            if (icon) icon.style.display = 'block';
        }
    }
    window.updateAvatarUI = updateAvatarUI;

    // Super Admin Auto-Registration
    async function checkAndRegisterSuperAdmin() {
        if (!supabase) return;
        const superAdminEmail = 'edukadoshmda@gmail.com';
        const superAdminName = 'Luiz Eduardo Santos da Silva';

        try {
            // Usando o nome correto da tabela em inglês
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
