const regex = /(?:Q\d{2}|\d{2}\.)\s*([\s\S]*?)\s*Ihre Antwort:[\s\S]*?Richtige Antwort:\s*(Richtig|Falsch|R|F|[\s\S]*?)\s*(?:Erklärung:\s*([\s\S]*?))?(?=\s*Hier anhören|\s+Q\d{2}|\s+\d{2}\.|$)/gi;

const text = `Q41
Der Bierkonsum steigt um 10%.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Falsch
Erklärung:

Bài nghe nói là "teurer wird" (trở nên đắt hơn), trong khi đề bài ghi là "Konsum steigt" (mức tiêu thụ tăng). Hai khái niệm này hoàn toàn khác nhau.

Hier anhören (1:20)
Q42
Deutsche Einkommen liegen im europäischen Vergleich nur im Mittelfeld.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Richtig
Erklärung:

Đứng thứ 10 tại Châu Âu và được mô tả là "không thuộc nhóm cuối bảng" (không thuộc Schlussliste) khớp với khái niệm "Mittelfeld" (nhóm giữa/trung bình).

Hier anhören (2:15)
Q43
Es ist ein Ende des Bahnstreiks in Sicht.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Falsch
Erklärung:

Bài nghe nhấn mạnh việc các bên không nhượng bộ và đang chuẩn bị cho các đợt đình công tiếp theo, vì vậy chưa có "hồi kết" (Ende in Sicht).

Hier anhören (3:15)
Q44
Es wird Gewalt von Fußballfans auch in Deutschland befürchtet.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Richtig
Erklärung:

Cụm từ "auch hierzulande" trong bài nghe chính là đồng nghĩa với "auch in Deutschland" trong đề bài.

Hier anhören (4:04)
Q45
Die Leopoldina soll internationale Akademie werden.

Ihre Antwort:
(keine Antwort)
Richtige Antwort:
Falsch
Erklärung:

Bài nghe nói nó sẽ là "Nationale Akademie" (Viện hàn lâm quốc gia) trong tương lai.

Hier anhören (4:40)`;

let match;
while ((match = regex.exec(text)) !== null) {
  console.log("MATCH FOUND!");
  console.log("Q:", match[1].trim());
  console.log("Ans:", match[2].trim());
  console.log("Expl:", match[3] ? match[3].trim() : '');
}
