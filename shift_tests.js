const fs = require('fs');

const content = fs.readFileSync('reading_texts.js', 'utf8');
const dataStr = content.replace('window.allReadingTexts = ', '').replace(/;$/, '');
let data = JSON.parse(dataStr);

// Shift tests
data.forEach(test => {
  const match = test.name.match(/^Đề (\d+)$/);
  if (match) {
    let num = parseInt(match[1]);
    if (num >= 13) {
      test.name = `Đề ${num + 1}`;
    }
  }
});

// Sort tests by number
data.sort((a, b) => {
  const matchA = a.name.match(/^Đề (\d+)$/);
  const matchB = b.name.match(/^Đề (\d+)$/);
  const numA = matchA ? parseInt(matchA[1]) : 0;
  const numB = matchB ? parseInt(matchB[1]) : 0;
  return numA - numB;
});

// Insert new empty Đề 13
const newTest13 = {
  name: "Đề 13",
  teil1: { texts: [], headings: [] },
  teil2: { text: "", questions: [] },
  teil3: { texts: [], situations: [] },
  teil4: { text: "", options: [] },
  teil5: { text: "", wordbank: [] }
};

// find index to insert
const index14 = data.findIndex(t => t.name === 'Đề 14');
if(index14 !== -1) {
    data.splice(index14, 0, newTest13);
} else {
    data.push(newTest13);
}

// Write back
const newContent = 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';';
fs.writeFileSync('reading_texts.js', newContent, 'utf8');
console.log('Successfully shifted tests >= 13 and created empty Đề 13.');
