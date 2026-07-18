const fs = require('fs');

const transcript = fs.readFileSync('C:/Users/ASUS/.gemini/antigravity/brain/d0334b17-913d-4061-9139-10699a94e007/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i];
  if (line.includes('==Start of PDF==') && line.includes('"type":"USER_INPUT"')) {
    try {
      const data = JSON.parse(line);
      fs.writeFileSync('pdf_ocr.txt', data.content, 'utf8');
      console.log('Saved! Length:', data.content.length);
      break;
    } catch(e) {
      console.log('Error parsing JSON on line', i);
    }
  }
}
