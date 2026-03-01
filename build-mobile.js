const fs = require('fs');
const path = require('path');

const filesToCopy = [
    'index.html',
    'main.js',
    'style.css',
    'logo.jpg'
];

const dest = 'www';

if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
}

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(__dirname, dest, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copiado: ${file}`);
    } else {
        console.warn(`Aviso: Arquivo não encontrado: ${file}`);
    }
});

console.log('Build mobile concluído com sucesso!');
