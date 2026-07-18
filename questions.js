// Gán trực tiếp vào window để đảm bảo các file JS khác luôn đọc được trong mọi môi trường trình duyệt
window.defaultListening = [
  {
    id: 1,
    title: "Chủ đề: Bảo vệ môi trường (Umweltschutz)",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    question: "Was ist laut dem Sprecher das Hauptproblem für die Umwelt?",
    options: [
      "Der Plastikmüll in den Ozeanen (Rác thải nhựa ở đại dương)",
      "Die Luftverschmutzung durch Autos (Ô nhiễm không khí do ô tô)",
      "Der hohe Stromverbrauch (Mức tiêu thụ điện cao)",
      "Der Wassermangel (Thiếu nước)"
    ],
    answer: 0,
    explanation: "Trong bài nói nghe được, người nói nhấn mạnh rằng rác thải nhựa ở đại dương là vấn đề nghiêm trọng nhất hiện nay."
  }
];

window.defaultReading = [
  {
    id: 1,
    title: "Bài đọc: Tương lai của việc làm từ xa (Homeoffice)",
    text: "Viele Unternehmen bieten heute flexible Arbeitszeitmodelle an. Homeoffice hat sich in den letzten Jahren etabliert. Mitarbeiter sparen Zeit für den Arbeitsweg, klagen jedoch manchmal über Einsamkeit. Experten meinen, dass eine Mischung aus Büro und Homeoffice am besten ist.",
    question: "Was ist ein Vorteil und Nachteil von Homeoffice laut dem Text?",
    options: [
      "Vorteil: Zeitersparnis / Nachteil: Einsamkeit (Tiết kiệm thời gian / Cô đơn)",
      "Vorteil: Mehr Geld / Nachteil: Keine Freizeit (Nhiều tiền hơn / Không có thời gian rảnh)",
      "Vorteil: Nette Kollegen / Nachteil: Stress (Đồng nghiệp tốt / Căng thẳng)",
      "Vorteil: Kostenloses Essen / Nachteil: Müdigkeit (Ăn miễn phí / Mệt mỏi)"
    ],
    answer: 0,
    explanation: "Đoạn văn có ghi rõ 'sparen Zeit' (tiết kiệm thời gian) và 'klagen jedoch manchmal über Einsamkeit' (nhưng đôi khi than phiền về sự cô đơn)."
  }
];

window.defaultWriting = [
  {
    id: 1,
    title: "Đề viết thư: Beschwerdebrief (Thư khiếu nại)",
    prompt: "Sie haben einen Laptop im Internet bestellt, aber er kam beschädigt an. Schreiben Sie eine E-Mail an den Kundenservice.",
    tips: [
      "Nêu lý do viết thư (Grund des Schreibens).",
      "Mô tả tình trạng lỗi của laptop.",
      "Đưa ra giải pháp đề xuất (đổi máy mới hoặc hoàn tiền).",
      "Chào hỏi và ký tên trang trọng (Mit freundlichen Grüßen)."
    ]
  }
];

window.defaultSpeaking = [
  {
    id: 1,
    title: "Sprechen Teil 1: Präsentation (Thuyết trình)",
    topic: "Chủ đề: Soziale Netzwerke (Mạng xã hội)",
    prompt: "Thuyết trình về chủ đề Soziale Netzwerke. Nêu rõ: Ý kiến cá nhân, Lợi ích, Tác hại, Tình hình sử dụng ở nước bạn và trải nghiệm bản thân.",
    tips: [
      "Einleitung: Heute möchte ich Ihnen ein Thema präsentieren. Mein Thema lautet 'Soziale Netzwerke'...",
      "Struktur: Bài thuyết trình gồm 4 phần: Trải nghiệm bản thân, Tình hình Việt Nam, Ưu khuyết điểm, Kết luận.",
      "Vorteile: Giúp liên lạc nhanh chóng, chia sẻ thông tin học tập.",
      "Nachteile: Dễ gây nghiện, thiếu tương tác thực tế bên ngoài.",
      "Schluss: Ich bedanke mich für Ihre Aufmerksamkeit. Haben Sie noch Fragen?"
    ]
  }
];

window.defaultGrammar = [
  {
    id: 1,
    title: "Ngữ pháp: Câu giả định Konjunktiv II",
    rule: "Konjunktiv II dùng để diễn tả mong muốn, giả định trái ngược thực tế hoặc lịch sự. Cấu trúc thường dùng: würde + Infinitiv hoặc dùng dạng đặc biệt (wäre, hätte).",
    question: "Welcher Satz ist im Konjunktiv II?",
    options: [
      "Wenn ich mehr Zeit hätte, würde ich Deutsch lernen. (Nếu có nhiều thời gian, tôi sẽ học tiếng Đức.)",
      "Ich lerne Deutsch, weil es mir gefällt. (Tôi học tiếng Đức vì thích.)",
      "Ich habe gestern Deutsch gelernt. (Hôm qua tôi đã học tiếng Đức.)",
      "Ich muss heute Deutsch lernen. (Hôm nay tôi phải học tiếng Đức.)"
    ],
    answer: 0,
    explanation: "Câu giả định 'hätte' (quá khứ giả định của haben) và 'würde ich... lernen' thể hiện mong muốn trái thực tế ở hiện tại."
  }
];

window.defaultVocabulary = [
  {
    id: 1,
    topic: "Umwelt (Môi trường)",
    word: "der Umweltschutz",
    meaning: "sự bảo vệ môi trường",
    example: "Umweltschutz geht uns alle an. (Bảo vệ môi trường liên quan đến tất cả chúng ta.)"
  },
  {
    id: 2,
    topic: "Beruf (Nghề nghiệp)",
    word: "die Aufstiegsmöglichkeit",
    meaning: "cơ hội thăng tiến",
    example: "In diesem Job gibt es gute Aufstiegsmöglichkeiten. (Công việc này có nhiều cơ hội thăng tiến tốt.)"
  },
  {
    id: 3,
    topic: "Gesundheit (Sức khỏe)",
    word: "die Vorbeugung",
    meaning: "sự phòng ngừa (bệnh tật)",
    example: "Vorbeugung ist besser als Heilung. (Phòng bệnh hơn chữa bệnh.)"
  }
];
