// Script xuất dữ liệu localStorage ra file JSON để nhúng vào web
const keys = [
  'maternopro_listening',
  'maternopro_reading', 
  'maternopro_writing',
  'maternopro_speaking',
  'maternopro_grammar',
  'maternopro_vocab'
];

const data = {};
keys.forEach(k => {
  const val = localStorage.getItem(k);
  if (val) {
    try { data[k] = JSON.parse(val); } catch(e) { data[k] = val; }
  }
});

// Tạo file download
const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'db_export.json';
a.click();
console.log("Đã xuất dữ liệu! File db_export.json đã được tải về.");
