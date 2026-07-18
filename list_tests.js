const fs = require('fs');
const lines = fs.readFileSync('app.js', 'utf8').split('\n');
for(let i=1174; i<lines.length; i++) {
  if(lines[i].includes('name:') && lines[i].includes('Đề')) {
    console.log(i+1, lines[i].trim());
  }
}
