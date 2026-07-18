const regex = /(?:Q\d{2}|\d{2}\.)\s*\n([\s\S]*?)\n+Ihre Antwort:[\s\S]*?Richtige Antwort:\s*\n(Richtig|Falsch|R|F|[\s\S]*?)\s*(?:\n+Erklärung:\s*\n([\s\S]*?))?(?=\n+Hier anhören|\n+Q\d{2}|\n+\d{2}\.|$)/gi;

const testCases = [
`Q41
Der Bierkonsum steigt um 10%.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Richtig
Erklärung:
Bla bla
Hier anhören (0:57)`,

`Q41
Der Bierkonsum steigt um 10%.
Ihre Antwort: Falsch
Richtige Antwort: Falsch
Erklärung: Bla bla`,

`Q41
Der Bierkonsum steigt um 10%.

Ihre Antwort:
Falsch
Richtige Antwort:
Falsch`
];

testCases.forEach((text, i) => {
  console.log("--- TEST", i, "---");
  console.log("Includes Richtige Antwort?", text.includes('Richtige Antwort'));
  let match = regex.exec(text);
  if (match) {
    console.log("MATCH FOUND!");
    console.log("Q:", match[1]);
    console.log("Ans:", match[2]);
    console.log("Expl:", match[3]);
  } else {
    console.log("NO MATCH!");
  }
  regex.lastIndex = 0; // reset
});
