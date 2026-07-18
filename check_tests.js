const fs = require('fs');

function check(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  let match = content.match(/"name":\s*"Đề (\d+)"/g);
  if(match) {
    const names = match.map(m => parseInt(m.match(/\d+/)[0])).sort((a,b)=>a-b);
    console.log(filename, names);
  }
}

check('reading_texts.js');
check('questions.js');
