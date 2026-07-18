const fs = require('fs');
const db = JSON.parse(fs.readFileSync('maternopro_db_backup.json', 'utf8'));

const regex = /\b(fur|konnen|uber|mussen|gros|auser|Schuler|Schulern|wahrend|spater|Turen|Buro|Fruhling|ubrigens|naturlich|daruber|dadurch|Manner|Fraulein|Gebauden|Lander|Larm|Rucksicht|furs|uberm|zahlt|Worter|wahlen|Gefuhl|moglich|Buro|unabhangig|jahrig)\b/g;

let issues = [];
db.reading.forEach(test => {
  ['teil1', 'teil2', 'teil3', 'teil4', 'teil5'].forEach(teil => {
    if (test[teil]) {
      const content = JSON.stringify(test[teil]);
      const matches = content.match(regex);
      if (matches) {
        matches.forEach(m => {
          issues.push(`${test.name} - ${teil}: ${m}`);
        });
      }
    }
  });
});

console.log(Array.from(new Set(issues)).join('\n'));
