const fs = require('fs');
let content = fs.readFileSync('reading_texts.js', 'utf8');
let data = JSON.parse(content.replace('window.allReadingTexts = ', '').replace(/;$/, ''));

const t16 = data.find(t => t.name === 'Đề 16');
if (t16) {
  t16.answers = {
    1: 'E', 2: 'B', 3: 'I', 4: 'C', 5: 'J',
    6: 'B', 7: 'B', 8: 'B', 9: 'A', 10: 'A',
    11: 'L', 12: 'I', 13: 'B', 14: 'H', 15: 'X', 16: 'E', 17: 'A', 18: 'D', 19: 'F', 20: 'G',
    21: 'C', 22: 'B', 23: 'A', 24: 'B', 25: 'B', 26: 'A', 27: 'B', 28: 'C', 29: 'C', 30: 'A',
    31: 'J', 32: 'B', 33: 'O', 34: 'M', 35: 'I', 36: 'K', 37: 'A', 38: 'L', 39: 'E', 40: 'F'
  };
  console.log('Đã nhập đáp án Đề 16:', JSON.stringify(t16.answers));
} else {
  console.log('Không tìm thấy Đề 16!');
}

const newContent = 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';';
fs.writeFileSync('reading_texts.js', newContent, 'utf8');
console.log('Done!');
