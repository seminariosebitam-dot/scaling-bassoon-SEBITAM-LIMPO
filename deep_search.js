const fs = require('fs');
const path = require('path');

const targetStrings = [
    'Contatos rápidos da equipe de gestão e ensino',
    'Contatos rÃ¡pidos da equipe de gestÃ£o e ensino',
    'gestão e ensino',
    'gestÃ£o e ensino'
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'android') return;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.json')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                targetStrings.forEach(target => {
                    if (content.includes(target)) {
                        results.push({ file: fullPath, match: target });
                    }
                });
            }
        }
    });
    return results;
}

const found = walk('c:/Users/eduka/Desktop/SEBITAM LIMPO');
console.log('Results:', JSON.stringify(found, null, 2));
