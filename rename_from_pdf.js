const fs = require('fs');

const names = [
  "Ausstellung",
  "Grippe-Impfung",
  "Jugendliche 1",
  "Jugendliche 2",
  "Jugendliche 3",
  "Trampoline",
  "Bilder",
  "In den Alpen 1",
  "In den Alpen 2",
  "Neue Heuschrenkenart",
  "Tanzkurs 1",
  "Tanzkurs 2",
  "Gemeinsam",
  "Das ideale Gemüse 1",
  "Das ideale Gemüse 2",
  "Deutscher Forscher 1",
  "Deutscher Forscher 2",
  "Limonade 1",
  "Limonade 2",
  "Schlafzug",
  "Das neue Schülerticket"
];

let content = fs.readFileSync('reading_texts.js', 'utf8');
let data = JSON.parse(content.replace('window.allReadingTexts = ', '').replace(/;$/, ''));

names.forEach((name, index) => {
  const num = index + 1;
  const testToUpdate = data.find(t => t.name === `Đề ${num}` || t.name.startsWith(`Đề ${num} -`));
  if (testToUpdate) {
    testToUpdate.name = `Đề ${num} - ${name}`;
    console.log(`Renamed to: ${testToUpdate.name}`);
  }
});

fs.writeFileSync('reading_texts.js', 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';', 'utf8');
console.log('Successfully renamed 21 tests.');
