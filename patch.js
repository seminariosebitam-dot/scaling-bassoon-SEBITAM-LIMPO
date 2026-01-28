const fs = require('fs');
const filePath = 'c:\\Users\\eduka\\Desktop\\SEBITAM LIMPO\\main.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the enrollment case logic
content = content.replace(/email: fd\.get\('email'\),`n\s+image: `https:\/\/api\.dicebear\.com\/7\.x\/avataaars\/svg\?seed=\$\{fd\.get\('name'\)\}`,/g,
    "email: fd.get('email'),\n                            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fd.get('name')}`,");

// Also update the second case (teacher-form) which I haven't messed up yet but needs the update
content = content.replace(/image: fd\.get\('image'\) \|\| `https:\/\/api\.dicebear\.com\/7\.x\/avataaars\/svg\?seed=\$\{fd\.get\('name'\)\}`,/g,
    "email: fd.get('email'),\n                            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fd.get('name')}`,");

fs.writeFileSync(filePath, content);
console.log('Patch applied successfully');
