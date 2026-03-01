const fs = require('fs');
const path = 'c:/Users/eduka/Desktop/SEBITAM LIMPO/main.js';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

const newEnrollment = `            case 'enrollment':
                const activeType = data && data.type ? data.type : 'student';
                html = \`
                    <div class="view-header" style="margin-bottom: 30px;">
                        <h2 style="font-size: 2.22rem; font-weight: 800; color: #1e293b;">Cadastro Institucional</h2>
                        <span style="background: #2563eb; color: white; padding: 5px 12px; border-radius: 4px; font-size: 0.9rem; font-weight: 500; display: inline-block; margin-top: 5px;">Selecione o perfil que deseja cadastrar no sistema.</span>
                    </div>
                    
                    <div class="registration-role-selector" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 35px;">
                        \${['student', 'teacher', 'admin', 'secretary'].map(type => {
                            const icons = { student: 'user', teacher: 'graduation-cap', admin: 'shield-check', secretary: 'briefcase' };
                            const labels = { student: 'Aluno', teacher: 'Professor', admin: 'Administrador', secretary: 'Secretária' };
                            const isActive = activeType === type;
                            return \`
                                <label class="role-option" style="text-align: center; cursor: pointer;">
                                    <input type="radio" name="reg-role" value="\${type}" \${isActive ? 'checked' : ''} style="margin-bottom: 12px; transform: scale(1.3); accent-color: #2563eb;">
                                    <div class="role-box" style="padding: 25px 10px; border: 1.5px solid \${isActive ? '#2563eb' : '#e2e8f0'}; border-radius: 15px; background: white; transition: all 0.3s; box-shadow: \${isActive ? '0 4px 15px rgba(37, 99, 235, 0.1)' : 'none'};">
                                        <i data-lucide="\${icons[type]}" style="width: 24px; height: 24px; color: \${isActive ? '#2563eb' : '#64748b'}; margin-bottom: 8px;"></i>
                                        <span style="display: block; font-weight: 600; font-size: 0.85rem; color: \${isActive ? '#1e293b' : '#64748b'};">\${labels[type]}</span>
                                    </div>
                                </label>
                            \`;
                        }).join('')}
                    </div>

                    <div id="reg-form-container"></div>
                \`;
                setTimeout(() => {
                    const renderForm = (type) => {
                        const container = document.getElementById('reg-form-container');
                        const roleNames = { student: 'Aluno', teacher: 'Professor(a)', admin: 'Administrador(a)', secretary: 'Secretário(a)' };
                        const nameLabel = \`Nome Completo do(a) \${roleNames[type]}\`;
                        
                        let formHtml = \`
                            <div class="form-container" style="max-width: 900px; padding: 45px; background: white; border-radius: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; margin-top: 20px;">
                                <form id="unified-reg-form">
                                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div class="form-group full-width" style="grid-column: 1 / -1; margin-bottom: 20px;">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">\${nameLabel}</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="user" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <input type="text" name="\${type === 'student' ? 'fullName' : 'name'}" placeholder="Nome completo" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">Telefone / WhatsApp</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="phone" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <input type="tel" name="phone" placeholder="(00) 00000-0000" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">E-mail</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="mail" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <input type="email" name="email" placeholder="email@exemplo.com" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;" required>
                                            </div>
                                        </div>
                        \`;

                        if (type === 'student') {
                            formHtml += \`
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">Turma (1 a 10)</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="hash" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <select name="grade" style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;">
                                                    \${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => \\\`<option value="\${n}">Turma \${n}</option>\\\`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">Módulo (1 a 5)</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="layers" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <select name="module" style="width: 100%; padding: 12px 12px 12px 45px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;">
                                                    <option value="1">Módulo 1</option><option value="2">Módulo 2</option><option value="3">Módulo 3</option><option value="4">Módulo 4</option><option value="5">Módulo 5</option>
                                                </select>
                                            </div>
                                        </div>
                            \`;
                        } else {
                            const extraIcon = type === 'teacher' ? 'graduation-cap' : (type === 'admin' ? 'shield-check' : 'briefcase');
                            formHtml += \`
                                        <div class="form-group full-width" style="grid-column: 1 / -1; margin-top: 10px;">
                                            <label style="font-weight: 700; color: #334155; margin-bottom: 8px; display: block; font-size: 0.9rem;">Função / Cargo</label>
                                            <div class="input-field" style="position: relative;">
                                                <i data-lucide="\${extraIcon}" style="position: absolute; left: 16px; top: 12px; width: 18px; color: #1e293b;"></i>
                                                <input type="text" name="extra" placeholder="Ex: Financeiro" style="width: 100%; padding: 12px 12px 12px 48px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white;" required>
                                            </div>
                                        </div>
                            \`;
                        }

                        formHtml += \`
                                    </div>
                                    <div class="form-actions" style="border:none; margin-top: 40px;">
                                        <button type="submit" class="btn-primary" style="background: #2563eb; width: auto; padding: 15px 40px; border-radius: 10px; font-weight: 700; font-size: 1rem; color: white; border: none; cursor: pointer;">Salvar Cadastro</button>
                                    </div>
                                </form>
                            </div>
                        \`;
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
                    document.querySelectorAll('input[name="reg-role"]').forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            renderForm(e.target.value);
                            // Refresh selection visuals
                            document.querySelectorAll('.role-box').forEach(box => {
                                box.style.borderColor = '#e2e8f0';
                                box.style.boxShadow = 'none';
                                box.querySelector('i').style.color = '#64748b';
                                box.querySelector('span').style.color = '#64748b';
                            });
                            const selectedBox = e.target.parentElement.querySelector('.role-box');
                            selectedBox.style.borderColor = '#2563eb';
                            selectedBox.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.1)';
                            selectedBox.querySelector('i').style.color = '#2563eb';
                            selectedBox.querySelector('span').style.color = '#1e293b';
                        });
                    });
                }, 0);
                break;`;

// We need to find the start and end indices of the enrollment case.
// case 'enrollment' is at line 717 index (lines[716])
// break; is at line 870 index (lines[869])

const finalLines = [
    ...lines.slice(0, 716),
    newEnrollment,
    ...lines.slice(870)
];

fs.writeFileSync(path, finalLines.join('\n'), 'utf8');
console.log('Successfully patched main.js');
