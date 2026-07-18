window.autoFixUmlautsCurrentTest = function(type = 'reading') {
  let test;
  if (type === 'reading') test = db.reading[currentAdminTestIndex];
  else if (type === 'listening') test = db.listening[currentAdminListeningTestIndex];
  if (!test) return;
  let content = JSON.stringify(test);
  const original = content;
  const reps = [
    { p: /\bfur\b/g, r: 'für' },
    { p: /\bFur\b/g, r: 'Für' },
    { p: /\bFUR\b/g, r: 'FÜR' },
    { p: /\buber\b/g, r: 'über' },
    { p: /\bUber\b/g, r: 'Über' },
    { p: /\bUBER\b/g, r: 'ÜBER' },
    { p: /\bSchuler(n|innen)?\b/gi, r: m => m.replace('u','ü').replace('U','Ü') },
    { p: /\bwahrend\b/gi, r: m => m.replace('a','ä').replace('A','Ä') },
    { p: /\bManner(n)?\b/gi, r: m => m.replace('a','ä').replace('A','Ä') },
    { p: /\bwahlen\b/gi, r: m => m.replace('a','ä').replace('A','Ä') },
    { p: /\bBuro(s)?\b/gi, r: m => m.replace('u','ü').replace('U','Ü') },
    { p: /\bdaruber\b/gi, r: m => m.replace('u','ü').replace('U','Ü') },
    { p: /\bnaturlich\b/gi, r: m => m.replace('u','ü').replace('U','Ü') },
    { p: /\bBEMUHEN\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bLOSUNGEN\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bDURFEN\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bMUSSEN\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bKONNEN\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bKONNTE(N)?\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bOSTERREICH\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bHAUFIG\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bKOLN\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bZURUCK\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bGROSSER\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bEINFUHREN\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bKUHLTRUHE\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bBADER\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bKAUFER\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bVERKAUFER\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bAUSSERST\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bGEBAUDE(N)?\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bMOCHTE(N)?\b/gi, r: m => m.replace('O','Ö').replace('o','ö') },
    { p: /\bGEFALLT\b/gi, r: m => m.replace('A','Ä').replace('a','ä') },
    { p: /\bBEGRUSSEN\b/gi, r: m => m.replace('U','Ü').replace('u','ü') },
    { p: /\bLOSUNG\b/gi, r: m => m.replace('O','Ö').replace('o','ö') }
  ];
  reps.forEach(r => { content = content.replace(r.p, r.r); });
  if (content !== original) {
    if (type === 'reading') {
      db.reading[currentAdminTestIndex] = JSON.parse(content);
      saveDB();
      renderAdminReadTab();
      renderAdminSidebar();
      alert('Đã tự động sửa các chữ thiếu dấu Umlaut trong đề này!');
    } else if (type === 'listening') {
      db.listening[currentAdminListeningTestIndex] = JSON.parse(content);
      saveDB();
      renderAdminListeningTab();
      renderAdminListeningSidebar();
      alert('Đã tự động sửa các chữ thiếu dấu Umlaut trong đề này!');
    }
  } else {
    alert('Không tìm thấy chữ nào cần sửa trong đề này!');
  }
};
