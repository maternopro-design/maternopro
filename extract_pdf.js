const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:/Users/ASUS/.gemini/antigravity/brain/d0334b17-913d-4061-9139-10699a94e007/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let pdfText = '';
  for await (const line of rl) {
    if (line.includes('==Start of PDF==')) {
      try {
        const data = JSON.parse(line);
        if (data && data.content && data.content.includes('==Start of PDF==')) {
          pdfText = data.content;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  if (pdfText) {
    fs.writeFileSync('pdf_raw.txt', pdfText, 'utf8');
    console.log('Saved PDF text. Size:', pdfText.length);
  } else {
    console.log('PDF text not found');
  }
}

extract();
