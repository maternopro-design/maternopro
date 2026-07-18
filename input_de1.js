const fs = require('fs');
let content = fs.readFileSync('reading_texts.js', 'utf8');
let data = JSON.parse(content.replace('window.allReadingTexts = ', '').replace(/;$/, ''));

const de1 = data.find(t => t.name === 'Đề 1');
if (!de1) { console.log('Không tìm thấy Đề 1!'); process.exit(1); }

// TEIL 1
de1.teil1 = {
  headings: [
    { letter: 'A', text: 'Ausstellung über Finanzmetropole' },
    { letter: 'B', text: 'Fachinformationen für Finanzprofis' },
    { letter: 'C', text: 'Finanz-ABC für Anfänger' },
    { letter: 'D', text: 'Interessante Tätigkeit wichtiger als hohes Gehalt' },
    { letter: 'E', text: 'Lehrreicher Rundgang zu Finanzwissen' },
    { letter: 'F', text: 'Sammelgefäße als Ausstellungsobjekte' },
    { letter: 'G', text: 'Sparbüchsen - Nun wieder in Mode' },
    { letter: 'H', text: 'Vertrauen zeigt sich auf dem Konto' },
    { letter: 'I', text: 'Wie Kinder den Umgang mit Geld lernen' },
    { letter: 'J', text: 'Wie man Kinder zum Sparen motiviert' }
  ],
  texts: [
    { id: 1, text: 'Spardosen sind Sammelbehälter, Dekoration oder Kinderspielzeug – und zwar seit Jahrhunderten. Und obwohl bargeldloses Bezahlen immer mehr in Mode kommt, sind sie bis heute nicht aus den Kinderzimmern verschwunden. Das Spardosen-Museum im Haus Kemnade zeigt 1.200 Exemplare aus dem Mittelalter bis zum 20. Jahrhundert. Daneben widmet sich das Museum der Geschichte des Geldes. In zwei Räumen sind Münzen, Scheine und weitere Tauschmittel aus der ganzen Welt ausgestellt. Die Sammlung von Spardosen reicht von schweren Gefäßen aus Eisen über kunstvoll verzierte Truhen und Kutschen bis zu Mickey-Mäusen aus Blech. "Um 1900 erlebten Spardosen einen Boom", erzählt Museumsleiter Jürgen Stollmann. In vielen Häusern hatten sie zwar nur als hübsche Dekoration hergehalten, doch immer seien sie auch ein Spiegel der Gesellschaft. Zehn Jahre später schon gibt es das Museum, das interessante Einblicke in die Geldgeschichte bietet. Jährlich lockt es über 13.000 Besucher an.' },
    { id: 2, text: 'Wer beim leisen Klirren von Geldstücken ein prickelndes Gefühl verspürt, ist in der neuen Sonderausstellung "Die Sprache des Geldes" im Berliner Museum für Kommunikation richtig. Auf ungewöhnliche Weise nähert sich diese kleine Schau dem Geld als Dreh- und Angelpunkt einer globalisierten Welt. Im Museum machen die Besucher auf 450 Quadratmeter eine Tour durch eine fiktive Stadt. Auf dem "Marktplatz" erfahren sie, warum sich zuerst Münzen und viel später Scheine als Zahlungsmittel durchsetzen. Bei den Stationen "Bank" und "Börse" lernen sie das Prinzip kennen, das in guten Zeiten dahintersteht: Vertrauen in den Wert des Geldes. In der Station "Einkaufszentrum" geht es dagegen um die heutige Konsumgesellschaft. Entlohnt werden die Besucher für ihren Ausstellungsbesuch natürlich auch. Wer sein neues Wissen in einem Computerquiz nachweisen kann, erhält einen Spielgeld-Schein mit dem eigenen Konterfei. Macht Geld denn nun glücklich? "Nur für einen kurzen Moment", versichert Kurator Gregor Isenbrot. "Wenn der Rausch vorbei ist, will der Mensch noch mehr. Und zwar mehr Geld".' },
    { id: 3, text: 'Versteh\' ich ja doch nicht; ist mir zu kompliziert". So oder ähnlich lauten die üblichen Vorbehalte, wenn es darum geht, zu begreifen, wie Wirtschaft funktioniert und der Finanzsektor arbeitet. Der englische Journalist John Lanchester nimmt alle jene neugierigen Laien, denen die Fachsprache rund ums Geld bislang verwirrend erschien, bei der Hand. So schildert er in seinem Buch "Die Sprache des Geldes und warum wir sie nicht verstehen", wie er sich als Außenseiter dem Thema genähert hat. Geld habe eine eigene Sprache, erklärt Lanchester. Wer diese nicht lerne, könne nicht mitreden. Und so erläutert er im ersten Teil seines Buches die Besonderheiten dieser Sprache. Den zweiten Teil bildet ein alphabetisches Glossar, in dem Fachwörter und Namens in kurzen Artikeln erläutert werden. Anschaulich erklärt Lanchester etwa, was Derivate sind und wie man antizyklisch handelt. Das Buch ist anekdotenreich und gut lesbar, seine Lektüre zu empfehlen. Denn Lanchester ermöglicht es dem interessierten Wirtschaftslaien, mitreden zu können.' },
    { id: 4, text: 'Eine neue Untersuchung des Instituts der deutschen Wirtschaft bestätigt eine Tatsache, über die sich Sozialwissenschaftler und Psychologen schon lange einig sind: Die Höhe des Einkommens allein macht nicht glücklich. Wie zufrieden ein Arbeitnehmer ist, hängt demnach nicht in erster Linie vom Lohn oder der Tätigkeit ab, sonder davon, wie emotional stabil, belastbar und selbstsicher er ist. Für die Studie hat die Ökonomin Mara Ewers die Zusammenhänge zwischen der Lebens- und Arbeitszufriedenheit, dem Bruttostundenlohn, der Anzahl der Bildungsjahre und dem Gesundheitszustand untersucht. Sie fand heraus dass 53 Prozent der Bundesbüger, die sich emotional als besonders stabil bezeichnen, auch im Job sehr zufrieden sind. Die Fähigkeit, anderen Menschen zu vertrauen, steigere die Lebens und Arbeitsunzufriedenheit. Die Untersuchung lege die These nahe, dass Einkommensunterschiede auch eine Folge der Persönlichkeitsentwicklung sein können, so Ewers. Wer misstrauisch sei, verwende mehr Zeit und Kraft für Kontrollen und sei daher weniger produktiv, sagt sie. Und wer weniger produktiv sei, verdiene auf Dauer auch weniger.' },
    { id: 5, text: 'Über Geld sprechen viele Deutsche nicht gerne - selbst Verwandte oder Lebenspartner haben oft keine Ahnung, was sich auf den Konten ihrer Nächsten tut. Dabei spielt Geld bei den meisten Entscheidungen eine wichtige Rolle, und zwar auch in der Familie. Es ist heutzutage zum Glück üblich, dass Kinder spielerisch ein Gefühl für Geld entwickeln: Zwei Drittel der Vier - bis Fünfjährigen bekommen mittlerweile Taschengeld. Doch die Offenheit von Eltern sollte noch weiter gehen: Denn die Erziehung prägt entscheidend das spätere Verhältnis der Kinder zu Geld, wie Studien belegen. Vorteilhaftes Finanzverhalten nennen Forscher das und setzen es mit der Fähigkeit gleich, Geld sinnvoll einzuteilen oder zu sparen. Natürlich ist das Thema Geld für Eltern ein Balanceakt. Doch letztlich lohnt sich der Mut zu Vertrauen und wohldosierter Offenheit, denn wo Offenheit herrscht, kann Verständnis wachsen. Vielleicht sieht dann auch ein Elfjähriger ein, dass die Spielekonsole für viele hundert Euro zwar toll, aber trotzdem nicht nötig ist.' }
  ]
};

// TEIL 2
de1.teil2 = {
  text: `Der Fluch der Informationszeitalters/ Alles schon vergessen?/ Der Kampf mit der Informationsflut

Melanie Hoffmann ist Gedächtnistrainerin. Seit fast zehn Jahren bietet sie nun schon Seminare an Volkshochschulen, in Altenheimen, in Banken und Industriebetrieben an, in denen die Seminarteilnehmer lernen sollen, wie sie Informationen besser im Gedächtnis behalten.

Suma Hartmann ist 30 Jahre alt, Bürokauffrau und eine von Melanie Hoffmanns Seminarteilnehmerinnen: „An meinem Arbeitsplatz bekomme ich ständig Massen von neuen Informationen: Texte, die zu lesen sind, Termine, Anrufe, Anfragen von Kunden, Kurzinfos von Kollegen. Diese Informationsflut zu bewältigen und möglichst nichts zu vergessen, ist fast ausgeschlossen", so Hartmann. Wie ihr geht es vielen Menschen in unserer Informationsgesellschaft – und das quer durch alle Altersstufen: vom Schüler bis zum Rentner. Sie fühlen sich den Anforderungen an ihr Gedächtnis nicht mehr gewachsen und daher besuchen sie Trainingskurse wie die von Melanie Hoffmann.

Während jeder Sekunde, die Suma Hartmann im Trainingsseminar, am Arbeitsplatz oder zu Hause verbringt, nimmt sie über ihre „Eingangskanäle" – die Augen, die Ohren, die Nase, den Mund, die Haut – um die zwei Millionen kleinste Informationen unbewusst auf. Jede kleinste Schwankung in der Licht- oder Farbintensität, Formen und Farben, Licht und Schatten, alle nur erdenklichen Geräusche – von der Stimme der Seminarleiterin oder Kollegin bis zum draußen vorbeifahrenden Motorrad –, verschiedenste Gerüche – vom Schweiß bis zum teuren Parfüm –, das Kratzen des Pullovers auf der Haut: All dies nimmt sie unbewusst wahr. Würde sie sich all diese Informationen bewusst merken wollen, wäre – wenn man die Sprache der Computerwelt zu Hilfe nimmt – innerhalb kürzester Zeit der Speicher voll.

Damit dies nicht passiert, vergisst man fast alle Informationseinheiten innerhalb der nächsten 20 Sekunden wieder – und schafft damit Platz für neue Informationen. Erst nach etwa 20 Minuten behalten wir etwas auf lange Zeit. Dann haben die Nervenzellen im Gehirn eine neue Verbindung hergestellt, eine Synapse gebildet – und wir behalten etwas, statt es gleich wieder zu vergessen.

Die Trainerin Melanie Hoffmann sagt: „Starke Sinneseindrücke, die mit Emotionen behaftet sind, behält man ebenso wie das, was interessant ist oder lebensnotwendig. Ein Kind, das einmal eine heiße Herdplatte angefasst hat, vergisst nie mehr, was ‚heiß' bedeutet. Ein Hobbyastronom, dem seine Freizeitbeschäftigung großen Spaß bereitet, kennt im Nu alle möglichen Namen von Sternen. Und ich habe noch keinen Seminarteilnehmer gehabt, der sich nicht mehr daran erinnern könnte, was am 11. September 2001 in New York passiert ist."

In unserer heutigen Informationsgesellschaft ist es wichtig, die auf uns einströmende Informationsflut zu bündeln. Daten und Begriffe zu gruppieren oder an Bildern oder Gegenständen festzumachen und sich so „Eselsbrücken" zu bauen, die dabei helfen, mehr im Gedächtnis zu behalten.

Suma Hartmann „sortiert" jetzt im Geiste alle wichtigen Informationen in bestimmte Schubladen ihres Aktenschrankes in ihrem Büro: „Ich habe mir Zahlensymbole ausgedacht, mit denen ich die neuen Informationen bildlich verknüpfe: Die Eins wird zur Kerze, die Zwei zum Schwan usw. Wenn ich nun nicht vergessen möchte, um zwei Uhr eine bestimmte Konferenz vorzubereiten, denke ich mir meine Konferenzmappe im Schnabel des Schwans. Und es funktioniert: Ich vergesse viel weniger."`,
  questions: [
    { num: 6, question: 'Melanie Hoffmanns Seminare besuchen', options: { A: 'ausschließlich Frauen, die im Büro arbeiten', B: 'junge und alte Menschen gleichermaßen', C: 'überwiegend alte Menschen' } },
    { num: 7, question: 'Die Teilnehmer besuchen Frau Hoffmanns Seminar, weil sie', options: { A: 'das Gefühl haben, dass ihr Gedächtnis schlechter wird', B: 'immer mehr vergessen', C: 'sich von den vielen Informationen überfordert fühlen' } },
    { num: 8, question: 'Jeder Mensch', options: { A: 'kann sich alle erdenklichen Geräusche und Gerüche merken', B: 'kann über einen Zeitraum von 20 Minuten alles behalten', C: 'vergisst die meisten Informationen innerhalb kürzester Zeit' } },
    { num: 9, question: 'Besonders gut kann man sich', options: { A: 'als Kind etwas merken', B: 'an Daten und Begriffe erinnern', C: 'emotional aufgeladene Situationen merken' } },
    { num: 10, question: 'Suma Hartmann', options: { A: 'lehrt andere, wie man sich "Eselsbrücken" ausdenkt', B: 'verbindet Informationen mit Bildern', C: 'verwendet für ihre Aktenablage nur Tiersymbole' } }
  ]
};

// TEIL 3
de1.teil3 = {
  situations: [
    { id: 11, desc: 'Ein Bekannter sucht eine Haushaltshilfe, die manchmal im Garten hilft.' },
    { id: 12, desc: 'Eine Bekannte möchte lernen, wie man Schaufenster gestaltet.' },
    { id: 13, desc: 'Eine Freundin möchte eine besondere Party für ihre siebenjährige Tochter organisieren.' },
    { id: 14, desc: 'Eine Freundin möchte einmal einen Tag lang in einer Bäckerei arbeiten.' },
    { id: 15, desc: 'Ihr Neffe liest gerne und möchte sein Hobby zu seinem Beruf machen.' },
    { id: 16, desc: 'Ihre Mutter braucht jemanden, der im Haushalt hilft und manchmal kocht.' },
    { id: 17, desc: 'Ihre Nachbarin sucht eine Stelle als Haushaltshilfe.' },
    { id: 18, desc: 'Ihre Tochter mag Cupcakes. Sie sucht nach einem Buch mit leckeren Rezepten.' },
    { id: 19, desc: 'Sie möchten für Ihren Sohn eine Geburtstagstorte bestellen. Ihr Sohn verträgt keine Laktose.' },
    { id: 20, desc: 'Sie möchten in Ihrem Haushalt weniger Plastik verwenden.' }
  ],
  texts: [
    { letter: 'a', text: 'Wenn Milchprodukte Bauchweh bereiten - viele Erwachsene, auch Kinder, kennen das Problem: Ein Stück Torte, eine Kugel Eis oder ein Glas Milch, und bald machen sich Bauchschmerzen und Verdauungsprobleme bemerkbar. Das kann ein Zeichen für Laktoseintoleranz sein.' },
    { letter: 'b', text: 'Die Produktion und der Verbrauch von Kunststoff steigen weltweit offenbar unaufhaltsam an. Kunststoff ist allgegenwärtig, und wir können uns ein Leben ohne ihn kaum mehr vorstellen. Dabei ist es gar nicht so schwer, den Verpackungsmüll gering zu halten.' },
    { letter: 'c', text: 'BÄCKEREI - KONDITOREI BROTECKE. Bei uns gibt es einige Ausbildungsmöglichkeiten: Bäcker, Konditor, Verkauf, Büro. Du interessierst dich für einen dieser Berufe und hast Freude an Backwaren aller Art? Dann bist du in der BROTECKE genau richtig!' },
    { letter: 'd', text: 'Brauchen Sie Unterstützung im Haushalt? Dann schreiben Sie mir. Gerne helfe ich Ihnen. Ich arbeite schnell und gründlich, bin ehrlich und zuverlässig mit langjähriger Erfahrung in Privathaushalten. Zusätzlich zu normalen Hausarbeiten wie Saugen, Putzen und Bügeln, erledige ich gerne auch Gartenarbeit.' },
    { letter: 'e', text: 'Zum 8. Mal findet dieses Jahr im September wieder die Nacht des Genusses statt. In diesem Rahmen öffnet auch die Bäckerei Holzofen wieder ihre Türen für Groß und Klein. Bäckermeister Carlo Menzinger führt durch die Backstube und beantwortet gerne Ihre Fragen. Führungen um 18:00 und 20:00 Uhr, begrenzte Teilnehmerzahl.' },
    { letter: 'f', text: 'Intensivkurs zur Dekorateurin/zum Dekorateur. Sie lernen innerhalb von nur vier Wochen, wie man Produkte wirkungsvoll und ansprechend präsentiert. Kursinhalte: Grundzüge der Dekoration, Werkstoffe, Arbeitstechniken, Drapieren, Bespannen und Tapezieren, Licht und Farben, Schriften, Preisauszeichnung.' },
    { letter: 'g', text: 'Rebecca, 38. Ich bin auf der Suche nach Familien, die Unterstützung im Haushalt brauchen. Ich biete: Aufräumen, Müll wegbringen, Boden reinigen, Staub wischen, Fenster putzen, Putzen von Bad & WC, Küche reinigen, Wäsche waschen und bügeln, Mahlzeiten zubereiten, Kinderbetreuung.' },
    { letter: 'h', text: 'Das duale Berufsausbildungssystem in Deutschland kombiniert praktische und theoretische Lehrinhalte. In der dualen Berufsausbildung gibt es jedes Jahr rund 600.000 Ausbildungsplätze in mehr als 340 anerkannten Ausbildungsberufen.' },
    { letter: 'i', text: 'TORTEN UND MEHR… Wir backen nicht nur Torten, sondern bieten auch Kurse rund ums Thema Backen an. Ganz aktuell: Cupcakes. In Gruppen von 5 bis max. 10 Personen lernen die Kinder (6–10 Jahre) Cupcakes backen und dekorieren. Ideal für Geburtstagsfeiern oder ähnliche Anlässe.' },
    { letter: 'j', text: 'LIZZIS BACKSTUBE. Nach abgeschlossener Patisserieausbildung habe ich mir meinen Herzenswunsch erfüllt. Besondere Wünsche wie gluten- oder laktosefreie Teige und Cremes sind kein Problem. Ich biete auch Torten ganz ohne tierische Produkte an.' },
    { letter: 'k', text: 'Während der dreijährigen Ausbildung zur Buchhändlerin bzw. zum Buchhändler lernst du, unsere Sortimente ansprechend im Schaufenster und im Verkaufsraum zu präsentieren. Wenn Bücher deine Welt sind, dann bist du hier richtig!' },
    { letter: 'l', text: 'Die Hausratversicherung bietet Ihnen Schutz vor dem Verlust oder einer Beschädigung Ihres Eigentums – zum Beispiel nach einem Einbruch oder einem Wasserschaden. Darüber hinaus können Sie auch für sich und Ihre Familie eine Haftpflichtversicherung bei uns abschließen.' }
  ]
};

// TEIL 4 - Sprachbaustein Teil 1
de1.teil4 = {
  text: `Hallo Maria,
Bevor wieder der Arbeitsalltag beginnt, schicke ich dir (21)_____ rasch einige Zeilen, um dir von unserem Wochenende zu erzählen. Es ist so schade, dass du (22)_____ deiner Grippe nicht dabei sein konntest! Wir haben dich alle sehr vermisst.
(23)____ auf Mikro sind alle mit dem Zug angereist, und wir haben uns schon am Bahnhof getroffen. Von dort sind wir dann los in die Ferienwohnung, die Lilo für uns reserviert hatte.
Nachdem wir unser Gepäck abgestellt (24)_____, haben wir gleich einen Rundgang durch den Ort gemacht. Lilo wusste viel Interessantes zu erzählen. Sie lebt ja schon einige Jahre dort und hat sich (25)_____ ausgezeichnete Fremdenführerin erwiesen. Besonders beeindruckt hat uns der wunderschöne Park, in dem gerade die Rhododendren blühten. Eine wahre Pracht. Das hätte dir auch gefallen! Später sind wir zum Amseesee gewandert, den man in kurzer Zeit vom Ort aus erreicht. Dort haben wir eine Bootsfahrt über den See gemacht. Vom Boot aus hat man einen wunderbaren Blick auf die beeindruckende Felsenlandschaft. Am Abend stand dann die Felsenbühne (26)_____ dem Programm. Die Wanderung am nächsten Tag war (27)_____ schön anstrengend, aber wunderbar.
(28)_____ Alle ziemlich erschöpft waren, haben wir nach dem Abendessen noch lange zusammen gesessen und über alte Zeiten geplaudert. Am nächsten Morgen, nach unserem gemeinsamen Frühstück, waren uns einig, dass wir bald wieder zusammen einen Ausflug machen (29)_____. Und nächste Mal musst du unbedingt dabei sein. Im Anhang schicke ich dir einige. Wie du siehst, war unser Treffen wirklich lustig! Ich hoffe, dass es dir (30)______ schon wieder besser geht.
Liebe Grüße von uns allen
Cem`,
  options: [
    { num: 21, options: { A: 'momentan', B: 'noch', C: 'weiterhin' } },
    { num: 22, options: { A: 'deswegen', B: 'wegen', C: 'weil' } },
    { num: 23, options: { A: 'abgesehen', B: 'außer', C: 'bis' } },
    { num: 24, options: { A: 'haben', B: 'hatten', C: 'hätten' } },
    { num: 25, options: { A: 'als', B: 'für', C: 'zur' } },
    { num: 26, options: { A: 'auf', B: 'für', C: 'zur' } },
    { num: 27, options: { A: 'absolut', B: 'ganz', C: 'vollkommen' } },
    { num: 28, options: { A: 'obwohl', B: 'trotzdem', C: 'ungeachtet' } },
    { num: 29, options: { A: 'durften', B: 'konnten', C: 'sollten' } },
    { num: 30, options: { A: 'inzwischen', B: 'während', C: 'zwischen' } }
  ]
};

// TEIL 5 - Sprachbaustein Teil 2
de1.teil5 = {
  text: `Ausbildung mit über 30

Die gelernte Krankenschwester Jaqueline Delgado drückt mit 38 Jahren noch einmal die Schulbank, __(31)__ sie hat sich für einen beruflichen Neustart entschieden. Da ihr früherer Beruf ihr keinen Spaß mehr machte, begann sie eine Berufsausbildung bei der Polizei. Ihr Ziel: Sie __(32)__ in den Streifendienst gehen.

Mit über 30 noch einmal einen ganz neuen Job zu erlernen - lange Zeit war das kaum möglich. Arbeitgeber suchten nur junge Berufseinsteiger. __(33)__ es heute in vielen Branchen aber an Nachwuchs fehlt, geben sie öfter auch Älteren eine __(34)__.

Thomas Neuendorfer, der stellvertretende Sprecher der Polizei Berlin, erklärt, __(35)__ sein Arbeitgeber gerne Ältere ausbildet: "Sie haben in ihrem Berufsleben Erfahrungen gesammelt, die der Polizei und auch den Bürgern der Stadt zu Gute kommen". Sie seien häufig emotional reifer, außerdem bereit, Verantwortung zu __(36)__, und motiviert, die Ausbildung erfolgreich abzuschließen. Zudem __(37)__ sie die Jüngeren unterstützen und ihnen als Vorbild dienen. Davon profitierten dann auch die Arbeitgeber. Gegen die Einstellung von Alteren spreche nur, dass sie dem Unternehmen kürzer zur __(38)__ stehen. __(39)__ haben ältere Azubis in vielen Bereichen Möglichkeiten: in kaufmännischen oder in gewerblich-technischen Berufen, im Gesundheitswesen oder vor allem in der Gastronomie.

Wenn das Azubi-Gehalt nicht für den Lebensunterhalt reicht, hilft die Arbeitsagentur. Der Betrag wird dabei nicht nach dem Alter festgelegt, __(40)__ es wird der individuelle, konkrete Bedarf ermittelt.`,
  wordbank: [
    { letter: 'A', word: 'AUSWAHL' },
    { letter: 'B', word: 'CHANCE' },
    { letter: 'C', word: 'DA' },
    { letter: 'D', word: 'DAGEGEN' },
    { letter: 'E', word: 'DENN' },
    { letter: 'F', word: 'DURFTEN' },
    { letter: 'G', word: 'KÖNNTEN' },
    { letter: 'H', word: 'MÖCHTE' },
    { letter: 'I', word: 'SOLLTE' },
    { letter: 'J', word: 'SONDERN' },
    { letter: 'K', word: 'TROTZDEM' },
    { letter: 'L', word: 'ÜBERNEHMEN' },
    { letter: 'M', word: 'VERFÜGUNG' },
    { letter: 'N', word: 'WARUM' },
    { letter: 'O', word: 'ZIEHEN' }
  ]
};

// ANSWERS (from screenshot earlier)
de1.answers = {
  1: 'F', 2: 'E', 3: 'C', 4: 'H', 5: 'I',
  6: 'B', 7: 'C', 8: 'C', 9: 'C', 10: 'B',
  11: 'D', 12: 'F', 13: 'I', 14: 'C', 15: 'K', 16: 'G', 17: 'X', 18: 'X', 19: 'J', 20: 'B',
  21: 'B', 22: 'B', 23: 'B', 24: 'B', 25: 'A', 26: 'A', 27: 'B', 28: 'A', 29: 'C', 30: 'A',
  31: 'E', 32: 'H', 33: 'C', 34: 'B', 35: 'N', 36: 'L', 37: 'G', 38: 'M', 39: 'K', 40: 'J'
};

const newContent = 'window.allReadingTexts = ' + JSON.stringify(data, null, 2) + ';';
fs.writeFileSync('reading_texts.js', newContent, 'utf8');
console.log('Đã nhập đầy đủ nội dung Đề 1 (Ausstellung)!');
console.log('- Teil 1: 5 văn bản + 10 tiêu đề');
console.log('- Teil 2: đoạn văn + 5 câu hỏi (6-10)');
console.log('- Teil 3: 10 tình huống + 12 văn bản (a-l)');
console.log('- Teil 4: thư + 10 câu điền (21-30)');
console.log('- Teil 5: đoạn văn + 15 từ ngân hàng (31-40)');
console.log('- Đáp án: 1-40 đầy đủ');
