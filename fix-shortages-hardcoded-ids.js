const fs = require('fs');
const path = './pages/Shortages.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find and replace hardcoded IDs
content = content.replace(
    /usuario_id: 'current-user-id',/g,
    'usuario_id: currentUser.id,'
);

content = content.replace(
    /empresa_id: 'current-company-id'/g,
    'empresa_id: currentUser.empresa_id'
);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Fixed hardcoded IDs in Shortages page');
