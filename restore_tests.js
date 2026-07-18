const fs = require('fs');

// Tạo lại Đề 23-43 trong reading_texts.js
let content = fs.readFileSync('reading_texts.js', 'utf8');
let data = JSON.parse(content.replace('window.allReadingTexts = ', '').replace(/;$/, ''));

console.log('Hiện có:', data.length, 'đề');
console.log('Danh sách:', data.map(t => t.name).join(', '));

for (let i = 23; i <= 43; i++) {
  const name = `Đề ${i}`;
  if (!data.find(t => t.name === name)) {
    data.push({
      name: name,
      teil1: { texts: [], headings: [] },
      teil2: { text: "", questions: [] },
      teil3: { texts: [], situations: [] },
      teil4: { text: "", options: [] },
      teil5: { text: "", wordbank: [] },
      answers: {},
      explanations: {}
    });
    console.log('Đã tạo:', name);
  }
}

// Sort
data.sort((a, b) => {
  const mA = a.name.match(/^Đề (\d+)$/);
  const mB = b.name.match(/^Đề (\d+)$/);
  const nA = mA ? parseInt(mA[1]) : 999;
  const nB = mB ? parseInt(mB[1]) : 999;
  return nA - nB;
});

fs.writeFileSync('reading_texts.js', 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';', 'utf8');
console.log('Tổng:', data.length, 'đề');

// Cũng thêm vào readingTestList trong app.js
let appContent = fs.readFileSync('app.js', 'utf8');

for (let i = 23; i <= 43; i++) {
  const name = `Đề ${i}`;
  if (!appContent.includes(`name: "${name}"`)) {
    // Find end of readingTestList array
    const marker = '];';
    const listStart = appContent.indexOf('const readingTestList = [');
    // Find the closing ]; of readingTestList
    let depth = 0;
    let endPos = -1;
    for (let j = listStart; j < appContent.length; j++) {
      if (appContent[j] === '[') depth++;
      if (appContent[j] === ']') {
        depth--;
        if (depth === 0) { endPos = j; break; }
      }
    }
    
    if (endPos > 0) {
      const newEntry = `,\n  { \n    name: "${name}", \n    free: false, \n    minutes: 90, \n    answers: {},\n    explanations: {}\n  }`;
      appContent = appContent.slice(0, endPos) + newEntry + appContent.slice(endPos);
    }
  }
}

fs.writeFileSync('app.js', appContent, 'utf8');
console.log('Đã thêm Đề 23-43 vào app.js');
console.log('DONE!');
