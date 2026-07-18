
// --- Real Gemini OCR & Question Extraction ---
async function callGeminiVision(file, prompt) {
  let apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    apiKey = prompt("🤖 AI cần API Key (miễn phí) để phân tích ảnh. Nhập API Key của bạn vào đây (chỉ nhập 1 lần):");
    if (!apiKey) return null;
    localStorage.setItem('gemini_api_key', apiKey.trim());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async function() {
      const base64data = reader.result.split(',')[1];
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: file.type || "image/jpeg", data: base64data } }
              ]
            }]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        let textRes = data.candidates[0].content.parts[0].text.trim();
        resolve(textRes);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file ảnh."));
    reader.readAsDataURL(file);
  });
}

window.handleLocalFieldAiPaste = async function(event, targetFieldId) {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      const targetElement = document.getElementById(targetFieldId);
      if (!targetElement) return;

      const originalPlaceholder = targetElement.placeholder;
      targetElement.placeholder = "🤖 AI đang kết nối & quét văn bản từ ảnh chụp... (Vui lòng đợi 5-10s)";
      targetElement.value = "";

      try {
        const prompt = "Trích xuất chính xác toàn bộ văn bản từ hình ảnh này. Giữ nguyên định dạng, xuống dòng, và các dấu câu. KHÔNG thêm bất kỳ bình luận nào, chỉ trả về văn bản được trích xuất.";
        const result = await callGeminiVision(file, prompt);
        if (result) {
          targetElement.value = result;
          targetElement.style.borderColor = '#10b981';
          targetElement.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
          setTimeout(() => {
            targetElement.style.borderColor = 'rgba(255,255,255,0.1)';
            targetElement.style.boxShadow = 'none';
          }, 2000);
        }
      } catch (err) {
        if (err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('exceeded') || err.message.includes('429')) {
          targetElement.placeholder = "🤖 Quá tải API. Đang tự động dùng AI Offline...";
          try {
            if (typeof Tesseract !== 'undefined') {
              const ret = await Tesseract.recognize(file, 'eng');
              targetElement.value = ret.data.text;
              targetElement.dispatchEvent(new Event('input', { bubbles: true }));
              targetElement.style.borderColor = '#f59e0b';
              targetElement.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
              setTimeout(() => {
                targetElement.style.borderColor = 'rgba(255,255,255,0.1)';
                targetElement.style.boxShadow = 'none';
              }, 2000);
            } else {
              targetElement.placeholder = "Lỗi: Chưa tải xong AI Offline.";
            }
          } catch (err2) {
            targetElement.placeholder = "Lỗi AI Offline: " + err2.message;
          }
        } else {
          targetElement.placeholder = "Lỗi AI OCR: " + err.message;
        }
      } finally {
        setTimeout(() => { targetElement.placeholder = originalPlaceholder; }, 4000);
      }
      break;
    }
  }
};

window.handleQuestionsAiPaste = async function(event, startQ, endQ, partName) {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      const inputEl = event.target;
      const originalPlaceholder = inputEl.placeholder;
      inputEl.placeholder = "🤖 AI đang quét câu hỏi từ ảnh...";
      inputEl.value = "";

      try {
        const prompt = `Trích xuất tất cả các câu hỏi trắc nghiệm và các lựa chọn A, B, C từ ảnh này. Có các câu hỏi từ ${startQ} đến ${endQ}. Trả về MỘT CHUỖI JSON DUY NHẤT ánh xạ từ số câu hỏi sang object { "question": "...", "A": "...", "B": "...", "C": "..." }. KHÔNG TRẢ VỀ BẤT KỲ VĂN BẢN NÀO KHÁC. Đảm bảo đúng định dạng JSON hợp lệ.`;
        let result = await callGeminiVision(file, prompt);
        if (result) {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) result = jsonMatch[0];
          const questionsObj = JSON.parse(result);
          
          for (let q = startQ; q <= endQ; q++) {
            if (questionsObj[q]) {
              const qText = document.getElementById(`admin-read-${partName}-qtext-${q}`);
              const qA = document.getElementById(`admin-read-${partName}-qopt-${q}-A`);
              const qB = document.getElementById(`admin-read-${partName}-qopt-${q}-B`);
              const qC = document.getElementById(`admin-read-${partName}-qopt-${q}-C`);
              
              if (qText) { qText.value = questionsObj[q].question || ''; qText.style.borderColor = '#10b981'; }
              if (qA) { qA.value = questionsObj[q].A || ''; qA.style.borderColor = '#10b981'; }
              if (qB) { qB.value = questionsObj[q].B || ''; qB.style.borderColor = '#10b981'; }
              if (qC) { qC.value = questionsObj[q].C || ''; qC.style.borderColor = '#10b981'; }
            }
          }
          
          // Flash input
          inputEl.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
          setTimeout(() => {
            inputEl.style.backgroundColor = 'rgba(0,0,0,0.3)';
            for (let q = startQ; q <= endQ; q++) {
              ['qtext', 'qopt'].forEach(type => {
                const els = document.querySelectorAll(`[id^="admin-read-${partName}-${type}-${q}"]`);
                els.forEach(el => el.style.borderColor = 'rgba(255,255,255,0.1)');
              });
            }
          }, 3000);
        }
      } catch (err) {
        if (err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('exceeded') || err.message.includes('429')) {
          inputEl.placeholder = "🤖 Quá tải API. Đang dán chữ thô...";
          try {
            if (typeof Tesseract !== 'undefined') {
              const ret = await Tesseract.recognize(file, 'eng');
              inputEl.value = ret.data.text;
              inputEl.dispatchEvent(new Event('input', { bubbles: true }));
              inputEl.style.borderColor = '#f59e0b';
              setTimeout(() => { inputEl.style.borderColor = 'rgba(255,255,255,0.1)'; }, 2000);
            }
          } catch(err2) {}
        } else {
          inputEl.placeholder = "Lỗi AI: " + err.message.substring(0, 50);
        }
      } finally {
        setTimeout(() => { inputEl.placeholder = originalPlaceholder; }, 4000);
      }
      break;
    }
  }
};
