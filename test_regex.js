const text = `Q41
Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Richtig
Erklärung:

Bài nghe dùng cụm từ "deutlich verbessern" (cải thiện rõ rệt), khớp hoàn toàn với "verbessern" trong đề.

Hier anhören (0:57)
Q42
Die Fans des FC Neustadt waren von dem Sieg ihrer Mannschafft überrascht.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Falsch
Erklärung:

Đề nói fan "bất ngờ" (überrascht), nhưng bài nghe khẳng định "keine große Überraschung" (không có gì bất ngờ lớn) vì đội bóng là ứng cử viên số 1 (Favorit).

Hier anhören (1:42)`;

// Moodle full block regex for listening T1/T3 (which has R/F)
const regex = /(?:Q(?:41|42|43|44|45|46|54|55|56|57|58|59|60)|(?:41|42|43|44|45|46|54|55|56|57|58|59|60)\.)\s*\n([^]*?)\n+Ihre Antwort:[^]*?Richtige Antwort:\s*\n(Richtig|Falsch|R|F)\s*\n+Erklärung:\s*\n([^]*?)(?=\n+Hier anhören|\n+Q\d{2}|\n+\d{2}\.|$)/gi;

let match;
while ((match = regex.exec(text)) !== null) {
  console.log("===========================");
  console.log("Q Text: ", match[1].trim());
  console.log("Answer: ", match[2].trim());
  console.log("Expl:   ", match[3].trim());
}
