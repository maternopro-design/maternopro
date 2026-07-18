const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');
content = content.replace("targetElement.value = ret.data.text;", "targetElement.value = ret.data.text;\n              targetElement.dispatchEvent(new Event('input', { bubbles: true }));");
fs.writeFileSync('app.js', content);
console.log('Fixed');
