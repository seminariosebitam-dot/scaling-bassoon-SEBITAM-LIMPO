const fs = require('fs');
const mainPath = 'c:/Users/eduka/Desktop/SEBITAM LIMPO/main.js';
let mainContent = fs.readFileSync(mainPath, 'utf8');

// 1. Fix Phone Column to be single line
mainContent = mainContent.replace(
    '<td style="font-size: 0.85rem;">${phone}</td>',
    '<td style="font-size: 0.85rem; white-space: nowrap;">${phone}</td>'
);

// 2. Apply "Cadastro Institucional" title fix (from patch.js logic)
mainContent = mainContent.replace(
    '<h2 style="font-size: 2.22rem; font-weight: 800; color: #1e293b;">Secretária</h2>',
    '<h2 style="font-size: 2.22rem; font-weight: 800; color: #1e293b;">Cadastro Institucional</h2>'
);

fs.writeFileSync(mainPath, mainContent, 'utf8');
console.log('Applied fixes to main.js');
