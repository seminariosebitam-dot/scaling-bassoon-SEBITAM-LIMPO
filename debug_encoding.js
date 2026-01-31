const fs = require('fs');
const content = fs.readFileSync('c:/Users/eduka/Desktop/SEBITAM LIMPO/main.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('Corpo Administrativo') || line.includes('Contatos')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
