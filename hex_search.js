const fs = require('fs');
const buffer = fs.readFileSync('c:/Users/eduka/Desktop/SEBITAM LIMPO/main.js');
const hex = buffer.toString('hex');
// Search for "Contatos" in hex: 436f6e7461746f73
if (hex.includes('436f6e7461746f73')) {
    console.log('Found "Contatos"');
    // Find the context
    const index = hex.indexOf('436f6e7461746f73');
    const start = Math.max(0, index - 100);
    const end = Math.min(hex.length, index + 200);
    console.log('Context (hex):', hex.substring(start, end));
    console.log('Context (UTF-8):', Buffer.from(hex.substring(start, end), 'hex').toString('utf8'));
} else {
    console.log('"Contatos" not found in main.js');
}
