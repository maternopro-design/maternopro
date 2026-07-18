const regex = /(?:Q\d{2}|\d{2}\.)\s*([\s\S]*?)\s*Ihre Antwort:[\s\S]*?Richtige Antwort:\s*(Richtig|Falsch|R|F|[\s\S]*?)\s*(?:Erklärung:\s*([\s\S]*?))?(?=\s*Hier anhören|\s+Q\d{2}|\s+\d{2}\.|$)/gi;

const testCases = [
// 1. With newlines
`Q41
Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Richtig
Erklärung:

Bài nghe dùng cụm từ "deutlich verbessern".

Hier anhören (0:57)
Q42
Test 2
Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Falsch
Erklärung:
Exp 2`,

// 2. All on one line
`Q41 Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern. Ihre Antwort: (keine Antwort) Richtige Antwort: Richtig Erklärung: Bài nghe dùng cụm từ... Hier anhören (0:57) Q42 Test 2 Ihre Antwort: Falsch Richtige Antwort: Falsch Erklärung: Exp 2`
];

testCases.forEach((text, i) => {
  console.log("--- TEST", i, "---");
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log("MATCH FOUND!");
    console.log("Q:", match[1].trim());
    console.log("Ans:", match[2].trim());
    console.log("Expl:", match[3] ? match[3].trim() : '');
  }
});
