const fs = require('fs');

const rawText = fs.readFileSync('pdf_raw.txt', 'utf8');

// Read current db
let data = JSON.parse(fs.readFileSync('reading_texts.js', 'utf8').replace('window.allReadingTexts = ', '').replace(/;$/, ''));

// Split into 22 chunks (TOC + 21 tests)
const chunks = rawText.split(/\n(?:LESEVERSTEHEN\s*\n)?TEIL 1\.?/i);

// Helper
function extract(text, startRegex, endRegex) {
  const startMatch = startRegex.exec(text);
  if (!startMatch) return '';
  const startIndex = startMatch.index + startMatch[0].length;
  endRegex.lastIndex = startIndex;
  const endMatch = endRegex.exec(text);
  return endMatch ? text.substring(startIndex, endMatch.index).trim() : text.substring(startIndex).trim();
}

for (let i = 1; i < chunks.length; i++) {
  const chunk = chunks[i];
  
  // the data array is 0-indexed for 21 tests
  let test = data[i - 1]; 
  if (!test) continue;
  
  // Extract sections from the chunk
  let t1Headings = extract(chunk, /^\s*/, /\n1\./);
  let t1Texts = extract(chunk, /\n1\./, /\nTeil 2/i);
  let t2 = extract(chunk, /\nTeil 2/i, /\n6\./);
  let t2Q = extract(chunk, /\n6\./, /\nTeil 3/i);
  let t3Headings = extract(chunk, /\nTeil 3:?/i, /\n11\./);
  let t3Q = extract(chunk, /\n11\./, /\nSPRACHBAUSTEINE.*Teil 1/i);
  let t4 = extract(chunk, /\nSPRACHBAUSTEINE.*Teil 1/i, /\n21\./);
  let t4Q = extract(chunk, /\n21\./, /\nSPRACHBAUSTEINE.*Teil 2/i);
  let t5 = extract(chunk, /\nSPRACHBAUSTEINE.*Teil 2/i, /\n31\./);
  let t5Q = extract(chunk, /\n31\./, /$/);

  test.teil1 = {
    headings: t1Headings.split('\n').filter(l => /^[A-J]\./.test(l.trim())).map(l => l.trim()),
    texts: t1Texts.split(/\n(?=[1-5]\.)/).map(t => t.trim()).filter(Boolean)
  };

  test.teil2 = {
    text: t2,
    questions: t2Q.split(/\n(?=[6-9]\.|10\.)/).filter(Boolean).map(q => {
      let lines = q.trim().split('\n');
      return { question: lines[0], options: lines.slice(1).filter(l => /^[A-C]\./.test(l.trim())) };
    })
  };

  test.teil3 = {
    situations: t3Q.split(/\n(?=1[1-9]\.|20\.)/).map(s => s.trim()).filter(Boolean),
    texts: t3Headings.split(/\n(?=[A-L]\.)/).map(t => t.trim()).filter(Boolean)
  };

  test.teil4 = {
    text: t4,
    options: t4Q.split(/\n(?=2[1-9]\.|30\.)/).map(o => o.trim()).filter(Boolean)
  };

  test.teil5 = {
    text: t5,
    wordbank: t5Q.split(/\n(?=3[1-9]\.|40\.)/).map(w => w.trim()).filter(Boolean)
  };
  
  console.log(`Parsed ${test.name}`);
}

fs.writeFileSync('reading_texts.js', 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';', 'utf8');
console.log('Saved 21 tests to reading_texts.js');
