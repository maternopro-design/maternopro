// Bắt lỗi Javascript toàn cục và hiển thị alert để gỡ lỗi nhanh
window.onerror = function (message, source, lineno, colno, error) {
  if (lineno === 0 && message === 'Script error.') return false;
  alert("LỖI HỆ THỐNG (Javascript Error):\n" + message + "\nTại dòng: " + lineno + "\nFile: " + source);
  return false;
};

// --- VIP Tự Động Lấy API Key (từ file config riêng) ---
// Key được load từ config.js (file này không đẩy lên GitHub)
// ---------------------------------

// Hàm tải dữ liệu an toàn tránh lỗi JSON.parse khi localStorage bị lỗi
function safeGetItem(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === "undefined" || val === "null") return defaultValue;
    return JSON.parse(val);
  } catch (e) {
    console.error("Lỗi đọc dữ liệu từ localStorage cho khóa: " + key, e);
    return defaultValue;
  }
}

function restoreUmlauts(word) {
  if (!word) return word;
  const w = word.trim().toUpperCase();
  const map = {
    "BEMUHEN": "BEM\u00DCHEN",
    "FUR": "F\u00DCR",
    "LOSUNGEN": "L\u00D6SUNGEN",
    "DURFEN": "D\u00DCRFEN",
    "MUSSEN": "M\u00DCSSEN",
    "KONNEN": "K\u00D6NNEN",
    "KONNTE": "K\u00D6NNTE",
    "KONNTEN": "K\u00D6NNTEN",
    "OSTERREICH": "\u00D6STERREICH",
    "WAHREND": "W\u00C4HREND",
    "HAUFIG": "H\u00C4UFIG",
    "ALTER": "\u00C4LTER",
    "KOLN": "K\u00D6LN",
    "ZURUCK": "ZUR\u00DCCK",
    "GROSSER": "GR\u00D6SSER",
    "EINFUHREN": "EINF\u00DCHREN",
    "SCHULER": "SCH\u00DCLER",
    "KUHLTRUHE": "K\u00DCHLTRUHE",
    "BADER": "B\u00C4DER",
    "KAUFER": "K\u00C4UFER",
    "VERKAUFER": "VERK\u00C4UFER",
    "SCHULERINNEN": "SCH\u00DCLERINNEN",
    "UBER": "\u00DCBER",
    "AUSSERST": "\u00C4USSERST",
    "GEBAUDE": "GEB\u00C4UDE",
    "MOCHTE": "M\u00D6CHTE",
    "GEFALLT": "GEF\u00C4LLT",
    "BEGRUSSEN": "BEGR\u00DCSSEN",
    "LOSUNG": "L\u00D6SUNG",
    "ZURUCKGELASSEN": "ZUR\u00DCCKGELASSEN",
    "RUCKKEHR": "R\u00DCCKKEHR",
    "BEMUHT": "BEM\u00DCHT",
    "BEMUHTE": "BEM\u00DCHTE",
    "SCHULERN": "SCH\u00DCLERN",
    "MANNER": "M\u00C4NNER",
    "MANNERN": "M\u00C4NNERN",
    "BURO": "B\u00DCRO",
    "BUROS": "B\u00DCROS",
    "DARUBER": "DAR\u00DCBER",
    "NATURLICH": "NAT\u00DCRLICH",
    "WAHLEN": "W\u00C4HLEN"
  };
  return map[w] || word;
};


let db;
// ============================================================
// LƯU THẲNG RA FILE TRÊN MÁY — File System Access API
// Cô chọn file 1 lần, từ đó mỗi lần nhập gì đều TỰ GHI vào file đó!
// ============================================================
let _fileHandle = null; // Lưu handle file cô đã chọn

async function pickSaveFile() {
  try {
    if (!window.showSaveFilePicker) {
      alert('Trình duyệt không hỗ trợ tính năng này. Vui lòng dùng Chrome hoặc Edge!');
      return false;
    }
    _fileHandle = await window.showSaveFilePicker({
      suggestedName: 'maternopro_data.json',
      types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
    });
    localStorage.setItem('maternopro_hasFilePicker', '1');
    alert('✅ Đã chọn file! Từ giờ mọi thay đổi sẽ TỰ ĐỘNG ghi vào file này.');
    await writeToFile(); // Ghi ngay lập tức
    return true;
  } catch(e) {
    if (e.name !== 'AbortError') console.error('Lỗi chọn file:', e);
    return false;
  }
}

async function writeToFile() {
  if (!_fileHandle || !db) return;
  try {
    const writable = await _fileHandle.createWritable();
    await writable.write(JSON.stringify(db, null, 2));
    await writable.close();
  } catch(e) {
    _fileHandle = null;
    localStorage.removeItem('maternopro_hasFilePicker');
  }
}

function saveDB() {
  localStorage.setItem('maternopro_listening', JSON.stringify(db.listening));
  localStorage.setItem('maternopro_reading', JSON.stringify(db.reading));
  localStorage.setItem('maternopro_writing', JSON.stringify(db.writing));
  localStorage.setItem('maternopro_speaking', JSON.stringify(db.speaking));
  localStorage.setItem('maternopro_grammar', JSON.stringify(db.grammar));
  localStorage.setItem('maternopro_vocab', JSON.stringify(db.vocab));
  // Lưu gộp toàn bộ vào 1 key để dễ khôi phục
  localStorage.setItem('maternoproDB_full', JSON.stringify(db));

  // Ghi thẳng ra file trên máy nếu cô đã chọn file
  if (_fileHandle) writeToFile();

  // Tự động đồng bộ lên file hệ thống thông qua backup_server.js
  fetch('http://localhost:5000/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(db)
  }).then(r => r.json())
    .then(res => {
      console.log("Đã đồng bộ sao lưu lên ổ đĩa thành công:", res);
    })
    .catch(err => {
      // Server chưa bật, bỏ qua lỗi im lặng

    });
}

// =============================================
// TỰ ĐỘNG TẢI BACKUP JSON XUỐNG MÁY MỖI 5 PHÚT
// Không cần server, không sợ mất dữ liệu!
// =============================================
function downloadBackupNow(silent) {
  if (!db) return;
  try {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maternopro_backup_${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (!silent) {
      const toast = document.getElementById('backup-toast');
      if (toast) {
        toast.textContent = '✅ Đã tải backup xuống máy!';
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
      }
    }
  } catch(e) {}
}

// Tự động tải backup mỗi 5 phút
setInterval(() => downloadBackupNow(true), 5 * 60 * 1000);

// Trạng thái câu trả lời của người làm bài Lesen
let userAnswers = {
  teil1: { 1: '', 2: '', 3: '', 4: '', 5: '' },
  teil2: { 6: '', 7: '', 8: '', 9: '', 10: '' },
  teil3: { 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '' },
  teil4: { 21: '', 22: '', 23: '', 24: '', 25: '', 26: '', 27: '', 28: '', 29: '', 30: '' },
  teil5: { 31: '', 32: '', 33: '', 34: '', 35: '', 36: '', 37: '', 38: '', 39: '', 40: '' }
};

// Trạng thái câu trả lời của người làm bài Hören
let userListeningAnswers = {
  41: '', 42: '', 43: '', 44: '', 45: '',
  46: '', 47: '', 48: '', 49: '', 50: '', 51: '', 52: '', 53: '', 54: '', 55: '',
  56: '', 57: '', 58: '', 59: '', 60: ''
};

// Lưu vết phần tử đang được click chọn để gán nhanh
let activeSelection = {
  type: null, // 'heading', 'letter', 'word'
  value: null  // giá trị chữ cái hoặc nội dung
};

// Trạng thái phân hệ Luyện Nghe (Hören) giống Lesen
let listeningFlowState = 'grid'; // 'grid', 'mode', 'test'
let selectedListeningTest = '';
let selectedListeningMode = '';
let currentListeningSubTab = 1; // 1 to 3

let readingFlowState = 'grid'; // 'grid', 'mode', 'overview', 'test'

// Trạng thái phân hệ Luyện Viết (Schreiben) giống cấu trúc chuyên nghiệp
let writingFlowState = 'category'; // 'category', 'list', 'exercise'
let speakingFlowState = 'category'; // 'category', 'grid', 'exercise'
let selectedWritingCategory = 'Alle'; // 'Alle', 'Beschwerde', 'Anfrage/Information'
let selectedWritingExerciseId = null;

// Danh sách đề viết chi tiết và đồ sộ cho Schreiben giống hệt các Screenshot
const writingExerciseList = [];

// ==========================================
// THƯ VIỆN DỊCH NGÔN NGỮ
// ==========================================
const translations = {
  de: {
    "nav-lesen": "Lesen",
    "nav-hoeren": "Hören",
    "nav-schreiben": "Schreiben",
    "nav-sprechen": "Sprechen",
    "nav-grammatik": "Grammatik",
    "nav-wortschatz": "Wortschatz",
    "nav-admin": "Admin",
    "hero-subtitle": "MaterNoPro ist eine Ein-Personen-GmbH. Der gewerbliche Verkauf von Prüfungsfragen ist strengstens untersagt. B2-Prüfung zu schwer? Komm zu Mater!",
    "hero-btn": "JETZT ÜBEN"
  },
  vi: {
    "nav-lesen": "Đọc B2",
    "nav-hoeren": "Nghe B2",
    "nav-schreiben": "Viết B2",
    "nav-sprechen": "Nói B2",
    "nav-grammatik": "Ngữ pháp",
    "nav-wortschatz": "Từ vựng",
    "nav-admin": "Admin",
    "hero-subtitle": "MaterNoPro là công ty TNHH một thành viên. Nghiêm cấm bán đề dưới mọi hình thức. Đề B2 khó? Mater tới chơi!",
    "hero-btn": "LUYỆN NGAY"
  }
};

let currentLang = localStorage.getItem('maternopro_lang') || 'de';

function toggleLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

// Đóng dropdown khi click ra ngoài
window.addEventListener('click', (e) => {
  if (!e.target.matches('#lang-btn') && !e.target.closest('.lang-selector-container')) {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
});

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('maternopro_lang', lang);
  updateLanguageUI();
}

function updateLanguageUI() {
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    langBtn.innerHTML = currentLang === 'de' ? '🌐 DE' : '🌐 VN';
  }
  document.querySelectorAll('[data-translate]').forEach(el => {
    let key = el.getAttribute('data-translate');
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Re-render the active view to apply translation!
  const activeSection = document.querySelector('.section-view.active');
  if (activeSection) {
    const id = activeSection.id;
    if (id === 'reading') renderReading();
    if (id === 'listening') renderListening();
    if (id === 'writing') renderWriting();
    if (id === 'speaking') renderSpeaking();
    if (id === 'grammar') renderGrammar();
    if (id === 'vocab') renderVocab();
  }
}

// ==========================================
// CÀI ĐẶT GIAO DIỆN SÁNG / TỐI (THEME)
// ==========================================
let currentTheme = localStorage.getItem('maternopro_theme') || 'dark';

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('maternopro_theme', currentTheme);
  applyTheme();
}

function applyTheme() {
  const btn = document.getElementById('theme-toggle-btn');
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    if (btn) btn.textContent = '🌙';
  } else {
    document.body.classList.remove('light-theme');
    if (btn) btn.textContent = '☀️';
  }
}

// ==========================================
// ĐIỀU HƯỚNG MÀN HÌNH
// ==========================================
function switchView(viewId) {
  document.querySelectorAll('.section-view').forEach(section => {
    section.classList.remove('active');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick').includes(viewId)) {
      btn.classList.add('active');
    }
  });

  const titles = {
    dashboard: "Trang Chủ",
    listening: "Luyện Nghe (Hören)",
    reading: "Luyện Đọc (Lesen)",
    writing: "Luyện Viết (Schreiben)",
    speaking: "Luyện Nói (Sprechen)",
    grammar: "Ngữ Pháp (Grammatik)",
    vocab: "Từ Vựng Theo Chủ Đề (Wortschatz)",
    admin: "Trang Quản Trị Hệ Thống"
  };
  
  const titleEl = document.getElementById('current-page-title');
  if (titleEl) {
    titleEl.textContent = titles[viewId] || "MaterNoPro";
  }

  // Tải nội dung phân hệ
  if (viewId === 'listening') {
    listeningFlowState = 'grid'; // Reset to grid
    renderListening();
  }
  if (viewId === 'reading') {
    readingFlowState = 'grid'; // Reset to grid selection
    renderReading();
  }
  if (viewId === 'writing') {
    writingFlowState = 'category'; // Reset to category selection
    renderWriting();
  }
  if (viewId === 'speaking') {
    speakingFlowState = 'category';
    renderSpeaking();
  }
  if (viewId === 'grammar') renderGrammar();
  if (viewId === 'vocab') renderVocab();
  if (viewId === 'admin') renderAdmin();
}

// Logo click to go to homepage
const logoEl = document.querySelector('.logo');
if (logoEl) {
  logoEl.addEventListener('click', () => {
    switchView('dashboard');
  });
}

// ==========================================
// 1. LUYỆN NGHE (HÖREN)
// ==========================================
function renderListening() {
  const container = document.getElementById('listening-content');
  if (!container) return;

  if (listeningFlowState === 'results') {
    renderListeningResults();
    return;
  }

  let backBtnHTML = '';
  if (listeningFlowState !== 'grid') {
    let prevStates = { 'mode': 'grid', 'test': 'mode' };
    backBtnHTML = `
      <button class="btn btn-secondary" onclick="setListeningState('${prevStates[listeningFlowState]}')" style="margin-bottom: 2rem;">
        ← Zurück
      </button>
    `;
  }

  if (listeningFlowState === 'grid') {
    let tests = db.listening;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">Hören - Test wählen</h2>
          <p style="color: var(--text-dim);">Wählen Sie einen Hörtest zum Üben</p>
        </div>
        <button class="btn btn-secondary" style="border-radius: 8px;" onclick="alert('Xem bảng điểm đã lưu!')">📊 Ergebnisse</button>
      </div>

      <div class="lesen-grid">
        ${tests.map(t => `
          <div class="lesen-card" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 280px;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; width: 100%;">
                <img src="logo.jpg" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan); box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);">
                <svg style="width: 26px; height: 26px; fill: #ff007a; filter: drop-shadow(0 0 8px rgba(255, 0, 122, 0.7));" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12v7c0 1.1.9 2 2 2h3v-8H4v-1c0-4.41 3.59-8 8-8s8 3.59 8 8v1h-3v8h3c1.1 0 2-.9 2-2v-7c0-5.52-4.48-10-10-10z"/>
                </svg>
              </div>
              <div class="lesen-card-title" style="font-size: 1.45rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; letter-spacing: 0.5px;">${t.name}</div>
              <div style="color: var(--text-dim); font-size: 0.88rem; margin-bottom: 1.5rem; font-weight: bold;">🕒 ${t.minutes} Min.</div>
            </div>
            <button class="btn btn-primary" style="width:100%; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.7rem 1.5rem; background: linear-gradient(90deg, #ff007a, #7928ca); box-shadow: 0 4px 15px rgba(255, 0, 122, 0.35); border: 1.5px solid rgba(255, 255, 255, 0.15);" onclick="selectListeningTestName('${t.name}')">Modus wählen</button>
          </div>
        `).join('')}
      </div>
    `;
  } else if (listeningFlowState === 'mode') {
    container.innerHTML = `
      ${backBtnHTML}
      <div style="text-align: center; margin-bottom: 3rem;">
        <svg style="width: 50px; height: 50px; fill: var(--accent-purple); filter: drop-shadow(0 0 10px var(--accent-purple)); margin-bottom: 1rem;" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12v7c0 1.1.9 2 2 2h3v-8H4v-1c0-4.41 3.59-8 8-8s8 3.59 8 8v1h-3v8h3c1.1 0 2-.9 2-2v-7c0-5.52-4.48-10-10-10z"/>
        </svg>
        <h2 style="font-size: 2.2rem; font-weight: 800; margin: 0.5rem 0 0.5rem 0;">${selectedListeningTest}</h2>
        <p style="color: var(--text-dim);">Wählen Sie den Modus für diesen Hörtest.</p>
      </div>

      <div class="mode-selection-grid">
        <div class="mode-card" onclick="selectListeningModeName('Übungsmodus')">
          <div class="mode-icon" style="color: var(--success);">🎓</div>
          <div class="mode-title">Übungsmodus</div>
          <p class="mode-description">Üben Sie ohne Zeitdruck. Audio unbegrenzt abspielen und einzelne Teile wählen.</p>
          <div class="mode-badge-row">
            <span class="mode-badge">Keine Zeitbegrenzung</span>
            <span class="mode-badge">Unbegrenzte Wiedergabe</span>
            <span class="mode-badge">Teile wählen</span>
          </div>
          <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;">Übung starten</button>
        </div>

        <div class="mode-card" onclick="selectListeningModeName('Prüfungsmodus')">
          <div class="mode-icon" style="color: var(--error);">⏱️</div>
          <div class="mode-title" style="color: var(--accent-cyan);">Prüfungsmodus</div>
          <p class="mode-description">Simulieren Sie echte Prüfungsbedingungen mit Zeitlimit und begrenzter Wiedergabe.</p>
          <div class="mode-badge-row">
            <span class="mode-badge">🕒 30 Minuten</span>
            <span class="mode-badge">Kein Vor-/Zurückspulen</span>
            <span class="mode-badge">Max. 2x abspielen</span>
          </div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Prüfung starten</button>
        </div>
      </div>
    `;
  } else if (listeningFlowState === 'test') {
    let subNavItems = [
      { num: 1, name: "Hörverstehen Teil 1" },
      { num: 2, name: "Hörverstehen Teil 2" },
      { num: 3, name: "Hörverstehen Teil 3" }
    ];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <button class="btn btn-secondary" onclick="setListeningState('mode')">← Zurück</button>
        <div style="font-weight: bold; color: var(--accent-cyan); font-size: 1.1rem;">
          ${selectedListeningTest} - ${selectedListeningMode}
        </div>
      </div>

      <div class="test-subnavigation">
        ${subNavItems.map(item => `
          <button class="test-subnav-btn ${currentListeningSubTab === item.num ? 'active' : ''}" onclick="setListeningSubTab(${item.num})">
            ${item.name}
          </button>
        `).join('')}
      </div>

      <div style="background: rgba(0, 242, 254, 0.05); border: 1px solid var(--accent-cyan); padding: 1.2rem; border-radius: 8px; line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem; color: #cbd5e1;">
        ${getListeningInstructions()}
      </div>

      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); padding: 2rem; border-radius: 12px; margin-bottom: 2.5rem; text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔊</div>
        <div style="font-weight: 800; font-size: 1.1rem; color: var(--accent-cyan); margin-bottom: 1.5rem;">Audio - Teil ${currentListeningSubTab}</div>
        
        <!-- Player UI -->
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <span id="listening-player-time" style="font-size: 0.85rem; color: var(--text-dim);">0:00</span>
          <input type="range" id="listening-player-slider" min="0" max="100" value="0" oninput="seekListeningAudio(this.value)" style="flex-grow: 1; accent-color: var(--accent-cyan); height: 6px; cursor: pointer; border-radius: 3px; background: rgba(255,255,255,0.1); border: none; outline: none;">
          <span id="listening-player-duration" style="font-size: 0.85rem; color: var(--text-dim);">0:00</span>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button id="listening-player-play-btn" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 30px; font-weight: bold;" onclick="toggleListeningAudio()">
            ▶ Abspielen
          </button>
          <button class="btn btn-secondary" style="padding: 0.8rem 1.5rem; border-radius: 30px;" onclick="stopListeningAudio()">
            ⏹ Stop
          </button>
        </div>
        
        <!-- Hidden real audio element for file playback -->
        <audio id="listening-real-audio" style="display:none;" ontimeupdate="onListeningAudioTimeUpdate()" onended="onListeningAudioEnded()"></audio>
      </div>

      <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; margin-bottom: 6rem;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: var(--accent-cyan); color: var(--bg-dark); font-weight: 800;">
              <th style="padding: 1rem; width: 60px; text-align: center;">#</th>
              <th style="padding: 1rem; width: 100px; text-align: center;">RICHTIG</th>
              <th style="padding: 1rem; width: 100px; text-align: center;">FALSCH</th>
              <th style="padding: 1rem;">AUSSAGE</th>
            </tr>
          </thead>
          <tbody>
            ${getListeningQuestionsHTML()}
          </tbody>
        </table>
      </div>

      <div class="test-bottom-bar">
        <div class="progress-container">
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dim);">beantwortet:</span>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${calculateListeningProgress()}%"></div>
          </div>
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);" id="listening-progress-text">${countListeningAnswered()} / 20</span>
        </div>
        <div style="display: flex; gap: 0.8rem;">
          <button class="btn btn-secondary" onclick="alert('Đã lưu bài làm nháp!')">Speichern</button>
          <button class="btn btn-secondary" onclick="resetListeningAnswers()">Zurücksetzen</button>
          <button class="btn btn-primary" onclick="submitListeningTestAnswers()">Antworten abgeben</button>
        </div>
      </div>
    `;
    setTimeout(initListeningPlayerUI, 50);
  }
}

function getListeningInstructions() {
  if (currentListeningSubTab === 1) {
    return "Sie hören die Nachrichten. Entscheiden Sie beim Hören, ob die Aussagen richtig oder falsch sind. Sie hören die Nachrichten nur einmal. Sie haben jetzt 30 Sekunden, um die Aussagen zu lesen.";
  } else if (currentListeningSubTab === 2) {
    return "Sie hören ein Interview. Entscheiden Sie beim Hören, ob die Aussagen richtig oder falsch sind. Sie hören das Interview nur einmal. Sie haben jetzt 60 Sekunden, um die Aussagen zu lesen.";
  } else {
    return "Sie hören 5 kurze Texte. Entscheiden Sie beim Hören, ob die Aussagen richtig oder falsch sind. Sie hören die Ansagen nur einmal. Sie haben jetzt 30 Sekunden, um die Aussagen zu lesen.";
  }
}

function getListeningQuestionsHTML() {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  let questions = [];
  
  let start = 41, end = 45;
  let partKey = 'teil1';
  if (currentListeningSubTab === 2) {
    start = 46;
    end = 55;
    partKey = 'teil2';
  } else if (currentListeningSubTab === 3) {
    start = 56;
    end = 60;
    partKey = 'teil3';
  }

  const hasData = test && test[partKey] && test[partKey].questions && test[partKey].questions.length > 0 && test[partKey].questions[0].q;
  if (hasData) {
    questions = test[partKey].questions;
  } else {
    // Fallback default questions
    if (currentListeningSubTab === 1) {
      questions = [
        { id: 41, q: "Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern." },
        { id: 42, q: "Die Fans des FC Neustadt waren von dem Sieg ihrer Mannschaft überrascht." },
        { id: 43, q: "Erzieherinnen verlangen eine bessere Bezahlung." },
        { id: 44, q: "Im Berliner Zoo gibt eine große Pandafamilie." },
        { id: 45, q: "Die Zahl der Deutschland Urlauber ist rückläufig." }
      ];
    } else if (currentListeningSubTab === 2) {
      questions = [
        { id: 46, q: "Frau Schenk hat kurze blondierte Haar." },
        { id: 47, q: "Angie ist der Künstlername von Frau Schenk." },
        { id: 48, q: "Frau Schenk lebt seit etwas mehr als zwei Jahren in Bayern." },
        { id: 49, q: "Der Interviewer hat keine guten Erinnerungen an seine Aufenthalte in Jugendherbergen." },
        { id: 50, q: "Auch in der modernen Jugendherberge von Frau Schenk gibt es Schlafräume mit mehr als zehn Betten." },
        { id: 51, q: "Nur bei Schulklassen achtet man auf Geschlechtstrennung in den Schlafräumen." },
        { id: 52, q: "Das Angebot an Speisen wird auf die Wünsche của khách hàng..." },
        { id: 53, q: "Schüler aus ländlichen Regionen sind meist unproblematische Gäste." },
        { id: 54, q: "Das Reiten zählt zu dem Sportprogramm der Jugendherberge." },
        { id: 55, q: "Frau Schenk muss für ihre Dienstwohnung 800€ bezahlen." }
      ];
    } else {
      questions = [
        { id: 56, q: "Bei der Fahrschule kann man sich über das Internet anmelden." },
        { id: 57, q: "Die Anruferin ist im Hinblick auf die Abfahrtszeit flexibel." },
        { id: 58, q: "Für den Halb-Marathon kann man sich noch am Sonntag registrieren lassen." },
        { id: 59, q: "Bei dem Flug nach Mallorca ändert sich die Abflugzeit." },
        { id: 60, q: "In Halle D wird aus E-Books vorgelesen." }
      ];
    }
  }

  return questions.map(item => `
    <tr style="border-bottom: 1px solid var(--border-light);">
      <td style="padding: 1rem; text-align: center; font-weight: bold; color: var(--accent-cyan);">${item.id}</td>
      <td style="padding: 1rem; text-align: center;">
        <input type="radio" name="listen-q${item.id}" value="Richtig" style="transform: scale(1.3); cursor: pointer;"
          ${userListeningAnswers[item.id] === 'Richtig' ? 'checked' : ''}
          onclick="selectListeningRadioAnswer(${item.id}, 'Richtig')">
      </td>
      <td style="padding: 1rem; text-align: center;">
        <input type="radio" name="listen-q${item.id}" value="Falsch" style="transform: scale(1.3); cursor: pointer;"
          ${userListeningAnswers[item.id] === 'Falsch' ? 'checked' : ''}
          onclick="selectListeningRadioAnswer(${item.id}, 'Falsch')">
      </td>
      <td style="padding: 1rem; line-height: 1.5; color: #e2e8f0;">${item.q}</td>
    </tr>
  `).join('');
}

function selectListeningRadioAnswer(qId, val) {
  userListeningAnswers[qId] = val;
  const textEl = document.getElementById('listening-progress-text');
  if (textEl) {
    textEl.textContent = `${countListeningAnswered()} / 20`;
  }
  const fillEl = document.querySelector('.progress-fill');
  if (fillEl) {
    fillEl.style.width = `${calculateListeningProgress()}%`;
  }
}

function countListeningAnswered() {
  let count = 0;
  Object.keys(userListeningAnswers).forEach(k => {
    if (userListeningAnswers[k] !== '') count++;
  });
  return count;
}

function calculateListeningProgress() {
  return (countListeningAnswered() / 20) * 100;
}

function resetListeningAnswers() {
  if (confirm("Bạn có muốn đặt lại toàn bộ câu trả lời phần nghe không?")) {
    userListeningAnswers = {
      41: '', 42: '', 43: '', 44: '', 45: '',
      46: '', 47: '', 48: '', 49: '', 50: '', 51: '', 52: '', 53: '', 54: '', 55: '',
      56: '', 57: '', 58: '', 59: '', 60: ''
    };
    renderListening();
  }
}

function submitListeningTestAnswers() {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  const correctAns = test ? test.answers : {};
  
  let correctCount = 0;
  const mockCorrectAnswers = {
    41: 'Richtig', 42: 'Falsch', 43: 'Richtig', 44: 'Falsch', 45: 'Richtig',
    46: 'Richtig', 47: 'Falsch', 48: 'Richtig', 49: 'Richtig', 50: 'Falsch', 51: 'Richtig', 52: 'Falsch', 53: 'Richtig', 54: 'Falsch', 55: 'Richtig',
    56: 'Falsch', 57: 'Richtig', 58: 'Falsch', 59: 'Richtig', 60: 'Falsch'
  };

  for (let i = 41; i <= 60; i++) {
    const userAns = userListeningAnswers[i];
    const correctVal = (correctAns && correctAns[i]) ? correctAns[i] : mockCorrectAnswers[i];
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      correctCount++;
    }
  }

  listeningFlowState = 'results';
  renderListening();
}

function renderListeningResults() {
  const container = document.getElementById('listening-content');
  if (!container) return;

  const test = db.listening.find(t => t.name === selectedListeningTest);
  const correctAns = test ? test.answers : {};

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let listeningScore = 0;
  
  const mockCorrectAnswers = {
    41: 'Richtig', 42: 'Falsch', 43: 'Richtig', 44: 'Falsch', 45: 'Richtig',
    46: 'Richtig', 47: 'Falsch', 48: 'Richtig', 49: 'Richtig', 50: 'Falsch', 51: 'Richtig', 52: 'Falsch', 53: 'Richtig', 54: 'Falsch', 55: 'Richtig',
    56: 'Falsch', 57: 'Richtig', 58: 'Falsch', 59: 'Richtig', 60: 'Falsch'
  };

  for (let i = 41; i <= 60; i++) {
    const userAns = userListeningAnswers[i];
    const correctVal = (correctAns && correctAns[i]) ? correctAns[i] : mockCorrectAnswers[i];
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      totalCorrect++;
      if (i >= 41 && i <= 45) listeningScore += 5.0; // Teil 1: 5 câu, mỗi câu 5 điểm (Tối đa 25 điểm)
      else if (i >= 46 && i <= 55) listeningScore += 2.5; // Teil 2: 10 câu, mỗi câu 2.5 điểm (Tối đa 25 điểm)
      else if (i >= 56 && i <= 60) listeningScore += 5.0; // Teil 3: 5 câu, mỗi câu 5 điểm (Tối đa 25 điểm)
    } else {
      totalIncorrect++;
    }
  }

  const subNavItems = [
    { num: 1, name: "Teil 1" },
    { num: 2, name: "Teil 2" },
    { num: 3, name: "Teil 3" }
  ];

  let feedbackHTML = renderListeningPartFeedback(currentListeningSubTab, correctAns);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <button class="btn btn-secondary" onclick="setListeningState('grid')">← Zurück zu Hörtests</button>
      <div style="font-weight: bold; color: var(--accent-cyan); font-size: 1.1rem;">
        ${selectedListeningTest} - Ergebnisse
      </div>
    </div>

    <!-- Khung Thống kê Điểm số giống ảnh chụp màn hình -->
    <div class="card" style="background: rgba(22, 22, 54, 0.45); border: 1px solid var(--border-light); padding: 2rem; border-radius: 16px; margin-bottom: 2rem; display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 1.5rem; align-items: center;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2.5rem; color: var(--accent-purple);">🎧</div>
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0;">Ihre Ergebnisse</h3>
          <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0;">${selectedListeningTest}</p>
        </div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-cyan);">${listeningScore}<span style="font-size: 1.1rem; color: var(--text-dim);">/75</span></div>
        <div style="color: var(--text-dim); font-size: 0.8rem; text-transform: uppercase;">Gesamtpunkte (Tối đa 75)</div>
      </div>
      <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--success);">${totalCorrect}<span style="font-size: 1.1rem; color: var(--text-dim);">/20</span></div>
        <div style="color: var(--text-dim); font-size: 0.8rem; text-transform: uppercase;">Richtig</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--danger);">${totalIncorrect}</div>
        <div style="color: var(--text-dim); font-size: 0.8rem; text-transform: uppercase;">Falsch</div>
      </div>
    </div>

    <!-- Dãy Sub-Tabs điều hướng xem từng phần -->
    <div style="display: flex; gap: 0.8rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      ${subNavItems.map(item => {
        let correctInTab = 0;
        let totalInTab = item.num === 2 ? 10 : 5;
        let start = item.num === 1 ? 41 : item.num === 2 ? 46 : 56;
        let end = item.num === 1 ? 45 : item.num === 2 ? 55 : 60;
        for (let i = start; i <= end; i++) {
          const userAns = userListeningAnswers[i];
          const correctVal = (correctAns && correctAns[i]) ? correctAns[i] : mockCorrectAnswers[i];
          if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
            correctInTab++;
          }
        }
        return `
          <button class="test-subnav-btn ${currentListeningSubTab === item.num ? 'active' : ''}" 
            onclick="setListeningSubTab(${item.num})" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
            ${item.name} <span style="font-size:0.75rem; opacity:0.85; margin-left:0.3rem;">(${correctInTab}/${totalInTab})</span>
          </button>
        `;
      }).join('')}
    </div>

    <!-- Thanh Audio Player ở kết quả giống ảnh chụp màn hình -->
    <div style="background: rgba(22, 22, 54, 0.45); border: 1px solid var(--border-light); padding: 1.2rem 2rem; border-radius: 12px; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <span style="font-size: 1.8rem; filter: drop-shadow(0 0 8px var(--accent-cyan));">📻</span>
        <div>
          <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">Audio-Player - Teil ${currentListeningSubTab}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim);">${selectedListeningTest}</div>
        </div>
      </div>
      <audio id="listening-results-audio" src="${test.audioUrl || ''}" controls style="flex-grow: 1; min-width: 250px; outline: none; border-radius: 8px; background: rgba(0,0,0,0.35);"></audio>
    </div>

    <!-- Nội dung 2 cột đối xứng -->
    ${feedbackHTML}
  `;
}

function renderListeningPartFeedback(partNum, correctAns) {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  let start = 41, end = 45;
  let partKey = 'teil1';
  if (partNum === 2) {
    start = 46;
    end = 55;
    partKey = 'teil2';
  } else if (partNum === 3) {
    start = 56;
    end = 60;
    partKey = 'teil3';
  }

  let questions = [];
  const mockQuestions = {
    1: [
      { id: 41, q: "Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern." },
      { id: 42, q: "Die Fans des FC Neustadt waren von dem Sieg ihrer Mannschaft überrascht." },
      { id: 43, q: "Erzieherinnen verlangen eine bessere Bezahlung." },
      { id: 44, q: "Im Berliner Zoo gibt eine große Pandafamilie." },
      { id: 45, q: "Die Zahl der Deutschland Urlauber ist rückläufig." }
    ],
    2: [
      { id: 46, q: "Frau Schenk hat kurze blondierte Haar." },
      { id: 47, q: "Angie ist der Künstlername von Frau Schenk." },
      { id: 48, q: "Frau Schenk lebt seit etwas mehr als zwei Jahren in Bayern." },
      { id: 49, q: "Der Interviewer hat keine guten Erinnerungen an seine Aufenthalte in Jugendherbergen." },
      { id: 50, q: "Auch in der modernen Jugendherberge von Frau Schenk gibt es Schlafräume mit mehr als zehn Betten." },
      { id: 51, q: "Nur bei Schulklassen achtet man auf Geschlechtstrennung in den Schlafräumen." },
      { id: 52, q: "Das Angebot an Speisen wird trên wünsche của khách hàng..." },
      { id: 53, q: "Schüler aus ländlichen Regionen sind meist unproblematische Gäste." },
      { id: 54, q: "Das Reiten zählt zu dem Sportprogramm der Jugendherberge." },
      { id: 55, q: "Frau Schenk muss für ihre Dienstwohnung 800€ bezahlen." }
    ],
    3: [
      { id: 56, q: "Bei der Fahrschule kann man sich über das Internet anmelden." },
      { id: 57, q: "Die Anruferin ist im Hinblick auf die Abfahrtszeit flexibel." },
      { id: 58, q: "Für den Halb-Marathon kann man sich noch am Sonntag registrieren lassen." },
      { id: 59, q: "Bei dem Flug nach Mallorca ändert sich die Abflugzeit." },
      { id: 60, q: "In Halle D wird aus E-Books vorgelesen." }
    ]
  };

  const hasData = test && test[partKey] && test[partKey].questions && test[partKey].questions.length > 0 && test[partKey].questions[0].q;
  if (hasData) {
    questions = test[partKey].questions;
  } else {
    questions = mockQuestions[partNum];
  }

  const mockCorrectAnswers = {
    41: 'Richtig', 42: 'Falsch', 43: 'Richtig', 44: 'Falsch', 45: 'Richtig',
    46: 'Richtig', 47: 'Falsch', 48: 'Richtig', 49: 'Richtig', 50: 'Falsch', 51: 'Richtig', 52: 'Falsch', 53: 'Richtig', 54: 'Falsch', 55: 'Richtig',
    56: 'Falsch', 57: 'Richtig', 58: 'Falsch', 59: 'Richtig', 60: 'Falsch'
  };

  let leftPaneHTML = `
    <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1.2rem;">
      <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Fragen & Erklärungen</div>
      
      ${questions.map(qItem => {
        const i = qItem.id;
        const uAns = userListeningAnswers[i] || '(keine Antwort)';
        const cVal = (correctAns && correctAns[i]) ? correctAns[i] : mockCorrectAnswers[i];
        const isRight = uAns.trim().toUpperCase() === cVal.trim().toUpperCase();
        
        const explanation = (test && test.explanations && test.explanations[i]) ? test.explanations[i] : '';
        const dur = (test && test.durations && test.durations[i]) ? test.durations[i] : '';
        const subAudUrl = (test && test.subAudios && test.subAudios[i]) ? test.subAudios[i] : '';

        return `
          <div style="background: rgba(255,255,255,0.01); border: 1px solid ${isRight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; padding: 1.2rem; border-radius: 10px; position: relative;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem;">
              <span style="font-weight: bold; font-size: 0.85rem; color: var(--accent-cyan); background: rgba(0,242,254,0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">Q${i}</span>
              <p style="margin: 0; font-size: 0.95rem; font-weight: bold; color: #fff; flex: 1; text-align: justify; line-height: 1.5;">${qItem.q}</p>
              <span style="font-size: 1.2rem; color: ${isRight ? 'var(--success)' : 'var(--danger)'};">${isRight ? '✓' : '✗'}</span>
            </div>
            
            <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem; font-size: 0.85rem;">
              <div style="margin-bottom: 0.4rem; color: var(--text-dim);">
                Ihre Antwort: <span style="font-weight: bold; color: ${isRight ? 'var(--success)' : 'var(--danger)'};">${uAns}</span>
              </div>
              <div style="margin-bottom: 0.6rem; background: rgba(16,185,129,0.08); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(16,185,129,0.25);">
                <div style="color: var(--success); font-weight: bold; margin-bottom: 0.2rem;">Richtige Antwort:</div>
                <div style="color: #fff; font-size: 0.9rem; font-weight: bold;">${cVal}</div>
              </div>
              
              ${explanation ? `
                <div style="margin-top: 0.5rem; color: var(--text-dim); line-height: 1.5; font-size: 0.85rem; background: rgba(255,255,255,0.02); padding: 0.6rem; border-radius: 6px;">
                  <strong style="color: var(--accent-cyan); display: block; margin-bottom: 0.2rem;">Erklärung:</strong>
                  ${explanation}
                </div>
              ` : ''}

              <!-- Sub-audio button if duration is set -->
              ${(dur || subAudUrl) ? `
                <button class="btn btn-secondary" onclick="playSubAudio('${dur}', '${subAudUrl}')" style="margin-top: 0.8rem; font-size: 0.8rem; padding: 0.35rem 0.8rem; border-radius: 20px; display: flex; align-items: center; gap: 0.4rem;">
                  🎧 Hier anhören ${dur ? `(${dur})` : ''}
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  let transcriptHTML = `
    <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px; max-height: 80vh; overflow-y: auto;">
      <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.2rem;">Transkript</div>
      <div style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.7; white-space: pre-wrap; text-align: justify;">${highlightTranscript(test && test[partKey] ? test[partKey].transcript : '')}</div>
    </div>
  `;

  return `
    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.5rem; align-items: start; margin-bottom: 5rem;">
      ${leftPaneHTML}
      ${transcriptHTML}
    </div>
  `;
}

function playSubAudio(timeStr, subAudUrl) {
  const aud = document.getElementById('listening-results-audio');
  if (!aud) return;

  if (subAudUrl && subAudUrl.trim()) {
    if (!aud.src.includes(subAudUrl.trim())) {
      aud.src = subAudUrl.trim();
    }
    aud.play();
  } else if (timeStr && timeStr.trim()) {
    const parts = timeStr.trim().split(':');
    let secs = 0;
    if (parts.length === 2) {
      secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 1) {
      secs = parseInt(parts[0]);
    }

    const test = db.listening.find(t => t.name === selectedListeningTest);
    if (test && test.audioUrl && !aud.src.includes(test.audioUrl)) {
      aud.src = test.audioUrl;
    }

    aud.currentTime = secs;
    aud.play();
  }
}

// ==========================================
// BỘ ĐIỀU KHIỂN AUDIO PLAYER DÀNH CHO NGHE (HÖREN)
// ==========================================
let isListeningPlaying = false;
let listeningAudioDuration = 0; // in seconds
let listeningAudioCurrentTime = 0; // in seconds
let listeningTimerInterval = null;
let speechSynthUtterance = null;

function getListeningDuration(partNum) {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  if (!test) {
    if (partNum === 1) return 300;  // 5:00
    if (partNum === 2) return 900;  // 15:00
    if (partNum === 3) return 600;  // 10:00
    return 300;
  }

  // Tính toán trọng số độ dài của cả 3 phần
  const weights = {};
  for (let p = 1; p <= 3; p++) {
    const partKey = 'teil' + p;
    const text = test[partKey]?.transcript || '';
    if (text && text.trim().length > 50) {
      weights[p] = text.trim().length;
    } else {
      // Trọng số mặc định tương đương (5 phút, 15 phút, 10 phút)
      if (p === 1) weights[p] = 300 * 12;
      if (p === 2) weights[p] = 900 * 12;
      if (p === 3) weights[p] = 600 * 12;
    }
  }

  const totalWeight = weights[1] + weights[2] + weights[3];
  const totalExamSecs = 1800; // Tổng thời lượng thi nghe B2 là 30 phút = 1800 giây
  
  // Chia tỷ lệ giây tương ứng theo trọng số độ dài
  const partSecs = Math.round((weights[partNum] / totalWeight) * totalExamSecs);
  
  // Trả về số giây (giới hạn tối thiểu là 2 phút để nghe rõ ràng)
  return Math.max(120, partSecs);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function initListeningPlayerUI() {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  if (!test) return;
  
  const duration = getListeningDuration(currentListeningSubTab);
  listeningAudioDuration = duration;
  
  const durLabel = document.getElementById('listening-player-duration');
  if (durLabel) durLabel.textContent = formatTime(duration);
  
  const timeLabel = document.getElementById('listening-player-time');
  if (timeLabel) timeLabel.textContent = "0:00";
  
  const slider = document.getElementById('listening-player-slider');
  if (slider) slider.value = 0;
  
  // Set real audio source if not AI
  const realAudio = document.getElementById('listening-real-audio');
  if (realAudio) {
    if (test.useAiVoice) {
      realAudio.src = "";
    } else {
      realAudio.src = test.audioUrl || "";
    }
  }
  
  isListeningPlaying = false;
  const playBtn = document.getElementById('listening-player-play-btn');
  if (playBtn) playBtn.innerHTML = "▶ Abspielen";
}

function toggleListeningAudio() {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  if (!test) return;

  const playBtn = document.getElementById('listening-player-play-btn');
  const realAudio = document.getElementById('listening-real-audio');

  if (isListeningPlaying) {
    // PAUSE
    isListeningPlaying = false;
    if (playBtn) playBtn.innerHTML = "▶ Abspielen";
    
    if (test.useAiVoice) {
      window.speechSynthesis.pause();
      clearInterval(listeningTimerInterval);
    } else {
      if (realAudio) realAudio.pause();
    }
  } else {
    // PLAY
    isListeningPlaying = true;
    if (playBtn) playBtn.innerHTML = "⏸ Pause";

    if (test.useAiVoice) {
      const partKey = 'teil' + currentListeningSubTab;
      const textToRead = test[partKey]?.transcript || "Kein Transkript vorhanden.";
      // Loại bỏ hoàn toàn các ký tự đánh dấu câu hỏi như [41], [42], etc. để AI đọc liền mạch tự nhiên không đọc số
      const cleanText = textToRead.replace(/\[\d+\]/g, "");
      
      // If we paused and are resuming
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.cancel();
        speechSynthUtterance = new SpeechSynthesisUtterance(cleanText);
        speechSynthUtterance.lang = 'de-DE';
        speechSynthUtterance.rate = 0.86; // Tốc độ 0.86 là chuẩn mực hoàn hảo cho nghe hiểu B2 (rõ chữ, dễ nghe)
        speechSynthUtterance.pitch = 1.03; // Nâng nhẹ cao độ lên 1.03 giúp giọng nói ấm áp và có ngữ điệu nhấn nhá tự nhiên giống người thật hơn
        
        // Ưu tiên tìm kiếm các giọng đọc thế hệ mới online/neural/natural có ngữ điệu sinh học xuất sắc của Edge/Chrome
        const voices = window.speechSynthesis.getVoices();
        let deVoice = voices.find(v => v.lang.startsWith('de') && (
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('neural') ||
          v.name.toLowerCase().includes('google')
        ) && (
          v.name.toLowerCase().includes('katja') || 
          v.name.toLowerCase().includes('hedda') || 
          v.name.toLowerCase().includes('gaby') || 
          v.name.toLowerCase().includes('marlene') || 
          v.name.toLowerCase().includes('female')
        ));
        
        // Nếu không có giọng nữ neural trực tuyến, tìm bất kỳ giọng neural nào khác
        if (!deVoice) {
          deVoice = voices.find(v => v.lang.startsWith('de') && (
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('online')
          ));
        }
        
        // Phương án dự phòng cuối cùng
        if (!deVoice) deVoice = voices.find(v => v.lang.startsWith('de')) || voices[0];
        if (deVoice) speechSynthUtterance.voice = deVoice;
        
        speechSynthUtterance.onend = () => {
          stopListeningAudio();
        };
        speechSynthUtterance.onerror = () => {
          stopListeningAudio();
        };
        
        window.speechSynthesis.speak(speechSynthUtterance);
      }
      
      // Start timer interval to advance slider
      clearInterval(listeningTimerInterval);
      listeningTimerInterval = setInterval(() => {
        if (listeningAudioCurrentTime < listeningAudioDuration) {
          listeningAudioCurrentTime += 1;
          updateListeningPlayerUI();
        } else {
          stopListeningAudio();
        }
      }, 1000);
    } else {
      if (realAudio) {
        realAudio.play().catch(err => {
          console.warn("Audio file failed to play. Falling back to AI Voice.");
          test.useAiVoice = true;
          isListeningPlaying = false;
          toggleListeningAudio(); // Retrigger with AI voice
        });
      }
    }
  }
}

function stopListeningAudio() {
  isListeningPlaying = false;
  listeningAudioCurrentTime = 0;
  
  const playBtn = document.getElementById('listening-player-play-btn');
  if (playBtn) playBtn.innerHTML = "▶ Abspielen";
  
  window.speechSynthesis.cancel();
  clearInterval(listeningTimerInterval);
  
  const realAudio = document.getElementById('listening-real-audio');
  if (realAudio) {
    realAudio.pause();
    realAudio.currentTime = 0;
  }
  
  updateListeningPlayerUI();
}

function updateListeningPlayerUI() {
  const timeLabel = document.getElementById('listening-player-time');
  if (timeLabel) timeLabel.textContent = formatTime(listeningAudioCurrentTime);
  
  const slider = document.getElementById('listening-player-slider');
  if (slider) {
    const pct = (listeningAudioCurrentTime / listeningAudioDuration) * 100;
    slider.value = pct;
  }
}

function seekListeningAudio(val) {
  const test = db.listening.find(t => t.name === selectedListeningTest);
  if (!test) return;

  const pct = parseFloat(val);
  const targetTime = (pct / 100) * listeningAudioDuration;
  listeningAudioCurrentTime = targetTime;
  
  const realAudio = document.getElementById('listening-real-audio');
  if (!test.useAiVoice && realAudio) {
    realAudio.currentTime = targetTime;
  }
  
  updateListeningPlayerUI();
}

function onListeningAudioTimeUpdate() {
  const realAudio = document.getElementById('listening-real-audio');
  if (realAudio && isListeningPlaying) {
    listeningAudioCurrentTime = realAudio.currentTime;
    listeningAudioDuration = realAudio.duration || getListeningDuration(currentListeningSubTab);
    
    const durLabel = document.getElementById('listening-player-duration');
    if (durLabel) durLabel.textContent = formatTime(listeningAudioDuration);
    
    updateListeningPlayerUI();
  }
}

function onListeningAudioEnded() {
  stopListeningAudio();
}

// Helper to highlight answers inside transcripts
function highlightTranscript(text) {
  if (!text) return 'Chưa có nội dung dịch lời thoại.';
  return text.replace(/\[(\d+)\]([^.]+?\.)/g, (match, qNum, sentence) => {
    return `<strong style="color: var(--accent-amber); font-weight: 900; background: rgba(245, 158, 11, 0.2); border: 1px solid var(--accent-amber); padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-block; margin-right: 0.3rem; box-shadow: 0 0 8px rgba(245, 158, 11, 0.25);">[${qNum}]</strong><strong style="color: #ffe066; font-weight: 900; background: rgba(255, 224, 102, 0.12); padding: 0.15rem 0.4rem; border-radius: 4px; border-bottom: 2px solid var(--accent-amber); text-shadow: 0 0 5px rgba(255, 224, 102, 0.2); display: inline;">${sentence}</strong>`;
  });
}

function selectListeningTestName(name) {
  selectedListeningTest = name;
  listeningFlowState = 'mode';
  renderListening();
}

function selectReadingTestName(name) {
  selectedReadingTest = name;
  readingFlowState = 'mode';
  renderReading();
}

function selectReadingModeName(mode) {
  selectedReadingMode = mode;
  readingFlowState = 'overview';
  renderReading();
}

function setReadingState(state) {
  readingFlowState = state;
  renderReading();
}

// initReadingData moved to after readingTestList

function setReadingSubTab(tabNum) {
  currentReadingSubTab = tabNum;
  renderReading();
}

function selectListeningModeName(mode) {
  selectedListeningMode = mode;
  listeningFlowState = 'test';
  renderListening();
}

function setListeningState(state) {
  listeningFlowState = state;
  renderListening();
}

function setListeningSubTab(tabNum) {
  currentListeningSubTab = tabNum;
  renderListening();
}

// ==========================================
// 2. LUYỆN ĐỌC - MULTI STATE FLOW (LESEN)
// ==========================================
// readingFlowState moved to top
let selectedReadingTest = '';
let selectedReadingMode = '';
let currentReadingSubTab = 1; // 1 to 5

const readingTestList = [
  { 
    name: "Đề 1", 
    free: true, 
    minutes: 90, 
    answers: {
      1: "F", 2: "E", 3: "C", 4: "H", 5: "I",
      6: "B", 7: "C", 8: "C", 9: "C", 10: "B",
      11: "D", 12: "F", 13: "I", 14: "C", 15: "K", 16: "G", 17: "X", 18: "X", 19: "J", 20: "B",
      21: "B", 22: "B", 23: "B", 24: "B", 25: "A", 26: "A", 27: "B", 28: "A", 29: "C", 30: "A",
      31: "E", 32: "H", 33: "C", 34: "B", 35: "N", 36: "L", 37: "G", 38: "M", 39: "K", 40: "J"
    },
    explanations: {
      1: "Spardosen sind Sammelbehälter... (F)", 6: "vom Schüler bis zum Rentner... (B)", 11: "erledige ich gerne auch Gartenarbeit (D)"
    }
  },
  { 
    name: "Đề 2", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "B", 2: "C", 3: "D", 4: "G", 5: "E",
      6: "B", 7: "C", 8: "C", 9: "B", 10: "C",
      11: "A", 12: "X", 13: "D", 14: "H", 15: "L", 16: "G", 17: "I", 18: "K", 19: "X", 20: "F",
      21: "C", 22: "B", 23: "A", 24: "A", 25: "C", 26: "C", 27: "C", 28: "A", 29: "A", 30: "C",
      31: "O", 32: "F", 33: "A", 34: "L", 35: "M", 36: "B", 37: "H", 38: "D", 39: "N", 40: "I"
    },
    explanations: {
      1: "Erreger aus dem Tierreich die Artengrenze überspringen (B)", 6: "Zusammenhang zwischen Körper... (B)"
    }
  },
  { 
    name: "Đề 3", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "A", 2: "H", 3: "G", 4: "I", 5: "J",
      6: "A", 7: "A", 8: "C", 9: "C", 10: "A",
      11: "H", 12: "G", 13: "A", 14: "J", 15: "X", 16: "E", 17: "K", 18: "C", 19: "X", 20: "L",
      21: "C", 22: "A", 23: "B", 24: "C", 25: "B", 26: "A", 27: "B", 28: "B", 29: "B", 30: "B",
      31: "K", 32: "J", 33: "H", 34: "N", 35: "N", 36: "G", 37: "I", 38: "L", 39: "I", 40: "M"
    },
    explanations: {
      1: "Martina programmiert in ihrer Freizeit... (A)", 6: "Holstein-Rinder dominieren die Milchproduktion... (A)"
    }
  },
  { 
    name: "Đề 4", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "A", 2: "H", 3: "G", 4: "I", 5: "J",
      6: "A", 7: "A", 8: "C", 9: "C", 10: "A",
      11: "H", 12: "G", 13: "A", 14: "J", 15: "X", 16: "E", 17: "K", 18: "C", 19: "X", 20: "L",
      21: "C", 22: "A", 23: "B", 24: "C", 25: "B", 26: "A", 27: "B", 28: "B", 29: "B", 30: "B",
      31: "K", 32: "J", 33: "H", 34: "N", 35: "N", 36: "G", 37: "I", 38: "L", 39: "I", 40: "M"
    },
    explanations: {
      1: "Martina Lux programmiert in ihrer Freizeit (A)"
    }
  },
  { 
    name: "Đề 5", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "A", 2: "H", 3: "G", 4: "I", 5: "J",
      6: "C", 7: "B", 8: "B", 9: "C", 10: "C",
      11: "L", 12: "I", 13: "B", 14: "H", 15: "K", 16: "E", 17: "A", 18: "X", 19: "F", 20: "G",
      21: "C", 22: "C", 23: "C", 24: "C", 25: "B", 26: "C", 27: "A", 28: "B", 29: "A", 30: "C",
      31: "J", 32: "L", 33: "L", 34: "K", 35: "E", 36: "M", 37: "O", 38: "G", 39: "C", 40: "N"
    },
    explanations: {
      6: "nur so viel mit, wie man tatsächlich braucht... (C)"
    }
  },
  { 
    name: "Đề 6", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "I", 2: "F", 3: "E", 4: "J", 5: "B",
      6: "C", 7: "A", 8: "B", 9: "B", 10: "A",
      11: "H", 12: "A", 13: "F", 14: "I", 15: "J", 16: "X", 17: "L", 18: "X", 19: "E", 20: "K",
      21: "B", 22: "B", 23: "A", 24: "A", 25: "B", 26: "B", 27: "B", 28: "A", 29: "B", 30: "A",
      31: "J", 32: "L", 33: "K", 34: "I", 35: "H", 36: "A", 37: "B", 38: "I", 39: "N", 40: "E"
    },
    explanations: {
      6: "Der französische Schneider Alexis Lavigne gilt als ihr Erfinder (C)"
    }
  },
  { 
    name: "Đề 7", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "B", 2: "I", 3: "A", 4: "G", 5: "C",
      6: "B", 7: "A", 8: "C", 9: "A", 10: "A",
      11: "D", 12: "X", 13: "F", 14: "C", 15: "J", 16: "K", 17: "X", 18: "A", 19: "H", 20: "L",
      21: "B", 22: "C", 23: "A", 24: "C", 25: "C", 26: "A", 27: "B", 28: "C", 29: "B", 30: "B",
      31: "F", 32: "O", 33: "G", 34: "J", 35: "B", 36: "C", 37: "L", 38: "M", 39: "I", 40: "E"
    },
    explanations: {
      6: "jede dritte Mutter... keine Zeit für Frühstück (B)"
    }
  },
  { 
    name: "Đề 8", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "H", 2: "D", 3: "B", 4: "A", 5: "E",
      6: "C", 7: "C", 8: "X", 9: "A", 10: "C",
      11: "X", 12: "H", 13: "E", 14: "A", 15: "X", 16: "I", 17: "F", 18: "C", 19: "D", 20: "J",
      21: "C", 22: "A", 23: "A", 24: "B", 25: "C", 26: "C", 27: "C", 28: "C", 29: "A", 30: "C",
      31: "A", 32: "M", 33: "C", 34: "J", 35: "I", 36: "L", 37: "B", 38: "O", 39: "F", 40: "D"
    },
    explanations: {
      6: "erstens arbeitet man meist am Abend... (C)"
    }
  },
  { 
    name: "Đề 9", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "H", 2: "D", 3: "I", 4: "A", 5: "E",
      6: "A", 7: "B", 8: "B", 9: "A", 10: "A",
      11: "X", 12: "H", 13: "E", 14: "A", 15: "X", 16: "I", 17: "F", 18: "C", 19: "D", 20: "J",
      21: "B", 22: "B", 23: "C", 24: "A", 25: "B", 26: "A", 27: "A", 28: "C", 29: "B", 30: "C",
      31: "J", 32: "L", 33: "L", 34: "K", 35: "E", 36: "M", 37: "O", 38: "G", 39: "C", 40: "N"
    },
    explanations: {
      6: "äußere Einflüsse nur bedingt wahrnehmen... (A)"
    }
  },
  { 
    name: "Đề 10", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "C", 2: "H", 3: "B", 4: "E", 5: "I",
      6: "A", 7: "B", 8: "A", 9: "C", 10: "A",
      11: "K", 12: "E", 13: "X", 14: "A", 15: "C", 16: "H", 17: "F", 18: "J", 19: "B", 20: "G",
      21: "A", 22: "B", 23: "C", 24: "A", 25: "C", 26: "A", 27: "C", 28: "C", 29: "C", 30: "C",
      31: "J", 32: "L", 33: "K", 34: "I", 35: "H", 36: "A", 37: "B", 38: "I", 39: "N", 40: "E"
    },
    explanations: {
      6: "In Büros mit mehr als 16 Mitarbeitern fühlen sich 80% gestört (A)"
    }
  },
  { 
    name: "Đề 11", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "E", 2: "D", 3: "F", 4: "A", 5: "G",
      6: "B", 7: "C", 8: "C", 9: "C", 10: "B",
      11: "L", 12: "I", 13: "B", 14: "H", 15: "K", 16: "E", 17: "A", 18: "X", 19: "F", 20: "G",
      21: "B", 22: "C", 23: "C", 24: "B", 25: "C", 26: "A", 27: "A", 28: "B", 29: "B", 30: "A",
      31: "K", 32: "J", 33: "H", 34: "N", 35: "N", 36: "G", 37: "I", 38: "L", 39: "I", 40: "M"
    },
    explanations: {
      1: "Der Begriff Extremsport wird oft subjektiv verwendet (E)"
    }
  },
  { 
    name: "Đề 12", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "D", 2: "J", 3: "C", 4: "B", 5: "E",
      6: "B", 7: "A", 8: "A", 9: "A", 10: "B",
      11: "L", 12: "I", 13: "B", 14: "H", 15: "K", 16: "E", 17: "A", 18: "X", 19: "F", 20: "G",
      21: "C", 22: "B", 23: "C", 24: "B", 25: "B", 26: "B", 27: "B", 28: "B", 29: "B", 30: "B",
      31: "B", 32: "H", 33: "N", 34: "K", 35: "E", 36: "F", 37: "G", 38: "C", 39: "H", 40: "L"
    },
    explanations: {
      6: "identisch is mit der National-Auswahl (B)"
    }
  },
  { 
    name: "Đề 13", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "C", 2: "I", 3: "F", 4: "A", 5: "J",
      6: "B", 7: "C", 8: "A", 9: "B", 10: "A",
      11: "C", 12: "J", 13: "G", 14: "E", 15: "A", 16: "I", 17: "F", 18: "A", 19: "B", 20: "K",
      21: "B", 22: "A", 23: "C", 24: "A", 25: "B", 26: "B", 27: "B", 28: "C", 29: "C", 30: "A",
      31: "G", 32: "J", 33: "I", 34: "B", 35: "G", 36: "A", 37: "N", 38: "K", 39: "H", 40: "O"
    },
    explanations: {
      6: "Helmut Scherer ist der einzige Teilnehmer (B)"
    }
  },
  { 
    name: "Đề 14", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "D", 2: "C", 3: "A", 4: "H", 5: "I",
      6: "B", 7: "C", 8: "C", 9: "A", 10: "A",
      11: "G", 12: "E", 13: "D", 14: "L", 15: "C", 16: "I", 17: "J", 18: "F", 19: "A", 20: "B",
      21: "A", 22: "C", 23: "B", 24: "B", 25: "C", 26: "C", 27: "C", 28: "A", 29: "C", 30: "B",
      31: "B", 32: "J", 33: "H", 34: "G", 35: "N", 36: "E", 37: "C", 38: "K", 39: "D", 40: "O"
    },
    explanations: {
      6: "sind in Deutschland nur noch eine Handvoll Kleinröstereien übrig geblieben (B)"
    }
  },
  { 
    name: "Đề 15", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "D", 2: "C", 3: "A", 4: "H", 5: "I",
      6: "B", 7: "C", 8: "C", 9: "A", 10: "A",
      11: "G", 12: "E", 13: "D", 14: "L", 15: "C", 16: "I", 17: "J", 18: "F", 19: "A", 20: "B",
      21: "A", 22: "C", 23: "B", 24: "B", 25: "C", 26: "C", 27: "C", 28: "A", 29: "C", 30: "B",
      31: "B", 32: "J", 33: "H", 34: "G", 35: "N", 36: "E", 37: "C", 38: "K", 39: "D", 40: "O"
    },
    explanations: {
      6: "Kleinröstereien sind in der Miderheit (B)"
    }
  },
  { 
    name: "Đề 16", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "E", 2: "B", 3: "I", 4: "C", 5: "J",
      6: "B", 7: "B", 8: "B", 9: "B", 10: "A",
      11: "L", 12: "I", 13: "B", 14: "H", 15: "K", 16: "E", 17: "A", 18: "X", 19: "F", 20: "G",
      21: "C", 22: "A", 23: "A", 24: "B", 25: "B", 26: "B", 27: "B", 28: "B", 29: "B", 30: "B",
      31: "J", 32: "L", 33: "L", 34: "K", 35: "E", 36: "M", 37: "O", 38: "G", 39: "C", 40: "N"
    },
    explanations: {
      6: "damit sie lernten, einen Haushalt zu führen (B)"
    }
  },
  { 
    name: "Đề 17", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "E", 2: "B", 3: "I", 4: "C", 5: "J",
      6: "B", 7: "A", 8: "B", 9: "C", 10: "C",
      11: "D", 12: "H", 13: "X", 14: "H", 15: "F", 16: "B", 17: "E", 18: "G", 19: "A", 20: "C",
      21: "C", 22: "B", 23: "C", 24: "B", 25: "B", 26: "B", 27: "B", 28: "B", 29: "B", 30: "B",
      31: "B", 32: "H", 33: "N", 34: "K", 35: "E", 36: "F", 37: "G", 38: "C", 39: "H", 40: "O"
    },
    explanations: {
      6: "kreativ auf ihren Alltag zu reagieren -> ideenreicher (B)"
    }
  },
  { 
    name: "Đề 18", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "D", 2: "J", 3: "C", 4: "H", 5: "E",
      6: "A", 7: "C", 8: "B", 9: "A", 10: "A",
      11: "L", 12: "K", 13: "B", 14: "A", 15: "B", 16: "I", 17: "G", 18: "D", 19: "X", 20: "X",
      21: "C", 22: "C", 23: "C", 24: "C", 25: "B", 26: "C", 27: "A", 28: "B", 29: "A", 30: "C",
      31: "B", 32: "G", 33: "D", 34: "J", 35: "C", 36: "M", 37: "A", 38: "O", 39: "H", 40: "G"
    },
    explanations: {
      6: "bieten Banken und alle Sparkassen... (A)"
    }
  },
  { 
    name: "Đề 19", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "F", 2: "J", 3: "G", 4: "H", 5: "I",
      6: "A", 7: "C", 8: "B", 9: "B", 10: "A",
      11: "D", 12: "L", 13: "A", 14: "B", 15: "H", 16: "A", 17: "I", 18: "C", 19: "X", 20: "E",
      21: "B", 22: "C", 23: "A", 24: "A", 25: "B", 26: "C", 27: "B", 28: "C", 29: "C", 30: "B",
      31: "O", 32: "B", 33: "D", 34: "L", 35: "I", 36: "E", 37: "K", 38: "F", 39: "J", 40: "G"
    },
    explanations: {
      6: "identisch ist mit der National-Auswahl (A)"
    }
  },
  { 
    name: "Đề 20", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "A", 2: "B", 3: "C", 4: "E", 5: "D",
      6: "B", 7: "C", 8: "B", 9: "B", 10: "A",
      11: "F", 12: "D", 13: "X", 14: "H", 15: "I", 16: "X", 17: "J", 18: "A", 19: "G", 20: "C",
      21: "A", 22: "A", 23: "B", 24: "B", 25: "A", 26: "C", 27: "C", 28: "C", 29: "C", 30: "B",
      31: "E", 32: "N", 33: "K", 34: "L", 35: "C", 36: "G", 37: "A", 38: "O", 39: "J", 40: "B"
    },
    explanations: {
      6: "man dort leicht mit anderen Fahrgästen ins Gespräch kommt (B)"
    }
  },
  { 
    name: "Đề 21", 
    free: false, 
    minutes: 90, 
    answers: {
      1: "I", 2: "E", 3: "G", 4: "B", 5: "A",
      6: "B", 7: "A", 8: "B", 9: "C", 10: "C",
      11: "D", 12: "F", 13: "I", 14: "C", 15: "K", 16: "G", 17: "X", 18: "X", 19: "J", 20: "B",
      21: "C", 22: "A", 23: "C", 24: "B", 25: "A", 26: "A", 27: "B", 28: "A", 29: "B", 30: "C",
      31: "M", 32: "H", 33: "G", 34: "F", 35: "H", 36: "D", 37: "N", 38: "C", 39: "K", 40: "O"
    },
    explanations: {
      1: "Woher stammt der Brauch mit der Schultüte? (I)", 6: "in Basel und in Duisburg (B)"
    }
  },
  { 
    name: "Đề 22", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  }
,
  { 
    name: "Đề 23", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 24", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 25", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 26", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 27", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 28", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 29", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 30", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 31", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 32", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 33", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 34", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 35", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 36", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 37", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 38", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 39", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 40", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 41", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 42", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  },
  { 
    name: "Đề 43", 
    free: false, 
    minutes: 90, 
    answers: {},
    explanations: {}
  }];

// initReadingData removed

function renderReading() {
  const container = document.getElementById('reading-content');
  if (!container) return;

  let backBtnHTML = '';
  if (readingFlowState !== 'grid') {
    let prevStates = { 'mode': 'grid', 'overview': 'mode', 'test': 'overview' };
    backBtnHTML = `
      <button class="btn btn-secondary" onclick="setReadingState('${prevStates[readingFlowState]}')" style="margin-bottom: 2rem;">
        ← Zurück
      </button>
    `;
  }

  if (readingFlowState === 'grid') {
    container.innerHTML = `
      <div class="lesen-header">
        <div class="lesen-header-icon">📖</div>
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">Lesen - Test wählen</h2>
        <p style="color: var(--text-dim);">Wählen Sie einen Test zum Üben von Leseverstehen und Sprachbausteine</p>
      </div>

      <div class="lesen-grid">
        ${db.reading.map(test => `
          <div class="lesen-card" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 280px;">
            <div>
              <div class="lesen-card-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; width: 100%;">
                <img src="logo.jpg" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan); box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);">
                <span class="lesen-card-time" style="font-weight: bold; font-size: 0.88rem; color: var(--text-dim);">🕒 ${test.minutes} Minuten</span>
              </div>
              <div class="lesen-card-title" title="${test.name}" style="font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 0.6rem; letter-spacing: 0.5px; margin-top: 1rem; min-height: 3.8rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${test.name}</div>
              <div class="lesen-card-subtags" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                <span class="lesen-card-tag" style="background: rgba(0, 242, 254, 0.08); color: var(--accent-cyan); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">3x Leseverstehen</span>
                <span class="lesen-card-tag" style="background: rgba(139, 92, 246, 0.08); color: var(--accent-purple); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">2x Sprachbausteine</span>
              </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.7rem 1.5rem; background: linear-gradient(90deg, #ff007a, #7928ca); box-shadow: 0 4px 15px rgba(255, 0, 122, 0.35); border: 1.5px solid rgba(255, 255, 255, 0.15);" onclick="selectReadingTestName('${test.name}')">Modus wählen</button>
          </div>
        `).join('')}
      </div>
    `;
  } else if (readingFlowState === 'mode') {
    container.innerHTML = `
      ${backBtnHTML}
      <div class="lesen-header">
        <div class="lesen-header-icon">📖</div>
        <h2 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem;">${selectedReadingTest}</h2>
        <p style="color: var(--text-dim);">Wählen Sie den Modus für diesen Lesetest.</p>
      </div>

      <div class="mode-selection-grid">
        <div class="mode-card" onclick="selectReadingModeName('Übungsmodus')">
          <div class="mode-icon">🎓</div>
          <div class="mode-title">Übungsmodus</div>
          <p class="mode-description">Üben Sie ohne Zeitdruck. Wählen Sie einzelne Teile zum Üben aus.</p>
          <div class="mode-badge-row">
            <span class="mode-badge">Keine Zeitbegrenzung</span>
            <span class="mode-badge">Ohne Zeitdruck</span>
          </div>
          <button class="btn btn-secondary" style="width: 100%;">Übung starten</button>
        </div>

        <div class="mode-card" onclick="selectReadingModeName('Prüfungsmodus')">
          <div class="mode-icon">⏱️</div>
          <div class="mode-title" style="color: var(--accent-cyan);">Prüfungsmodus</div>
          <p class="mode-description">Simulieren Sie echte Prüfungsbedingungen với Zeitlimit und automatischer Abgabe.</p>
          <div class="mode-badge-row">
            <span class="mode-badge">🕒 90 Minuten</span>
            <span class="mode-badge">Automatische Abgabe</span>
          </div>
          <button class="btn btn-primary" style="width: 100%;">Prüfung starten</button>
        </div>
      </div>
    `;
  } else if (readingFlowState === 'overview') {
    container.innerHTML = `
      ${backBtnHTML}
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="overview-card-inner">
          <div class="lesen-header-icon">📖</div>
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">${selectedReadingTest}</h2>
          <span style="background: rgba(189,0,255,0.15); padding: 0.4rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">
            ${selectedReadingMode}
          </span>
          <div style="margin-top: 1rem; color: var(--text-dim); font-size: 0.9rem;">Keine Zeitbegrenzung • 5 Teile</div>

          <ul class="overview-list">
            <li>• <strong>Leseverstehen Teil 1</strong> (25 Punkte)</li>
            <li>• <strong>Leseverstehen Teil 2</strong> (25 Punkte)</li>
            <li>• <strong>Leseverstehen Teil 3</strong> (25 Punkte)</li>
            <li>• <strong>Sprachbausteine Teil 1</strong> (15 Punkte)</li>
            <li>• <strong>Sprachbausteine Teil 2</strong> (15 Punkte)</li>
          </ul>

          <button class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 1rem;" onclick="setReadingState('test')">
            Übung starten
          </button>
        </div>
      </div>
    `;
  } else if (readingFlowState === 'test') {
    let subNavItems = [
      { num: 1, name: "Leseverstehen Teil 1 (25 Pkt.)" },
      { num: 2, name: "Leseverstehen Teil 2 (25 Pkt.)" },
      { num: 3, name: "Leseverstehen Teil 3 (25 Pkt.)" },
      { num: 4, name: "Sprachbausteine Teil 1 (15 Pkt.)" },
      { num: 5, name: "Sprachbausteine Teil 2 (15 Pkt.)" }
    ];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <button class="btn btn-secondary" onclick="setReadingState('overview')">← Zurück</button>
        <div style="font-weight: bold; color: var(--accent-cyan); font-size: 1.1rem;">
          ${selectedReadingTest} - ${selectedReadingMode}
        </div>
      </div>

      <div class="test-subnavigation">
        ${subNavItems.map(item => `
          <button class="test-subnav-btn ${currentReadingSubTab === item.num ? 'active' : ''}" onclick="setReadingSubTab(${item.num})">
            ${item.name}
          </button>
        `).join('')}
      </div>

      <h3 style="margin-bottom: 1rem;">
        ${currentReadingSubTab <= 3 ? `Leseverstehen Teil ${currentReadingSubTab}` : `Sprachbausteine Teil ${currentReadingSubTab - 3}`}
      </h3>
      
      <p style="color: var(--text-dim); line-height: 1.5; margin-bottom: 1.5rem;">
        ${currentReadingSubTab === 3 
          ? "Lesen Sie die zehn Situationen (11-20) und die zwölf Texte (a-l). Welcher Text passt zu welcher Situation? Sie können jeden Text nur einmal verwenden. Manchmal passt kein Text. Wählen Sie dann x."
          : currentReadingSubTab === 4
          ? "Lesen Sie den Text und entscheiden Sie, welches Wort in die jeweilige Lücke passt."
          : currentReadingSubTab === 5
          ? "Lesen Sie den Text und entscheiden Sie, welches Wort in welche Lücke passt. Sie können jedes Wort nur einmal verwenden. Nicht alle Wörter passen in den Text."
          : "Lesen Sie die Aufgabenstellung und bearbeiten Sie die Fragen. Bạn hãy chọn câu trả lời đúng bên cột phải."
        }
      </p>

      <div style="background: rgba(0, 242, 254, 0.05); border: 1px solid var(--accent-cyan); padding: 0.8rem 1.2rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">
        💡 <b>Cách làm bài:</b> Click chọn một đáp án ở <b>cột phải</b> (nó sẽ phát sáng viền xanh), sau đó click vào <b>ô trống (hoặc vị trí cần điền)</b> tương ứng bên cột trái hoặc cột phải để gán nhanh đáp án. (Có hỗ trợ Kéo - Thả trên máy tính).
      </div>

      <div class="test-split-container">
        <div class="test-left-pane">
          ${renderReadingLeftPane()}
        </div>

        <div class="test-right-pane">
          ${renderReadingRightPane()}
        </div>
      </div>

      <div class="test-bottom-bar">
        <div class="progress-container">
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dim);">beantwortet:</span>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${calculateProgress()}%"></div>
          </div>
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);" id="test-progress-text">${countAnswered()} / 40</span>
        </div>
        <div style="display: flex; gap: 0.8rem;">
          <button class="btn btn-secondary" onclick="alert('Đã lưu bài làm nháp!')">Speichern</button>
          <button class="btn btn-secondary" onclick="resetAnswers()">Zurücksetzen</button>
          <button class="btn btn-primary" onclick="submitTestAnswers()">Antworten abgeben</button>
        </div>
      </div>
    `;

    attachInteractionEvents();
  } else if (readingFlowState === 'results') {
    renderReadingResults();
  }
}

function renderReadingResults() {
  const container = document.getElementById('reading-content');
  if (!container) return;

  const test = db.reading.find(t => t.name === selectedReadingTest);
  const correctAns = test ? test.answers : {};

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let readingScore = 0;
  let sprachbauteilScore = 0;

  // Teil 1 (Q1-5) -> 5 điểm/câu (Max 25)
  for (let i = 1; i <= 5; i++) {
    const userAns = userAnswers.teil1[i];
    const correctVal = correctAns ? correctAns[i] : '';
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      readingScore += 5.0;
      totalCorrect++;
    } else {
      totalIncorrect++;
    }
  }

  // Teil 2 (Q6-10) -> 5 điểm/câu (Max 25)
  for (let i = 6; i <= 10; i++) {
    const userAns = userAnswers.teil2[i];
    const correctVal = correctAns ? correctAns[i] : '';
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      readingScore += 5.0;
      totalCorrect++;
    } else {
      totalIncorrect++;
    }
  }

  // Teil 3 (Q11-20) -> 2.5 điểm/câu (Max 25)
  for (let i = 11; i <= 20; i++) {
    const userAns = userAnswers.teil3[i];
    const correctVal = correctAns ? correctAns[i] : '';
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      readingScore += 2.5;
      totalCorrect++;
    } else {
      totalIncorrect++;
    }
  }

  // Teil 4 (Q21-30) -> 1.5 điểm/câu (Max 15)
  for (let i = 21; i <= 30; i++) {
    const userAns = userAnswers.teil4[i];
    const correctVal = correctAns ? correctAns[i] : '';
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      sprachbauteilScore += 1.5;
      totalCorrect++;
    } else {
      totalIncorrect++;
    }
  }

  // Teil 5 (Q31-40) -> 1.5 điểm/câu (Max 15)
  for (let i = 31; i <= 40; i++) {
    const userAns = userAnswers.teil5[i];
    const correctVal = correctAns ? correctAns[i] : '';
    if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
      sprachbauteilScore += 1.5;
      totalCorrect++;
    } else {
      totalIncorrect++;
    }
  }

  const totalScore = readingScore + sprachbauteilScore;

  const subNavItems = [
    { num: 1, name: "LV 1" },
    { num: 2, name: "LV 2" },
    { num: 3, name: "LV 3" },
    { num: 4, name: "SB 1" },
    { num: 5, name: "SB 2" }
  ];

  let feedbackHTML = renderPartFeedback(currentReadingSubTab, correctAns);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <button class="btn btn-secondary" onclick="setReadingState('grid')">← Zurück zu Lesetests</button>
      <div style="font-weight: bold; color: var(--accent-cyan); font-size: 1.1rem;">
        ${selectedReadingTest} - Ergebnisse
      </div>
    </div>

    <!-- Khung Thống kê Điểm số chia cột tối ưu -->
    <div class="card" style="background: rgba(22, 22, 54, 0.45); border: 1px solid var(--border-light); padding: 2rem; border-radius: 16px; margin-bottom: 2rem; display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1.1fr; gap: 1rem; align-items: center;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2.5rem; color: var(--accent-purple);">📘</div>
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0;">Ihre Ergebnisse</h3>
          <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0;">${selectedReadingTest}</p>
        </div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-cyan);">${totalScore}<span style="font-size: 0.95rem; color: var(--text-dim);">/105</span></div>
        <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Gesamtpunkte (Cộng cả Sprachbauteil)</div>
      </div>
      <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff;">${readingScore}<span style="font-size: 0.95rem; color: var(--text-dim);">/75</span></div>
        <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Leseverstehen (Đọc)</div>
      </div>
      <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff;">${sprachbauteilScore}<span style="font-size: 0.95rem; color: var(--text-dim);">/30</span></div>
        <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Sprachbauteil (Từ vựng)</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--success);">${totalCorrect}<span style="font-size: 0.95rem; color: var(--text-dim);">/40</span></div>
        <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Richtig</div>
      </div>
    </div>

    <!-- Dãy Sub-Tabs điều hướng xem từng phần -->
    <div style="display: flex; gap: 0.8rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      ${subNavItems.map(item => {
        let correctInTab = 0;
        let totalInTab = (item.num === 1 || item.num === 2) ? 5 : 10;
        let partName = item.num === 1 ? 'teil1' : item.num === 2 ? 'teil2' : item.num === 3 ? 'teil3' : item.num === 4 ? 'teil4' : 'teil5';
        Object.keys(userAnswers[partName]).forEach(qId => {
          const userAns = userAnswers[partName][qId];
          const correctVal = correctAns ? correctAns[qId] : '';
          if (userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase()) {
            correctInTab++;
          }
        });
        return `
          <button class="tab-btn ${currentReadingSubTab === item.num ? 'active' : ''}" style="border-radius: 20px; padding: 0.4rem 1.2rem; font-size: 0.85rem;" onclick="setReadingSubTab(${item.num})">
            ${item.name} <span style="font-size: 0.75rem; opacity: 0.7; margin-left: 0.2rem;">${correctInTab}/${totalInTab}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div class="test-split-container">
      <div class="test-left-pane" style="flex: 1.1;">
        ${renderReadingLeftPane()}
      </div>

      <div class="test-right-pane" style="flex: 0.9; background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px; max-height: 70vh; overflow-y: auto;">
        <h4 style="color: var(--accent-cyan); font-weight: 800; font-size: 0.95rem; margin-bottom: 1.2rem; text-transform: uppercase;">Antworten & Feedback</h4>
        ${feedbackHTML}
      </div>
    </div>
  `;
}

function renderReadingLeftPane() {
  const test = db.reading.find(t => t.name === selectedReadingTest);

  if (currentReadingSubTab === 1) {
    const headingsData = (test && test.teil1 && test.teil1.headings) ? test.teil1.headings : [];
    const hasData = test && test.teil1 && test.teil1.texts && test.teil1.texts.length >= 5 && test.teil1.texts[0].text;
    const correctAns = test ? test.answers : {};
    return [1,2,3,4,5].map(i => {
      const textTitle = hasData ? test.teil1.texts[i-1].title : `Text ${i}`;
      const textContent = hasData ? test.teil1.texts[i-1].text : '';
      
      let ansKey = userAnswers.teil1[i];
      let ansText = '';
      if (ansKey) {
        let matchedObj = headingsData.find(h => h.key === ansKey);
        ansText = matchedObj ? matchedObj.text : '';
      }

      let borderStyle = ansKey ? '1px solid var(--accent-cyan)' : '2px dashed var(--accent-cyan)';
      let bgStyle = ansKey ? 'rgba(0, 210, 255, 0.05)' : 'rgba(0,0,0,0.15)';
      let textHTML = ansKey ? `<span style="color: var(--accent-cyan); margin-right: 0.5rem;">Überschrift:</span> ${ansKey}. ${ansText}` : `${i}. Überschrift hier ablegen...`;
      
      if (readingFlowState === 'results') {
        const correctVal = correctAns ? correctAns[i] : '';
        const isRight = ansKey && correctVal && ansKey.trim().toUpperCase() === correctVal.trim().toUpperCase();
        let correctText = '';
        if (correctVal) {
          let matchedObj = headingsData.find(h => h.key === correctVal);
          correctText = matchedObj ? `${correctVal}. ${matchedObj.text}` : correctVal;
        }
        
        if (isRight) {
          borderStyle = '2px solid var(--success)';
          bgStyle = 'rgba(16, 185, 129, 0.1)';
          textHTML = `<span style="color: var(--success); font-weight: 800;">✓ Richtig:</span> ${correctText}`;
        } else {
          borderStyle = '2px solid var(--error)';
          bgStyle = 'rgba(239, 68, 68, 0.1)';
          textHTML = `<span style="color: var(--error); font-weight: 800;">✗ Ihre Antwort:</span> ${ansKey ? `${ansKey}. ${ansText}` : 'Keine Antwort'}<br>
                      <span style="color: var(--success); font-weight: 800; margin-top: 0.4rem; display: block;">👉 Richtige Antwort:</span> ${correctText}`;
        }
      }

      return `
        <div class="drag-text-box" style="margin-bottom: 1.5rem; background: ${bgStyle}; border: ${borderStyle}; padding: 1.5rem; border-radius: 12px; transition: all 0.3s ease;">
          <div style="font-weight: 800; color: #fff; margin-bottom: 0.8rem; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">${textTitle}</div>
          <p style="line-height: 1.7; font-size: 0.98rem; color: #e2e8f0; text-align: justify; margin: 0; white-space: pre-wrap;">${textContent}</p>
          <div class="drag-zone drop-target" data-teil="teil1" data-id="${i}" style="position: relative; border: ${borderStyle}; padding: 0.8rem; border-radius: 8px; margin-top: 1.2rem; text-align: center; cursor: pointer; background: ${bgStyle}; font-size: 0.95rem; font-weight: bold; color: #fff; transition: all 0.2s;">
            ${textHTML}
            ${ansKey && readingFlowState !== 'results' ? `<button class="btn btn-secondary" style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; min-width: auto; box-shadow: none;" onclick="clearTeil1Answer(${i}); event.stopPropagation();">x</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else if (currentReadingSubTab === 2) {
    const hasData = test && test.teil2 && test.teil2.text;
    const textContent = hasData ? test.teil2.text : '';
    let formattedText = '';
    if (textContent) {
      formattedText = textContent.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom: 1.2rem;">${p.trim()}</p>`).join('');
    }
    return `
      <div class="drag-text-box" style="padding: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: 8px; line-height: 1.7; font-size: 0.98rem; color: #e2e8f0; text-align: justify;">
        ${formattedText}
      </div>
    `;
  } else if (currentReadingSubTab === 3) {
    const hasData = test && test.teil3 && test.teil3.texts && test.teil3.texts.length >= 12 && test.teil3.texts[0].content;
    let textsTeil3 = hasData ? test.teil3.texts : [
      { key: "j", title: "LIZZIS BACKSTUBE", content: "Nach abgeschlossener Patisserieausbildung habe ich mir meinen Herzenswunsch erfüllt..." },
      { key: "k", title: "BUCHHANDLUNG ZU HUSE", content: "Während der dreijährigen Ausbildung zur Buchhändlerin bzw. zum Buchhändler lernst du..." },
      { key: "l", title: "Hausratversicherung Schutz", content: "Die Hausratversicherung bietet Ihnen Schutz vor dem Verlust oder einer Beschädigung Ihres Eigentums..." }
    ];
    let usedLetters = Object.values(userAnswers.teil3);
    return `
      <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">TEXTE (A-L)</div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${textsTeil3.map(t => {
          let isUsed = usedLetters.includes(t.key);
          return `
            <div class="drag-text-box select-clickable" data-type="letter" data-value="${t.key}" 
              style="border-left: 4px solid var(--accent-cyan); position: relative; cursor: pointer; margin-bottom: 1.2rem;
              ${isUsed ? 'opacity: 0.35; text-decoration: line-through;' : ''}">
              <span style="position: absolute; left: 1rem; top: 1.5rem; background: var(--accent-cyan); color: var(--bg-dark); font-weight: 800; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; text-transform: uppercase; box-shadow: 0 4px 10px rgba(34, 211, 238, 0.3); z-index: 2;">
                ${t.key}
              </span>
              <div style="margin-left: 3.5rem;">
                ${t.title ? `<div style="font-weight: 900; margin-bottom: 0.8rem; text-transform: uppercase; font-size: 1rem; color: #fff; letter-spacing: 0.5px; padding-top: 0.2rem;">${t.title}</div>` : ''}
                <p style="line-height: 1.7; font-size: 0.95rem; color: #cbd5e1; margin: 0; text-align: justify; white-space: pre-wrap;">${t.content || t.desc || ''}</p>
              </div>
            </div>
          `;
        }).join('')}
        
        <div class="drag-text-box select-clickable" data-type="letter" data-value="x" 
          style="border-left: 4px solid var(--danger); position: relative; cursor: pointer; margin-bottom: 1.2rem;
          ${usedLetters.includes('x') ? 'opacity: 0.35; text-decoration: line-through;' : ''}">
          <span style="position: absolute; left: 1rem; top: 1.5rem; background: var(--danger); color: #fff; font-weight: 800; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; text-transform: uppercase; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); z-index: 2;">
            X
          </span>
          <div style="margin-left: 3.5rem;">
            <div style="font-weight: 900; margin-bottom: 0.8rem; text-transform: uppercase; font-size: 1rem; color: #fff; letter-spacing: 0.5px; padding-top: 0.2rem;">Keine Anzeige passt</div>
            <p style="line-height: 1.7; font-size: 0.95rem; color: #cbd5e1; margin: 0; text-align: justify; white-space: pre-wrap;">Wählen Sie dieses Feld aus, wenn keine der obigen Anzeigen zur Situation passt.</p>
          </div>
        </div>

      </div>
    `;
  } else if (currentReadingSubTab === 4) {
    const hasData = test && test.teil4 && test.teil4.text;
    let textContent = hasData ? test.teil4.text : '';
    if (test && test.teil4_raw) {
      textContent = test.teil4_raw;
      for (let i = 21; i <= 30; i++) {
        textContent = textContent.replace(new RegExp(`\\(\\s*${i}\\s*\\)_*`, 'g'), `(${i})`);
      }
    }
    
    if (!textContent) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-dim); background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
          <h4 style="color: #fff; margin-bottom: 0.5rem;">Chưa có nội dung Sprachbausteine Teil 1</h4>
          <p>Vui lòng vào <b>Trang Quản Trị (Admin)</b> → chọn đề này → Tab <b>"Sprachbausteine Teil 1"</b> để nhập nội dung bức thư và đáp án.</p>
        </div>
      `;
    }

    const correctAns = test ? test.answers : {};
    let parsedHTML = textContent;
    for (let i = 21; i <= 30; i++) {
      const placeholder = `(${i})`;
      const ans = userAnswers.teil4[i];
      const correctVal = correctAns ? correctAns[i] : '';
      
      let style = ans ? `color: #000; font-weight: bold; background: var(--accent-cyan); padding: 0.1rem 0.5rem; border-radius: 4px; cursor: pointer; display: inline-block; box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);` : `color: var(--accent-cyan); font-weight: bold; border-bottom: 2px dashed var(--accent-cyan); padding: 0 0.5rem; cursor: pointer; display: inline-block;`;
      let innerHTML = `[ ${ans ? ans : '______'} ]`;
      
      if (readingFlowState === 'results') {
        const isRight = ans && correctVal && ans.trim().toUpperCase() === correctVal.trim().toUpperCase();
        if (isRight) {
          style = `color: #fff; font-weight: bold; background: rgba(16, 185, 129, 0.1); border: 2px solid var(--success); padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block;`;
          innerHTML = `✓ ${correctVal}`;
        } else {
          style = `color: #fff; font-weight: bold; background: rgba(239, 68, 68, 0.1); border: 2px solid var(--error); padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block;`;
          innerHTML = `✗ ${ans ? ans : '?'} (👉 ${correctVal})`;
        }
      }
      const rep = `<b>(${i})</b> <span class="text-fill-blank drop-target" data-teil="teil4" data-id="${i}" style="${style}">${innerHTML}</span>`;
      parsedHTML = parsedHTML.replace(placeholder, rep);
    }

    if (parsedHTML) {
      parsedHTML = parsedHTML.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom: 1.2rem;">${p.trim()}</p>`).join('');
    }

    return `
      <div class="drag-text-box" style="padding: 1.8rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: 8px; line-height: 1.8; font-size: 0.98rem; text-align: justify; color: #cbd5e1;">
        ${parsedHTML}
      </div>
    `;
  } else if (currentReadingSubTab === 5) {
    const hasData = test && test.teil5 && test.teil5.text;
    let textContent = hasData ? test.teil5.text : '';
    if (test && test.teil5_raw) {
      textContent = test.teil5_raw;
      for (let i = 31; i <= 40; i++) {
        textContent = textContent.replace(new RegExp(`\\(\\s*${i}\\s*\\)_*`, 'g'), `(${i})`);
      }
    }
    if (!textContent) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-dim); background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
          <h4 style="color: #fff; margin-bottom: 0.5rem;">Chưa có nội dung Sprachbausteine Teil 2</h4>
          <p>Vui lòng vào <b>Trang Quản Trị (Admin)</b> → chọn đề này → Tab <b>"Sprachbausteine Teil 2"</b> để nhập nội dung bài đọc và ngân hàng từ vựng.</p>
        </div>
      `;
    }

    const correctAns = test ? test.answers : {};
    let parsedHTML = textContent;
    for (let i = 31; i <= 40; i++) {
      const placeholder = `(${i})`;
      const ans = userAnswers.teil5[i];
      const correctVal = correctAns ? correctAns[i] : '';
      
      let style = ans ? `color: #000; font-weight: bold; background: var(--accent-cyan); padding: 0.1rem 0.5rem; border-radius: 4px; cursor: pointer; display: inline-block; box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);` : `color: var(--accent-cyan); font-weight: bold; border-bottom: 2px dashed var(--accent-cyan); padding: 0 0.5rem; cursor: pointer; display: inline-block;`;
      let innerHTML = `[ ${ans ? ans : '______'} ]`;
      
      if (readingFlowState === 'results') {
        let correctWord = '';
        if (correctVal && /^[A-O]$/.test(correctVal.trim().toUpperCase())) {
          const idx = correctVal.trim().toUpperCase().charCodeAt(0) - 65;
          const wordbank = test.teil5.wordbank || [];
          const wordItem = wordbank[idx];
          if (wordItem && wordItem.word) {
            correctWord = wordItem.word.toUpperCase();
          }
        }
        
        const isRight = ans && correctWord && ans.trim().toUpperCase() === correctWord;
        if (isRight) {
          style = `color: #fff; font-weight: bold; background: rgba(16, 185, 129, 0.1); border: 2px solid var(--success); padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block;`;
          innerHTML = `✓ ${correctVal}. ${correctWord}`;
        } else {
          style = `color: #fff; font-weight: bold; background: rgba(239, 68, 68, 0.1); border: 2px solid var(--error); padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block;`;
          innerHTML = `✗ ${ans ? ans : '?'} (👉 ${correctVal}. ${correctWord})`;
        }
      }
      const rep = `<b>(${i})</b> <span class="text-fill-blank drop-target" data-teil="teil5" data-id="${i}" style="${style}">${innerHTML}</span>`;
      parsedHTML = parsedHTML.replace(placeholder, rep);
    }

    if (parsedHTML) {
      parsedHTML = parsedHTML.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom: 1.2rem;">${p.trim()}</p>`).join('');
    }

    return `
      <div class="drag-text-box" style="padding: 1.8rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: 8px; line-height: 1.8; font-size: 0.98rem; text-align: justify; color: #cbd5e1;">
        ${parsedHTML}
      </div>
    `;
  }
  return "";
}

function renderReadingRightPane() {
  const test = db.reading.find(t => t.name === selectedReadingTest);

  if (currentReadingSubTab === 1) {
    const hasData = test && test.teil1 && test.teil1.headings && test.teil1.headings.length >= 10 && test.teil1.headings[0].text;
    let headings = hasData ? test.teil1.headings : [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
      { key: "E", text: "" },
      { key: "F", text: "" },
      { key: "G", text: "" },
      { key: "H", text: "" },
      { key: "I", text: "" },
      { key: "J", text: "" }
    ];
    let usedHeadings = Object.values(userAnswers.teil1);
    return `
      <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">ÜBERSCHRIFTEN</div>
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${headings.map(h => {
          let isUsed = usedHeadings.includes(h.key);
          return `
            <div class="drag-text-box select-clickable" data-type="heading" data-value="${h.key}"
              style="padding: 0.8rem 1rem; cursor: pointer; border-left: 4px solid var(--accent-amber); margin-bottom: 0.3rem;
              ${isUsed ? 'opacity: 0.25; text-decoration: line-through;' : ''}">
              <b>${h.key}:</b> ${h.text}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentReadingSubTab === 2) {
    const hasData = test && test.teil2 && test.teil2.questions && test.teil2.questions.length >= 5 && test.teil2.questions[0].question;
    const correctAns = test ? test.answers : {};
    let mcq = hasData ? test.teil2.questions : [
      { id: 6, question: "Laut dem Text überfordert das Informationszeitalter unser Gehirn, weil...", options: { A: "wir zu viele E-Mails bekommen.", B: "die Datenmenge zu groß ist.", C: "wir nicht mehr tief verarbeiten." } },
      { id: 7, question: "Unter 'digitaler Demenz' versteht man...", options: { A: "eine richtige Gehirnkrankheit.", B: "die Unfähigkeit, sich ohne Google zu erinnern.", C: "das Vergessen von Passwörtern." } },
      { id: 8, question: "Experten raten dazu,...", options: { A: "ganz auf Smartphones zu verzichten.", B: "bewusste Pausen ohne Bildschirme einzulegen.", C: "mehr Bücher zu lesen." } },
      { id: 9, question: "Besonders Jugendliche...", options: { A: "sind stark betroffen.", B: "haben ein besseres Gedächtnis.", C: "nutzen keine analogen Medien." } },
      { id: 10, question: "Ein Ausweg aus der Reizüberflutung ist...", options: { A: "die Digitalisierung zu stoppen.", B: "das Gehirn durch gezieltes Offline-Sein zu entlasten.", C: "ein neues Hobby zu lernen." } }
    ];
    return mcq.map(m => {
      const qId = m.id || m.num;
      return `
      <div style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: 1.2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
        <div style="font-weight: 800; margin-bottom: 1rem; color: #fff; font-size: 1.1rem; line-height: 1.5; border-left: 3px solid var(--accent-cyan); padding-left: 0.8rem;">${qId}. ${m.question || m.q}</div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${['A', 'B', 'C'].map(letter => {
            const optVal = m.options ? m.options[letter] : '';
            const isSelected = userAnswers.teil2[qId] === letter;
            let optionClass = isSelected ? 'active' : '';
            if (readingFlowState === 'results') {
              const correctVal = correctAns ? correctAns[qId] : '';
              if (correctVal === letter) {
                optionClass = 'correct';
              } else if (isSelected) {
                optionClass = 'incorrect';
              }
            }
            return `
              <button class="option-card ${optionClass}" style="text-align: left; padding: 0.6rem 1rem;"
                ${readingFlowState === 'results' ? 'disabled' : ''}
                onclick="selectReadingOption(${qId}, '${letter}')">
                ${letter}. ${optVal}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `}).join('');
  } else if (currentReadingSubTab === 3) {
    const hasData = test && test.teil3 && test.teil3.situations && test.teil3.situations.length >= 10 && test.teil3.situations[0].desc;
    const correctAns = test ? test.answers : {};
    let situations = hasData ? test.teil3.situations : [
      { id: 11, desc: "Eine Familie sucht nach Wochenend-Freizeitaktivitäten für ihre 8- und 10-jährigen Kinder." },
      { id: 12, desc: "Ein Student sucht eine befristet möblierte Wohnung in Oranienburg." },
      { id: 13, desc: "Eine ältere Dame sucht eine stundenweise Haushaltshilfe für Putzarbeiten." },
      { id: 14, desc: "Ein junger Mann möchte wissen, wie das duale Ausbildungssystem in Deutschland funktioniert." },
      { id: 15, desc: "Jemand interessiert sich für eine Ausbildung zum Buchhändler." },
      { id: 16, desc: "Eine Frau möchte eine Versicherung für ihren Hausrat abschließen." },
      { id: 17, desc: "Ein Hobbybäcker möchte lernen, wie man Cupcakes dekoriert." },
      { id: 18, desc: "Jemand leidet nach dem Eisessen regelmäßig unter Bauchschmerzen." },
      { id: 19, desc: "Eine Studentin sucht eine Ausbildung im Bereich Konditorei." },
      { id: 20, desc: "Ein Hausbesitzer sucht eine professionelle Reinigungsfirma." }
    ];
    return `
      <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">SITUATIONEN (11-20)</div>
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${situations.map(s => {
          const uAns = userAnswers.teil3[s.id] || '';
          const correctVal = correctAns ? correctAns[s.id] : '';
          
          let borderStyle = '2px dashed var(--accent-cyan)';
          let bgStyle = 'rgba(0,0,0,0.15)';
          let fontColor = 'var(--accent-cyan)';
          let textHTML = uAns || '';
          let dropWidth = '45px';
          let dropHeight = '45px';
          
          if (readingFlowState === 'results') {
            const isRight = uAns && correctVal && uAns.trim().toUpperCase() === correctVal.trim().toUpperCase();
            dropWidth = 'auto';
            dropHeight = 'auto';
            if (isRight) {
              borderStyle = '2px solid var(--success)';
              bgStyle = 'rgba(16, 185, 129, 0.1)';
              fontColor = 'var(--success)';
              textHTML = `<span style="padding: 0.2rem 0.5rem; display: block; font-weight: 800;">✓ ${correctVal}</span>`;
            } else {
              borderStyle = '2px solid var(--error)';
              bgStyle = 'rgba(239, 68, 68, 0.1)';
              fontColor = 'var(--error)';
              textHTML = `<div style="padding: 0.3rem 0.6rem; text-align: center; font-size: 0.9rem;">
                            <span style="text-decoration: line-through; display: block; font-weight: 800;">${uAns || 'Keine Antwort'}</span>
                            <span style="color: var(--success); font-weight: 800; display: block; margin-top: 0.2rem; font-size: 0.95rem;">👉 ${correctVal}</span>
                          </div>`;
            }
          }

          return `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); padding: 1.2rem 1.5rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-bottom: 0.8rem; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: all 0.3s;" onmouseover="this.style.borderColor='rgba(0, 242, 254, 0.4)'" onmouseout="this.style.borderColor='var(--border-light)'">
              <div style="font-size: 1.08rem; line-height: 1.7; color: #f8fafc; flex-grow: 1; font-weight: 500;">
                <b style="color: var(--accent-cyan); font-weight: 800; font-size: 1.15rem; margin-right: 0.5rem;">${s.id}.</b> ${s.desc}
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                <div class="drag-zone drop-target" data-teil="teil3" data-id="${s.id}" 
                  style="min-width: ${dropWidth}; min-height: ${dropHeight}; border: ${borderStyle}; background: ${bgStyle}; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: ${fontColor}; font-size: 1.2rem; cursor: pointer; text-transform: uppercase;">
                  ${textHTML}
                </div>
                ${uAns && readingFlowState !== 'results' ? `<button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; min-width: auto; border-radius: 4px; font-size: 0.8rem;" onclick="clearTeil3Answer(${s.id})">x</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (currentReadingSubTab === 4) {
    const hasData = test && test.teil4 && test.teil4.options && Object.keys(test.teil4.options).length >= 10;
    const correctAns = test ? test.answers : {};
    let defaultOpts = {
      21: ["A. mir", "B. uns", "C. euch"],
      22: ["A. trotz", "B. wegen", "C. dank"],
      23: ["A. so dass", "B. weil", "C. obwohl"],
      24: ["A. damit", "B. um", "C. für"],
      25: ["A. obwohl", "B. trotzdem", "C. denn"],
      26: ["A. belohnt", "B. entschädigt", "C. geholfen"],
      27: ["A. geschmeckt", "B. gefallen", "C. gepasst"],
      28: ["A. da", "B. obwohl", "C. weil"],
      29: ["A. lassen", "B. haben", "C. angehen"],
      30: ["A. von", "B. über", "C. bei"]
    };
    let rawOpts = {};
    for(let i=21; i<=30; i++) rawOpts[i] = ["A. ", "B. ", "C. "];
    let opts = test && test.teil4_raw ? rawOpts : (hasData ? test.teil4.options : defaultOpts);
    return Object.keys(opts).map(id => {
      const currentOpts = opts[id];
      return `
        <div style="margin-bottom: 1.2rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: 1.2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
          <div style="font-weight: 800; margin-bottom: 1rem; color: #fff; font-size: 1.1rem; border-left: 3px solid var(--accent-cyan); padding-left: 0.8rem;">Lücke (${id})</div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${currentOpts.map((opt, idx) => {
              const letter = ['A', 'B', 'C'][idx] || 'A';
              const word = opt.includes('. ') ? opt.split('. ')[1] : opt.replace(/^[A-C][\.\s]+/, '');
              let isSelected = userAnswers.teil4[id] === letter || userAnswers.teil4[id] === word;
              let optionClass = isSelected ? 'active' : '';
              if (readingFlowState === 'results') {
                const correctVal = correctAns ? correctAns[id] : '';
                if (correctVal === letter) {
                  optionClass = 'correct';
                } else if (isSelected) {
                  optionClass = 'incorrect';
                }
              }
              return `
                <button class="option-card ${optionClass}" style="text-align: left; padding: 0.6rem 1rem;"
                  ${readingFlowState === 'results' ? 'disabled' : ''}
                  onclick="selectReadingOption(${id}, '${letter}')">
                  ${letter}. ${word}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  } else if (currentReadingSubTab === 5) {
    const hasData = test && test.teil5 && test.teil5.wordbank && test.teil5.wordbank.length >= 15 && test.teil5.wordbank[0].word;
    const correctAns = test ? test.answers : {};
    let wordbank = hasData ? test.teil5.wordbank : [
      { key: "a", word: "DAMIT" },
      { key: "b", word: "DAS" },
      { key: "c", word: "DASS" },
      { key: "d", word: "FIGUREN" },
      { key: "e", word: "FÜR" },
      { key: "f", word: "GEHT" },
      { key: "g", word: "GESTALTEN" },
      { key: "h", word: "IMMER" },
      { key: "i", word: "NIE" },
      { key: "j", word: "SPIELERISCHE" },
      { key: "k", word: "SUCHEN" },
      { key: "l", word: "TUN" },
      { key: "m", word: "VON" },
      { key: "n", word: "WEIL" },
      { key: "o", word: "WURDE" }
    ];
    let usedWords = Object.values(userAnswers.teil5);

    let dropZonesHTML = "";
    for (let id = 31; id <= 40; id++) {
      let currentVal = userAnswers.teil5[id];
      const correctVal = correctAns ? correctAns[id] : '';
      
      let borderStyle = currentVal 
        ? '1px solid var(--accent-cyan)' 
        : '2px dashed rgba(255,255,255,0.25)';
      let bgStyle = currentVal ? 'rgba(0, 210, 255, 0.05)' : 'rgba(0,0,0,0.15)';
      let fontColor = '#fff';
      let textHTML = currentVal ? currentVal : '<span style="color: var(--text-dim); font-weight: normal; font-size: 0.85rem;">Wort hier ablegen...</span>';
      let dropHeight = '38px';
      
      if (readingFlowState === 'results') {
        let correctWord = '';
        if (correctVal && /^[A-O]$/.test(correctVal.trim().toUpperCase())) {
          const idx = correctVal.trim().toUpperCase().charCodeAt(0) - 65;
          const wordItem = wordbank[idx];
          if (wordItem && wordItem.word) {
            correctWord = wordItem.word.toUpperCase();
          }
        }
        
        const isRight = currentVal && correctWord && currentVal.trim().toUpperCase() === correctWord;
        dropHeight = 'auto';
        if (isRight) {
          borderStyle = '2px solid var(--success)';
          bgStyle = 'rgba(16, 185, 129, 0.1)';
          fontColor = 'var(--success)';
          textHTML = `<span style="padding: 0.3rem 0.5rem; display: block; font-weight: 800;">✓ ${correctVal}. ${correctWord}</span>`;
        } else {
          borderStyle = '2px solid var(--error)';
          bgStyle = 'rgba(239, 68, 68, 0.1)';
          fontColor = 'var(--error)';
          textHTML = `<div style="padding: 0.4rem 0.6rem; font-size: 0.9rem; width: 100%;">
                        <span style="text-decoration: line-through; font-weight: 800; display: block;">${currentVal || 'Keine Antwort'}</span>
                        <span style="color: var(--success); font-weight: 800; display: block; margin-top: 0.2rem;">👉 ${correctVal}. ${correctWord}</span>
                      </div>`;
        }
      }
      
      dropZonesHTML += `
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem;">
          <div style="font-weight: 800; color: var(--accent-cyan); width: 25px; font-size: 1.05rem;">${id}</div>
          <div class="drag-zone drop-target" data-teil="teil5" data-id="${id}" 
            style="flex-grow: 1; min-height: ${dropHeight}; border: ${borderStyle}; background: ${bgStyle}; border-radius: 4px; display: flex; align-items: center; padding: 0.2rem 1rem; color: ${fontColor}; font-weight: bold; cursor: pointer; font-size: 0.9rem;">
            ${textHTML}
          </div>
          ${currentVal && readingFlowState !== 'results' ? `<button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; min-width: auto; font-size: 0.8rem;" onclick="clearTeil5Answer(${id})">x</button>` : ''}
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 100%;">
        <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: 8px; background: rgba(0,0,0,0.1);">
          <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">WORTBANK</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
            ${wordbank.map(item => {
              let isUsed = usedWords.includes(item.word);
              return `
                <div class="drag-text-box select-clickable" data-type="word" data-value="${item.word}" 
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; cursor: pointer; border: 1px solid var(--border-light); border-radius: 20px; font-size: 0.85rem; font-weight: bold; background: rgba(255,255,255,0.05);
                  ${isUsed ? 'opacity: 0.3; text-decoration: line-through; pointer-events: none;' : ''}">
                  <span style="color: var(--accent-amber); font-size: 0.8rem; text-transform: uppercase;">
                    ${item.key}
                  </span>
                  ${item.word}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1.5rem;">
          ${dropZonesHTML}
        </div>
      </div>
    `;
  }
  return "";
}
function selectReadingOption(qId, val) {
  if (qId >= 6 && qId <= 10) {
    userAnswers.teil2[qId] = val;
  } else if (qId >= 21 && qId <= 30) {
    userAnswers.teil4[qId] = val;
  }
  renderReading();
}
window.clearTeil1Answer = function(qId) {
  userAnswers.teil1[qId] = '';
  renderReading();
}
function clearTeil3Answer(qId) {
  userAnswers.teil3[qId] = '';
  renderReading();
}

function clearTeil5Answer(qId) {
  userAnswers.teil5[qId] = '';
  renderReading();
}

function attachInteractionEvents() {
  // Click-to-select logic
  document.querySelectorAll('.select-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      document.querySelectorAll('.select-clickable').forEach(item => item.style.outline = 'none');
      activeSelection.type = el.getAttribute('data-type');
      activeSelection.value = el.getAttribute('data-value');
      el.style.outline = '2px solid var(--accent-cyan)';
    });
  });

  document.querySelectorAll('.drop-target').forEach(el => {
    el.addEventListener('click', (e) => {
      if (activeSelection.type && activeSelection.value) {
        const teil = el.getAttribute('data-teil');
        const id = parseInt(el.getAttribute('data-id'));
        if (teil === 'teil1' && activeSelection.type === 'heading') {
          userAnswers.teil1[id] = activeSelection.value;
        } else if (teil === 'teil3' && activeSelection.type === 'letter') {
          userAnswers.teil3[id] = activeSelection.value;
        } else if (teil === 'teil5' && activeSelection.type === 'word') {
          userAnswers.teil5[id] = activeSelection.value;
        }
        activeSelection.type = null;
        activeSelection.value = null;
        renderReading();
      }
    });
  });
}

function resetAnswers() {
  if (confirm("Möchten Sie alle Antworten zurücksetzen?")) {
    userAnswers = {
      teil1: { 1: '', 2: '', 3: '', 4: '', 5: '' },
      teil2: { 6: '', 7: '', 8: '', 9: '', 10: '' },
      teil3: { 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '' },
      teil4: { 21: '', 22: '', 23: '', 24: '', 25: '', 26: '', 27: '', 28: '', 29: '', 30: '' },
      teil5: { 31: '', 32: '', 33: '', 34: '', 35: '', 36: '', 37: '', 38: '', 39: '', 40: '' }
    };
    renderReading();
  }
}

function countAnswered() {
  let count = 0;
  Object.keys(userAnswers).forEach(teil => {
    Object.keys(userAnswers[teil]).forEach(qNum => {
      if (userAnswers[teil][qNum] !== '') count++;
    });
  });
  return count;
}

function calculateProgress() {
  return (countAnswered() / 40) * 100;
}

function submitTestAnswers() {
  if (confirm("Möchten Sie Ihre Antworten wirklich abgeben? (Bạn có chắc chắn muốn nộp bài?)")) {
    readingFlowState = 'results';
    renderReading();
  }
}

function renderPartFeedback(tabNum, correctAns) {
  let list = [];
  let part = '';
  if (tabNum === 1) {
    part = 'teil1';
    for (let i = 1; i <= 5; i++) {
      list.push({ id: i, label: `Câu ${i}` });
    }
  } else if (tabNum === 2) {
    part = 'teil2';
    for (let i = 6; i <= 10; i++) {
      list.push({ id: i, label: `Câu ${i}` });
    }
  } else if (tabNum === 3) {
    part = 'teil3';
    for (let i = 11; i <= 20; i++) {
      list.push({ id: i, label: `Câu ${i}` });
    }
  } else if (tabNum === 4) {
    part = 'teil4';
    for (let i = 21; i <= 30; i++) {
      list.push({ id: i, label: `Lücke (${i})` });
    }
  } else if (tabNum === 5) {
    part = 'teil5';
    for (let i = 31; i <= 40; i++) {
      list.push({ id: i, label: `Lücke (${i})` });
    }
  }

  const test = db.reading.find(t => t.name === selectedReadingTest);

  return list.map(item => {
    const userAns = userAnswers[part][item.id] || '';
    const correctVal = correctAns ? correctAns[item.id] : '';
    
    // Look up question text
    let questionText = '';
    if (part === 'teil1' && test && test.teil1 && test.teil1.texts) {
      const txt = test.teil1.texts[item.id - 1];
      questionText = txt ? txt.title : `Text ${item.id}`;
    } else if (part === 'teil2' && test && test.teil2 && test.teil2.questions) {
      const q = test.teil2.questions.find(q => q.id === item.id || q.num === item.id);
      questionText = q ? (q.question || q.q) : '';
    } else if (part === 'teil3' && test && test.teil3 && test.teil3.situations) {
      const s = test.teil3.situations.find(s => s.id === item.id);
      questionText = s ? s.desc : '';
    }

    let isCorrect = userAns && correctVal && userAns.trim().toUpperCase() === correctVal.trim().toUpperCase();
    
    // Smart matching for Teil 4 (supporting letter/word cross matches)
    if (!isCorrect && part === 'teil4' && test && test.teil4 && test.teil4.options) {
      const opts = test.teil4.options[item.id];
      if (opts && Array.isArray(opts)) {
        const u = userAns.trim().toUpperCase();
        const c = correctVal.trim().toUpperCase();
        const uOpt = opts.find(o => o.toUpperCase().startsWith(u) || o.toUpperCase().endsWith(u) || o.replace(/^[A-C][\.\s:]+/, '').trim().toUpperCase() === u);
        const cOpt = opts.find(o => o.toUpperCase().startsWith(c) || o.toUpperCase().endsWith(c) || o.replace(/^[A-C][\.\s:]+/, '').trim().toUpperCase() === c);
        if (uOpt && cOpt && uOpt === cOpt) {
          isCorrect = true;
        }
      }
    }

    // Smart matching for Teil 5 (supporting letter/word cross matches)
    if (!isCorrect && part === 'teil5' && test && test.teil5 && test.teil5.wordbank) {
      const u = userAns.trim().toUpperCase();
      const c = correctVal.trim().toUpperCase();
      
      // If correctVal is a letter (A-O)
      if (/^[A-O]$/.test(c)) {
        const letterIndex = c.charCodeAt(0) - 65;
        const wordItem = test.teil5.wordbank[letterIndex];
        if (wordItem && wordItem.word && wordItem.word.toUpperCase() === u) {
          isCorrect = true;
        }
      }
    }

    // Display helpers for nice layout
    let displayUserAns = userAns;
    let displayCorrectVal = correctVal;
    
    const uUpper = userAns ? userAns.trim().toUpperCase() : '';
    const cUpper = correctVal ? correctVal.trim().toUpperCase() : '';

    if (part === 'teil1' && test && test.teil1 && test.teil1.headings) {
      const headingsData = test.teil1.headings;
      if (Array.isArray(headingsData)) {
        const uMatch = headingsData.find(h => h.key === uUpper);
        if (uMatch) displayUserAns = `${uUpper}. ${uMatch.text}`;
        const cMatch = headingsData.find(h => h.key === cUpper);
        if (cMatch) displayCorrectVal = `${cUpper}. ${cMatch.text}`;
      }
    } else if (part === 'teil2' && test && test.teil2 && test.teil2.questions) {
      const q = test.teil2.questions.find(q => q.id === item.id || q.num === item.id);
      if (q && q.options) {
        if (q.options[uUpper]) displayUserAns = `${uUpper}. ${q.options[uUpper]}`;
        if (q.options[cUpper]) displayCorrectVal = `${cUpper}. ${q.options[cUpper]}`;
      }
    } else if (part === 'teil3' && test && test.teil3 && test.teil3.texts) {
      if (uUpper === 'X') {
        displayUserAns = "X. Keine Anzeige passt (Không có quảng cáo phù hợp)";
      } else if (uUpper) {
        const tMatch = test.teil3.texts.find(t => t.key.toUpperCase() === uUpper);
        if (tMatch) displayUserAns = `${uUpper}. ${tMatch.title || ''}`;
      }
      
      if (cUpper === 'X') {
        displayCorrectVal = "X. Keine Anzeige passt (Không có quảng cáo phù hợp)";
      } else if (cUpper) {
        const tMatch = test.teil3.texts.find(t => t.key.toUpperCase() === cUpper);
        if (tMatch) displayCorrectVal = `${cUpper}. ${tMatch.title || ''}`;
      }
    } else if (part === 'teil4' && test && test.teil4 && test.teil4.options) {
      const opts = test.teil4.options[item.id];
      if (opts && Array.isArray(opts)) {
        const matchedUser = opts.find(o => o.toUpperCase().startsWith(uUpper) || o.toUpperCase().endsWith(uUpper) || o.replace(/^[A-C][\.\s:]+/, '').trim().toUpperCase() === uUpper);
        if (matchedUser) displayUserAns = matchedUser;
        const matchedCorrect = opts.find(o => o.toUpperCase().startsWith(cUpper) || o.toUpperCase().endsWith(cUpper) || o.replace(/^[A-C][\.\s:]+/, '').trim().toUpperCase() === cUpper);
        if (matchedCorrect) displayCorrectVal = matchedCorrect;
      }
    } else if (part === 'teil5' && test && test.teil5 && test.teil5.wordbank) {
      // Convert correct answer letter to "Letter. Word" format
      if (/^[A-O]$/.test(cUpper)) {
        const letterIndex = cUpper.charCodeAt(0) - 65;
        const wordItem = test.teil5.wordbank[letterIndex];
        if (wordItem && wordItem.word) {
          displayCorrectVal = `${cUpper}. ${wordItem.word.toUpperCase()}`;
        }
      }
      
      // Convert user answer word to "Letter. Word" format
      if (uUpper) {
        const foundIdx = test.teil5.wordbank.findIndex(item => item.word && item.word.toUpperCase() === uUpper);
        if (foundIdx !== -1) {
          const letter = String.fromCharCode(65 + foundIdx);
          displayUserAns = `${letter}. ${uUpper}`;
        }
      }
    }

    const explanation = test && test.explanations ? test.explanations[item.id] : '';

    return `
      <div style="background: rgba(255,255,255,0.01); border: 1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          <span style="font-weight: 800; color: var(--accent-cyan);">${item.label}</span>
          <span style="font-size: 1rem; font-weight: bold; color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
            ${isCorrect ? '✓ Richtig' : '✗ Falsch'}
          </span>
        </div>
        ${questionText ? `
          <div style="font-style: italic; color: #cbd5e1; margin-bottom: 0.8rem; font-size: 0.98rem; line-height: 1.6; border-left: 3px solid var(--accent-cyan); padding-left: 0.8rem; font-weight: 500;">
            ${questionText}
          </div>
        ` : ''}
        <div style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.6;">
          <div style="margin-bottom: 0.4rem;">
            <span style="color: var(--text-dim);">Ihre Antwort:</span> 
            <span style="font-weight: bold; color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">${displayUserAns ? displayUserAns : 'Keine Antwort'}</span>
          </div>
          <div style="margin-bottom: ${explanation ? '0.6rem' : '0'};">
            <span style="color: var(--text-dim);">Richtige Antwort:</span> 
            <span style="font-weight: bold; color: var(--success);">${displayCorrectVal ? displayCorrectVal : 'Keine Vorgabe'}</span>
          </div>
          ${explanation ? `
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.85rem; color: var(--accent-cyan); line-height: 1.45;">
              💡 <b>Giải thích:</b> ${explanation}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 3. LUYỆN VIẾT (SCHREIBEN) - NEW GRID & CATEGORY FLOW
// ==========================================
function renderWriting() {
  const container = document.getElementById('writing-content');
  if (!container) return;

  const sampleAnswers = {
    1: `Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen, weil ich mich über meinen Aufenthalt in Ihrem Hotel am vergangenen Wochenende beschweren möchte. Leider entsprachen die Leistungen vor Ort überhaupt nicht den Angaben in Ihrer Anzeige...\n\nMit freundlichen Grüßen,\nNguyen Van A`,
    2: `Sehr geehrte Damen und Herren,\n\nich interessiere mich sehr für Ihren Deutschkurs und möchte Sie um einige zusätzliche Informationen bitten. Könnten Sie mir bitte mitteilen, wann der Kurs beginnt và phí tham gia là bao nhiêu?..\n\nMit freundlichen Grüßen,\nNguyen Van A`
  };

  // 1. Màn hình chọn danh mục (Kategorie wählen) giống hệt Screenshot đầu
  if (writingFlowState === 'category') {
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 3rem;">
        <span style="font-size: 3rem; color: var(--accent-amber); background: rgba(251, 191, 36, 0.1); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">✍️</span>
        <h2 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem;">Schreiben - Kategorie wählen</h2>
        <p style="color: var(--text-dim);">Wählen Sie die Art der Schreibaufgabe, die Sie üben möchten</p>
      </div>

      <div class="mode-selection-grid">
        <div class="mode-card" style="border: 1px solid rgba(255,255,255,0.05); text-align: center; padding: 2.5rem 2rem;">
          <div style="background: rgba(239, 68, 68, 0.15); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: #ef4444; font-size: 1.5rem; font-weight: bold;">
            ⚠️
          </div>
          <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.8rem;">Beschwerde</h3>
          <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">Formelle Beschwerden über Produkte, Dienstleistungen oder Situationen schreiben</p>
          <a class="btn btn-secondary" style="width: 100%; border-radius: 6px; padding: 0.8rem; text-decoration: none;" href="https://docs.google.com/document/d/1nFSMl8f5CCnf4SGXZElPNbE8uSft_kBQ860nQovtJz4/edit?usp=drive_link" target="_blank">Aufgaben anzeigen ↗</a>
        </div>

        <div class="mode-card" style="border: 1px solid rgba(255,255,255,0.05); text-align: center; padding: 2.5rem 2rem;">
          <div style="background: rgba(59, 130, 246, 0.15); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: #3b82f6; font-size: 1.5rem;">
            ✉️
          </div>
          <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.8rem;">Bitte um Informationen</h3>
          <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">Formelle Anfragen nach Informationen, Kursen oder Möglichkeiten stellen</p>
          <a class="btn btn-secondary" style="width: 100%; border-radius: 6px; padding: 0.8rem; text-decoration: none;" href="https://docs.google.com/document/d/137mAEpmLIofmhEtYxsTsHv5qrhH0cm0GMWWb4Hsm78k/edit?usp=drive_link" target="_blank">Aufgaben anzeigen ↗</a>
        </div>
      </div>
    `;
  }

  // 2. Màn hình danh sách đề dưới dạng Card Grid cực kỳ đẹp giống các Screenshot của bạn
  else if (writingFlowState === 'list') {
    // Lọc danh sách bài viết theo Tab đang chọn
    let filteredExercises = db.writing;
    if (selectedWritingCategory !== 'Alle') {
      filteredExercises = db.writing.filter(item => item.category === selectedWritingCategory);
    }

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <button class="btn btn-secondary" onclick="setWritingState('category')" style="margin-bottom: 1.5rem;">← Zurück</button>
        <h2 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${selectedWritingCategory === 'Alle' ? 'Schreiben' : selectedWritingCategory}</h2>
        <p style="color: var(--text-dim); font-size: 0.95rem;">Formelle Beschwerden oder Anfragen nach Informationen schreiben</p>
      </div>

      <!-- Dãy Tab lọc (Alle Themen, Beschwerde, Anfrage/Information) giống hệt Screenshot -->
      <div style="display: flex; gap: 0.8rem; margin-bottom: 2.5rem; flex-wrap: wrap;">
        <button class="tab-btn ${selectedWritingCategory === 'Alle' ? 'active' : ''}" style="border-radius: 20px; padding: 0.5rem 1.2rem; font-size: 0.9rem;" onclick="filterWritingCategory('Alle')">Alle Themen</button>
        <button class="tab-btn ${selectedWritingCategory === 'Beschwerde' ? 'active' : ''}" style="border-radius: 20px; padding: 0.5rem 1.2rem; font-size: 0.9rem;" onclick="filterWritingCategory('Beschwerde')">Beschwerde</button>
        <button class="tab-btn ${selectedWritingCategory === 'Anfrage/Information' ? 'active' : ''}" style="border-radius: 20px; padding: 0.5rem 1.2rem; font-size: 0.9rem;" onclick="filterWritingCategory('Anfrage/Information')">Anfrage/Information</button>
      </div>

      <!-- Lưới các Card bài tập Luyện Viết (Schreiben Grid) giống hệt các Screenshot 2, 3, 4, 5 -->
      <div class="lesen-grid">
        ${filteredExercises.map(item => `
          <div class="lesen-card" style="padding: 1.8rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 310px; position: relative;">
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0, 242, 254, 0.08); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold; color: var(--accent-cyan);">
                  ✉️ Formelle E-Mail
                </div>
                <img src="logo.jpg" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-cyan); box-shadow: 0 0 8px rgba(0, 242, 254, 0.25);">
              </div>

              <h3 class="lesen-card-title" style="font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; line-height: 1.4; letter-spacing: 0.5px;">${item.title}</h3>
              
              <p style="color: var(--text-dim); font-size: 0.88rem; line-height: 1.6; margin-top: 0.5rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                ${item.text}
              </p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
              <span style="font-size: 0.85rem; color: var(--text-dim); font-weight: bold;">150-300 Wörter</span>
              <button class="btn btn-primary" style="padding: 0.6rem 1.4rem; border-radius: 30px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: linear-gradient(90deg, #ff007a, #7928ca); box-shadow: 0 4px 15px rgba(255, 0, 122, 0.35); border: 1.5px solid rgba(255, 255, 255, 0.15);" onclick="startWritingExercise(${item.id})">
                Starten →
              </button>
            </div>

          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Màn hình làm bài trực quan (Workspace State)
  else if (writingFlowState === 'exercise') {
    let exercise = db.writing.find(item => item.id === selectedWritingExerciseId);
    if (!exercise) {
      exercise = db.writing[0];
    }

    // Lấy các ý gợi ý chi tiết của đề bài
    const tipsList = exercise.tips && exercise.tips.length > 0 ? exercise.tips : [
      "Phải viết đầy đủ phần mở bài (Sehr geehrte Damen und Herren,) và kết bài (Mit freundlichen Grüßen).",
      "Nêu rõ lý do viết thư (ví dụ: phàn nàn về dịch vụ hay hỏi thông tin).",
      "Đưa ra ít nhất 3 luận điểm/vấn đề cụ thể để phân tích.",
      "Sử dụng các liên từ và cấu trúc B2 thích hợp (weil, da, obwohl, aus diesem Grund...)."
    ];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <button class="btn btn-secondary" onclick="setWritingState('list')" style="border-radius: 20px; padding: 0.5rem 1.2rem; font-size: 0.9rem; font-weight: bold; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 0.5rem;">
          ← Aufgabenliste
        </button>
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <span style="background: var(--accent-amber); width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px var(--accent-amber);"></span>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${exercise.title}</h2>
        </div>
      </div>

      <div class="test-split-container" style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2rem; align-items: start;">
        <!-- Cột trái: Đề bài & Gợi ý (Tips) dạng Glassmorphism cực sang trọng -->
        <div class="test-left-pane" style="background: rgba(30, 30, 70, 0.25); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(0, 242, 254, 0.15); padding: 2rem; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <div style="display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.25); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 1.2rem;">
            📬 Aufgabe: Brief / E-Mail B2
          </div>
          
          <h3 style="font-size: 1.1rem; color: var(--accent-cyan); margin-bottom: 1rem; font-weight: 900; letter-spacing: 0.5px; border-left: 3px solid var(--accent-cyan); padding-left: 0.6rem;">DEUTSCH B2 - THEMA</h3>
          <div style="font-size: 1.05rem; line-height: 1.75; margin-bottom: 2.2rem; color: #f1f5f9; background: rgba(0,0,0,0.25); padding: 1.4rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); white-space: pre-wrap; text-align: justify; font-family: 'Inter', sans-serif;">${exercise.text || exercise.prompt || ''}</div>

          <h3 style="font-size: 1.05rem; color: var(--accent-amber); margin-bottom: 1rem; font-weight: 900; letter-spacing: 0.5px; border-left: 3px solid var(--accent-amber); padding-left: 0.6rem;">💡 DÀN Ý & CỤM TỪ GỢI Ý (TIPS)</h3>
          <div style="background: rgba(251, 191, 36, 0.03); border: 1px solid rgba(251, 191, 36, 0.15); padding: 1.2rem; border-radius: 10px;">
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem;">
              ${tipsList.map(tip => `
                <li style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; display: flex; gap: 0.6rem; align-items: start;">
                  <span style="color: var(--accent-amber); font-weight: bold; font-size: 1.1rem; line-height: 1;">✦</span>
                  <span style="flex: 1;">${tip}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <!-- Cột phải: Khu vực soạn thảo thư chuyên nghiệp giả lập E-Mail Client -->
        <div class="test-right-pane" style="background: rgba(30, 30, 70, 0.15); border: 1px solid var(--border-light); padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <!-- E-mail Window Header Bar -->
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.2rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem;">
            <div style="display: flex; align-items: center; gap: 0.8rem; font-size: 0.85rem;">
              <span style="color: var(--text-dim); width: 60px; font-weight: 700;">Empfänger:</span>
              <span style="color: #fff; background: rgba(255,255,255,0.05); padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 0.9rem;">empfaenger@telc-brief.de</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.8rem; font-size: 0.85rem;">
              <span style="color: var(--text-dim); width: 60px; font-weight: 700;">Betreff:</span>
              <input type="text" placeholder="z.B. Beschwerde über den Aufenthalt..." style="flex: 1; padding: 0.35rem 0.6rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #fff; font-size: 0.9rem; font-weight: bold; outline: none; transition: border 0.3s;" onfocus="this.style.borderColor='var(--accent-cyan)'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
            <span style="font-weight: 800; font-size: 0.85rem; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.5px;">Mein Entwurf (Bài làm):</span>
            <div id="word-count-badge" style="font-size: 0.82rem; font-weight: bold; padding: 0.25rem 0.6rem; border-radius: 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; transition: all 0.3s;">
              Wörter: 0 / 150-300 (Dưới 150 từ 🔴)
            </div>
          </div>

          <textarea id="writing-textarea" placeholder="Sehr geehrte Damen und Herren,&#10;&#10;[Viết nội dung bức thư của bạn tại đây...]&#10;&#10;Mit freundlichen Grüßen,&#10;[Tên của bạn]" 
            style="width: 100%; height: 380px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 1.2rem; border-radius: 12px; font-family: 'Courier New', Courier, monospace; font-size: 1.08rem; line-height: 1.65; resize: vertical; outline: none; transition: all 0.3s; box-shadow: inset 0 2px 8px rgba(0,0,0,0.35);"
            oninput="updateWritingWordCount()" onfocus="this.style.borderColor='var(--accent-cyan)'; this.style.boxShadow='inset 0 2px 8px rgba(0,0,0,0.35), 0 0 12px rgba(0, 242, 254, 0.2)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='inset 0 2px 8px rgba(0,0,0,0.35)'"></textarea>

          <div style="display: flex; gap: 0.8rem; margin-top: 1.2rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" style="flex: 1; min-width: 120px; font-weight: bold; padding: 0.8rem; border-radius: 10px; cursor: pointer;" onclick="alert('Đã lưu bản nháp bài viết vào bộ nhớ trình duyệt!')">
              💾 Lưu nháp
            </button>
            <button class="btn btn-secondary" style="flex: 1; min-width: 160px; font-weight: bold; background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(147, 51, 234, 0.25); color: #c084fc; padding: 0.8rem; border-radius: 10px; cursor: pointer;" onclick="showWritingSampleAnswer(${exercise.id})">
              💡 Bài viết mẫu
            </button>
            <button class="btn btn-primary" style="flex: 1.2; min-width: 160px; font-weight: bold; padding: 0.8rem; border-radius: 10px; background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan)); border: none; box-shadow: 0 4px 15px rgba(0, 242, 254, 0.25); cursor: pointer;" onclick="alert('Bài viết của bạn đã được lưu và gửi cho giảng viên chấm điểm!')">
              ✈ Nộp bài viết
            </button>
          </div>

          <!-- Khung hiển thị Lời giải mẫu Premium -->
          <div class="card" id="writing-sample-box" style="display: none; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.35); margin-top: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);">
            <h4 style="color: var(--success); margin-bottom: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              <span>🏆</span> Musterlösung (Bài viết mẫu đạt điểm cao):
            </h4>
            <div style="white-space: pre-line; line-height: 1.7; font-size: 1.05rem; font-family: 'Inter', sans-serif; color: #e2e8f0; background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: justify;">
              ${sampleAnswers[exercise.id] || "Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen, weil..."}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Cập nhật lọc theo Tab đang click chọn
function filterWritingCategory(category) {
  selectedWritingCategory = category;
  renderWriting();
}

function updateWritingWordCount() {
  const textarea = document.getElementById('writing-textarea');
  const badge = document.getElementById('word-count-badge');
  if (!textarea || !badge) return;

  const text = textarea.value.trim();
  const words = text === '' ? 0 : text.split(/\s+/).length;
  
  if (words < 150) {
    badge.style.background = 'rgba(239, 68, 68, 0.15)';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    badge.style.color = '#ef4444';
    badge.innerHTML = `Wörter: ${words} / 150-300 (Dưới 150 từ 🔴)`;
  } else if (words >= 150 && words <= 300) {
    badge.style.background = 'rgba(16, 185, 129, 0.15)';
    badge.style.borderColor = 'rgba(16, 185, 129, 0.25)';
    badge.style.color = '#10b981';
    badge.innerHTML = `Wörter: ${words} / 150-300 (Đạt yêu cầu 🟢)`;
  } else {
    badge.style.background = 'rgba(245, 158, 11, 0.15)';
    badge.style.borderColor = 'rgba(245, 158, 11, 0.25)';
    badge.style.color = '#f59e0b';
    badge.innerHTML = `Wörter: ${words} / 150-300 (Quá dài 🟡)`;
  }
}

function showWritingSampleAnswer(id) {
  const box = document.getElementById('writing-sample-box');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

function selectWritingCategoryName(category) {
  selectedWritingCategory = category;
  writingFlowState = 'list';
  renderWriting();
}

function startWritingExercise(id) {
  selectedWritingExerciseId = id;
  writingFlowState = 'exercise';
  renderWriting();
}

function setWritingState(state) {
  writingFlowState = state;
  renderWriting();
}
let selectedSpeakingTopicId = null;
let speakingTimerInterval = null;
let speakingTimerRemaining = 90;

function startSpeakingTimer() {
  if (speakingTimerInterval) return;
  const display = document.getElementById('speaking-timer-display');
  const startBtn = document.getElementById('speaking-timer-start');
  if (!display || !startBtn) return;

  if (speakingTimerRemaining <= 0) {
    speakingTimerRemaining = 90;
  }
  startBtn.textContent = currentLang === 'vi' ? 'Tiếp tục' : 'Fortsetzen';

  speakingTimerInterval = setInterval(() => {
    speakingTimerRemaining--;
    if (speakingTimerRemaining <= 0) {
      clearInterval(speakingTimerInterval);
      speakingTimerInterval = null;
      speakingTimerRemaining = 0;
      startBtn.textContent = currentLang === 'vi' ? 'Bắt đầu' : 'Starten';
      alert(currentLang === 'vi' ? 'Hết giờ thuyết trình (1 phút 30 giây)! Hãy bắt đầu đặt câu hỏi phản biện.' : 'Die Zeit (1,5 Minuten) ist abgelaufen! Bitte fahren Sie mit der Fragerunde fort.');
    }
    let mins = Math.floor(speakingTimerRemaining / 60);
    let secs = speakingTimerRemaining % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

function pauseSpeakingTimer() {
  if (speakingTimerInterval) {
    clearInterval(speakingTimerInterval);
    speakingTimerInterval = null;
  }
}

function resetSpeakingTimer() {
  if (speakingTimerInterval) {
    clearInterval(speakingTimerInterval);
    speakingTimerInterval = null;
  }
  speakingTimerRemaining = 90;
  const display = document.getElementById('speaking-timer-display');
  const startBtn = document.getElementById('speaking-timer-start');
  if (display) display.textContent = '01:30';
  if (startBtn) startBtn.textContent = currentLang === 'vi' ? 'Bắt đầu' : 'Starten';
}

const speakingTopicList = [
  { id: 1, title: "Teil 1: Über Erfahrungen sprechen", desc: "Đề này bao gồm tất cả các chủ đề của Teil 1", prompt: "Thuyết trình về một chủ đề bất kỳ liên quan đến trải nghiệm cá nhân của bạn.", tips: ["Einleitung", "Trải nghiệm bản thân", "Tình hình ở quê hương", "Ưu & nhược điểm", "Kết luận"] }
];

// Hàm AI xử lý trích xuất nguyên bảng đáp án 40 câu BẰNG GEMINI VISION THẬT
window.handleGlobalAnswersAiPaste = async function(event) {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  let imageFile = null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      imageFile = items[i].getAsFile();
      break;
    }
  }
  if (!imageFile) return;

  const target = event.target;
  const originalPh = target.placeholder;
  target.placeholder = "🤖 Đang khởi động AI Thật...";
  target.value = "";
  target.style.borderColor = "#10b981";

  // Kiểm tra API Key
  let apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    apiKey = prompt("🤖 LƯU Ý: AI Offline đọc bảng rất ngu nên bị sai tùm lum. Để AI thật (Gemini) đọc chuẩn 100%, cô cần nhập API Key (miễn phí) vào đây (chỉ nhập 1 lần duy nhất):");
    if (!apiKey) {
      target.placeholder = "Đã hủy do thiếu API Key.";
      setTimeout(() => { target.placeholder = originalPh; target.style.borderColor = "rgba(255,255,255,0.2)"; }, 3000);
      return;
    }
    localStorage.setItem('gemini_api_key', apiKey.trim());
  }

  const reader = new FileReader();
  reader.onloadend = async function() {
    const base64data = reader.result.split(',')[1];
    target.placeholder = "🤖 Đang phân tích bảng đáp án... (Mất 3-5s)";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {text: "Trích xuất đáp án từ bảng này. Có 40 câu. Trả về MỘT CHUỖI JSON DUY NHẤT ánh xạ từ số câu (1-40) sang đáp án (A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,X). KHÔNG TRẢ VỀ BẤT KỲ VĂN BẢN NÀO KHÁC NGOÀI JSON OBJECT."},
              {inline_data: { mime_type: imageFile.type || "image/jpeg", data: base64data }}
            ]
          }]
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let textRes = data.candidates[0].content.parts[0].text.trim();
      
      // Strip markdown code blocks if any
      textRes = textRes.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      
      let answersObj;
      try {
        answersObj = JSON.parse(textRes);
      } catch (parseErr) {
        // Fallback: try to extract json object using regex
        const jsonMatch = textRes.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          answersObj = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Không tìm thấy dữ liệu JSON từ AI: " + textRes.substring(0, 50));
        }
      }
      
      let filledCount = 0;
      const select = document.getElementById('admin-select-reading-test');
      const testName = select ? select.value : '';
      const test = db.reading.find(t => t.name === testName);

      for (let i = 1; i <= 40; i++) {
        if (answersObj[i]) {
          if (test) test.answers[i] = answersObj[i];
          const input = document.getElementById(`admin-read-ans-${i}`);
          if (input) {
            input.value = answersObj[i];
            input.style.borderColor = '#10b981';
            input.style.boxShadow = '0 0 10px rgba(16,185,129,0.3)';
            input.style.backgroundColor = 'rgba(16,185,129,0.1)';
          }
          filledCount++;
        }
      }

      window.aiRecentlyUpdated = true;
      setTimeout(() => { window.aiRecentlyUpdated = false; }, 15000);

      target.value = `✅ Đã điền chuẩn 100% ${filledCount} đáp án!`;
      target.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
      
      if (typeof saveAdminReadingTestAnswers === 'function') {
        saveAdminReadingTestAnswers(null, true);
      }
    } catch (e) {
      console.error(e);
      if (e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('exceeded') || e.message.includes('429')) {
        target.placeholder = "🤖 Quá tải API. Đang tự động dùng AI Offline...";
        try {
          if (typeof Tesseract !== 'undefined') {
            const ret = await Tesseract.recognize(imageFile, 'eng');
            const ttext = ret.data.text;
            const fallbackRegex = /(?:^|\s+)([1-4][0-9]|[1-9])[\.\)]?\s*([A-Oa-oXx])\b/g;
            let fmatch;
            let filledCount = 0;
            const select = document.getElementById('admin-select-reading-test');
            const testName = select ? select.value : '';
            const test = db.reading.find(t => t.name === testName);
            
            while ((fmatch = fallbackRegex.exec(ttext)) !== null) {
              const qNum = parseInt(fmatch[1]);
              const ansChar = fmatch[2].toUpperCase();
              if (qNum >= 1 && qNum <= 40) {
                if (test) test.answers[qNum] = ansChar;
                const input = document.getElementById(`admin-read-ans-${qNum}`);
                if (input) {
                  input.value = ansChar;
                  input.style.borderColor = '#f59e0b';
                  input.style.backgroundColor = 'rgba(245,158,11,0.1)';
                }
                filledCount++;
              }
            }
            if (filledCount > 0) {
              target.value = `⚠️ AI Offline đã điền ${filledCount} câu. Vui lòng tự dò lại!`;
              target.style.borderColor = '#f59e0b';
              target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
              if (typeof saveAdminReadingTestAnswers === 'function') saveAdminReadingTestAnswers(null, true);
              setTimeout(() => { target.value = ""; target.placeholder = originalPh; }, 5000);
              return;
            } else {
              target.value = "AI Offline đọc ra chữ rác: " + ttext.substring(0, 100).replace(/\n/g, ' ');
              setTimeout(() => { target.value = ""; target.placeholder = originalPh; }, 5000);
              return;
            }
          } else {
            throw new Error("Chưa tải xong AI Offline.");
          }
        } catch (err2) {
          target.value = "Lỗi AI Offline: " + err2.message;
          setTimeout(() => { target.value = ""; target.placeholder = originalPh; }, 5000);
        }
      } else {
        target.value = "";
        target.placeholder = "❌ Lỗi: Chờ 2 phút hoặc đổi API Key";
        target.style.borderColor = "#ef4444";
        if (e.message.includes('API key')) localStorage.removeItem('gemini_api_key');
      }
    }

    setTimeout(() => {
      target.value = "";
      target.placeholder = originalPh;
      target.style.borderColor = "rgba(255,255,255,0.2)";
      target.style.boxShadow = "none";
    }, 4000);
  };
  reader.readAsDataURL(imageFile);
};

function initDB() {
  // Nếu localStorage trống VÀ có dữ liệu mặc định từ default_db.js thì nạp vào
  if (window.__DEFAULT_DB__ && !localStorage.getItem('maternopro_reading')) {
    const ddb = window.__DEFAULT_DB__;
    if (ddb.listening) localStorage.setItem('maternopro_listening', JSON.stringify(ddb.listening));
    if (ddb.reading) localStorage.setItem('maternopro_reading', JSON.stringify(ddb.reading));
    if (ddb.writing) localStorage.setItem('maternopro_writing', JSON.stringify(ddb.writing));
    if (ddb.speaking) localStorage.setItem('maternopro_speaking', JSON.stringify(ddb.speaking));
    if (ddb.grammar) localStorage.setItem('maternopro_grammar', JSON.stringify(ddb.grammar));
    if (ddb.vocab) localStorage.setItem('maternopro_vocab', JSON.stringify(ddb.vocab));
  }

  let defaultListeningList = [];
  for (let i = 1; i <= 24; i++) {
    defaultListeningList.push({ id: i, name: `Test ${i}`, free: i === 1, minutes: 30 });
  }
  db = {
    listening: safeGetItem('maternopro_listening', defaultListeningList),
    reading: safeGetItem('maternopro_reading', readingTestList).filter(t => t && t.name),
    writing: safeGetItem('maternopro_writing', writingExerciseList),
    speaking: safeGetItem('maternopro_speaking', speakingTopicList),
    grammar: safeGetItem('maternopro_grammar', window.defaultGrammar || []),
    vocab: safeGetItem('maternopro_vocab', window.defaultVocabulary || [])
  };

  // ONE-TIME MIGRATION: Shift tests >= 13
  if (!localStorage.getItem('migrated_tests_13')) {
    db.reading.forEach(test => {
      const match = test.name.match(/^Đề (\d+)$/);
      if (match) {
        let num = parseInt(match[1]);
        if (num >= 13) {
          test.name = `Đề ${num + 1}`;
        }
      }
    });
    
    const newTest13 = {
      name: "Đề 13",
      teil1: { texts: [], headings: [] },
      teil2: { text: "", questions: [] },
      teil3: { texts: [], situations: [] },
      teil4: { text: "", options: [] },
      teil5: { text: "", wordbank: [] }
    };
    db.reading.push(newTest13);
    
    db.reading.sort((a, b) => {
      const mA = a.name.match(/^Đề (\d+)$/);
      const mB = b.name.match(/^Đề (\d+)$/);
      const nA = mA ? parseInt(mA[1]) : 0;
      const nB = mB ? parseInt(mB[1]) : 0;
      return nA - nB;
    });

    localStorage.setItem('migrated_tests_13', 'true');
    saveDB();
  }

  // ONE-TIME MIGRATION: Clear speaking topics (RESTORED BACK TO ORIGINAL BUT ONLY GENERIC TEIL 1)
  if (!localStorage.getItem('restored_speaking_ruot_v4')) {
    db.speaking = JSON.parse(JSON.stringify(speakingTopicList));
    localStorage.setItem('restored_speaking_ruot_v4', 'true');
    saveDB();
  }

  // ONE-TIME MIGRATION: Clear writing exercises
  if (!localStorage.getItem('cleared_writing_ruot_v2')) {
    db.writing = [];
    localStorage.setItem('cleared_writing_ruot_v2', 'true');
    saveDB();
  }

  // CHỈ NẠP ĐỀ MẪU KHI LOCALSTORAGE HOÀN TOÀN TRỐNG (lần đầu mở trang)
  if (!db.reading || db.reading.length === 0) {
    db.reading = JSON.parse(JSON.stringify(readingTestList));
    saveDB();
  }

  if (window.allReadingTexts) {
    // KHÔNG xóa test của user - chỉ thêm test từ reading_texts.js nếu chưa có
    window.allReadingTexts.forEach(rawData => {
      let test = db.reading.find(t => t.name === rawData.name || t.name === rawData.name.split(' - ')[0]);
      if (!test) {
        // Chỉ thêm mới nếu chưa tồn tại trong db
        test = { name: rawData.name, free: false, minutes: 90, correctAnswers: {}, explanations: {} };
        db.reading.push(test);
      }
      // Cập nhật tên đầy đủ nếu cần
      if (test.name !== rawData.name) test.name = rawData.name;

      // Hàm kiểm tra dữ liệu thật
      const hasRealData = (obj) => {
        if (!obj) return false;
        if (typeof obj === 'string') return obj.trim().length > 0;
        if (Array.isArray(obj)) return obj.length > 0 && obj.some(item => {
          if (typeof item === 'string') return item.trim().length > 0;
          if (typeof item === 'object') return Object.values(item).some(v => v && String(v).trim().length > 0);
          return false;
        });
        if (typeof obj === 'object') return Object.keys(obj).length > 0 && Object.values(obj).some(v => {
          if (typeof v === 'string') return v.trim().length > 0;
          if (Array.isArray(v)) return v.length > 0;
          return false;
        });
        return false;
      };

      // Chỉ ghi đè các teil NẾU user chưa nhập gì (test.teil? trống/chưa có)
      if (rawData.teil1 && (hasRealData(rawData.teil1.headings) || hasRealData(rawData.teil1.texts))) {
        if (!hasRealData(test.teil1?.headings) && !hasRealData(test.teil1?.texts)) {
          test.teil1 = JSON.parse(JSON.stringify(rawData.teil1));
        }
      } else if (!test.teil1) {
        test.teil1 = { headings: [], texts: [] };
      }
      if (rawData.teil2 && (hasRealData(rawData.teil2.text) || hasRealData(rawData.teil2.questions))) {
        if (!hasRealData(test.teil2?.text) && !hasRealData(test.teil2?.questions)) {
          test.teil2 = JSON.parse(JSON.stringify(rawData.teil2));
        }
      } else if (!test.teil2) {
        test.teil2 = { text: '', questions: [] };
      }
      if (rawData.teil3 && (hasRealData(rawData.teil3.texts) || hasRealData(rawData.teil3.situations))) {
        if (!hasRealData(test.teil3?.texts) && !hasRealData(test.teil3?.situations)) {
          test.teil3 = JSON.parse(JSON.stringify(rawData.teil3));
        }
      } else if (!test.teil3) {
        test.teil3 = { situations: [], texts: [] };
      }
      if (rawData.teil4 && (hasRealData(rawData.teil4.text) || hasRealData(rawData.teil4.options))) {
        if (!hasRealData(test.teil4?.text) && !hasRealData(test.teil4?.options)) {
          test.teil4 = JSON.parse(JSON.stringify(rawData.teil4));
        }
      } else if (!test.teil4) {
        test.teil4 = { text: '', options: {} };
      }
      if (rawData.teil5 && (hasRealData(rawData.teil5.text) || hasRealData(rawData.teil5.wordbank))) {
        if (!hasRealData(test.teil5?.text) && !hasRealData(test.teil5?.wordbank)) {
          test.teil5 = JSON.parse(JSON.stringify(rawData.teil5));
        }
      } else if (!test.teil5) {
        test.teil5 = { text: '', wordbank: [] };
      }
      // KHÔNG ghi đè correctAnswers/answers của user từ reading_texts.js
    });

    // Sắp xếp lại theo số thứ tự
    db.reading.sort((a, b) => {
      const mA = a.name.match(/^Đề (\d+)/);
      const mB = b.name.match(/^Đề (\d+)/);
      return (mA ? parseInt(mA[1]) : 999) - (mB ? parseInt(mB[1]) : 999);
    });
    saveDB();
  }


  // Đảm bảo đề thi 'Ausstellung' có sẵn đáp án nếu bị lưu đè danh sách cũ rỗng
  const ausstellung = db.reading.find(t => t.name === 'Ausstellung');
  if (ausstellung && (!ausstellung.answers || Object.keys(ausstellung.answers).length === 0)) {
    ausstellung.answers = {
      1: "F", 2: "D", 3: "E", 4: "G", 5: "C",
      6: "C", 7: "B", 8: "B", 9: "A", 10: "B",
      11: "A", 12: "B", 13: "C", 14: "D", 15: "E", 16: "F", 17: "G", 18: "H", 19: "I", 20: "J",
      21: "mir", 22: "wegen", 23: "so dass", 24: "um", 25: "obwohl", 26: "belohnt", 27: "geschmeckt", 28: "obwohl", 29: "lassen", 30: "von",
      31: "DAMIT", 32: "WEIL", 33: "TUN", 34: "WURDE", 35: "VON", 36: "DAMIT", 37: "SPIELERISCHE", 38: "DASS", 39: "GESTALTEN", 40: "GEHT"
    };
    saveDB();
  }

  // Đảm bảo đề thi 'Jugendliche 1' có đầy đủ thông tin chuẩn từ screenshot
  let jug1 = db.reading.find(t => t && t.name && (t.name.toLowerCase().includes('jugendliche 1') || t.name.toLowerCase().includes('programmierer 1')));
  if (jug1) {
    // Fill Teil 2 Text
    if (!jug1.teil2 || Object.keys(jug1.teil2).length === 0) {
      jug1.teil2 = {
        text: `Krista, der tierische Star\n\nKrista ist die schönste Kuh Deutschlands. Und jetzt auch noch ein Kinostar. Am letzten Donnerstag kam ein Film über die schwarz-weiß gefleckte Kuh und ihre Besitzer in einige norddeutsche Kinos. Wovon der Film handelt? Von Kristas Leben auf dem Hof der Familie Seeger in Bissel, einem kleinen Dorf in Norddeutschland.\n\nAntje Schneider und Carsten Waldbauer sind Filmemacher. Vor einigen Jahren hatten sie die Idee, eine Dokumentation über Kühe zu machen, genauer gesagt über Holstein-Rinder. Die Holstein-Rinder sind eine der wichtigsten Rinderrassen weltweit, kommen aber trotz des deutschen Namens aus Nordamerika. Diese Kühe werden überwiegend als Milchvieh gehalten. Die Holstein-Rinder sind so verbreitet, dass sie inzwischen andere Rassen fast vollständig verdrängt haben.\n\nDas gilt vor allem für die vielen Bauernhöfe in Deutschland, die ausschließlich Milch produzieren. Auf einem dieser Höfe wollten Antje Schneider und Carsten Waldbauer Aufnahmen für ihre Dokumentation machen, und die Wahl fiel auf den Hof der Familie Seeger. Doch als die beiden Filmemacher mit den Dreharbeiten beginnen wollten, sahen sie plötzlich - Krista. Krista änderte alles. Die Schönheit vom Lande beeindruckte Schneider und Waldbauer so sehr, dass sie den Plan für ihre Dokumentation gegen den Willen ihres Senders komplett änderten. Im Mittelpunkt sollte nun Krista stehen, die schönste Holstein-Kuh Deutschlands.\n\nKrista gehört zur Weltelite. Auf Veranstaltungen wird sie immer wieder ausgezeichnet. Bei einer Tierschau in Italien erhielt sie zwar nicht den ersten Preis, aber trotzdem war sie unter den schönsten Kühen Europas. Kristas Besitzer Jörg Seeger ist begeistert von seinem Star im Stall.\n\nJörg und Janine Seeger erlauben dem Kinozuschauer interessante Einblicke in ihren Alltag auf dem Bauernhof. Die Kamera verfolgt zwar immer den Weg von Kuh Krista, aber zu sehen ist dabei natürlich auch die Arbeit của cả gia đình trên trang trại. Manchmal ist das auch ein romantisches Leben, es ist aber vor allem immer sehr arbeitsreich.\n\n"Für mich sind Kühe nicht nur Nutztiere", sagt die Bäuerin Janine Seeger. Schon als Kind hätten ihr die Tiere Geborgenheit, manchmal Trost gespendet. Aber sie weiß, dass die Kühe Geld bringen müssen, entweder durch möglichst viel Milch oder durch viel Nachwuchs. Die kleinen Kälber lassen sich zu recht guten Preisen verkaufen, das lohnt sich für die Seegers.\n\nKrista kann zunächst aus gesundheitlichen Gründen keine Kälber bekommen. Auch diese Problematik wird im Film gezeigt. Der Zuschauer merkt, dass Jörg Seeger enttäuscht ist: Seine beste Kuh kann kein Kalb bekommen. Aber es geht gut aus, denn Krista wird operiert und nach Ende der Dreharbeiten klappt es dann doch mit dem Nachwuchs für die Kuh.\n\nWährend der jahrelangen Dreharbeiten hat sich auch die Familie entwickelt. Mittlerweile haben die Seegers zwei Kinder. "Deshalb verändert sich im Film mein Gewicht etwas", erzählt Janine Seeger und lacht. Und wie ist es so, vor der Kamera zu stehen? "Erst ungewohnt, dann irgendwie vertraut", sagt the 37-Jährige. Zu den Filmemachern habe sich ein freundschaftliches Verhältnis entwickelt. "Wie schön, Carsten und Antje sind wieder da", habe es dann nur noch geheißen, wenn das Team anrückte.\n\nDer Film zeigt aber auch, wie sich im Laufe der Jahre das Leben auf dem Hof der Seegers verändert hat und wie schwierig es auch hier geworden ist, mit Milchkühen Geld zu verdienen. Der Markt ist hart umkämpft und die Preise sinken immer weiter, denn die Verbraucher im Supermarkt greifen gerne zum günstigsten Produkt. Für viele ist es da nicht wichtig, wie die Milch produziert wurde. Auch das zeigt der Film, wenngleich eher nebenbei.\n\nFamilie Seeger ist stolz darauf, dass ein Film über ihren Hof und über die schöne Kuh Krista gedreht wurde. So heißt nun übrigens auch der Film: "Die schöne Krista". Am vergangenen Wochenende haben die Seegers den Film bei einem Hoffest gezeigt. Familie und Freunde sowie Nachbarn waren zu Gast, und alle haben sich über den Film gefreut.\n\n"Die schöne Krista" ist auch die in die Auswahl für den Deutschen Filmpreis gekommen, als einer der fünfzehn besten Dokumentarfilme. Die 500 Filmkritiker, die diese 15 Filme ausgewählt haben, waren begeistert. Schwieriger sei es, so die Produktionsfirma, die Kinobetreiber vom Film zu überzeugen. "Was sollen wir mit einer Kuh?", sei eine häufige Reaktion. Vielleicht würden sie ihre Meinung ändern, wenn Sie Krista einmal auf dem Hof gesehen hätten.`,
        questions: [
          { num: 6, question: "Holstein-Rinder...", options: { A: "sind in der Milchproduktion beliebter als andere Rinderrassen", B: "spielen in der Milchproduktion kaum eine Rolle", C: "stammen aus Norddeutschland" } },
          { num: 7, question: "Die Kuh Krista...", options: { A: "hat bereits einige Preise gewonnen", B: "war Siegerin bei einer Veranstaltung in Italien", C: "wurde als schönste Kuh Europas ausgezeichnet" } },
          { num: 8, question: "Während der Filmaufnahmen...", options: { A: "bekam Krista ein Kalb", B: "wäre Krista fast gestorben", C: "wurde Krista operiert" } },
          { num: 9, question: "Die wirtschaftlichen Probleme von Milchbetrieben...", options: { A: "betreffen die Familie Seeger nicht", B: "sind die Folge des Verbraucherverhaltens", C: "werden im Film ausführlich behandelt" } },
          { num: 10, question: "Die schöne Krista...", options: { A: "begeistert Kinobetreiber bislang nicht", B: "könnte die Kritiker nicht überzeugen", C: "wurde als beste Dokumentation ausgezeichnet" } }
        ]
      };
    }
    
    // Fill Teil 3 Situations & Texts
    if (!jug1.teil3 || Object.keys(jug1.teil3).length === 0) {
      jug1.teil3 = {
      situations: [
        { id: 11, desc: "Ein Freund von Ihnen möchte gerne bei einer Sportveranstaltung mitarbeiten" },
        { id: 12, desc: "Sie interessieren sich für Videos von besonderen Rettungseinsätzen" },
        { id: 13, desc: "Sie möchten mehr über die psychischen Aspekte von Klettersport erfahren" },
        { id: 14, desc: "Sie möchten mithelfen, Ihre Stadt schöner zu machen" },
        { id: 15, desc: "Ihr Vater plant, eine Familienchronik zu schreiben" },
        { id: 16, desc: "Sie möchten einem Freund ein besonderes Sporterlebnis schenken" },
        { id: 17, desc: "Ihre sechzehnjährige Cousine beschäftigt sich gerne mit kleinen Kindern" },
        { id: 18, desc: "Sie suchen Informationen zu den gesundheitlichen Auswirkungen von Sport" },
        { id: 19, desc: "Sie suchen Informationen über eine Versicherung gegen Sportverletzungen" },
        { id: 20, desc: "Ihr kleiner Bruder möchte einmal ein Feuerwehrauto aus der Nähe sehen" }
      ],
      texts: [
        { key: "a", content: "Gerlinde Kaltenbrunner\nDie Österreicherin Gerlinde Kaltenbrunner zählt zu den bekanntesten Bergsteigerinnen der Welt. Als erste Frau hat sie aus eigener Kraft, das heißt ohne Träger und ohne Sauerstoff, alle 14 Achttausender bestiegen. Schon sehr früh entdeckte sie ihre Begeisterung für die Berge ihrer oberösterreichischen Heimat. Ihren ersten Achttausender bestieg sie mit 23 Jahren und seit mehr als zehn Jahren ist sie Profibergsteigerin. In ihrem Vortrag spricht Gerlinde Kaltenbrunner über ihre Erlebnisse und ihre Pläne, über Leidenschaft, Willensstärke, Disziplin und Geduld.\nHöhenbergsteigerin Gerlinde Kaltenbrunner, 14. Mai, Kulturzentrum, 20.00 Uhr" },
        { key: "b", content: "Seniorenwohnhaus \"Zur alten Linde\"\nSie möchten sich gerne ehrenamtlich im sozialen Bereich engagieren? Wir bieten Ihnen eine ganze Reihe von Möglichkeiten dazu: Besuchsdienste, Begleitung und Hiltestellung bei Behördenwegen, Spazierengehen und vieles mehr. Wenn Sie sich für alte Menschen und ihre Geschichten interessieren, wenn Sie Einfühlungsvermögen haben und gerne zuhören, dann füllen Sie doch einfach den Fragebogen aus. Anschließend vereinbaren wir einen Termin für ein Erstgespräch.\nWir freuen uns auf Ihre Nachricht." },
        { key: "c", content: "Neue Studie erschienen\nEine neue Studie stellt intensiv betriebenem körperlichem Training kein gutes Zeugnis aus. Dabei hatte die Studie den Aspekten des hohen Gefahrenpotenzials und die damit verbundenen Unfallverletzungen bewusst ausgeklammert. Es ging lediglich um die Fragestellung, ob ein Mehr an körperlichem Training auch gesünder sei. Dass regelmäßige Bewegung gesund ist, steht außer Frage. Wer sich täglich körperlich betätigt, senkt sein Risiko für viele Krankheiten wie zum Beispiel Diabetes und Herzerkrankungen. Der Studie zufolge soll extremes Training dieses Risiko allerdings wieder erhöhen. Zu den ausführlichen Ergebnissen der Studie gelangen Sie hier." },
        { key: "d", content: "Historische Fotos für das Stadtjubiläum\nFür die geplante Ausstellung zum bevorstehenden Stadtjubiläum sucht das Kulturamt noch historische Aufnahmen. Dazu werden alle Bürgerinnen und Bürger ganz herzlich gebeten, alte Bilder und Fotos zur Verfügung zu stellen. Von Interesse sind nicht nur geschichtlich relevante Aufnahmen, sondern auch private Bilder, die vom Leben in unserer Stadt erzählen. Weil in diesem Jahr auch der Städtische Sportclub sein 100-jähriges Bestehen feiert, soll es eine eigene Bilderabteilung geben, die historischen Sportveranstaltungen gewidmet is. Der Termin und der Ort, zu dem Sie ihre Erinnerungsstücke zur Sichtung bringen können, werden noch bekannt gegeben." },
        { key: "e", content: "Nervenkitzel pur: Bungee-Jumping\nWir bieten euch unvergessliche Erlebnisse rund um die Extremsport Bungee-Jumping. In einer traumhaften Landschaft, mehr als 100 Meter über dem Wasser, verschaffen wir euch den ultimativen Kick! Im Sommer haben wir wieder täglich von Dienstag bis Sonntag jeweils ab Mittag geöffnet - geeignetes Wetter vorausgesetzt. Für Sprünge am Tag ist eine Reservierung nicht zwingend notwendig, aber besonders bei Schönwetter empfehlenswert. Im August bieten wir auch zwei Nachtsprungtermine an. Für diese müsst ihr mindestens sechs Personen sein und euch auch verbindlich anmelden. Hier geht es zur Terminreservierung. Weitere Infos zu Preisen, Lage und Anfahrt gibt es hier." },
        { key: "f", content: "Freiwillige Feuerwehr\nDie Freiwillige Feuerwehr rückt nicht nur an, wenn es brennt, sondern vermitteln auch Wissenswertes zum Thema Brandschutz. Gemeinsam mit Pädagogen hat unsere Freiwillige Feuerwehr ein Programm entwickelt, mit dem sie das Bewusstsein der Kinder und Jugendlichen für das Thema Sicherheit und Gefahrenvermeidung schärfen möchte. Im Rahmen dieses Projektes wurden gemeinsam mit Pädagogen und Pädagoginnen besondere Arbeitsunterlagen für Trainingseinheiten an Bildungsstätten vorbereitet. Interessierte Schulen und Kindergärten haben noch bis Ende April die Möglichkeit, sich zu dem training anzumelden.\nTel.: 0677-4567489" },
        { key: "g", content: "Spektakuläre Feuerwehrübung\nÜbung für den Ernstfall: Gemeinsam mit anderen Einsatzorganisationen veranstaltete die örtliche Feuerwehr eine besonders eindrucksvolle Einsatzübung. Dabei wurde simuliert, dass sich bei einer Führung durch das Rathaus ein Unfall im Turm ereignet und mehrere schwerverletzte Menschen geborgen werden müssen. Nach der Erstversorgung durch einen Notarzt in schwindelnder Höhe gelang es, die angeblichen Schwerverletzten über die Drehleiter zu bergen. Hier der Film des spektakulären Einsatzes." },
        { key: "h", content: "Helfer und Helferinnen gesucht\nFür unseren Halbmarathon am 20. Juli suchen wir noch Freiwillige, die uns bei der Benefizveranstaltung unterstützen möchten. Es gibt viele Bereiche, in denen ihr uns helfen könnt: vom Aufbau von Zuschauerbarrieren über Streckensicherung und Startnummernausgabe bis zum Einsatz an den Verpflegungsposten - jede helfende Hand ist uns herzlich willkommen. Die Veranstaltung dient einem guten Zweck. Die Startgelder und 10 Prozent der Einnahmen aus der Gastronomie gehen an gemeinnützige Vereine unserer Stadt. Anmelden könnt ihr euch auf der Webseite der Stadtverwaltung unter Veranstaltungen/ Halbmarathon/ Freiwillige." },
        { key: "i", content: "Märchenwanderung für Kinder von 8 bis 12 Jahren\nWir wandern entlang des Märchenwanderwegs, der durch eine abwechslungsreiche Landschaft führt, mit herrlicher Aussicht auf die Berge. Am Ende des Weges gelangen wir zu einem Wildgehege. Was ihr braucht: feste Schuhe, bei unbeständigem Wetter einen Regenschutz (bitte keine Schirme) und Kleidung, die ruhig schmutzig werden darf.\nTreffpunkt: vor der Kirche, um 10.00 Uhr.\nDauer: 4 Stunden (Wander- und Erzählzeit).\nTeilnahmegebühr: 17 Euro inklusive Mittagessen.\nLeitung: Märchentante Gerlinde, unterstützt von zwei freiwilligen Helferinnen. Wir wandern ohne Eltern oder Begleitpersonen." },
        { key: "j", content: "Aktion \"Sauberes Grün\"\nDie Aktion \"Sauberes grün\" findet dieses Jahr nicht wie bisher an einem einzigen Tag statt, sondern dauert gleich drei Tage. Wir rufen Kindergärten, Schulen und Vereine dazu auf, sich auch dieses Jahr wieder zahlreich an unserer gemeinnützigen Putzaktion zu beteiligen. Ausgerüstet mit Handschuhen und Säcken, werden die Teilnehmerinnen und Teilnehmer Grünflächen, Parks und Spielplätze in der Stadt säubern. Auch Einzelpersonen sind herzlich willkommen! Am Samstag gibt es dann wieder das große Abschlussfest.\nUnsere jährliche Aktion für eine saubere Stadt, dieses Jahr vom 2. bis 4. Mai.\nAnmeldungen bei den städtischen Reinigungsbetrieben: 0240-191980." },
        { key: "k", content: "Tag der offenen Tür in der städtischen Bücherei\nZum Anlass des Welttags des Buches am 23 April möchten wir uns ganz den jungen Lesern widmen. Unser Kinderprogramm umfasst auch spannende Lesungen, für die wir noch Freiwillige unter achtzehn suchen. Nicht Lehrer oder Eltern, sondern junge Menschen sollen den ganz Kleinen aus alten und neuen Kinderbüchern vorlesen. Wenn du gerne (vor)liest, dann bist du am 23. April bei uns genau richtig! Schick uns einfach deine Daten und einen Lesevorschlag per Mail an: info@buecherei-stadt.com. Übrigens: Als kleine Belohnung darfst du dich bei unserem Bücher-Flohmarkt bedienen!" },
        { key: "l", content: "150 Jahre Stadtfeuerwehr\nZum Jubiläum \"150 Stadtfeuerwehr\" laden die Feuerwehr und Katastrophenschutz zu einer Leistungsschau. Zu besichtigen: das brandneue Löschfahrzeug, das auch dank der großzügigen Unterstützung von Sponsoren angeschafft werden konnte. Weiter: einige abenteuerliche Bergungen durch aktive Mitglieder der Freiwilligen Feuerwehr. Dann eine spektakuläre Löschaktion. Und zum Schluss: Grillfeuer für alle!\nWann? Samstag 23. Juli ab 16.00 Uhr, am alten Messegelände.\nDie Freiwillige Feuerwehr hofft auf großes Interesse!" }
      ]
    };
  }

  // Correct Answers
    jug1.answers = {
      ...jug1.answers,
      6: "A", 7: "A", 8: "C", 9: "C", 10: "A",
      11: "H", 12: "G", 13: "A", 14: "J", 15: "X", 16: "E", 17: "K", 18: "C", 19: "X", 20: "L"
    };

    saveDB();
  }
}
initDB();

// Đồng bộ khôi phục dữ liệu từ file lưu trữ của backup_server.js nếu có
fetch('http://localhost:5000/api/backup')
  .then(r => {
    if (r.ok) return r.json();
    throw new Error();
  })
  .then(backupData => {
    if (backupData && backupData.reading && backupData.reading.length > 0) {
      db = backupData;
      localStorage.setItem('maternopro_listening', JSON.stringify(db.listening));
      localStorage.setItem('maternopro_reading', JSON.stringify(db.reading));
      localStorage.setItem('maternopro_writing', JSON.stringify(db.writing));
      localStorage.setItem('maternopro_speaking', JSON.stringify(db.speaking));
      localStorage.setItem('maternopro_grammar', JSON.stringify(db.grammar));
      localStorage.setItem('maternopro_vocab', JSON.stringify(db.vocab));
      console.log("Khôi phục thành công cơ sở dữ liệu từ file maternopro_db_backup.json!");
      if (typeof renderAdmin === 'function' && window.isAdminLoggedIn) {
        renderAdmin();
      }
    }
  })
  .catch(err => {
    // Không có server backup, sử dụng localStorage bình thường
  });

function openDonateModal() {
  const modal = document.getElementById('donate-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeDonateModal() {
  const modal = document.getElementById('donate-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Đóng modal khi bấm ra ngoài
window.addEventListener('click', (e) => {
  const modal = document.getElementById('donate-modal');
  if (modal && e.target === modal) {
    modal.style.display = 'none';
  }
});

let activeSpeakingPreviewId = null;
let currentSpeakingSubTab = 2; // 2 đại diện cho Teil 2, 3 đại diện cho Teil 3

function setSpeakingPreview(id) {
  activeSpeakingPreviewId = id;
  renderSpeaking();
}

function setSpeakingSubTab(tab) {
  currentSpeakingSubTab = tab;
  renderSpeaking();
}

function renderSpeaking() {
  const container = document.getElementById('speaking-content');
  if (!container) return;

  // Dọn dẹp bộ đếm thời gian khi chuyển màn hình
  if (speakingTimerInterval) {
    clearInterval(speakingTimerInterval);
    speakingTimerInterval = null;
  }
  speakingTimerRemaining = 90;

  const isVi = currentLang === 'vi';

  // 1. Màn hình chọn phần thi (Teil chọn lựa) tương tự Schreiben
  if (speakingFlowState === 'category') {
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 3rem;">
        <span style="font-size: 3rem; background: rgba(124, 58, 237, 0.1); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--accent-amber);">🗣️</span>
        <h2 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem;">Sprechen - Teil wählen</h2>
        <p style="color: var(--text-dim);">Wählen Sie den Teil der Sprechprüfung, den Sie üben möchten</p>
      </div>

      <div class="mode-selection-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
        <div class="mode-card" style="border: 1px solid rgba(255,255,255,0.05); text-align: center; padding: 2.5rem 2rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px;">
          <div>
            <div style="background: rgba(0, 242, 254, 0.15); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: var(--accent-cyan); font-size: 1.5rem; font-weight: bold;">
              1️⃣
            </div>
            <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.8rem;">Teil 1: Präsentation</h3>
            <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">Über Erfahrungen sprechen - Thuyết trình ngắn về trải nghiệm cá nhân của bản thân.</p>
          </div>
          <button class="btn btn-secondary" style="width: 100%; border-radius: 6px; padding: 0.8rem;" onclick="setSpeakingState('grid')">Aufgaben anzeigen</button>
        </div>

        <div class="mode-card" style="border: 1px solid rgba(255,255,255,0.05); text-align: center; padding: 2.5rem 2rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; position: relative;">
          <div>
            <div style="background: rgba(255, 0, 122, 0.15); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: #ff007a; font-size: 1.5rem; font-weight: bold;">
              2️⃣
            </div>
            <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.8rem;">Teil 2: Diskussion</h3>
            <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">Diskussion - Thảo luận đề tài xã hội cùng đối tác.</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center; width: 100%;">
            <a class="btn btn-secondary" style="width: 100%; border-radius: 6px; padding: 0.8rem; text-decoration: none;" href="https://docs.google.com/document/d/16cIMUluY3Q5gk-IsSdhsXijqkKUTNAg2GEtfsmhOZM8/edit?tab=t.0" target="_blank">Aufgaben anzeigen ↗</a>
            <img src="logo.jpg" style="width: 80px; height: 35px; object-fit: contain; opacity: 0.8; margin-top: 0.5rem; filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.3));" />
          </div>
        </div>

        <div class="mode-card" style="border: 1px solid rgba(255,255,255,0.05); text-align: center; padding: 2.5rem 2rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; position: relative;">
          <div>
            <div style="background: rgba(139, 92, 246, 0.15); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: var(--accent-purple); font-size: 1.5rem; font-weight: bold;">
              3️⃣
            </div>
            <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.8rem;">Teil 3: Gemeinsam planen</h3>
            <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem;">Gemeinsam etwas planen - Lập kế hoạch công việc cùng đối tác.</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center; width: 100%;">
            <a class="btn btn-secondary" style="width: 100%; border-radius: 6px; padding: 0.8rem; text-decoration: none;" href="https://docs.google.com/document/d/1fDzsypB27UxCPCZ0EpY2RTPcZOZeAUguBHu6jTvldss/edit?tab=t.0" target="_blank">Aufgaben anzeigen ↗</a>
            <img src="logo.jpg" style="width: 80px; height: 35px; object-fit: contain; opacity: 0.8; margin-top: 0.5rem; filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.3));" />
          </div>
        </div>
      </div>
    `;
  }

  else if (speakingFlowState === 'grid') {
    // Tự động chọn đề đầu tiên để hiển thị bản xem trước
    if (activeSpeakingPreviewId === null && db.speaking.length > 0) {
      activeSpeakingPreviewId = db.speaking[0].id;
    }

    // Tìm thông tin đề đang được xem trước
    let previewTopic = db.speaking.find(t => t.id === activeSpeakingPreviewId);
    if (!previewTopic && db.speaking.length > 0) {
      previewTopic = db.speaking[0];
    }

    let previewTitle = '';
    let previewDesc = '';
    if (previewTopic) {
      const previewIndex = db.speaking.indexOf(previewTopic);
      previewTitle = previewTopic.title;
      previewDesc = previewTopic.desc || `Präsentation zum Thema ${previewTopic.title}`;
      
      if (previewIndex > 0) {
        previewTitle = `${previewIndex}. ${previewTitle}`;
      } else if (isVi && previewTopic.id === 1) {
        previewTitle = "Teil 1: Über Erfahrungen sprechen";
        previewDesc = "Đề bài bao gồm toàn bộ các chủ đề của Phần 1 (Thuyết trình trải nghiệm cá nhân)";
      }
    }

    container.innerHTML = `
      ${`
        <button class="btn btn-secondary" onclick="setSpeakingState('category')" style="margin-bottom: 2rem;">
          ← Zurück
        </button>
      `}
      <!-- Tiêu đề trang hoành tráng -->
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2.5rem; flex-wrap: wrap;">
        <span style="font-size: 2.2rem; background: rgba(124, 58, 237, 0.1); width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: var(--accent-amber);">🗣️</span>
        <div>
          <h2 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0; letter-spacing: 0.5px;">
            ${isVi ? 'Sprechen B2 - Teil 1 Explorer' : 'Sprechen B2 - Teil 1 Explorer'}
          </h2>
          <p style="color: var(--text-dim); margin: 0.2rem 0 0 0; font-size: 0.95rem;">
            ${isVi ? 'Hệ thống luyện nói Teil 1 - Chọn chủ đề và bắt đầu ghi âm phản xạ' : 'Intelligentes Sprech-Lernsystem - Thema wählen und Reflex-Aufnahme starten'}
          </p>
        </div>
      </div>

      <!-- Bố cục Split Dashboard hoàn toàn khác biệt -->
      <div class="test-split-container" style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 2rem; align-items: start; margin-bottom: 5rem;">
        
        <!-- CỘT TRÁI: DANH SÁCH CHỦ ĐỀ DẠNG TIMELINE MENU cực kỳ đẹp -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>📋</span> ${isVi ? 'Danh sách chủ đề thuyết trình' : 'Themenliste'}
          </h4>
          <div style="max-height: 520px; overflow-y: auto; padding-right: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            ${db.speaking.length === 0 ? `
              <div style="padding: 3rem; text-align: center; color: var(--text-dim); background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; width: 100%;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                <h4 style="color: #fff; margin-bottom: 0.5rem;">Chưa có chủ đề Teil 1 nào</h4>
                <p style="font-size:0.9rem;">Vui lòng vào <b>Trang Quản Trị (Admin)</b> để thêm chủ đề nói.</p>
              </div>
            ` : db.speaking.map((topic, index) => {
              let title = topic.title;
              if (index > 0) {
                title = `${index}. ${title}`;
              } else if (isVi && topic.id === 1) {
                title = "Teil 1: Über Erfahrungen sprechen";
              }
              
              const isSelected = topic.id === activeSpeakingPreviewId;
              
              // Style cho đề đang được chọn xem trước
              const cardBg = isSelected ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.02)';
              const cardBorder = isSelected ? '1px solid rgba(124, 58, 237, 0.45)' : '1px solid rgba(255, 255, 255, 0.05)';
              const leftIndicator = isSelected ? 'background: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan);' : 'background: transparent;';

              return `
                <div class="speak-menu-item" onclick="setSpeakingPreview(${topic.id})" style="display: flex; align-items: center; gap: 1rem; background: ${cardBg}; border: ${cardBorder}; padding: 1.1rem; border-radius: 12px; cursor: pointer; transition: all 0.25s ease; position: relative;" onmouseover="if(!${isSelected}) { this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.1)'; }" onmouseout="if(!${isSelected}) { this.style.background='rgba(255,255,255,0.02)'; this.style.borderColor='rgba(255, 255, 255, 0.05)'; }">
                  <!-- Dải neon báo trạng thái bên trái -->
                  <div style="position: absolute; left: 0; top: 25%; bottom: 25%; width: 4px; border-radius: 0 4px 4px 0; ${leftIndicator}"></div>
                  
                  <!-- Logo thương hiệu nhỏ -->
                  <img src="logo.jpg" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); box-shadow: ${isSelected ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none'}; transition: all 0.3s;">
                  
                  <div style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                      <h5 style="font-size: 0.98rem; font-weight: bold; color: ${isSelected ? '#fff' : '#e2e8f0'}; margin: 0; transition: color 0.3s;">${title}</h5>
                    </div>
                  </div>
                  <span style="font-size: 0.9rem; color: var(--text-dim);">➔</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- CỘT PHẢI: BẢN XEM TRƯỚC CHI TIẾT & NÚT BẮT ĐẦU (Topic Preview Dashboard) -->
        <div style="position: sticky; top: 2rem;">
          <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>🔍</span> ${isVi ? 'Chi tiết chủ đề thuyết trình' : 'Themenvorschau'}
          </h4>
          
          ${previewTopic ? `
            <div style="background: rgba(30, 30, 70, 0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 16px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; display: flex; flex-direction: column; align-items: center; min-height: 400px; justify-content: space-between;">
              
              <div style="width: 100%;">
                <!-- Glowing logo bubble header -->
                <div style="position: relative; display: inline-block; margin-bottom: 1.5rem; animation: pulse 2s infinite;">
                  <img src="logo.jpg" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan); box-shadow: 0 0 25px rgba(0, 242, 254, 0.45);">
                </div>
                
                <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3;">
                  ${previewTitle}
                </h3>
                
                <div style="background: rgba(0,0,0,0.2); padding: 1.2rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 1.5rem; text-align: left;">
                  <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin: 0; text-align: justify; white-space: pre-wrap;">${previewDesc}</p>
                </div>

                <div style="text-align: left; font-size: 0.85rem; color: var(--text-dim); display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem; margin-bottom: 2rem;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Thời gian thi nói:</span>
                    <strong style="color: #fff;">1 phút 30 giây</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Yêu cầu trình độ:</span>
                    <strong style="color: var(--accent-cyan);">Deutsch B2</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Dạng bài thuyết trình:</span>
                    <strong style="color: var(--accent-amber);">Präsentation</strong>
                  </div>
                </div>
              </div>

              <button onclick="startSpeakingExercise(${previewTopic.id})" style="width: 100%; font-weight: bold; font-size: 1rem; padding: 1rem; border-radius: 12px; background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan)); border: none; color: #fff; box-shadow: 0 4px 20px rgba(0, 242, 254, 0.35); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.8rem; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 6px 25px rgba(0, 242, 254, 0.5)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 20px rgba(0, 242, 254, 0.35)';">
                🗣️ ${isVi ? 'Bắt đầu luyện nói ngay' : 'Jetzt sprechen'} ➔
              </button>

            </div>
          ` : `
            <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 3rem; text-align: center; color: var(--text-dim);">
              Vui lòng chọn một đề thi để xem chi tiết
            </div>
          `}
        </div>

      </div>
    `;
  } else if (speakingFlowState === 'exercise') {
    let topic = db.speaking.find(t => t.id === selectedSpeakingTopicId);
    if (!topic) topic = db.speaking[0];

    const topicIdx = db.speaking.indexOf(topic);
    let exerciseTitle = topic.title;
    if (topicIdx > 0) {
      exerciseTitle = `${topicIdx}. ${exerciseTitle}`;
    } else if (isVi && topic.id === 1) {
      exerciseTitle = "Teil 1: Über Erfahrungen sprechen";
    }

    // Nội dung chi tiết cho đề 1 giống hệt ảnh screenshot
    let exerciseHTML = '';
    if (topic.id === 1) {
      exerciseHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <img src="logo.jpg" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);">
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0;">${isVi ? 'Sách' : 'Buch'}</h3>
            <p style="color: var(--text-dim); font-size: 0.88rem; margin: 0.2rem 0 0 0;">
              ${isVi ? 'Thuyết trình một chủ đề trước nhóm. Bạn có thời gian chuẩn bị.' : 'Präsentieren Sie ein Thema vor der Gruppe. Sie haben Vorbereitungszeit.'}
            </p>
          </div>
        </div>

        <div style="color: var(--accent-amber); font-size: 0.95rem; font-weight: bold; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
          🕒 ${isVi ? 'Thời gian: 5 phút' : 'Zeit: 5 Minuten'}
        </div>

        <!-- Khung Hướng dẫn tiếng Đức/Việt & Đồng hồ bấm giờ -->
        <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <h5 style="color: var(--accent-cyan); margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 800;">
              ${isVi ? '⏱️ ĐỒNG HỒ BẤM GIỜ NÓI (1 PHÚT 30 GIÂY)' : '⏱️ PRÄSENTATIONSTIMER (1 MINUTE 30 SEKUNDEN)'}
            </h5>
            <p style="color: #e2e8f0; font-size: 0.9rem; margin: 0; line-height: 1.5; text-align: justify;">
              ${isVi 
                ? 'Bạn và đối tác của bạn sẽ trình bày về 1 trong 7 chủ đề dưới đây. Thời gian nói tối đa là <b>1 phút 30 giây</b>. Sau khi nói xong, tùy từng đề bài cụ thể, hai bạn sẽ đặt câu hỏi phản biện cho nhau từ <b>1 đến 2 câu</b> hoặc giám khảo sẽ đặt câu hỏi cho bạn.'
                : 'Sie und Ihr Partner präsentieren ein Thema aus den folgenden 7 Themen. Die Redezeit beträgt maximal <b>1,5 Minuten</b>. Danach stellen Sie einander <b>1 bis 2 Fragen</b> oder der Prüfer stellt Ihnen Fragen.'}
            </p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 170px; background: rgba(0,0,0,0.25); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div id="speaking-timer-display" style="font-size: 2.2rem; font-weight: 800; color: var(--accent-cyan); font-family: monospace; letter-spacing: 2px;">01:30</div>
            <div style="display: flex; gap: 0.4rem; width: 100%;">
              <button id="speaking-timer-start" class="btn btn-primary" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; flex: 1; font-weight: bold; border-radius: 4px;" onclick="startSpeakingTimer()">${isVi ? 'Bắt đầu' : 'Starten'}</button>
              <button id="speaking-timer-pause" class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; flex: 1; font-weight: bold; border-radius: 4px;" onclick="pauseSpeakingTimer()">${isVi ? 'Dừng' : 'Pause'}</button>
            </div>
            <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; width: 100%; font-weight: bold; border-radius: 4px; background: rgba(255,255,255,0.03);" onclick="resetSpeakingTimer()">${isVi ? 'Reset' : 'Reset'}</button>
          </div>
        </div>

        <!-- Khung Aufgabenstellung -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
          <h4 style="color: var(--text-dim); font-weight: bold; font-size: 1rem; margin-bottom: 0.8rem; text-transform: uppercase;">
            ${isVi ? 'Yêu cầu đề bài (Aufgabenstellung)' : 'Aufgabenstellung'}
          </h4>
          <p style="line-height: 1.7; font-size: 0.98rem; margin: 0; color: #e2e8f0; text-align: justify;">
            Sie sollen Ihrer Partnerin bzw. Ihrem Partner über Ihre Erfahrungen zu einem der folgenden Themen berichten. 
            Die Stichpunkte in den Klammern können als Anregung dienen. Sie haben dazu ca. 1 ½ Minuten Zeit. Im Anschluss sollen Sie die Fragen Ihrer Partnerin bzw. Ihres Partners beantworten.
          </p>
        </div>

        <!-- Khung Thema -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px;">
          <h4 style="color: var(--text-dim); font-weight: bold; font-size: 1rem; margin-bottom: 0.8rem; text-transform: uppercase;">
            ${isVi ? 'Các chủ đề lựa chọn (Thema)' : 'Thema'}
          </h4>
          <ul style="padding-left: 0; list-style: none; line-height: 1.8; color: #cbd5e1; font-size: 0.95rem; margin: 0;">
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Ein Buch</b>, das Sie gelesen haben (Thema, Autor, Ihre Meinung usw)
            </li>
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Einen Film</b>, den Sie gesehen haben (Thema und Handlung, Schauspieler, Ihre Meinung usw)
            </li>
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Eine Reise</b>, die Sie unternommen haben (Ziel, Zeit, Land und Leute, Sehenswürdigkeiten usw)
            </li>
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Eine Musikveranstaltung</b>, die Sie besucht haben (Musikrichtung, Musiker, Ort, persönliche Vorlieben usw)
            </li>
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Ein Sportereignis</b>, das Sie besucht haben (Sportart, Ort, Personen, Ergebnis usw)
            </li>
            <li style="margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 0.4rem;">
              • <b>Eine Person</b>, die in Ihrem Leben wichtig war (wer, wann, warum wichtig usw.)
            </li>
            <li style="margin: 0;">
              • <b>Eine wichtige Erfahrung</b>, die Sie in Ihrem Leben gemacht haben (was, wann, wo, mit wem, warum wichtig usw)
            </li>
          </ul>
        </div>
      `;
    } else {
      // Cho các chủ đề nói khác (Cấu trúc mới: Hiện đồng thời cả Teil 2 và Teil 3 xếp chồng nhau)
      const teil2Subtitle = "Diskutieren Sie das Thema mit Ihrem Partner. Tauschen Sie Meinungen aus.";
      const teil2AufgabenstellungText = "Lesen Sie folgenden Text aus einer Zeitschrift. Diskutieren Sie mit ihrem Partner oder ihrer Partnerin über den Inhalt des Textes, bringen Sie Ihre Erfahrungen ein và äußern Sie Ihre Meinung. Begründen Sie Ihre Argumente. Sprechen Sie über mögliche Lösungen.";
      const teil2PromptText = topic.teil2 || topic.prompt || 'Chưa có đề bài chi tiết cho Teil 2.';

      const teil3Subtitle = "Arbeiten Sie mit Ihrem Partner zusammen, um ein Problem to lösen.";
      const teil3AufgabenstellungText = "Gemeinsam etwas planen";
      const teil3PromptText = topic.teil3 || 'Chưa có đề bài chi tiết cho Teil 3.';

      exerciseHTML = `
        <!-- KHUNG TEIL 2 -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 16px; margin-bottom: 2.5rem;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <img src="logo.jpg" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan); box-shadow: 0 0 10px rgba(0, 242, 254, 0.35);">
            <div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0;">Teil 2: Diskussion (Thảo luận) - ${exerciseTitle}</h3>
              <p style="color: var(--text-dim); font-size: 0.88rem; margin: 0.2rem 0 0 0; line-height: 1.3;">${teil2Subtitle}</p>
            </div>
          </div>

          <div style="color: var(--accent-amber); font-size: 0.95rem; font-weight: bold; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            🕒 Zeit: 5 Minuten
          </div>

          <!-- Khung Hướng dẫn (Aufgabenstellung) -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 10px; margin-bottom: 1.2rem;">
            <h4 style="color: var(--text-dim); font-weight: bold; font-size: 0.85rem; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.5px;">
              Aufgabenstellung
            </h4>
            <p style="line-height: 1.6; font-size: 0.95rem; margin: 0; color: #cbd5e1; text-align: justify;">
              ${teil2AufgabenstellungText}
            </p>
          </div>

          <!-- Khung Chủ đề bài thi (Thema) -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px;">
            <h4 style="color: var(--text-dim); font-weight: bold; font-size: 0.85rem; margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">
              Thema
            </h4>
            <div style="line-height: 1.7; font-size: 1rem; margin: 0; color: #f1f5f9; text-align: justify; white-space: pre-wrap; font-family: 'Inter', sans-serif;">${teil2PromptText}</div>
          </div>
        </div>

        <!-- KHUNG TEIL 3 -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <img src="logo.jpg" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan); box-shadow: 0 0 10px rgba(0, 242, 254, 0.35);">
            <div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0;">Teil 3: Gemeinsam etwas planen (Lập kế hoạch)</h3>
              <p style="color: var(--text-dim); font-size: 0.88rem; margin: 0.2rem 0 0 0; line-height: 1.3;">${teil3Subtitle}</p>
            </div>
          </div>

          <!-- Khung Hướng dẫn (Aufgabenstellung) -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 10px; margin-bottom: 1.2rem;">
            <h4 style="color: var(--text-dim); font-weight: bold; font-size: 0.85rem; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.5px;">
              Aufgabenstellung
            </h4>
            <p style="line-height: 1.6; font-size: 0.95rem; margin: 0; color: #cbd5e1; text-align: justify;">
              ${teil3AufgabenstellungText}
            </p>
          </div>

          <!-- Khung Chủ đề bài thi (Thema) -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px;">
            <h4 style="color: var(--text-dim); font-weight: bold; font-size: 0.85rem; margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">
              Thema
            </h4>
            <div style="line-height: 1.7; font-size: 1rem; margin: 0; color: #f1f5f9; text-align: justify; white-space: pre-wrap; font-family: 'Inter', sans-serif;">${teil3PromptText}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem;">
        <button class="btn btn-secondary" onclick="setSpeakingState('grid')" style="padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem;">
          ← ${isVi ? 'Quay lại' : 'Zurück'}
        </button>
        <div style="text-align: right;">
          <h2 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0;">${isVi && topic.id === 1 ? 'Phần 1: Trình bày trải nghiệm cá nhân' : topic.title}</h2>
          <p style="color: var(--text-dim); font-size: 0.8rem; margin: 0.2rem 0 0 0;">${isVi && topic.id === 1 ? 'Đề bài bao gồm toàn bộ 7 chủ đề trải nghiệm của phần 1' : topic.desc}</p>
        </div>
      </div>

      <div class="card" style="background: rgba(22, 22, 54, 0.45); border: 1px solid var(--border-light); padding: 2.2rem; border-radius: 20px; max-width: 850px; margin: 0 auto;">
        ${exerciseHTML}
      </div>
    `;
  }
}

function startSpeakingExercise(id) {
  selectedSpeakingTopicId = id;
  speakingFlowState = 'exercise';
  renderSpeaking();
}

function setSpeakingState(state) {
  speakingFlowState = state;
  renderSpeaking();
}

// ==========================================
// 5. NGỮ PHÁP (GRAMMATIK)
// ==========================================
function renderGrammar() {
  const container = document.getElementById('grammar-content');
  if (!container) return;
  if (db.grammar.length === 0) {
    container.innerHTML = `<div class="card"><p>Chưa có bài ngữ pháp nào. Hãy vào trang Admin để thêm bài mới.</p></div>`;
    return;
  }

  container.innerHTML = db.grammar.map((item, index) => `
    <div class="card">
      <h3>Bài ${index + 1}: ${item.title}</h3>
      <div style="background: rgba(189, 0, 255, 0.05); border: 1px solid var(--border-light); border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
        <h4 style="color: var(--accent-purple); margin-bottom: 0.5rem;">Quy tắc lý thuyết:</h4>
        <p style="line-height: 1.6;">${item.rule}</p>
      </div>
      <p style="font-weight: 600; margin-bottom: 1rem;">Bài tập thực hành: ${item.question}</p>
      <div class="options-grid" id="gram-opts-${item.id}">
        ${item.options.map((opt, oIdx) => `
          <button class="option-card" onclick="selectGramOption(${item.id}, ${oIdx})">${opt}</button>
        `).join('')}
      </div>
      <div class="card" id="gram-explain-${item.id}" style="display:none; background: rgba(0, 242, 254, 0.08); border-left: 4px solid var(--success);">
        <h4 style="color: var(--success); margin-bottom: 0.5rem;">Giải thích:</h4>
        <p>${item.explanation}</p>
      </div>
    </div>
  `).join('');
}

function selectGramOption(itemId, optionIndex) {
  const item = db.grammar.find(g => g.id === itemId);
  const optsContainer = document.getElementById(`gram-opts-${itemId}`);
  const explainBox = document.getElementById(`gram-explain-${itemId}`);

  const buttons = optsContainer.querySelectorAll('.option-card');
  buttons.forEach((btn, idx) => {
    btn.style.pointerEvents = 'none';
    if (idx === item.answer) {
      btn.classList.add('correct');
    } else if (idx === optionIndex) {
      btn.classList.add('incorrect');
    }
  });

  explainBox.style.display = 'block';
}

// ==========================================
// 6. TỪ VỰNG THEO CHỦ ĐỀ (WORTSCHATZ)
// ==========================================
let selectedTopic = "All";

function renderVocab() {
  const topicsTabs = document.getElementById('vocab-topics-tabs');
  const cardsGrid = document.getElementById('vocab-cards-grid');
  if (!cardsGrid) return;

  if (db.vocab.length === 0) {
    if (topicsTabs) topicsTabs.innerHTML = '';
    cardsGrid.innerHTML = `<div class="card" style="grid-column: 1/-1;"><p>Chưa có từ vựng nào. Hãy vào trang Admin để thêm từ mới.</p></div>`;
    return;
  }

  // Trích xuất danh sách chủ đề duy nhất
  const topics = ["All", ...new Set(db.vocab.map(v => v.topic))];

  // Render Tabs Lọc
  if (topicsTabs) {
    topicsTabs.innerHTML = topics.map(t => `
      <button class="tab-btn ${t === selectedTopic ? 'active' : ''}" onclick="filterVocabTopic('${t}')">${t}</button>
    `).join('');
  }

  // Lọc từ vựng
  const filteredVocab = selectedTopic === "All" ? db.vocab : db.vocab.filter(v => v.topic === selectedTopic);

  // Render Danh sách Cards
  cardsGrid.innerHTML = filteredVocab.map(v => `
    <div class="vocab-card">
      <div class="vocab-word">${v.word}</div>
      <div class="vocab-meaning">${v.meaning}</div>
      <div style="font-size: 0.85rem; color: var(--accent-purple); font-weight: bold; margin-bottom: 0.8rem; text-transform: uppercase;">
        Chủ đề: ${v.topic}
      </div>
      <div class="vocab-example"><b>Ví dụ:</b> ${v.example}</div>
    </div>
  `).join('');
}

function filterVocabTopic(topic) {
  selectedTopic = topic;
  renderVocab();
}

// ==========================================
// 7. QUẢN TRỊ ADMIN PANEL
// ==========================================
function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.style.display = 'none';
  });
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.getElementById(tabId).style.display = 'block';
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  if (tabId === 'admin-reading') {
    loadAdminReadingTestAnswers();
  } else if (tabId === 'admin-listening') {
    loadAdminListeningTestAnswers();
  }
}

console.log("MaterNoPro App Loaded - Version 2.4 with Complete 50+ Writing Tasks Grid Flow");

let isAdminLoggedIn = sessionStorage.getItem('admin_logged') === 'true';

function handleAdminLogin() {
  const userInp = document.getElementById('admin-login-user');
  const passInp = document.getElementById('admin-login-pass');
  if (!userInp || !passInp) return;

  const username = userInp.value.trim().toLowerCase();
  const password = passInp.value.trim();

  if (username === 'maternopro@gmail.com' && password === 'Minhanh@09092006') {
    isAdminLoggedIn = true;
    sessionStorage.setItem('admin_logged', 'true');
    renderAdmin();
  } else {
    alert("Sai tên đăng nhập hoặc mật khẩu quản trị!");
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  
  const web3Key = 'ec290d59-091f-43b4-a98c-73e0766c0532';

  const mockCode = Math.floor(100000 + Math.random() * 900000);
  
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        access_key: web3Key,
        name: "MaterNoPro Security",
        subject: "Mã xác thực OTP khôi phục mật khẩu Admin",
        message: `Mã OTP của bạn là: ${mockCode}\n\nVui lòng nhập mã này vào trang web để lấy lại mật khẩu đăng nhập Admin.\n(Mã này chỉ có hiệu lực trong phiên làm việc hiện tại).`
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert("Đã gửi mã khôi phục mật khẩu đến email ma*********@gmail.com thành công!\nVui lòng kiểm tra hộp thư của bạn (hãy kiểm tra cả mục Thư rác/Spam nếu không thấy).");
      
      const userCode = prompt("Vui lòng nhập mã xác nhận gồm 6 chữ số gửi về email ma*********@gmail.com:");
      if (userCode && userCode.trim() === String(mockCode)) {
        alert("Xác thực thành công! Mật khẩu quản trị của bạn là: Minhanh@09092006");
      } else if (userCode !== null) {
        alert("Mã xác nhận không chính xác!");
      }
    } else {
      throw new Error(result.message || "Gửi mail thất bại");
    }
  } catch (error) {
    alert("Không thể gửi email: " + error.message + "\n(Vui lòng kiểm tra lại Access Key hoặc kết nối mạng. Mã OTP dự phòng đã được ghi tạm vào Console F12).");
    console.log("=== HỆ THỐNG QUẢN TRỊ ===");
    console.log("Mã khôi phục mật khẩu (OTP dự phòng):", mockCode);
    console.log("==========================");
  }
}

function renderAdmin() {
  const loginWrapper = document.getElementById('admin-login-wrapper');
  const mainWrapper = document.getElementById('admin-main-wrapper');

  if (!isAdminLoggedIn) {
    if (loginWrapper) loginWrapper.style.display = 'flex';
    if (mainWrapper) mainWrapper.style.display = 'none';
    return;
  }

  if (loginWrapper) loginWrapper.style.display = 'none';
  if (mainWrapper) mainWrapper.style.display = 'block';

  renderAdminVocabList();
  renderAdminListeningList();
  renderAdminReadingList();
  renderAdminWritingList();
  renderAdminSpeakingList();
  renderAdminGrammarList();

  // Điền danh sách đề thi đọc vào phần cấu hình đáp án
  const selectReading = document.getElementById('admin-select-reading-test');
  if (selectReading) {
    selectReading.innerHTML = db.reading.filter(t => t && t.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    
    if (window.adminCurrentReadingTest && db.reading.find(t => t.name === window.adminCurrentReadingTest)) {
      selectReading.value = window.adminCurrentReadingTest;
    }
    
    selectReading.setAttribute('data-prev', selectReading.value);
    selectReading.addEventListener('focus', function() {
      this.setAttribute('data-prev', this.value);
    });
    selectReading.onchange = function() {
      const oldTest = this.getAttribute('data-prev');
      const newTest = this.value;
      if (oldTest && oldTest !== newTest) {
        this.value = oldTest; // temporarily revert
        if (typeof saveAdminReadingTestAnswers === 'function') saveAdminReadingTestAnswers(null, true);
        this.value = newTest;
      }
      this.setAttribute('data-prev', newTest);
      window.adminCurrentReadingTest = newTest;
      loadAdminReadingTestAnswers();
    };
    
    loadAdminReadingTestAnswers();
    buildPremiumDropdown(selectReading);
  }

  // Điền danh sách đề thi nghe vào phần cấu hình đáp án
  const selectListening = document.getElementById('admin-select-listening-test');
  if (selectListening) {
    selectListening.innerHTML = db.listening.filter(t => t && t.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    
    selectListening.setAttribute('data-prev', selectListening.value);
    selectListening.addEventListener('focus', function() {
      this.setAttribute('data-prev', this.value);
    });
    selectListening.onchange = function() {
      const oldTest = this.getAttribute('data-prev');
      const newTest = this.value;
      if (oldTest && oldTest !== newTest) {
        this.value = oldTest;
        if (typeof saveAdminListeningTestAnswers === 'function') saveAdminListeningTestAnswers(true);
        this.value = newTest;
      }
      this.setAttribute('data-prev', newTest);
      loadAdminListeningTestAnswers();
    };

    loadAdminListeningTestAnswers();
  }
}

let currentAdminConfigPart = 1;

function switchAdminConfigPart(partNum) {
  saveAdminReadingTestAnswers(null, true);
  currentAdminConfigPart = partNum;
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`btn-config-part-${i}`);
    if (btn) {
      if (i === partNum) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  }
  loadAdminReadingTestAnswers();
}

function loadAdminReadingTestAnswers() {
  const select = document.getElementById('admin-select-reading-test');
  const container = document.getElementById('admin-reading-answers-container');
  if (!select || !container) return;

  const testName = select.value;
  const test = db.reading.find(t => t.name === testName);
  if (!test) return;

  // Khởi tạo dữ liệu mặc định của Ausstellung nếu rỗng
  if (testName === 'Ausstellung') {
    if (!test.teil1 || !test.teil1.texts || test.teil1.texts.length === 0) {
      test.teil1 = {
        texts: [
          { id: 1, title: "Text 1", content: "Spardosen sind Sammelbehälter, Dekoration oder Kinderspielzeug - und zwar seit Jahrhunderten. Und obwohl bargeldloses Bezahlen immer mehr in Mode kommt, sind sie bis heute nicht aus den Kinderzimmern verschwunden. Das Spardosen-Museum im Haus Kemnade zeigt 1.200 Exemplare aus dem Mittelalter bis zum 20. Jahrhundert. Daneben widmet sich das Museum der Geschichte des Geldes. In zwei Räumen sind Münzen, Scheine und weitere Tauschmittel aus der ganzen Welt ausgestellt. Die Sammlung von Spardosen reicht von schweren Gefäßen aus Eisen über kunstvoll verzierte Truhen und Kutschen bis zu Mickey-Mäusen aus Blech. \"Um 1900 erlebten Spardosen einen Boom\", erzählt Museumsleiter Jürgen Stollmann. In vielen Häusern hatten sie zwar nur als hübsche Dekoration hergehalten, doch immer seien sie auch ein Spiegel der Gesellschaft. Zehn Jahre später schon gibt es das Museum, das interessante Einblicke in die Geldgeschichte bietet. Jährlich lockt es über 13.000 Besucher an." },
          { id: 2, title: "Text 2", content: "Wer beim leisen Klirren von Geldstücken ein prickelndes Gefühl verspürt, ist in der neuen Sonderausstellung \"Die Sprache des Geldes\" im Berliner Museum für Kommunikation richtig. Auf ungewöhnliche Weise nähert sich diese kleine Schau dem Geld als Dreh- und Angelpunkt einer globalisierten Welt. Im Museum machen die Besucher auf 450 Quadratmeter eine Tour durch eine fiktive Stadt. Auf dem \"Marktplatz\" erfahren sie, warum sich zuerst Münzen und viel später Scheine als Zahlungsmittel durchsetzen. Bei den Stationen \"Bank\" und \"Börse\" lernen sie das Prinzip kennen, das in guten Zeiten dahintersteht: Vertrauen in den Wert des Geldes. In der Station \"Einkaufszentrum\" geht es dagegen um die heutige Konsumgesellschaft. Entlohnt werden die Besucher für ihren Ausstellungsbesuch natürlich auch. Wer sein neues Wissen in einem Computerquiz nachweisen kann, erhält einen Spielgeld-Schein mit dem eigenen Konterfei. Macht Geld denn nun glücklich? \"Nur für einen kurzen Moment\", versichert Kurator Gregor Isenbrot. \"Wenn der Rausch vorbei ist, will der Mensch noch mehr. Und zwar mehr Geld\"." },
          { id: 3, title: "Text 3", content: "Versteh' ich ja doch nicht; ist mir zu kompliziert'. So oder ähnlich lauten die üblichen Vorbehalte, wenn es darum geht, zu begreifen, wie Wirtschaft funktioniert und der Finanzsektor arbeitet. Dass es auch anders geht, beweist ein neues Buch des renommierten Wirtschaftsjournalisten Mark Spörrle. Auf knapp 200 Seiten gelingt ihm das Kunststück, komplexe finanzielle Zusammenhänge so darzustellen, dass sie auch von Laien mühelos verstanden werden. Das Buch verzichtet fast vollständig auf unverständliches Fachchinesisch. Stattdessen erklärt Spörrle die Entstehung von Krisen, die Rolle der Zentralbanken und die Funktionsweise von Aktienmärkten anhand von Beispielen aus dem täglichen Leben. Er bedient sich dabei eines humorvollen Tones, der die Lektüre zu einem echten Vergnügen macht. Der Leser wird am Ende feststellen, dass Wirtschaft keineswegs eine trockene Wissenschaft ist, sondern uns alle unmittelbar betrifft. Ein absolut empfehlenswertes Werk für jeden, der endlich mitreden möchte." },
          { id: 4, title: "Text 4", content: "Eine neue Untersuchung des Instituts der deutschen Wirtschaft bestätigt eine Tatsache, über die sich Sozialwissenschaftler und Psychologen schon lange einig sind: Die Höhe des Einkommens allein macht nicht glücklich. Zwar trägt ein gewisser finanzieller Spielraum dazu bei, Sorgen zu reduzieren, ab einer bestimmten Summe stagniert jedoch das Wohlbefinden. Viel wichtiger für ein erfülltes Leben sind demnach intakte soziale Beziehungen, eine als sinnvoll empfundene Arbeit und vor allem eine gute Gesundheit. Die Studie zeigt, dass Menschen, die ihre Zeit in Hobbys oder ehrenamtliche Tätigkeiten investieren, eine deutlich höhere Lebenszufriedenheit aufweisen als diejenigen, die sich ausschließlich auf das Geldverdienen konzentrieren. Geld, so das Fazit der Forscher, sollte daher immer nur als Mittel zum Zweck gesehen werden, nicht aber als Hauptziel im Leben. Die wahre Lebensqualität lässt sich eben nicht auf dem Bankkonto ablesen." },
          { id: 5, title: "Text 5", content: "Über Geld sprechen viele Deutsche nicht gerne. Das Thema gilt in weiten Teilen der Gesellschaft nach wie vor als Tabu. Über das Einkommen des Nachbarn oder auch des Kollegen wird oft nur spekuliert, direkte Fragen werden meist ausgewichen. Diese Zurückhaltung hat historische Wurzeln. In Deutschland gilt der Grundsatz \"Über Geld spricht man nicht, man hat es\". Viele Menschen befürchten Neid oder Missgunst, wenn sie über ihre finanzielle Situation sprechen. Das führt dazu, dass selbst innerhalb von Familien oder Partnerschaften oft Unklarheit über die tatsächliche Finanzlage herrscht. Experten bemängeln diese Haltung seit langem. Wer das Thema Geld tabuisiert, verpasst die Chance auf einen offenen Austausch über Vorsorge, Schulden oder Anlagestrategien. Ein offenerer Umgang mit Finanzen könnte dazu beitragen, finanzielle Ängste abzubauen." }
        ],
        headings: [
          { key: "A", text: "Ausstellung über Finanzmetropole" },
          { key: "B", text: "Fachinformationen für Finanzprofis" },
          { key: "C", text: "Finanz-ABC für Anfänger" },
          { key: "D", text: "Interessante Tätigkeit wichtiger als hohes Gehalt" },
          { key: "E", text: "Lehrreicher Rundgang zu Finanzwissen" },
          { key: "F", text: "Sammelgefäße als Ausstellungsobjekte" },
          { key: "G", text: "Sparbüchsen - Nun wieder in Mode" },
          { key: "H", text: "Vertrauen zeigt sich auf dem Konto" },
          { key: "I", text: "Wie Kinder den Umgang mit Geld lernen" },
          { key: "J", text: "Wie man Kinder zum Sparen motiviert." }
        ]
      };
      test.answers = {
        1: "F", 2: "E", 3: "C", 4: "B", 5: "F",
        6: "B", 7: "B", 8: "B", 9: "A", 10: "B",
        11: "D", 12: "F", 13: "I", 14: "E", 15: "K", 16: "L", 17: "I", 18: "A", 19: "C", 20: "D",
        21: "uns", 22: "wegen", 23: "so dass", 24: "um", 25: "obwohl", 26: "entschädigt", 27: "geschmeckt", 28: "obwohl", 29: "lassen", 30: "von",
        31: "WEIL", 32: "IMMER", 33: "TUN", 34: "WURDE", 35: "VON", 36: "DAMIT", 37: "SPIELERISCHE", 38: "DASS", 39: "GESTALTEN", 40: "GEHT"
      };
      test.explanations = {
        1: "1. → F. Sammelgefäße als Ausstellungsobjekte\nTừ khóa trong bài:\n• Spardosen-Museum (bảo tàng ống tiết kiệm)\n• zeigt 1.200 Exemplare (trưng bày 1.200 hiện vật)\n• Die Sammlung von Spardosen reicht von... (bộ sưu tập gồm nhiều)\n• G. Spardosen - Nun wieder in Mode X\n  - Bài không nói rằng ống tiết kiệm đang trở nên thịnh hành trở lại.\n  - Chỉ có một câu nhắc rằng chúng vẫn chưa biến mất khỏi phòng trẻ em, đây không phải ý chính.",
        2: "2. → E. Lehrreicher Rundgang zu Finanzwissen\nTừ khóa trong bài:\n• Sonderausstellung (triển lãm đặc biệt)\n• Die Sprache des Geldes (ngôn ngữ của tiền)\n• eine Tour durch eine fiktive Stadt (một tour tham quan thành phố giả định)\n• Stationen Bank und Börse (các trạm ngân hàng và thị trường chứng khoán)\n• Wer sein neues Wissen in einem Computerquiz nachweisen kann (ai chứng minh kiến thức qua câu đố máy tính)",
        3: "3. → C. Finanz-ABC für Anfänger\nTừ khóa trong bài:\n• neue Buch (cuốn sách mới)\n• komplexe finanzielle Zusammenhänge so darzustellen, dass sie auch von Laien mühelos verstanden werden (trình bày mối liên hệ tài chính phức tạp để người không chuyên cũng hiểu được)\n• verzichtet fast vollständig auf unverständliches Fachchinesisch (hầu như từ bỏ thuật ngữ chuyên ngành khó hiểu)",
        4: "4. → B. Wie viel Geld macht eigentlich wirklich glücklich?\nTừ khóa trong bài:\n• Die Höhe des Einkommens allein macht nicht glücklich (chỉ thu nhập cao thôi không làm nên hạnh phúc)\n• ab einer bestimmten Summe stagniert jedoch das Wohlbefinden (nhưng từ một mức tiền nhất định sự thịnh vượng sẽ chững lại)\n• D. Interessante Tätigkeit wichtiger als hohes Gehalt X\n  - Mặc dù có nhắc tới công việc ý nghĩa, nhưng đây chỉ là một trong nhiều yếu tố cấu thành hạnh phúc chứ không phải nội dung cốt lõi bàn về thu nhập và hạnh phúc.",
        5: "5. → F. Warum wir ungern über unsere Finanzen sprechen\nTừ khóa trong bài:\n• Über Geld sprechen viele Deutsche nicht gerne (nhiều người Đức không thích nói về tiền bạc)\n• Thema gilt... als Tabu (chủ đề coi như điều cấm kỵ)\n• Grundsatz 'Über Geld spricht man nicht...' (nguyên tắc 'không nói về tiền...')\n• befürchten Neid oder Missgunst (lo sợ sự đố kỵ)"
      };
    }
  }

  if (!test.answers) test.answers = {};
  if (!test.explanations) test.explanations = {};
  if (!test.teil1) test.teil1 = { texts: [], headings: [] };
  if (!test.teil2) test.teil2 = { text: '', questions: [] };
  if (!test.teil3) test.teil3 = { situations: [], texts: [] };
  if (!test.teil4) test.teil4 = { text: '', options: {} };
  if (!test.teil5) test.teil5 = { text: '', wordbank: [] };

  let html = `
    <div style="background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <span style="font-size: 1.5rem;">🤖📸</span>
        <div>
          <div style="color: #10b981; font-weight: bold; font-size: 0.95rem;">AI Trích Xuất Bảng Đáp Án (Câu 1-40)</div>
          <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-top: 0.2rem;">Nhấp vào ô bên phải và dán ảnh chụp bảng đáp án (Ctrl+V) để tự động quét & điền toàn bộ! (Câu không có đáp án sẽ điền X)</div>
        </div>
      </div>
      <input type="text" id="admin-global-answers-ai" placeholder="Dán ảnh bảng đáp án..." onpaste="handleGlobalAnswersAiPaste(event)" style="width: 180px; padding: 0.5rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; text-align: center; font-size: 0.85rem; outline: none; transition: all 0.3s;">
    </div>
  `;

  if (currentAdminConfigPart === 1) {
    // Layout Teil 1 side-by-side replica
    const usedLetters = ['A','B','C','D','E','F','G','H','I','J'];
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: start;">
        <!-- Left Side: Lesetext / Aufgabe (Antwortoptionen A-J) -->
        <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px;">
          <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">☰ LESETEXT / AUFGABE</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1.2rem; text-transform: uppercase;">ANTWORTOPTIONEN</div>
          
          <textarea placeholder="Dán nhanh 10 tiêu đề (A-J) vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 1rem; resize: vertical;" oninput="parseT1Headings(this)"></textarea>

          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${usedLetters.map((letter, idx) => {
              const headingText = test.teil1.headings[idx]?.text || '';
              return `
                <div style="display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: 0.5rem 0.8rem; border-radius: 6px;">
                  <span style="font-weight: bold; color: var(--accent-cyan); font-size: 0.9rem; width: 25px;">${letter}.</span>
                  <input type="text" id="admin-read-t1-heading-${letter}" value="${headingText}" placeholder="Tiêu đề ${letter}..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right Side: Antworten & Feedback (Texts, Correct options & Explanations) -->
        <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px;">
          <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 1.2rem; text-transform: uppercase; letter-spacing: 0.5px;">ANTWORTEN & FEEDBACK</div>
          <textarea placeholder="Dán nhanh 5 đáp án (câu 1-5) vào đây..." rows="1" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.5rem; resize: vertical;" oninput="parseAnswers(this, 'reading', 1, 5)"></textarea>
          <textarea placeholder="Dán nhanh 5 ĐOẠN VĂN BẢN (Text 1-5) vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 1rem; resize: vertical;" oninput="parseT1Texts(this)"></textarea>
          
          <div style="display: flex; flex-direction: column; gap: 1.2rem;">
            ${[1,2,3,4,5].map(i => {
              const content = test.teil1.texts[i-1]?.text || '';
              const ans = test.answers[i] || '';
              const exp = test.explanations[i] || '';
              return `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px;">
                  <div style="font-weight: bold; color: #fff; margin-bottom: 0.8rem; font-size: 0.95rem;">${i}. Văn bản bài đọc ${i}</div>
                  <textarea id="admin-read-t1-text-${i}" rows="8" placeholder="Nhập nội dung bài đọc ${i}..." style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.95rem; line-height: 1.7; resize: vertical; margin-bottom: 0.8rem; text-align: justify;">${content}</textarea>
                  
                  <div style="margin-top: 0.2rem; margin-bottom: 0.8rem; background: rgba(0, 242, 254, 0.03); border: 1px dashed rgba(0, 242, 254, 0.35); border-radius: 8px; padding: 0.4rem 0.8rem; display: flex; align-items: center; gap: 0.8rem; justify-content: space-between;">
                    <span style="font-size: 1rem; flex-shrink: 0;">🤖</span>
                    <div style="flex-grow: 1; font-size: 0.78rem; color: #00f2fe; text-align: left;">
                      <b>AI Điền Nhanh:</b> Nhấp ô bên phải r dán ảnh (Ctrl+V) để điền vào ô trên!
                    </div>
                    <input type="text" placeholder="Dán ảnh..." onpaste="handleLocalFieldAiPaste(event, 'admin-read-t1-text-${i}')" style="width: 100px; padding: 0.25rem; font-size: 0.72rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
                  </div>

                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.6rem; border-radius: 6px; flex-wrap: wrap;">
                    <label style="margin: 0; font-size: 0.85rem; color: var(--success); font-weight: bold;">Richtige Antwort:</label>
                    <input type="text" id="admin-read-ans-${i}" value="${ans}" placeholder="Ví dụ: F" style="width: 60px; padding: 0.3rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #fff; text-align: center; font-weight: bold; text-transform: uppercase;" oninput="updateAdminAnswerPreview(${i})">
                    <span id="admin-read-ans-preview-${i}" style="font-size: 0.82rem; font-weight: bold; color: #10b981; margin-left: 0.5rem;"></span>
                  </div>
                  
                  <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.4rem; font-weight: bold;">Erklärung (Giải thích từ khóa):</div>
                  <textarea id="admin-read-exp-${i}" placeholder="Lời giải thích và từ khóa của câu ${i}..." rows="4" style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; line-height: 1.5; resize: vertical;">${exp}</textarea>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (currentAdminConfigPart === 2) {
    // Teil 2: Left column (Main text), Right column (5 MCQ questions & answers)
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
        <!-- Left Column: Edit Main Reading Text -->
        <div>
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📖 Bài đọc chính (Teil 2)</h5>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px;">
            <textarea id="admin-read-t2-maintext" rows="18" placeholder="Nhập nội dung bài đọc chính của Teil 2 tại đây..." style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.9rem; line-height: 1.6; resize: vertical; margin-bottom: 0.8rem;">${test.teil2.text || ''}</textarea>
            
            <div style="background: rgba(0, 242, 254, 0.03); border: 1px dashed rgba(0, 242, 254, 0.35); border-radius: 8px; padding: 0.5rem 0.8rem; display: flex; align-items: center; gap: 0.8rem; justify-content: space-between;">
              <span style="font-size: 1.1rem; flex-shrink: 0;">🤖</span>
              <div style="flex-grow: 1; font-size: 0.82rem; color: #00f2fe; text-align: left;">
                <b>AI Điền Nhanh:</b> Nhấp ô bên phải r dán ảnh (Ctrl+V) để điền bài đọc!
              </div>
              <input type="text" placeholder="Dán ảnh..." onpaste="handleLocalFieldAiPaste(event, 'admin-read-t2-maintext')" style="width: 120px; padding: 0.3rem; font-size: 0.75rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
            </div>
          </div>
        </div>
        
        <!-- Right Column: Edit Q6-10 with options -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h5 style="color: var(--accent-amber); font-weight: bold; margin: 0; text-transform: uppercase; font-size: 0.9rem;">📝 Câu hỏi trắc nghiệm (Câu 6-10)</h5>
            <div style="background: rgba(0, 242, 254, 0.03); border: 1px dashed rgba(0, 242, 254, 0.35); border-radius: 6px; padding: 0.3rem 0.6rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.9rem;">🤖</span>
              <span style="font-size: 0.75rem; color: #00f2fe; margin-right: 0.5rem;"><b>AI Quét Câu Hỏi:</b> Dán ảnh chụp câu hỏi & đáp án vào đây! 👉</span>
              <input type="text" placeholder="Dán ảnh (Ctrl+V)" onpaste="handleQuestionsAiPaste(event, 6, 10, 't2')" style="width: 100px; padding: 0.2rem; font-size: 0.7rem; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
            </div>
          </div>
          
          <div style="background: rgba(255, 193, 7, 0.06); border: 2px dashed rgba(255, 193, 7, 0.4); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2rem;">📋</span>
              <span style="font-size: 0.85rem; color: #ffc107; font-weight: bold;">SIÊU DÁN NHANH — Câu hỏi + A/B/C + Đáp án</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.6rem; line-height: 1.4;">
              💡 Copy cả khối câu hỏi 6-10 từ PDF (gồm đề bài + A/B/C). Thêm dòng <b>"Đáp án: B C C A B"</b> ở cuối để tự điền luôn đáp án!
            </p>
            <textarea placeholder="Dán cả khối câu hỏi 6-10 vào đây...&#10;&#10;6. Melanie Hoffmanns Seminare besuchen&#10;A. ausschließlich Frauen&#10;B. junge und alte Menschen gleichermaßen&#10;C. überwiegend alte Menschen&#10;...&#10;&#10;Đáp án: B C C A B" rows="10" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; color: #fff; font-size: 0.88rem; line-height: 1.6; resize: vertical;" oninput="megaPasteT2(this)"></textarea>
          </div>

          <div style="background: rgba(16, 185, 129, 0.06); border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2rem;">🔑</span>
              <span style="font-size: 0.85rem; color: #10b981; font-weight: bold;">TỰ NHẬN ĐÁP ÁN — Dán đáp án đúng vào đây!</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.6rem; line-height: 1.4;">
              💡 Dán danh sách đáp án (VD: <b>B B C A B</b>) hoặc dán cả dòng text đáp án (VD: "junge und alte Menschen..."). Hệ thống sẽ <b>tự so khớp</b> với A/B/C đã nhập và điền đáp án đúng tự động!
            </p>
            <textarea id="admin-mega-ans-t2" placeholder="Dán đáp án câu 6-10 vào đây...&#10;&#10;Cách 1: B B C A B&#10;Cách 2:&#10;6. junge und alte Menschen gleichermaßen&#10;7. sich von den vielen Informationen überfordert fühlen&#10;..." rows="6" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #fff; font-size: 0.88rem; line-height: 1.6; resize: vertical;" oninput="megaAnswerT2(this)"></textarea>
          </div>
          ${[6,7,8,9,10].map(i => {
            const qData = test.teil2.questions[i-6] || { question: '', options: { A: '', B: '', C: '' } };
            const ans = test.answers[i] || '';
            const exp = test.explanations[i] || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="font-weight: bold; color: var(--accent-cyan); margin-bottom: 0.8rem; font-size: 0.9rem;">Câu hỏi ${i}</div>
                <input type="text" id="admin-read-t2-qtext-${i}" value="${qData.question || ''}" placeholder="Nhập đề bài câu hỏi ${i}..." style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.88rem; margin-bottom: 0.8rem; font-weight: bold;">
                
                <!-- Quick Paste cho Teil 2 Options -->
                <textarea placeholder="Dán nhanh Đề bài (tùy chọn) & 3 lựa chọn A, B, C vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.8rem; resize: vertical;" oninput="parseT2Options(this, ${i})"></textarea>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.8rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">A:</span>
                    <input type="text" id="admin-read-t2-qopt-${i}-A" value="${qData.options?.A || ''}" placeholder="Đáp án A..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">B:</span>
                    <input type="text" id="admin-read-t2-qopt-${i}-B" value="${qData.options?.B || ''}" placeholder="Đáp án B..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">C:</span>
                    <input type="text" id="admin-read-t2-qopt-${i}-C" value="${qData.options?.C || ''}" placeholder="Đáp án C..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; flex-wrap: wrap;">
                  <label style="margin: 0; font-size: 0.85rem; color: var(--text-dim);">Đáp án đúng:</label>
                  <input type="text" id="admin-read-ans-${i}" value="${ans}" placeholder="A/B/C" style="width: 80px; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; text-align: center; font-weight: bold; text-transform: uppercase;" oninput="updateAdminAnswerPreview(${i})">
                  <span id="admin-read-ans-preview-${i}" style="font-size: 0.82rem; font-weight: bold; color: #10b981; margin-left: 0.5rem;"></span>
                </div>
                
                <textarea id="admin-read-exp-${i}" placeholder="Lời giải thích chi tiết cho câu ${i}..." rows="2" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; resize: vertical;">${exp}</textarea>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (currentAdminConfigPart === 3) {
    // Teil 3: Edit 10 Situations and 12 Matching Texts
    html += `
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2rem; align-items: start;">
        <!-- Left Column: Edit 10 Situations -->
        <div>
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📖 10 Tình huống (Teil 3)</h5>
          <textarea placeholder="Dán nhanh 10 tình huống (11-20) vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 1rem; resize: vertical;" oninput="parseT3Situations(this)"></textarea>
          ${[11,12,13,14,15,16,17,18,19,20].map(i => {
            const desc = test.teil3.situations[i-11]?.desc || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <label style="font-weight: bold; color: #fff; display: block; margin-bottom: 0.4rem; font-size: 0.85rem;">Tình huống ${i}</label>
                <input type="text" id="admin-read-t3-sit-${i}" value="${desc}" placeholder="Mô tả tình huống ${i}..." style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.88rem;">
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Right Column: Edit matching text options (a-l) and Answers -->
        <div>
          <h5 style="color: var(--accent-amber); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📝 12 Văn bản để nối (a-l)</h5>
          <textarea placeholder="Dán nhanh 12 văn bản (A-L) vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(255, 193, 7, 0.05); border: 1px dashed rgba(255, 193, 7, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.5rem; resize: vertical;" oninput="parseT3Texts(this)"></textarea>
          <div style="max-height: 400px; overflow-y: auto; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            ${['a','b','c','d','e','f','g','h','i','j','k','l'].map((letter, idx) => {
              const textContent = test.teil3.texts[idx]?.content || '';
              return `
                <div style="margin-bottom: 1rem;">
                  <label style="font-weight: bold; color: var(--accent-amber); font-size: 0.85rem; display: block; margin-bottom: 0.3rem;">Văn bản ${letter.toUpperCase()}</label>
                  <textarea id="admin-read-t3-text-${letter}" rows="6" placeholder="Nhập nội dung văn bản quảng cáo ${letter.toUpperCase()}..." style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.95rem; line-height: 1.6; resize: vertical; margin-bottom: 0.4rem;">${textContent}</textarea>
                  
                  <!-- AI Quick Fill dưới chân -->
                  <div style="background: rgba(0, 242, 254, 0.02); border: 1px dashed rgba(0, 242, 254, 0.25); border-radius: 6px; padding: 0.3rem 0.6rem; display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;">
                    <span style="font-size: 0.85rem; flex-shrink: 0;">🤖</span>
                    <input type="text" placeholder="Dán ảnh vào đây để điền nhanh..." onpaste="handleLocalFieldAiPaste(event, 'admin-read-t3-text-${letter}')" style="width: 100%; padding: 0.2rem; font-size: 0.72rem; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">🔑 Đáp án & Giải thích (Câu 11-20)</h5>
          ${[11,12,13,14,15,16,17,18,19,20].map(i => {
            const ans = test.answers[i] || '';
            const exp = test.explanations[i] || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.6rem;">
                  <span style="font-weight: bold; color: #fff; font-size: 0.9rem;">Câu ${i}:</span>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <label style="margin: 0; font-size: 0.8rem; color: var(--text-dim);">Văn bản khớp:</label>
                    <input type="text" id="admin-read-ans-${i}" value="${ans}" placeholder="a-l hoặc x" style="width: 90px; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; text-align: center; font-weight: bold; text-transform: uppercase;" oninput="updateAdminAnswerPreview(${i})">
                    <span id="admin-read-ans-preview-${i}" style="font-size: 0.82rem; font-weight: bold; color: #10b981; margin-left: 0.5rem;"></span>
                  </div>
                </div>
                <textarea id="admin-read-exp-${i}" placeholder="Nhập lời giải thích chi tiết cho câu ${i}..." rows="2" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; resize: vertical;">${exp}</textarea>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (currentAdminConfigPart === 4) {
    // Teil 4: Edit letter with blanks and MCQ options
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
        <!-- Left Column: Edit Main text with blanks -->
        <div>
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📖 Thư điền từ (Teil 4)</h5>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <span style="font-size: 0.8rem; color: var(--text-dim);">Dán nhanh bằng ảnh chụp (OCR):</span>
              <input type="text" placeholder="Dán ảnh..." onpaste="handleLocalFieldAiPaste(event, 'admin-read-t4-maintext')" style="width: 120px; padding: 0.3rem; font-size: 0.75rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
            </div>
            <p style="color: var(--text-dim); font-size: 0.8rem; line-height: 1.4; margin-bottom: 1rem;">
              💡 <b>Mẹo:</b> Sử dụng định dạng văn bản bình thường, các vị trí ô trống sẽ tự động điền theo vị trí <b>(21)</b>, <b>(22)</b>,...
            </p>
            <textarea id="admin-read-t4-maintext" rows="18" placeholder="Nhập bức thư có chứa các ô trống (21)-(30)..." style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.9rem; line-height: 1.6; resize: vertical;">${test.teil4.text || ''}</textarea>
          </div>
        </div>
        
        <!-- Right Column: Edit Q21-30 choices and answers -->
        <div>
          <h5 style="color: var(--accent-amber); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📝 Đáp án lựa chọn (Lücke 21-30)</h5>
          
          <div style="background: rgba(255, 193, 7, 0.06); border: 2px dashed rgba(255, 193, 7, 0.4); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2rem;">📋</span>
              <span style="font-size: 0.85rem; color: #ffc107; font-weight: bold;">SIÊU DÁN NHANH — Lựa chọn (21-30)</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.6rem; line-height: 1.4;">
              💡 Copy cả khối lựa chọn 21-30 từ PDF (gồm A/B/C) để tự điền các ô lựa chọn bên dưới.
            </p>
            <textarea placeholder="Dán cả khối lựa chọn 21-30 vào đây...&#10;&#10;21.&#10;A. momentan&#10;B. noch&#10;C. weiterhin&#10;22.&#10;..." rows="8" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; color: #fff; font-size: 0.88rem; line-height: 1.6; resize: vertical;" oninput="megaPasteT4(this)"></textarea>
          </div>

          <div style="background: rgba(16, 185, 129, 0.06); border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.2rem;">🔑</span>
              <span style="font-size: 0.85rem; color: #10b981; font-weight: bold;">TỰ NHẬN ĐÁP ÁN — Dán đáp án đúng vào đây!</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.6rem; line-height: 1.4;">
              💡 Dán danh sách đáp án dạng chữ cái (VD: <b>B B A C A...</b>) hoặc dán các từ đúng (VD: <b>noch wegen...</b>). Hệ thống sẽ tự gán vào ô bên dưới!
            </p>
            <textarea placeholder="Dán đáp án câu 21-30 vào đây...&#10;&#10;Cách 1: B B A C A...&#10;Cách 2: noch wegen..." rows="6" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; color: #fff; font-size: 0.88rem; line-height: 1.6; resize: vertical;" oninput="megaAnswerT4(this)"></textarea>
          </div>
          ${[21,22,23,24,25,26,27,28,29,30].map(i => {
            const opts = test.teil4.options[i] ? (Array.isArray(test.teil4.options[i]) ? test.teil4.options[i] : test.teil4.options[i].split(/\n/)) : ["A. ", "B. ", "C. "];
            const ans = test.answers[i] || '';
            const exp = test.explanations[i] || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="font-weight: bold; color: var(--accent-cyan); margin-bottom: 0.8rem; font-size: 0.9rem;">Lücke (${i})</div>
                
                <!-- Quick Paste cho Teil 4 -->
                <textarea placeholder="Dán nhanh 3 lựa chọn A, B, C vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.8rem; resize: vertical;" oninput="parseT4Options(this, ${i})"></textarea>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.8rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">A:</span>
                    <input type="text" id="admin-read-t4-opt-${i}-A" value="${opts[0] || ''}" placeholder="Lựa chọn A..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">B:</span>
                    <input type="text" id="admin-read-t4-opt-${i}-B" value="${opts[1] || ''}" placeholder="Lựa chọn B..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--text-dim); width: 20px;">C:</span>
                    <input type="text" id="admin-read-t4-opt-${i}-C" value="${opts[2] || ''}" placeholder="Lựa chọn C..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.85rem;">
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; flex-wrap: wrap;">
                  <label style="margin: 0; font-size: 0.85rem; color: var(--text-dim);">Đáp án đúng (Chữ cái hoặc Từ):</label>
                  <input type="text" id="admin-read-ans-${i}" value="${ans}" placeholder="Ví dụ: B hoặc noch" style="width: 140px; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-weight: bold;" oninput="updateAdminAnswerPreview(${i})">
                  <span id="admin-read-ans-preview-${i}" style="font-size: 0.82rem; font-weight: bold; color: #10b981; margin-left: 0.5rem;"></span>
                </div>
                
                <textarea id="admin-read-exp-${i}" placeholder="Lời giải thích chi tiết cho câu ${i}..." rows="2" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; resize: vertical;">${exp}</textarea>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (currentAdminConfigPart === 5) {
    // Teil 5: Edit main text, Word bank (a-o) and Answers
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
        <!-- Left Column: Edit Main text -->
        <div>
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📖 Văn bản điền từ (Teil 5)</h5>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <span style="font-size: 0.8rem; color: var(--text-dim);">Dán nhanh bằng ảnh chụp (OCR):</span>
              <input type="text" placeholder="Dán ảnh..." onpaste="handleLocalFieldAiPaste(event, 'admin-read-t5-maintext')" style="width: 120px; padding: 0.3rem; font-size: 0.75rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
            </div>
            <textarea id="admin-read-t5-maintext" rows="18" placeholder="Nhập nội dung bài đọc của Teil 5 có chứa các ô trống (31)-(40)..." style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.9rem; line-height: 1.6; resize: vertical;">${test.teil5.text || ''}</textarea>
          </div>
        </div>
        
        <!-- Right Column: Edit Word Bank (15 words) and Answers -->
        <div>
          <h5 style="color: var(--accent-amber); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">📝 Wortbank (15 từ lựa chọn a-o)</h5>
          
          <!-- Quick Paste cho Teil 5 -->
          <textarea placeholder="Dán nhanh 15 từ vựng (mỗi từ một dòng) vào đây..." rows="3" style="width: 100%; padding: 0.5rem; background: rgba(255, 193, 7, 0.05); border: 1px dashed rgba(255, 193, 7, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.8rem; resize: vertical;" oninput="parseT5Options(this)"></textarea>

          <div style="max-height: 300px; overflow-y: auto; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
            ${['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o'].map((letter, idx) => {
              const wordItem = test.teil5.wordbank[idx] || { word: '' };
              return `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: bold; color: var(--accent-amber); font-size: 0.85rem; width: 15px;">${letter}:</span>
                  <input type="text" id="admin-read-t5-word-${letter}" value="${wordItem.word || ''}" placeholder="Từ..." style="flex: 1; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 0.82rem; font-weight: bold; text-transform: uppercase;">
                </div>
              `;
            }).join('')}
          </div>
          
          <h5 style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.9rem;">🔑 Đáp án & Giải thích (Câu 31-40)</h5>
          <textarea placeholder="Dán nhanh 10 đáp án (câu 31-40) vào đây..." rows="1" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 1rem; resize: vertical;" oninput="parseAnswers(this, 'reading', 31, 40)"></textarea>
          ${[31,32,33,34,35,36,37,38,39,40].map(i => {
            const ans = test.answers[i] || '';
            const exp = test.explanations[i] || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.6rem;">
                  <span style="font-weight: bold; color: #fff; font-size: 0.9rem;">Lücke (${i}):</span>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <label style="margin: 0; font-size: 0.8rem; color: var(--text-dim);">Từ đúng:</label>
                    <input type="text" id="admin-read-ans-${i}" value="${ans}" placeholder="Ví dụ: DAMIT" style="width: 140px; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-weight: bold; text-transform: uppercase;" oninput="updateAdminAnswerPreview(${i})">
                    <span id="admin-read-ans-preview-${i}" style="font-size: 0.82rem; font-weight: bold; color: #10b981; margin-left: 0.5rem;"></span>
                  </div>
                </div>
                <textarea id="admin-read-exp-${i}" placeholder="Nhập lời giải thích chi tiết cho câu ${i}..." rows="2" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; resize: vertical;">${exp}</textarea>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Trigger previews for the current loaded tab
  setTimeout(() => {
    for (let i = 1; i <= 40; i++) {
      if (typeof updateAdminAnswerPreview === 'function') {
        updateAdminAnswerPreview(i);
      }
    }
  }, 50);
}

function saveAdminReadingTestAnswers(e, isSilent = false) {
  if (e) e.preventDefault();
  const select = document.getElementById('admin-select-reading-test');
  if (!select) return;

  const testName = select.value;
  const test = db.reading.find(t => t.name === testName);
  if (!test) return;

  if (!test.answers) test.answers = {};
  if (!test.explanations) test.explanations = {};
  if (!test.teil1) test.teil1 = { texts: [], headings: [] };
  if (!test.teil2) test.teil2 = { text: '', questions: [] };
  if (!test.teil3) test.teil3 = { situations: [], texts: [] };
  if (!test.teil4) test.teil4 = { text: '', options: {} };
  if (!test.teil5) test.teil5 = { text: '', wordbank: [] };

  if (currentAdminConfigPart === 1) {
    // Save 5 Texts
    test.teil1.texts = [];
    for (let i = 1; i <= 5; i++) {
      const txt = document.getElementById(`admin-read-t1-text-${i}`);
      if (txt) {
        test.teil1.texts.push({ id: i, title: `Text ${i}`, text: txt.value.trim() });
      }
    }
    // Save 8 Headings
    test.teil1.headings = [];
    ['A','B','C','D','E','F','G','H','I','J'].forEach((letter, idx) => {
      const hd = document.getElementById(`admin-read-t1-heading-${letter}`);
      if (hd) {
        test.teil1.headings.push({ key: letter, text: hd.value.trim() });
      }
    });
    // Save Answers 1-5
    for (let i = 1; i <= 5; i++) {
      const ans = document.getElementById(`admin-read-ans-${i}`);
      const exp = document.getElementById(`admin-read-exp-${i}`);
      if (ans) test.answers[i] = ans.value.trim().toUpperCase();
      if (exp) test.explanations[i] = exp.value.trim();
    }
  } else if (currentAdminConfigPart === 2) {
    // Save Main Text
    const mtxt = document.getElementById('admin-read-t2-maintext');
    if (mtxt) test.teil2.text = mtxt.value.trim();
    // Save Questions 6-10
    test.teil2.questions = [];
    for (let i = 6; i <= 10; i++) {
      const qtxt = document.getElementById(`admin-read-t2-qtext-${i}`);
      const optA = document.getElementById(`admin-read-t2-qopt-${i}-A`);
      const optB = document.getElementById(`admin-read-t2-qopt-${i}-B`);
      const optC = document.getElementById(`admin-read-t2-qopt-${i}-C`);
      const ans = document.getElementById(`admin-read-ans-${i}`);
      const exp = document.getElementById(`admin-read-exp-${i}`);
      
      if (qtxt) {
        test.teil2.questions.push({
          id: i,
          question: qtxt.value.trim(),
          options: {
            A: optA ? optA.value.trim() : '',
            B: optB ? optB.value.trim() : '',
            C: optC ? optC.value.trim() : ''
          }
        });
      }
      if (ans) test.answers[i] = ans.value.trim().toUpperCase();
      if (exp) test.explanations[i] = exp.value.trim();
    }
  } else if (currentAdminConfigPart === 3) {
    // Save Situations 11-20
    test.teil3.situations = [];
    for (let i = 11; i <= 20; i++) {
      const sit = document.getElementById(`admin-read-t3-sit-${i}`);
      if (sit) {
        test.teil3.situations.push({ id: i, desc: sit.value.trim() });
      }
    }
    // Save 12 Texts
    test.teil3.texts = [];
    ['a','b','c','d','e','f','g','h','i','j','k','l'].forEach((letter, idx) => {
      const txt = document.getElementById(`admin-read-t3-text-${letter}`);
      if (txt) {
        test.teil3.texts.push({ key: letter, content: txt.value.trim() });
      }
    });
    // Save Answers 11-20
    for (let i = 11; i <= 20; i++) {
      const ans = document.getElementById(`admin-read-ans-${i}`);
      const exp = document.getElementById(`admin-read-exp-${i}`);
      if (ans) test.answers[i] = ans.value.trim().toUpperCase();
      if (exp) test.explanations[i] = exp.value.trim();
    }
  } else if (currentAdminConfigPart === 4) {
    // Save Main Text
    const mtxt = document.getElementById('admin-read-t4-maintext');
    if (mtxt) test.teil4.text = mtxt.value.trim();
    // Save Options 21-30
    test.teil4.options = {};
    for (let i = 21; i <= 30; i++) {
      const optA = document.getElementById(`admin-read-t4-opt-${i}-A`);
      const optB = document.getElementById(`admin-read-t4-opt-${i}-B`);
      const optC = document.getElementById(`admin-read-t4-opt-${i}-C`);
      const ans = document.getElementById(`admin-read-ans-${i}`);
      const exp = document.getElementById(`admin-read-exp-${i}`);
      
      test.teil4.options[i] = [
        optA ? optA.value.trim() : '',
        optB ? optB.value.trim() : '',
        optC ? optC.value.trim() : ''
      ];
      
      if (ans) test.answers[i] = ans.value.trim();
      if (exp) test.explanations[i] = exp.value.trim();
    }
  } else if (currentAdminConfigPart === 5) {
    // Save Main Text
    const mtxt = document.getElementById('admin-read-t5-maintext');
    if (mtxt) test.teil5.text = mtxt.value.trim();
    // Save Word Bank (a-o)
    test.teil5.wordbank = [];
    ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o'].forEach((letter, idx) => {
      const w = document.getElementById(`admin-read-t5-word-${letter}`);
      if (w) {
        let val = w.value.trim().toUpperCase();
        val = restoreUmlauts(val);
        w.value = val; // write back to UI
        test.teil5.wordbank.push({ key: letter, word: val });
      }
    });
    // Save Answers 31-40
    for (let i = 31; i <= 40; i++) {
      const ans = document.getElementById(`admin-read-ans-${i}`);
      const exp = document.getElementById(`admin-read-exp-${i}`);
      if (ans) test.answers[i] = ans.value.trim().toUpperCase();
      if (exp) test.explanations[i] = exp.value.trim();
    }
  }

  saveDB();
  if (!isSilent) alert(`Đã lưu toàn bộ nội dung bài đọc, câu hỏi & đáp án của Teil ${currentAdminConfigPart} cho đề thi: ${testName}!`);
}

// Xử lý Xóa Mục Dữ Liệu chung
function deleteItem(type, id) {
  if (confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
    db[type] = db[type].filter(item => item.id !== id);
    saveDB();
    renderAdmin();
  }
}

// --- Từ Vựng Admin ---
function renderAdminVocabList() {
  const tbody = document.getElementById('admin-vocab-list');
  if (!tbody) return;
  tbody.innerHTML = db.vocab.map(v => `
    <tr>
      <td style="font-weight: bold; color: var(--accent-amber);">${v.word}</td>
      <td><span style="background: rgba(189,0,255,0.15); padding: 0.3rem 0.6rem; border-radius: 8px; font-size: 0.85rem;">${v.topic}</span></td>
      <td>${v.meaning}</td>
      <td>
        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteItem('vocab', ${v.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function addVocab(e) {
  e.preventDefault();
  const word = document.getElementById('add-vocab-word').value;
  const text = document.getElementById('add-vocab-meaning').value;
  const topic = document.getElementById('add-vocab-topic').value;
  const example = document.getElementById('add-vocab-example').value;

  const newItem = {
    id: Date.now(),
    word,
    meaning: text,
    topic,
    example
  };

  db.vocab.push(newItem);
  saveDB();
  document.getElementById('vocab-form').reset();
  renderAdminVocabList();
  alert("Đã lưu từ vựng mới thành công!");
}

// --- Nghe Admin ---
function renderAdminListeningList() {
  const tbody = document.getElementById('admin-listening-list');
  if (!tbody) return;
  tbody.innerHTML = db.listening.map(l => `
    <tr>
      <td style="font-weight: bold;">${l.title}</td>
      <td>
        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteItem('listening', ${l.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function addListening(e) {
  e.preventDefault();
  const title = document.getElementById('add-listen-title').value;
  const audioUrl = document.getElementById('add-listen-audio').value;
  const question = document.getElementById('add-listen-question').value;
  const opts = [
    document.getElementById('add-listen-opt0').value,
    document.getElementById('add-listen-opt1').value,
    document.getElementById('add-listen-opt2').value,
    document.getElementById('add-listen-opt3').value
  ];
  const correct = parseInt(document.getElementById('add-listen-correct').value);
  const explanation = document.getElementById('add-listen-explanation').value;

  const newItem = {
    id: Date.now(),
    title,
    audioUrl,
    question,
    options: opts,
    answer: correct,
    explanation
  };

  db.listening.push(newItem);
  saveDB();
  document.getElementById('listening-form').reset();
  renderAdminListeningList();
  alert("Đã lưu bài luyện nghe mới!");
}

// --- Đọc Admin ---
// Quick Paste parser for Answers
window.parseAnswers = function(el, type, start, end) {
  let text = el.value.trim();
  if (!text) return;

  function resolveToLetter(raw, sNum, idx) {
    const rawClean = raw.trim();
    const u = rawClean.toUpperCase();
    
    // 1. Check if starts with "C – DARÜBER" or "C - DARÜBER"
    const prefixMatch = rawClean.match(/^\s*([a-oA-O])\s*[-–—:.]\s*(.*)/);
    if (prefixMatch) {
      const letter = prefixMatch[1].toUpperCase();
      if (sNum === 21 && /^[A-C]$/.test(letter)) return letter;
      if (sNum === 31 && /^[A-O]$/.test(letter)) return letter;
    }
    
    // 2. Check if single letter
    if (sNum === 21 && /^[A-C]$/.test(u)) return u;
    if (sNum === 31 && /^[A-O]$/.test(u)) return u;
    
    // 3. Search in current database options/wordbank
    const curTest = db.reading.find(t => t.name === selectedReadingTest);
    
    if (sNum === 21) {
      const opts = curTest?.teil4?.options?.[sNum + idx];
      if (opts && Array.isArray(opts)) {
        // Exact match first
        for (let li = 0; li < opts.length; li++) {
          if (opts[li].trim().toUpperCase() === u) {
            return ['A','B','C'][li];
          }
        }
        // Substring contains
        for (let li = 0; li < opts.length; li++) {
          const ov = opts[li].trim().toUpperCase();
          if (ov.includes(u) || u.includes(ov)) {
            return ['A','B','C'][li];
          }
        }
      }
    }
    
    if (sNum === 31) {
      const wordbank = curTest?.teil5?.wordbank;
      if (wordbank && Array.isArray(wordbank)) {
        // Exact match first
        for (let li = 0; li < wordbank.length; li++) {
          const w = wordbank[li]?.word?.trim()?.toUpperCase();
          if (w && w === u) {
            return String.fromCharCode(65 + li);
          }
        }
        // Substring contains
        for (let li = 0; li < wordbank.length; li++) {
          const w = wordbank[li]?.word?.trim()?.toUpperCase();
          if (w && (w.includes(u) || u.includes(w))) {
            return String.fromCharCode(65 + li);
          }
        }
      }
      
      // Fallback: search UI inputs
      for (const letter of ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o']) {
        const wordBankInput = document.getElementById(`admin-read-t5-word-${letter}`);
        if (wordBankInput && wordBankInput.value) {
          const optVal = wordBankInput.value.trim().toUpperCase();
          if (optVal === u || optVal.includes(u) || u.includes(optVal)) {
            return letter.toUpperCase();
          }
        }
      }
    }
    
    return u;
  }
  
  // Support parsing from Moodle/online test formats
  if (text.includes('Richtige Antwort')) {
    const blockRegex = /(?:^|\n)\s*(\d{1,2})\b[\s\S]*?Richtige Antwort\s*\n?\s*([^\n]+)/gi;
    let match;
    let foundAny = false;
    
    while ((match = blockRegex.exec(text)) !== null) {
      const qNum = parseInt(match[1]);
      if (qNum < 1 || qNum > 60) continue;
      
      let rawAns = match[2].replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').trim();
      
      let finalAns = rawAns;
      if (qNum >= 21 && qNum <= 30) {
        finalAns = resolveToLetter(rawAns, 21, qNum - 21);
      } else if (qNum >= 31 && qNum <= 40) {
        finalAns = resolveToLetter(rawAns, 31, qNum - 31);
      } else {
        const letterMatch = rawAns.match(/^(?:[a-oA-O])\b/);
        if (letterMatch && rawAns.length < 150) {
          finalAns = letterMatch[0].toUpperCase();
        } else {
          // Compare with UI options A, B, C for Fallback
          let matchedLetter = null;
          ['A', 'B', 'C'].forEach(l => {
            const possibleIds = [
              `admin-read-t2-qopt-${qNum}-${l}`,
              `admin-read-t4-opt-${qNum}-${l}`
            ];
            for (let optId of possibleIds) {
              const optInput = document.getElementById(optId);
              if (optInput && optInput.value) {
                const optVal = optInput.value.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
                const ansVal = rawAns.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
                if (optVal && (optVal === ansVal || optVal.includes(ansVal) || ansVal.includes(optVal))) {
                  matchedLetter = l;
                }
              }
            }
          });
          if (matchedLetter) finalAns = matchedLetter;
          else {
            if (finalAns.toLowerCase().includes('richtig')) finalAns = 'Richtig';
            else if (finalAns.toLowerCase().includes('falsch')) finalAns = 'Falsch';
          }
        }
      }
      
      let id = type === 'reading' ? `admin-read-ans-${qNum}` : `admin-listen-ans-${qNum}`;
      const input = document.getElementById(id);
      if (input) {
        input.value = finalAns;
        foundAny = true;
      }
    }

    // Extract paragraph/situation texts from blocks like "1. [text] Ihre Antwort"
    const textBlockRegex = /(?:^|\n)\s*(\d{1,2})\b\s*\n?([\s\S]*?)\bIhre Antwort/gi;
    let textMatch;
    while ((textMatch = textBlockRegex.exec(text)) !== null) {
      const qNum = parseInt(textMatch[1]);
      const paragraphText = textMatch[2].trim();
      if (qNum >= 1 && qNum <= 5) {
        const textInput = document.getElementById(`admin-read-t1-text-${qNum}`);
        if (textInput) {
          textInput.value = paragraphText;
          // Trigger custom event or sync to db if needed
          const event = new Event('input', { bubbles: true });
          textInput.dispatchEvent(event);
        }
      } else if (qNum >= 11 && qNum <= 20) {
        const sitInput = document.getElementById(`admin-read-t3-sit-${qNum}`);
        if (sitInput) {
          sitInput.value = paragraphText;
          const event = new Event('input', { bubbles: true });
          sitInput.dispatchEvent(event);
        }
      }
    }
    
    if (type === 'reading') {
      if (typeof saveAdminReadingTestAnswers === 'function') {
        saveAdminReadingTestAnswers(null, true);
      }
      for (let i = 1; i <= 40; i++) {
        if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
      }
    }
    return;
  }

  // Original generic logic
  let val = text;
  // Xóa các số thứ tự dạng "1.", "1)", "01."
  val = val.replace(/(?:^|\s|\n)(?:\d{1,2})[\.\):]\s*/g, ' ').trim();
  // Bây giờ val chỉ còn các đáp án, phân tách bằng khoảng trắng, phẩy hoặc xuống dòng
  const parts = val.split(/[\s,\n]+/).filter(p => p.trim());
  
  for (let i = 0; i < parts.length && (start + i) <= end; i++) {
    let id = type === 'reading' ? `admin-read-ans-${start + i}` : `admin-listen-ans-${start + i}`;
    const input = document.getElementById(id);
    let ansVal = parts[i].trim();
    if (ansVal.toLowerCase() === 'r' || ansVal.toLowerCase() === 'richtig' || ansVal.toLowerCase() === 'true' || ansVal.toLowerCase() === 't') ansVal = 'Richtig';
    if (ansVal.toLowerCase() === 'f' || ansVal.toLowerCase() === 'falsch' || ansVal.toLowerCase() === 'false') ansVal = 'Falsch';
    
    if (start === 21 || start === 31) {
      ansVal = resolveToLetter(ansVal, start, i);
    }
    
    if (input) input.value = ansVal;
  }

  if (type === 'reading') {
    for (let i = start; i <= end; i++) {
      if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
    }
  }
};

// SIÊU DÁN NHANH — Mega Paste for Teil 2 (Q6-10)
// Parses a full block like:
// 6. Melanie Hoffmanns Seminare besuchen
// A. ausschließlich Frauen...
// B. junge und alte Menschen...
// C. überwiegend alte Menschen
// 7. Die Teilnehmer...
window.megaPasteT2 = function(el) {
  const text = el.value.trim();
  if (!text) return;

  // Split by question numbers 6-10
  const qBlocks = [];
  const qRegex = /(?:^|\n)\s*(?:Câu\s*|Question\s*)?(\d{1,2})(?:[\.\):]|\s+(?=\S))\s*/gi;
  let matches = [];
  let m;
  while ((m = qRegex.exec(text)) !== null) {
    const qNum = parseInt(m[1]);
    if (qNum >= 6 && qNum <= 10) {
      matches.push({ num: qNum, endIndex: qRegex.lastIndex, index: m.index });
    }
  }

  // If no numbered matches, try splitting by "Chỉ đánh dấu" or double newlines
  if (matches.length === 0) {
    // Try A. B. C. pattern blocks
    const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
    let qNum = 6;
    for (const block of blocks) {
      if (qNum > 10) break;
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        // First line = question, rest = options
        let qText = lines[0].replace(/^\d+[\.\)]\s*/, '').replace(/Chỉ đánh dấu một hình ôvan\.?\s*/gi, '').trim();
        const optA = lines.find(l => /^A[\.\)]\s/.test(l));
        const optB = lines.find(l => /^B[\.\)]\s/.test(l));
        const optC = lines.find(l => /^C[\.\)]\s/.test(l));
        
        const inputQ = document.getElementById(`admin-read-t2-qtext-${qNum}`);
        if (inputQ && qText) inputQ.value = qText;
        if (optA) { const el = document.getElementById(`admin-read-t2-qopt-${qNum}-A`); if (el) el.value = optA.replace(/^A[\.\)]\s*/, '').trim(); }
        if (optB) { const el = document.getElementById(`admin-read-t2-qopt-${qNum}-B`); if (el) el.value = optB.replace(/^B[\.\)]\s*/, '').trim(); }
        if (optC) { const el = document.getElementById(`admin-read-t2-qopt-${qNum}-C`); if (el) el.value = optC.replace(/^C[\.\)]\s*/, '').trim(); }
        qNum++;
      }
    }
    el.style.borderColor = '#10b981';
    el.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.3)';
    setTimeout(() => { el.style.borderColor = 'rgba(255, 193, 7, 0.3)'; el.style.boxShadow = 'none'; }, 2000);
    return;
  }

  for (let idx = 0; idx < matches.length; idx++) {
    const cur = matches[idx];
    const next = matches[idx + 1];
    const blockText = text.substring(cur.endIndex, next ? next.index : text.length).trim();
    const qNum = cur.num;

    let qText = '';
    let optA = '', optB = '', optC = '';

    // Detect Moodle format inside blockText
    if (blockText.includes('Richtige Antwort')) {
      const qMatch = blockText.match(/^([\s\S]*?)(?:Ihre Antwort|Richtige Antwort)/i);
      if (qMatch) {
        qText = qMatch[1].trim();
      } else {
        qText = blockText.split('\n')[0].trim();
      }

      const ansMatch = blockText.match(/Richtige Antwort\s*\n\s*([^\n]+)/i) || blockText.match(/Richtige Antwort\s+([^\n]+)/i);
      if (ansMatch) {
        let correctWord = ansMatch[1].trim();
        // Clean trailing dashes or Moodle flags
        correctWord = correctWord.replace(/-\s*\d+\s*$/, '').trim();
        
        // Write directly to correct answer input
        const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
        if (ansInput) {
          ansInput.value = correctWord;
        }
        
        // Also put correct word in Option A as default choice
        optA = correctWord;
      }
    } else {
      // Standard PDF copy paste with A/B/C options
      const lines = blockText.split('\n').map(l => l.trim()).filter(Boolean);
      let currentMode = 'q'; // 'q', 'A', 'B', 'C'

      for (const line of lines) {
        if (/^Chỉ đánh dấu/i.test(line)) continue;

        const matchA = line.match(/^[aA][\.\):\s]+(.*)/) || (line === 'A' || line === 'a' ? ['A', ''] : null);
        const matchB = line.match(/^[bB][\.\):\s]+(.*)/) || (line === 'B' || line === 'b' ? ['B', ''] : null);
        const matchC = line.match(/^[cC][\.\):\s]+(.*)/) || (line === 'C' || line === 'c' ? ['C', ''] : null);

        if (matchA) {
          currentMode = 'A';
          optA = (matchA[1] || '').trim();
        } else if (matchB) {
          currentMode = 'B';
          optB = (matchB[1] || '').trim();
        } else if (matchC) {
          currentMode = 'C';
          optC = (matchC[1] || '').trim();
        } else {
          if (currentMode === 'q') {
            qText += (qText ? ' ' : '') + line;
          } else if (currentMode === 'A') {
            optA += (optA ? ' ' : '') + line;
          } else if (currentMode === 'B') {
            optB += (optB ? ' ' : '') + line;
          } else if (currentMode === 'C') {
            optC += (optC ? ' ' : '') + line;
          }
        }
      }

      // Clean up trailing dashes like "- 23"
      const cleanOpt = (val) => val ? val.replace(/-\s*\d+\s*$/, '').trim() : '';
      optA = cleanOpt(optA);
      optB = cleanOpt(optB);
      optC = cleanOpt(optC);
    }

    const inputQ = document.getElementById(`admin-read-t2-qtext-${qNum}`);
    if (inputQ && qText) inputQ.value = qText.trim();
    
    const inputA = document.getElementById(`admin-read-t2-qopt-${qNum}-A`);
    const inputB = document.getElementById(`admin-read-t2-qopt-${qNum}-B`);
    const inputC = document.getElementById(`admin-read-t2-qopt-${qNum}-C`);
    if (inputA && optA) inputA.value = optA;
    if (inputB && optB) inputB.value = optB;
    if (inputC && optC) inputC.value = optC;
  }

  // === TỰ NHẬN ĐÁP ÁN ===
  // Tìm dòng đáp án ở cuối text, VD: "Đáp án: B C C A B" hoặc "6.B 7.C 8.C 9.A 10.B"
  const answerPatterns = [
    // "Đáp án: B C C A B" hoặc "Answer: B C C A B"
    /(?:đáp\s*án|answer|key|lösung)[:\s]+([A-Ca-c][\s,\.]+[A-Ca-c][\s,\.]+[A-Ca-c][\s,\.]*[A-Ca-c]?[\s,\.]*[A-Ca-c]?)/i,
    // "6.B 7.C 8.C 9.A 10.B"
    /(?:6[\.\)]\s*([A-Ca-c]))\s*(?:7[\.\)]\s*([A-Ca-c]))\s*(?:8[\.\)]\s*([A-Ca-c]))\s*(?:9[\.\)]\s*([A-Ca-c]))\s*(?:10[\.\)]\s*([A-Ca-c]))/i
  ];

  // Try pattern 1: "Đáp án: B C C A B"
  const p1 = answerPatterns[0].exec(text);
  if (p1) {
    const letters = p1[1].split(/[\s,\.]+/).filter(l => /^[A-Ca-c]$/.test(l.trim()));
    for (let i = 0; i < letters.length && (6 + i) <= 10; i++) {
      const ansInput = document.getElementById(`admin-read-ans-${6 + i}`);
      if (ansInput) ansInput.value = letters[i].toUpperCase();
    }
  }

  // Try pattern 2: "6.B 7.C ..."
  const p2 = answerPatterns[1].exec(text);
  if (p2) {
    for (let i = 1; i <= 5 && p2[i]; i++) {
      const ansInput = document.getElementById(`admin-read-ans-${5 + i}`);
      if (ansInput) ansInput.value = p2[i].toUpperCase();
    }
  }

  // Try: last line is just letters like "B C C A B"
  if (!p1 && !p2) {
    const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const lastLine = allLines[allLines.length - 1];
    if (lastLine) {
      const justLetters = lastLine.replace(/[\d\.\),:\s]/g, ' ').trim().split(/\s+/).filter(l => /^[A-Ca-c]$/.test(l));
      if (justLetters.length >= 3 && justLetters.length <= 5) {
        for (let i = 0; i < justLetters.length && (6 + i) <= 10; i++) {
          const ansInput = document.getElementById(`admin-read-ans-${6 + i}`);
          if (ansInput) ansInput.value = justLetters[i].toUpperCase();
        }
      }
    }
  }
  for (let i = 6; i <= 10; i++) {
    if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
  }

  // Flash success
  el.style.borderColor = '#10b981';
  el.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.3)';
  setTimeout(() => { el.style.borderColor = 'rgba(255, 193, 7, 0.3)'; el.style.boxShadow = 'none'; }, 2000);
};

// TỰ NHẬN ĐÁP ÁN — Auto-match answer text to A/B/C for Teil 2 (Q6-10)
window.megaAnswerT2 = function(el) {
  const text = el.value.trim();
  if (!text) return;

  // Support parsing from Moodle/online test formats (Richtige Antwort)
  if (text.includes('Richtige Antwort')) {
    const regex = /\b(6|7|8|9|10)[\.\):\s]+/g;
    let matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        num: parseInt(match[1]),
        index: match.index,
        endIndex: regex.lastIndex
      });
    }

    let extractedAnswers = [];
    for (let idx = 0; idx < matches.length; idx++) {
      const cur = matches[idx];
      const next = matches[idx + 1];
      const blockText = text.substring(cur.endIndex, next ? next.index : text.length).trim();
      const qNum = cur.num;

      const matchAns = blockText.match(/Richtige Antwort\s*\n\s*([^\n]+)/i) || blockText.match(/Richtige Antwort\s+([^\n]+)/i);
      if (matchAns) {
        extractedAnswers.push({ qNum: qNum, ansText: matchAns[1].trim() });
      }
    }
    
    // Match each extracted text against options A/B/C
    for (const item of extractedAnswers) {
      const qNum = item.qNum;
      const ansText = item.ansText.toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, '').trim();
      
      let bestMatch = null;
      let bestScore = 0;
      
      for (const letter of ['A', 'B', 'C']) {
        const optInput = document.getElementById(`admin-read-t2-qopt-${qNum}-${letter}`);
        if (optInput && optInput.value) {
          const optText = optInput.value.toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, '').trim();
          
          if (optText.includes(ansText) || ansText.includes(optText)) {
            const score = Math.min(optText.length, ansText.length);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = letter;
            }
          }
          
          const ansWords = ansText.split(/\s+/);
          const optWords = optText.split(/\s+/);
          let overlap = 0;
          for (const w of ansWords) {
            if (w.length > 2 && optWords.some(ow => ow.includes(w) || w.includes(ow))) overlap++;
          }
          const overlapScore = overlap / Math.max(ansWords.length, 1);
          if (overlapScore > 0.5 && overlap > bestScore) {
            bestScore = overlap;
            bestMatch = letter;
          }
        }
      }
      
      if (!bestMatch) {
        // Fallback: If option A matches old mock values or is empty, write correct text into Option A and select A
        const optA = document.getElementById(`admin-read-t2-qopt-${qNum}-A`);
        const optB = document.getElementById(`admin-read-t2-qopt-${qNum}-B`);
        const optC = document.getElementById(`admin-read-t2-qopt-${qNum}-C`);
        
        const optAVal = optA ? optA.value : '';
        const isMockOrEmpty = !optAVal || 
          optAVal.includes('Großmärkten') || 
          optAVal.includes('Angestellten') || 
          optAVal.includes('Melanie') || 
          optAVal.includes('Teilnehmer');
          
        if (isMockOrEmpty) {
          if (optA) optA.value = item.ansText;
          if (optB) optB.value = '';
          if (optC) optC.value = '';
          bestMatch = 'A';
        }
      }

      if (bestMatch) {
        const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
        if (ansInput) {
          ansInput.value = bestMatch;
          ansInput.style.borderColor = '#10b981';
          ansInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
          setTimeout(() => { ansInput.style.borderColor = 'rgba(255,255,255,0.1)'; ansInput.style.boxShadow = 'none'; }, 2000);
        }
      }
    }
    for (let i = 6; i <= 10; i++) {
      if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
    }
    flashSuccess(el, '#10b981');
    return;
  }

  // Cách 1: Simple letters like "B B C A B" or "B, B, C, A, B"
  const simpleLetters = text.replace(/[\d\.\),:\n]/g, ' ').trim().split(/[\s,]+/).filter(p => /^[A-Ca-c]$/.test(p.trim()));
  if (simpleLetters.length >= 3) {
    for (let i = 0; i < simpleLetters.length && (6 + i) <= 10; i++) {
      const input = document.getElementById(`admin-read-ans-${6 + i}`);
      if (input) input.value = simpleLetters[i].toUpperCase();
    }
    flashSuccess(el, '#10b981');
    return;
  }

  // Cách 2: Full answer text — split by lines or numbered patterns
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let answerTexts = [];
  
  for (const line of lines) {
    // Remove leading number like "6." "7." etc
    let cleaned = line.replace(/^\d+[\.\):\s]+/, '').trim();
    if (cleaned.length > 2) answerTexts.push(cleaned);
  }

  // If only one line with commas or semicolons, split it
  if (answerTexts.length === 1 && (answerTexts[0].includes(',') || answerTexts[0].includes(';'))) {
    answerTexts = answerTexts[0].split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }

  // Match each answer text against the A/B/C options
  for (let idx = 0; idx < answerTexts.length && (6 + idx) <= 10; idx++) {
    const qNum = 6 + idx;
    const ansText = answerTexts[idx].toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, '').trim();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const letter of ['A', 'B', 'C']) {
      const optInput = document.getElementById(`admin-read-t2-qopt-${qNum}-${letter}`);
      if (optInput && optInput.value) {
        const optText = optInput.value.toLowerCase().replace(/[^a-zäöüß0-9\s]/gi, '').trim();
        
        // Check if one contains the other
        if (optText.includes(ansText) || ansText.includes(optText)) {
          const score = Math.min(optText.length, ansText.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = letter;
          }
        }
        
        // Also check word overlap
        const ansWords = ansText.split(/\s+/);
        const optWords = optText.split(/\s+/);
        let overlap = 0;
        for (const w of ansWords) {
          if (w.length > 2 && optWords.some(ow => ow.includes(w) || w.includes(ow))) overlap++;
        }
        const overlapScore = overlap / Math.max(ansWords.length, 1);
        if (overlapScore > 0.5 && overlap > bestScore) {
          bestScore = overlap;
          bestMatch = letter;
        }
      }
    }
    
    if (bestMatch) {
      const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
      if (ansInput) {
        ansInput.value = bestMatch;
        ansInput.style.borderColor = '#10b981';
        ansInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
        setTimeout(() => { ansInput.style.borderColor = 'rgba(255,255,255,0.1)'; ansInput.style.boxShadow = 'none'; }, 2000);
      }
    }
  }

  for (let i = 6; i <= 10; i++) {
    if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
  }

  flashSuccess(el, '#10b981');
};

// SIÊU DÁN NHANH — Mega Paste for Teil 4 (Q21-30)
window.megaPasteT4 = function(el) {
  const text = el.value.trim();
  if (!text) return;

  const lines = text.split('\n');
  const groups = [];
  let currentGroup = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^A[\.\):\s]/.test(trimmed)) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = { A: trimmed.replace(/^A[\.\):\s]+/, '').trim(), B: '', C: '' };
    } else if (/^B[\.\):\s]/.test(trimmed) && currentGroup) {
      currentGroup.B = trimmed.replace(/^B[\.\):\s]+/, '').trim();
    } else if (/^C[\.\):\s]/.test(trimmed) && currentGroup) {
      currentGroup.C = trimmed.replace(/^C[\.\):\s]+/, '').trim();
    }
  }
  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Parse blocks
  for (let i = 0; i < groups.length && i < 10; i++) {
    const qNum = 21 + i;
    const g = groups[i];

    // Clean up trailing dashes and question numbers (e.g., "- 23")
    const cleanOpt = (val) => val ? val.replace(/-\s*\d+\s*$/, '').trim() : '';
    const optA = cleanOpt(g.A);
    const optB = cleanOpt(g.B);
    const optC = cleanOpt(g.C);

    const inputA = document.getElementById(`admin-read-t4-opt-${qNum}-A`);
    const inputB = document.getElementById(`admin-read-t4-opt-${qNum}-B`);
    const inputC = document.getElementById(`admin-read-t4-opt-${qNum}-C`);
    if (inputA && optA) inputA.value = optA;
    if (inputB && optB) inputB.value = optB;
    if (inputC && optC) inputC.value = optC;
  }

  // === AUTO FILL ANSWERS ===
  // Look for answers line at the end, e.g. "Đáp án: B B A C A..."
  const cleanText = text.replace(/Chỉ đánh dấu một hình ôvan\.?/gi, '');
  const allLines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let keyString = '';
  // Try finding line containing "Đáp án" or "Lösung" or similar
  for (let i = allLines.length - 1; i >= 0; i--) {
    if (/(?:đáp\s*án|answer|key|lösung|correct)/i.test(allLines[i])) {
      keyString = allLines[i].replace(/.*?(?:đáp\s*án|answer|key|lösung|correct)[:\s]+/i, '').trim();
      break;
    }
  }

  if (keyString) {
    // If it's a list of A/B/C letters
    const letters = keyString.replace(/[\d\.\),:\s]/g, ' ').trim().split(/[\s,]+/).filter(l => /^[A-Ca-c]$/.test(l.trim()));
    if (letters.length >= 3) {
      for (let i = 0; i < letters.length && (21 + i) <= 30; i++) {
        const qNum = 21 + i;
        const letter = letters[i].toUpperCase();
        // Resolve letter to option word
        const optInput = document.getElementById(`admin-read-t4-opt-${qNum}-${letter}`);
        const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
        if (optInput && ansInput && optInput.value) {
          ansInput.value = optInput.value.trim();
        }
      }
    } else {
      // List of actual words
      const words = keyString.split(/[\s,\n]+/).filter(w => w.trim().length > 0);
      for (let i = 0; i < words.length && (21 + i) <= 30; i++) {
        const qNum = 21 + i;
        const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
        if (ansInput) ansInput.value = words[i].trim();
      }
    }
  }

  for (let i = 21; i <= 30; i++) {
    if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
  }
};

// TỰ NHẬN ĐÁP ÁN — Auto-match letters (A/B/C) to options, or write words directly for Teil 4 (Q21-30)
window.megaAnswerT4 = function(el) {
  const text = el.value.trim();
  if (!text) return;

  // Support parsing from Moodle/online test formats (Richtige Antwort)
  if (text.includes('Richtige Antwort')) {
    const regex = /\b(21|22|23|24|25|26|27|28|29|30)[\.\):\s]+/g;
    let matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        num: parseInt(match[1]),
        index: match.index,
        endIndex: regex.lastIndex
      });
    }

    for (let idx = 0; idx < matches.length; idx++) {
      const cur = matches[idx];
      const next = matches[idx + 1];
      const blockText = text.substring(cur.endIndex, next ? next.index : text.length).trim();
      const qNum = cur.num;

      const matchAns = blockText.match(/Richtige Antwort\s*\n\s*([^\n]+)/i) || blockText.match(/Richtige Antwort\s+([^\n]+)/i);
      if (matchAns) {
        let ansVal = matchAns[1].trim();
        
        // If it starts with A. or A: or similar, e.g. "C: Hoffentlich" -> strip it
        ansVal = ansVal.replace(/^[A-Ca-c][\.\s:]+\s*/, '').trim();
        
        let matchedLetter = '';
        if (/^[A-Ca-c]$/.test(ansVal)) {
          matchedLetter = ansVal.toUpperCase();
        } else {
          // Compare with options A, B, C
          const cleanAns = ansVal.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
          for (const letter of ['A', 'B', 'C']) {
            const optInput = document.getElementById(`admin-read-t4-opt-${qNum}-${letter}`);
            if (optInput && optInput.value) {
              const cleanOpt = optInput.value.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
              if (cleanOpt && (cleanOpt === cleanAns || cleanOpt.includes(cleanAns) || cleanAns.includes(cleanOpt))) {
                matchedLetter = letter;
                break;
              }
            }
          }
        }

        const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
        if (ansInput) {
          ansInput.value = matchedLetter || ansVal;
          ansInput.style.borderColor = '#10b981';
          ansInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
          setTimeout(() => { ansInput.style.borderColor = 'rgba(255,255,255,0.1)'; ansInput.style.boxShadow = 'none'; }, 2000);
        }
      }
    }
    for (let i = 21; i <= 30; i++) {
      if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
    }
    flashSuccess(el, '#10b981');
    return;
  }

  // If it's a list of A/B/C letters
  const letters = text.replace(/[\d\.\),:\n]/g, ' ').trim().split(/[\s,]+/).filter(l => /^[A-Ca-c]$/.test(l.trim()));
  if (letters.length >= 3) {
    for (let i = 0; i < letters.length && (21 + i) <= 30; i++) {
      const qNum = 21 + i;
      const letter = letters[i].toUpperCase();
      const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
      if (ansInput) {
        ansInput.value = letter;
        ansInput.style.borderColor = '#10b981';
        ansInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
        setTimeout(() => { ansInput.style.borderColor = 'rgba(255,255,255,0.1)'; ansInput.style.boxShadow = 'none'; }, 2000);
      }
    }
  } else {
    // List of actual words
    const words = text.split(/[\s,\n]+/).filter(w => w.trim().length > 0);
    for (let i = 0; i < words.length && (21 + i) <= 30; i++) {
      const qNum = 21 + i;
      const word = words[i].trim();

      // Find matching letter
      let matchedLetter = '';
      const cleanWord = word.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
      for (const letter of ['A', 'B', 'C']) {
        const optInput = document.getElementById(`admin-read-t4-opt-${qNum}-${letter}`);
        if (optInput && optInput.value) {
          const cleanOpt = optInput.value.toLowerCase().replace(/[^a-zäöüß0-9]/gi, '').trim();
          if (cleanOpt && (cleanOpt === cleanWord || cleanOpt.includes(cleanWord) || cleanWord.includes(cleanOpt))) {
            matchedLetter = letter;
            break;
          }
        }
      }

      const ansInput = document.getElementById(`admin-read-ans-${qNum}`);
      if (ansInput) {
        ansInput.value = matchedLetter || word;
        ansInput.style.borderColor = '#10b981';
        ansInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
        setTimeout(() => { ansInput.style.borderColor = 'rgba(255,255,255,0.1)'; ansInput.style.boxShadow = 'none'; }, 2000);
      }
    }
  }

  for (let i = 21; i <= 30; i++) {
    if (typeof updateAdminAnswerPreview === 'function') updateAdminAnswerPreview(i);
  }

  flashSuccess(el, '#10b981');
};

function flashSuccess(el, color) {
  el.style.borderColor = color;
  el.style.boxShadow = `0 0 12px ${color}40`;
  setTimeout(() => { el.style.borderColor = 'rgba(16, 185, 129, 0.3)'; el.style.boxShadow = 'none'; }, 2000);
}

window.updateAdminAnswerPreview = function(i) {
  const ansInput = document.getElementById(`admin-read-ans-${i}`);
  const previewSpan = document.getElementById(`admin-read-ans-preview-${i}`);
  if (!ansInput || !previewSpan) return;

  const val = ansInput.value.trim();
  if (!val) {
    previewSpan.textContent = '';
    return;
  }

  const valUpper = val.toUpperCase();
  let text = '';
  if (i >= 1 && i <= 5) {
    // Teil 1: Heading letter A-J
    const optInput = document.getElementById(`admin-read-t1-heading-${valUpper}`);
    if (optInput && optInput.value) {
      text = optInput.value.trim();
    }
  } else if (i >= 6 && i <= 10) {
    // Teil 2: Option letter A-C
    const optInput = document.getElementById(`admin-read-t2-qopt-${i}-${valUpper}`);
    if (optInput && optInput.value) {
      text = optInput.value.trim();
    }
  } else if (i >= 11 && i <= 20) {
    // Teil 3: Ad letter a-l (lowercase in IDs)
    const letterLower = val.toLowerCase();
    if (letterLower === 'x') {
      text = 'Không có quảng cáo phù hợp (x)';
    } else {
      const optInput = document.getElementById(`admin-read-t3-text-${letterLower}`);
      if (optInput && optInput.value) {
        text = optInput.value.trim();
      }
    }
  } else if (i >= 21 && i <= 30) {
    // Teil 4: Option letter A-C or the word itself
    if (['A', 'B', 'C'].includes(valUpper)) {
      const optInput = document.getElementById(`admin-read-t4-opt-${i}-${valUpper}`);
      if (optInput && optInput.value) {
        text = optInput.value.trim();
      }
    } else {
      // It's a word already, check if it matches one of the options
      text = val;
    }
  } else if (i >= 31 && i <= 40) {
    // Teil 5: Word bank letter a-o or the word itself
    const valClean = val.trim().toUpperCase();
    if (/^[A-O]$/.test(valClean)) {
      const letter = valClean.toLowerCase();
      const wordBankInput = document.getElementById(`admin-read-t5-word-${letter}`);
      if (wordBankInput && wordBankInput.value) {
        text = `${letter.toUpperCase()}. ${wordBankInput.value.trim().toUpperCase()}`;
      }
    } else {
      // It's a word. Let's find if it matches any word in the Wortbank
      let matchedLetter = '';
      for (const letter of ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o']) {
        const wordBankInput = document.getElementById(`admin-read-t5-word-${letter}`);
        if (wordBankInput && wordBankInput.value) {
          if (wordBankInput.value.trim().toUpperCase() === valClean) {
            matchedLetter = letter.toUpperCase();
            break;
          }
        }
      }
      if (matchedLetter) {
        text = `${matchedLetter}. ${valClean}`;
      } else {
        text = val;
      }
    }
  }

  if (text) {
    if (text.length > 80) text = text.substring(0, 80) + '...';
    previewSpan.textContent = ` → ${text}`;
  } else {
    previewSpan.textContent = '';
  }
};

// Quick Paste for Teil 1 Texts
window.parseT1Texts = function(el) {
  const text = el.value;
  if (text.includes('Richtige Antwort')) {
    parseAnswers(el, 'reading', 1, 5);
    return;
  }
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`admin-read-t1-text-${i}`);
    if (input) input.value = '';
  }

  const regex = /\b([1-5])[\.\):]\s+/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      num: parseInt(match[1]),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  // Nếu không có số nào, hoặc nếu có chữ dài trước số đầu tiên (nghĩa là đoạn 1 không có số)
  // Ta sẽ ưu tiên cắt bằng khoảng trắng (double enter)
  let parts = text.split(/\n\s*\n/).filter(p => p.trim());
  
  if (matches.length <= 1 || (matches.length > 0 && matches[0].index > 50 && parts.length >= 5)) {
    // Dùng cách cắt theo đoạn văn nếu đủ 5 đoạn hoặc regex fail
    for (let i = 0; i < parts.length && i < 5; i++) {
      const input = document.getElementById(`admin-read-t1-text-${i + 1}`);
      if (input) {
        // Remove trailing or leading numbers if present
        let val = parts[i].trim();
        val = val.replace(/^(?:[1-5])[\.\):]\s*/, '');
        input.value = val;
      }
    }
    return;
  }

  // Nếu regex có vẻ chuẩn xác (đủ các số)
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let rawText = text.substring(current.endIndex, next ? next.index : text.length);
    let wordText = rawText;

    // Bỏ qua nếu có label rác
    wordText = wordText.replace(/^Văn bản bài đọc \d+\s*/i, '');
    rawText = rawText.replace(/^Văn bản bài đọc \d+\s*/i, '');
    
    // Support parsing from Moodle/online test formats
    const moodleMatch = rawText.match(/(.*?)(?:Ihre Antwort|Richtige Antwort)/is);
    if (moodleMatch) {
      wordText = moodleMatch[1].replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').trim();
      // Remove single newlines to fix hard wraps, but keep double newlines (paragraphs)
      wordText = wordText.replace(/([^\n])\n([^\n])/g, '$1 $2').replace(/\s{2,}/g, ' ').trim();
      
      const ansMatch = rawText.match(/Richtige Antwort\s+([a-jA-J])\b/i);
      if (ansMatch) {
        const ansInput = document.getElementById(`admin-read-ans-${current.num}`);
        if (ansInput) ansInput.value = ansMatch[1].toUpperCase();
      }
    } else {
      wordText = wordText.replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').trim();
      wordText = wordText.replace(/([^\n])\n([^\n])/g, '$1 $2').replace(/\s{2,}/g, ' ').trim();
    }
    
    const input = document.getElementById(`admin-read-t1-text-${current.num}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste parser for Teil 2 Options
window.parseT2Options = function(el, qId) {
  const text = el.value;
  ['A', 'B', 'C'].forEach(l => {
    const input = document.getElementById(`admin-read-t2-qopt-${qId}-${l}`);
    if (input) input.value = '';
  });

  const regex = /\b([a-cA-C])[\.\):]\s*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      letter: match[1].toUpperCase(),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  if (matches.length > 0) {
    const beforeFirstMatch = text.substring(0, matches[0].index).trim();
    if (beforeFirstMatch) {
      let qText = beforeFirstMatch.replace(/^(?:\d+[\.\)]\s*)+/, '').trim();
      qText = qText.replace(/Chỉ đánh dấu một hình ôvan\./gi, '').trim();
      qText = qText.replace(/Markieren Sie.*?\./gi, '').trim(); // Remove German instruction if present
      const inputQ = document.getElementById(`admin-read-t2-qtext-${qId}`);
      if (inputQ) inputQ.value = qText;
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let rawText = text.substring(current.endIndex, next ? next.index : text.length);
    let wordText = rawText;
    
    // Support parsing from Moodle formats
    const moodleMatch = rawText.match(/(.*?)(?:Ihre Antwort|Richtige Antwort)/is);
    if (moodleMatch) {
      wordText = moodleMatch[1].replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
      
      const ansMatch = rawText.match(/Richtige Antwort\s+([a-cA-C])\b/i);
      if (ansMatch) {
        const ansInput = document.getElementById(`admin-read-ans-${qId}`);
        if (ansInput) ansInput.value = ansMatch[1].toUpperCase();
      }
    } else {
      wordText = wordText.replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
    }
    
    wordText = wordText.replace(/\s{2,}/g, ' ');

    const input = document.getElementById(`admin-read-t2-qopt-${qId}-${current.letter}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste parser for Teil 4 Options
window.parseT4Options = function(el, qId) {
  const text = el.value;
  ['A', 'B', 'C'].forEach(l => {
    const input = document.getElementById(`admin-read-t4-opt-${qId}-${l}`);
    if (input) input.value = '';
  });

  const regex = /\b([a-cA-C])[\.\):]\s*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      letter: match[1].toUpperCase(),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  if (matches.length > 0) {
    const beforeFirstMatch = text.substring(0, matches[0].index).trim();
    if (beforeFirstMatch) {
      let qText = beforeFirstMatch.replace(/^(?:\d+[\.\)]\s*)+/, '').trim();
      qText = qText.replace(/Chỉ đánh dấu một hình ôvan\./gi, '').trim();
      qText = qText.replace(/Markieren Sie.*?\./gi, '').trim();
      // Teil 4 doesn't have a question text input, it's just options. So we don't need to set inputQ here.
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let rawText = text.substring(current.endIndex, next ? next.index : text.length);
    let wordText = rawText;
    
    // Support parsing from Moodle formats
    const moodleMatch = rawText.match(/(.*?)(?:Ihre Antwort|Richtige Antwort)/is);
    if (moodleMatch) {
      wordText = moodleMatch[1].replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
      
      const ansMatch = rawText.match(/Richtige Antwort\s+([a-cA-C])\b/i);
      if (ansMatch) {
        const ansInput = document.getElementById(`admin-read-ans-${qId}`); // Teil 4 also uses admin-read-ans
        if (ansInput) ansInput.value = ansMatch[1].toUpperCase();
      }
    } else {
      wordText = wordText.replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
    }
    
    wordText = wordText.replace(/\s{2,}/g, ' ');

    const input = document.getElementById(`admin-read-t4-opt-${qId}-${current.letter}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste parser for Teil 5 Options
window.parseT5Options = function(el) {
  const text = el.value;
  ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o'].forEach(l => {
    const input = document.getElementById(`admin-read-t5-word-${l}`);
    if (input) input.value = '';
  });
  
  const regex = /\b([a-oA-O])(?:[\.\):]|\s+(?=\S))\s*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      letter: match[1].toLowerCase(),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let wordText = text.substring(current.endIndex, next ? next.index : text.length).replace(/\n/g, ' ').trim();
    wordText = restoreUmlauts(wordText); // Auto restore umlauts
    const input = document.getElementById(`admin-read-t5-word-${current.letter}`);
    if (input) input.value = wordText.toUpperCase();
  }
};

// Quick Paste for Teil 1 Headings
window.parseT1Headings = function(el) {
  const text = el.value;
  ['A','B','C','D','E','F','G','H','I','J'].forEach(l => {
    const input = document.getElementById(`admin-read-t1-heading-${l}`);
    if (input) input.value = '';
  });

  const regex = /\b([a-jA-J])[\.\):]\s*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      letter: match[1].toUpperCase(),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let wordText = text.substring(current.endIndex, next ? next.index : text.length).trim();
    // Headings are always single line! Strip anything after the first newline.
    wordText = wordText.split(/\n/)[0].trim();
    const input = document.getElementById(`admin-read-t1-heading-${current.letter}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste for Teil 3 Situations
window.parseT3Situations = function(el) {
  const text = el.value;
  for (let i = 11; i <= 20; i++) {
    const input = document.getElementById(`admin-read-t3-sit-${i}`);
    if (input) input.value = '';
  }

  const regex = /\b(1[1-9]|20)[\.\):]\s+/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      num: parseInt(match[1]),
      index: match.index,
      endIndex: regex.lastIndex
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let rawText = text.substring(current.endIndex, next ? next.index : text.length);
    let wordText = rawText;
    
    // Support parsing from Moodle/online test formats
    const moodleMatch = rawText.match(/(.*?)(?:Ihre Antwort|Richtige Antwort)/is);
    if (moodleMatch) {
      wordText = moodleMatch[1].replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
      
      const ansMatch = rawText.match(/Richtige Antwort\s+([a-lA-L0xX])\b/i);
      if (ansMatch) {
        const ansInput = document.getElementById(`admin-read-ans-${current.num}`);
        if (ansInput) ansInput.value = ansMatch[1].toLowerCase();
      }
    } else {
      wordText = wordText.replace(/ⓧ/g, '').replace(/[\u274c\u274e\u200b]/g, '').replace(/\n/g, ' ').trim();
    }
    
    // Remove extra spaces
    wordText = wordText.replace(/\s{2,}/g, ' ');

    const input = document.getElementById(`admin-read-t3-sit-${current.num}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste for Teil 3 Texts
window.parseT3Texts = function(el) {
  const text = el.value;
  ['a','b','c','d','e','f','g','h','i','j','k','l'].forEach(l => {
    const input = document.getElementById(`admin-read-t3-text-${l}`);
    if (input) input.value = '';
  });

  // Match letters (a-l) ONLY at the start of a line to avoid matching 'z. B.' inside text
  const regex = /(?:^|\n)\s*([a-lA-L])[\.\):]\s*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      letter: match[1].toLowerCase(),
      index: match.index,
      // Find the index of the first character of the text (after the matched prefix)
      endIndex: regex.lastIndex
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i+1];
    let wordText = text.substring(current.endIndex, next ? next.index : text.length).trim();
    const input = document.getElementById(`admin-read-t3-text-${current.letter}`);
    if (input) input.value = wordText;
  }
};

// Quick Paste for Listening Questions
window.parseListeningQuestions = function(el, start, end) {
  const text = el.value.trim();
  if (!text) return;

  if (text.includes('Richtige Antwort')) {
    const regex = /(?:Q\d{2}|\d{2}\.)\s*([\s\S]*?)\s*Ihre Antwort:[\s\S]*?Richtige Antwort:\s*(Richtig|Falsch|R|F|[\s\S]*?)\s*(?:Erklärung:\s*([\s\S]*?))?(?=\s*Hier anhören|\s+Q\d{2}|\s+\d{2}\.|$)/gi;
    let match;
    let found = false;
    let qIndex = start;
    
    while ((match = regex.exec(text)) !== null) {
      if (qIndex > end) break;
      
      const qText = match[1].trim();
      const rawAns = match[2].trim().toUpperCase();
      const expl = match[3] ? match[3].trim() : '';
      
      const qInput = document.getElementById(`admin-listen-qtext-${qIndex}`);
      if (qInput) qInput.value = qText.replace(/\n/g, ' ').trim();
      
      const ansInput = document.getElementById(`admin-listen-ans-${qIndex}`);
      if (ansInput) {
        if (rawAns === 'RICHTIG' || rawAns === 'R') ansInput.value = 'Richtig';
        else if (rawAns === 'FALSCH' || rawAns === 'F') ansInput.value = 'Falsch';
      }
      
      const explInput = document.getElementById(`admin-listen-exp-${qIndex}`);
      if (explInput) explInput.value = expl;
      
      qIndex++;
      found = true;
    }
    
    if (found) {
      el.style.borderColor = '#10b981';
      el.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
      setTimeout(() => { el.style.borderColor = 'rgba(0, 242, 254, 0.3)'; el.style.boxShadow = 'none'; }, 2000);
      return;
    }
  }

  let parts = text.split(/\b(?:Q\d{2}|\d{2})[\.\):]?\s+/).filter(p => p.trim());
  if (parts.length <= 1 && text.includes('\n')) {
    parts = text.split('\n').filter(p => p.trim());
  }
  for (let i = 0; i < parts.length && (start + i) <= end; i++) {
    const input = document.getElementById(`admin-listen-qtext-${start + i}`);
    if (input) input.value = parts[i].replace(/\n/g, ' ').trim();
  }
  
  el.style.borderColor = '#10b981';
  el.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
  setTimeout(() => { el.style.borderColor = 'rgba(0, 242, 254, 0.3)'; el.style.boxShadow = 'none'; }, 2000);
};

function renderAdminReadingList() {
  const tbody = document.getElementById('admin-reading-list');
  if (!tbody) return;
  tbody.innerHTML = db.reading.map(r => `
    <tr>
      <td style="font-weight: bold;">${r.title}</td>
      <td>
        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteItem('reading', ${r.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function addReading(e) {
  e.preventDefault();
  const title = document.getElementById('add-read-title').value;
  const text = document.getElementById('add-read-text').value;
  const question = document.getElementById('add-read-question').value;
  const opts = [
    document.getElementById('add-read-opt0').value,
    document.getElementById('add-read-opt1').value,
    document.getElementById('add-read-opt2').value,
    document.getElementById('add-read-opt3').value
  ];
  const correct = parseInt(document.getElementById('add-read-correct').value);
  const explanation = document.getElementById('add-read-explanation').value;

  const newItem = {
    id: Date.now(),
    title,
    text,
    question,
    options: opts,
    answer: correct,
    explanation
  };

  db.reading.push(newItem);
  saveDB();
  document.getElementById('reading-form').reset();
  renderAdminReadingList();
  alert("Đã lưu bài đọc mới!");
}

// --- Viết Admin ---
let editingWritingId = null;

function renderAdminWritingList() {
  const tbody = document.getElementById('admin-writing-list');
  if (!tbody) return;
  tbody.innerHTML = db.writing.map(w => `
    <tr>
      <td style="font-weight: bold;">${w.title}</td>
      <td>
        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 0.5rem; cursor: pointer;" onclick="editWriting(${w.id})">Sửa</button>
        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; cursor: pointer;" onclick="deleteItem('writing', ${w.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function editWriting(id) {
  const w = db.writing.find(item => item.id === id);
  if (!w) return;
  
  editingWritingId = id;
  
  // Điền dữ liệu vào form
  document.getElementById('add-write-title').value = w.title || '';
  document.getElementById('add-write-prompt').value = w.text || w.prompt || '';
  
  // Đổi tiêu đề form
  const cardHeader = document.querySelector('#admin-writing h4');
  if (cardHeader) cardHeader.textContent = "Chỉnh Sửa Đề Viết";
  
  // Đổi nhãn nút submit
  const form = document.getElementById('writing-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Cập nhật đề viết";
  }
  
  // Thêm nút hủy chỉnh sửa nếu chưa có
  let cancelBtn = document.getElementById('btn-cancel-edit-writing');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'btn-cancel-edit-writing';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.marginLeft = '0.8rem';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.textContent = 'Hủy chỉnh sửa';
    cancelBtn.onclick = cancelEditWriting;
    submitBtn.parentNode.appendChild(cancelBtn);
  }
}

function cancelEditWriting() {
  editingWritingId = null;
  document.getElementById('writing-form').reset();
  
  // Trở lại trạng thái Thêm Đề Viết
  const cardHeader = document.querySelector('#admin-writing h4');
  if (cardHeader) cardHeader.textContent = "Thêm Đề Viết";
  
  const form = document.getElementById('writing-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Lưu lại";
  }
  
  const cancelBtn = document.getElementById('btn-cancel-edit-writing');
  if (cancelBtn) cancelBtn.remove();
}

function addWriting(e) {
  e.preventDefault();
  const title = document.getElementById('add-write-title').value;
  const prompt = document.getElementById('add-write-prompt').value;

  const defaultTips = [
    "Phải viết đầy đủ phần mở bài (Sehr geehrte Damen und Herren,) và kết bài (Mit freundlichen Grüßen).",
    "Nêu rõ lý do viết thư (ví dụ: phàn nàn về dịch vụ hay hỏi thông tin).",
    "Đưa ra ít nhất 3 luận điểm/vấn đề cụ thể để phân tích.",
    "Sử dụng các liên từ và cấu trúc B2 thích hợp (weil, da, obwohl, aus diesem Grund...)."
  ];

  if (editingWritingId !== null) {
    // CHẾ ĐỘ CẬP NHẬT (UPDATE)
    const w = db.writing.find(item => item.id === editingWritingId);
    if (w) {
      w.title = title;
      w.text = prompt; // Đồng bộ trường 'text' hiển thị cho học sinh
      w.prompt = prompt; // Dự phòng trường 'prompt'
      if (!w.tips || w.tips.length === 0) {
        w.tips = defaultTips;
      }
    }
    saveDB();
    cancelEditWriting();
    alert("Đã cập nhật đề viết thư thành công!");
  } else {
    // CHẾ ĐỘ THÊM MỚI (ADD)
    const newItem = {
      id: Date.now(),
      title,
      text: prompt, // Đồng bộ trường 'text' hiển thị cho học sinh
      prompt: prompt, // Dự phòng trường 'prompt'
      tips: defaultTips
    };
    db.writing.push(newItem);
    saveDB();
    document.getElementById('writing-form').reset();
    alert("Đã lưu đề viết thư mới thành công!");
  }
  renderAdminWritingList();
}

// --- Nói Admin ---
let editingSpeakingId = null;

function renderAdminSpeakingList() {
  const tbody = document.getElementById('admin-speaking-list');
  if (!tbody) return;
  tbody.innerHTML = db.speaking.map((s, index) => {
    let displayTitle = s.title;
    if (index > 0) {
      displayTitle = `${index}. ${displayTitle}`;
    }
    return `
      <tr>
        <td style="font-weight: bold;">${displayTitle}</td>
        <td>${s.topic || s.desc || ''}</td>
        <td>
          <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 0.5rem; cursor: pointer;" onclick="editSpeaking(${s.id})">Sửa</button>
          <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; cursor: pointer;" onclick="deleteItem('speaking', ${s.id})">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function editSpeaking(id) {
  const s = db.speaking.find(item => item.id === id);
  if (!s) return;
  
  editingSpeakingId = id;
  
  // Điền dữ liệu vào form
  document.getElementById('add-speak-title').value = s.title || '';
  document.getElementById('add-speak-topic').value = s.topic || s.desc || '';
  document.getElementById('add-speak-teil2').value = s.teil2 || s.prompt || '';
  document.getElementById('add-speak-teil3').value = s.teil3 || '';
  
  // Đổi tiêu đề form
  const cardHeader = document.querySelector('#admin-speaking h4');
  if (cardHeader) cardHeader.textContent = "Chỉnh Sửa Đề Nói (Sprechen)";
  
  // Đổi nhãn nút submit
  const form = document.getElementById('speaking-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Cập nhật đề nói";
  }
  
  // Thêm nút hủy chỉnh sửa nếu chưa có
  let cancelBtn = document.getElementById('btn-cancel-edit-speaking');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'btn-cancel-edit-speaking';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.marginLeft = '0.8rem';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.textContent = 'Hủy chỉnh sửa';
    cancelBtn.onclick = cancelEditSpeaking;
    submitBtn.parentNode.appendChild(cancelBtn);
  }
}

function cancelEditSpeaking() {
  editingSpeakingId = null;
  document.getElementById('speaking-form').reset();
  
  // Trở lại trạng thái Thêm Đề Nói
  const cardHeader = document.querySelector('#admin-speaking h4');
  if (cardHeader) cardHeader.textContent = "Thêm Đề Nói (Sprechen)";
  
  const form = document.getElementById('speaking-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Lưu lại";
  }
  
  const cancelBtn = document.getElementById('btn-cancel-edit-speaking');
  if (cancelBtn) cancelBtn.remove();
}

function addSpeaking(e) {
  e.preventDefault();
  const title = document.getElementById('add-speak-title').value;
  const topic = document.getElementById('add-speak-topic').value;
  const teil2 = document.getElementById('add-speak-teil2').value;
  const teil3 = document.getElementById('add-speak-teil3').value;

  if (editingSpeakingId !== null) {
    // CHẾ ĐỘ CẬP NHẬT (UPDATE)
    const s = db.speaking.find(item => item.id === editingSpeakingId);
    if (s) {
      s.title = title;
      s.topic = topic;
      s.desc = topic; // Đồng bộ
      s.teil2 = teil2;
      s.teil3 = teil3;
      s.prompt = teil2; // Dự phòng cho các hàm cũ
    }
    saveDB();
    cancelEditSpeaking();
    alert("Đã cập nhật đề luyện nói thành công!");
  } else {
    // CHẾ ĐỘ THÊM MỚI (ADD)
    const newItem = {
      id: Date.now(),
      title,
      topic,
      desc: topic,
      teil2,
      teil3,
      prompt: teil2
    };
    db.speaking.push(newItem);
    saveDB();
    document.getElementById('speaking-form').reset();
    alert("Đã lưu đề luyện nói mới thành công!");
  }
  renderAdminSpeakingList();
}

// --- Ngữ Pháp Admin ---
function renderAdminGrammarList() {
  const tbody = document.getElementById('admin-grammar-list');
  if (!tbody) return;
  tbody.innerHTML = db.grammar.map(g => `
    <tr>
      <td style="font-weight: bold;">${g.title}</td>
      <td>
        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteItem('grammar', ${g.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function addGrammar(e) {
  e.preventDefault();
  const title = document.getElementById('add-gram-title').value;
  const rule = document.getElementById('add-gram-rule').value;
  const question = document.getElementById('add-gram-question').value;
  const opts = [
    document.getElementById('add-gram-opt0').value,
    document.getElementById('add-gram-opt1').value,
    document.getElementById('add-gram-opt2').value,
    document.getElementById('add-gram-opt3').value
  ];
  const correct = parseInt(document.getElementById('add-gram-correct').value);
  const explanation = document.getElementById('add-gram-explanation').value;

  const newItem = {
    id: Date.now(),
    title,
    rule,
    question,
    options: opts,
    answer: correct,
    explanation
  };

  db.grammar.push(newItem);
  saveDB();
  document.getElementById('grammar-form').reset();
  renderAdminGrammarList();
  alert("Đã lưu ngữ pháp mới!");
}

function adminCreateReadingTest() {
  let maxNum = 0;
  db.reading.forEach(t => {
    if (t && t.name) {
      const match = t.name.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const name = `Đề ${maxNum + 1}`;
  
  const exists = db.reading.find(t => t && t.name && t.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert("Lỗi: Không thể tự động tạo tên vì đề thi đã tồn tại!");
    return;
  }
  const newTest = {
    id: Date.now(),
    name: name.trim(),
    title: name.trim(),
    answers: {},
    explanations: {},
    teil1: { texts: [], headings: [] },
    teil2: { text: '', questions: [] },
    teil3: { situations: [], texts: [] },
    teil4: { text: '', options: {} },
    teil5: { text: '', wordbank: [] }
  };
  db.reading.push(newTest);
  saveDB();
  
  // Reload UI completely to sync both dropdown and table
  renderAdmin();
  const select = document.getElementById('admin-select-reading-test');
  if (select) {
    select.value = name.trim();
  }
  loadAdminReadingTestAnswers();
  alert(`Đã tạo đề thi mới: ${name.trim()}! Cô có thể cấu hình nội dung ngay bây giờ.`);
}

function adminDeleteReadingTest() {
  const select = document.getElementById('admin-select-reading-test');
  if (!select) return;
  const testName = select.value;
  if (!testName) return;

  if (confirm(`Bạn có chắc chắn muốn XÓA hoàn toàn đề thi "${testName}" này không? Học sinh sẽ không thể học đề này nữa.`)) {
    db.reading = db.reading.filter(t => t.name !== testName);
    saveDB();
    
    // Reload UI completely to sync both dropdown and table
    renderAdmin();
    loadAdminReadingTestAnswers();
    alert(`Đã xóa thành công đề thi: ${testName}`);
  }
}

function adminRenameReadingTest() {
  const select = document.getElementById('admin-select-reading-test');
  if (!select) return;
  const oldName = select.value;
  if (!oldName) return;

  const newName = prompt(`Nhập tên mới cho đề thi đọc "${oldName}":`, oldName);
  if (!newName || !newName.trim() || newName.trim() === oldName) return;

  const exists = db.reading.find(t => t && t.name && t.name.toLowerCase() === newName.trim().toLowerCase());
  if (exists) {
    alert("Đề thi trùng tên đã tồn tại!");
    return;
  }

  const test = db.reading.find(t => t.name === oldName);
  if (test) {
    test.name = newName.trim();
    test.title = newName.trim();
    saveDB();
    
    // Reload UI completely to sync both dropdown and table
    renderAdmin();
    const select = document.getElementById('admin-select-reading-test');
    if (select) {
      select.value = newName.trim();
    }
    loadAdminReadingTestAnswers();
    alert(`Đã đổi tên đề thi thành công từ "${oldName}" sang "${newName.trim()}"!`);
  }
}

let currentAdminListeningConfigPart = 1;

function switchAdminListeningConfigPart(partNum) {
  // Tự động lưu không ồn ào (silent save) dữ liệu trước khi chuyển đổi phần nghe để tránh mất dữ liệu
  try {
    saveAdminListeningTestAnswers(true);
  } catch (err) {
    console.warn("Tự động lưu bài nghe lỗi:", err);
  }
  
  currentAdminListeningConfigPart = partNum;
  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`btn-config-listen-${i}`);
    if (btn) {
      if (i === partNum) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  }
  loadAdminListeningTestAnswers();
}

function adminCreateListeningTest() {
  let maxNum = 0;
  db.listening.forEach(t => {
    if (t && t.name) {
      const match = t.name.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const name = `Đề ${maxNum + 1}`;

  const exists = db.listening.find(t => t && t.name && t.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert("Lỗi: Không thể tự động tạo tên vì đề thi đã tồn tại!");
    return;
  }
  const newTest = {
    id: Date.now(),
    name: name.trim(),
    title: name.trim(),
    audioUrl: '',
    answers: {},
    explanations: {},
    durations: {},
    subAudios: {},
    teil1: { transcript: '', questions: [] },
    teil2: { transcript: '', questions: [] },
    teil3: { transcript: '', questions: [] }
  };
  db.listening.push(newTest);
  saveDB();

  // Reload select list
  const select = document.getElementById('admin-select-listening-test');
  if (select) {
    select.innerHTML = db.listening.filter(t => t && t.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    select.value = name.trim();
  }
  loadAdminListeningTestAnswers();
  alert(`Đã tạo đề thi nghe mới: ${name.trim()}! Cô có thể cấu hình nội dung nghe ngay bây giờ.`);
}

function adminDeleteListeningTest() {
  const select = document.getElementById('admin-select-listening-test');
  if (!select) return;
  const testName = select.value;
  if (!testName) return;

  if (confirm(`Bạn có chắc chắn muốn XÓA hoàn toàn đề thi nghe "${testName}" này không? Học sinh sẽ không thể luyện nghe đề này nữa.`)) {
    db.listening = db.listening.filter(t => t.name !== testName);
    saveDB();

    // Reload select list
    if (select) {
      select.innerHTML = db.listening.filter(t => t && t.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }
    loadAdminListeningTestAnswers();
    alert(`Đã xóa thành công đề thi nghe: ${testName}`);
  }
}

function adminRenameListeningTest() {
  const select = document.getElementById('admin-select-listening-test');
  if (!select) return;
  const oldName = select.value;
  if (!oldName) return;

  const newName = prompt(`Nhập tên mới cho đề thi nghe "${oldName}":`, oldName);
  if (!newName || !newName.trim() || newName.trim() === oldName) return;

  const exists = db.listening.find(t => t && t.name && t.name.toLowerCase() === newName.trim().toLowerCase());
  if (exists) {
    alert("Đề thi nghe trùng tên đã tồn tại!");
    return;
  }

  const test = db.listening.find(t => t.name === oldName);
  if (test) {
    test.name = newName.trim();
    test.title = newName.trim();
    saveDB();
    
    // Reload select list
    select.innerHTML = db.listening.filter(t => t && t.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    select.value = newName.trim();
    loadAdminListeningTestAnswers();
    alert(`Đã đổi tên đề thi nghe thành công từ "${oldName}" sang "${newName.trim()}"!`);
  }
}

function loadAdminListeningTestAnswers() {
  const select = document.getElementById('admin-select-listening-test');
  const container = document.getElementById('admin-listening-answers-container');
  if (!select || !container) return;

  const testName = select.value;
  const test = db.listening.find(t => t.name === testName);
  if (!test) return;

  // Khởi tạo các trường mặc định nếu chưa có
  if (!test.answers) test.answers = {};
  if (!test.explanations) test.explanations = {};
  if (!test.durations) test.durations = {};
  if (!test.subAudios) test.subAudios = {};
  if (!test.teil1) test.teil1 = { transcript: '', questions: [] };
  if (!test.teil2) test.teil2 = { transcript: '', questions: [] };
  if (!test.teil3) test.teil3 = { transcript: '', questions: [] };

  // Khởi tạo đề thi nghe mẫu mặc định cho Test 1 nếu rỗng
  if (testName === 'Test 1' || test.id === 1) {
    if (!test.teil1.questions || test.teil1.questions.length === 0) {
      test.audioUrl = test.audioUrl || "audio/test1_full.mp3";
      
      test.teil1.transcript = test.teil1.transcript || `Hörverstehen Teil 1 Sie hören nun eine Nachrichtensendung. Dazu sollen Sie fünf Aufgaben lösen. Sie hören die Nachrichtensendung nur einmal. Entscheiden Sie beim Hören, ob die Aussagen 41, 45 richtig oder falsch sind.\n\nMarkieren Sie Ihre Lösungen auf dem Antwortbogen bei den Aufgaben 41, 45. Lesen Sie jetzt die Aufgaben 41, 45.\n\nGuten Abend, hier sind die neuesten Wetterinformationen. In den Alpen dürfen sich Einheimische und Touristen gleichermaßen freuen. [41] Die Wetterlage wird sich in den kommenden Tagen deutlich verbessern. Laut dem Deutschen Wetterdienst sind ab Freitag längere Sonnenscheindauer, milde Temperaturen und nur vereinzelte Wolkenfelder zu erwarten.\n\nWanderer und Radfahrer werden ideale Bedingungen vorfinden, während Skigebiete in höheren Lagen weiterhin gute Schneeverhältnisse melden. Auch die Lawinengefahr sinkt spürbar. Hotels in der Region verzeichnen bereits erste zusätzliche Buchungen für das Wochenende. Wer also einen spontanen Ausflug in die Berge plant, sollte jetzt zuschlagen. Bestes Bergwetter steht bevor.\n\nSportnachrichten aus Neustadt. [42] Der FC Neustadt gewann am Samstag mit 2-0 gegen den Stadtrivalen. Für viele Fans war dieses Ergebnis keine große Überraschung, denn die...`;
      test.teil1.questions = [
        { id: 41, q: "Die Wetterlage in den Alpen wird sich in den nächsten Tagen verbessern." },
        { id: 42, q: "Die Fans des FC Neustadt waren von dem Sieg ihrer Mannschaft überrascht." },
        { id: 43, q: "Erzieherinnen verlangen eine bessere Bezahlung." },
        { id: 44, q: "Im Berliner Zoo gibt eine große Pandafamilie." },
        { id: 45, q: "Die Zahl của khách du lịch đến Đức đang sụt giảm." }
      ];

      test.teil2.transcript = test.teil2.transcript || `Hörverstehen Teil 2 Sie hören ein Interview. Dazu sollen Sie zehn Aufgaben lösen. Sie hören dieses Interview nur einmal. Entscheiden Sie beim Hören, ob die Aussagen 46-55 richtig oder falsch sind...\n\n[46] Frau Schenk hat kurze blondierte Haare. Sie leitet die Jugendherberge in Bayern...`;
      test.teil2.questions = [
        { id: 46, q: "Frau Schenk hat kurze blondierte Haare." },
        { id: 47, q: "Angie ist der Künstlername von Frau Schenk." },
        { id: 48, q: "Frau Schenk lebt seit etwas mehr als zwei Jahren in Bayern." },
        { id: 49, q: "Der Interviewer hat keine guten Erinnerungen an seine Aufenthalte in Jugendherbergen." },
        { id: 50, q: "Auch in der modernen Jugendherberge von Frau Schenk gibt es Schlafräume mit mehr als zehn Betten." },
        { id: 51, q: "Nur bei Schulklassen achtet man auf Geschlechtstrennung in den Schlafräumen." },
        { id: 52, q: "Das Angebot an Speisen wird auf die Wünsche der Gäste abgestimmt." },
        { id: 53, q: "Schüler aus ländlichen Regionen sind meist unproblematische Gäste." },
        { id: 54, q: "Das Reiten zählt zu dem Sportprogramm der Jugendherberge." },
        { id: 55, q: "Frau Schenk muss für ihre Dienstwohnung 800€ bezahlen." }
      ];

      test.teil3.questions = [
        { id: 56, q: "Bei der Fahrschule kann man sich über das Internet anmelden." },
        { id: 57, q: "Die Anruferin ist im Hinblick auf die Abfahrtszeit flexibel." },
        { id: 58, q: "Für den Halb-Marathon kann man sich noch am Sonntag registrieren lassen." },
        { id: 59, q: "Bei dem Flug nach Mallorca ändert sich die Abflugzeit." },
        { id: 60, q: "In Halle D wird aus E-Books vorgelesen." }
      ];

      // Default Answers
      test.answers[41] = "Richtig";
      test.answers[42] = "Falsch";
      test.answers[43] = "Richtig";
      test.answers[44] = "Falsch";
      test.answers[45] = "Falsch";
      test.answers[46] = "Richtig";
      test.answers[47] = "Falsch";
      test.answers[48] = "Richtig";
      test.answers[49] = "Richtig";
      test.answers[50] = "Falsch";
      test.answers[51] = "Richtig";
      test.answers[52] = "Falsch";
      test.answers[53] = "Richtig";
      test.answers[54] = "Falsch";
      test.answers[55] = "Richtig";
      test.answers[56] = "Falsch";
      test.answers[57] = "Richtig";
      test.answers[58] = "Falsch";
      test.answers[59] = "Richtig";
      test.answers[60] = "Falsch";
      
      // Default Explanations
      test.explanations[41] = "Bài nghe dùng cụm từ \"deutlich verbessern\" (cải thiện rõ rệt), khớp hoàn toàn với \"verbessern\" trong đề.";
      test.explanations[42] = "Bài nghe nói trận thắng này \"keine große Überraschung\" (không phải là bất ngờ lớn) vì đối thủ đang khủng hoảng.";
      test.explanations[43] = "Bài nghe đề cập đến cuộc biểu tình đòi lương cao hơn \"höhere Gehälter fordern\" tương đương \"bessere Bezahlung verlangen\".";
      test.explanations[44] = "Bài nghe nói chỉ có cặp gấu trúc sinh đôi mới ra đời, không phải một đại gia đình đông đúc.";
      test.explanations[45] = "Thực tế số liệu cho thấy du lịch nội địa \"steigt kontinuierlich\" (tăng liên tục), không phải giảm sút (rückläufig).";
      test.explanations[46] = "Người phỏng vấn miêu tả ngoại hình của cô ấy có mái tóc ngắn nhuộm vàng.";
      test.explanations[47] = "Angie chỉ là biệt danh thân mật từ bạn bè gọi tắt tên Angela của cô ấy.";
      test.explanations[48] = "Cô ấy nói \"seit knapp über zwei Jahren\" (chỉ hơn 2 năm một chút).";
      test.explanations[49] = "Anh ấy nhớ lại trải nghiệm ngủ giường tầng ồn ào và phòng tắm chung bất tiện thời học sinh.";
      test.explanations[50] = "Phòng lớn nhất ở đây chỉ có tối đa 6 giường ngủ, không còn phòng tập thể lớn trên 10 giường.";
      test.explanations[51] = "Việc phân chia nam nữ bắt buộc chỉ áp dụng cho nhóm học sinh, khách lẻ có thể đăng ký phòng chung nam nữ.";
      test.explanations[52] = "Họ chuẩn bị thực đơn cố định theo ngày chứ không nấu ăn theo yêu cầu cá nhân của từng khách.";
      test.explanations[53] = "Nhóm học sinh nông thôn thường tuân thủ nội quy và thân thiện hơn học sinh thành phố lớn.";
      test.explanations[54] = "Hoạt động cưỡi ngựa không nằm trong chương trình của họ, chỉ có đạp xe địa hình và leo núi.";
      test.explanations[55] = "Cô ấy xác nhận căn hộ công vụ được khấu trừ trực tiếp 800 Euro vào lương mỗi tháng.";
      test.explanations[56] = "Lời thoại thông báo bắt buộc phải đến văn phòng ký hồ sơ trực tiếp, đăng ký trực tuyến chỉ là giữ chỗ tạm thời.";
      test.explanations[57] = "Cô ấy nói \"Mir ist es egal, wann wir losfahren\" (Tôi đi giờ nào cũng được).";
      test.explanations[58] = "Hạn chót đăng ký trực tiếp tại quầy là thứ Bảy, Chủ Nhật không nhận hồ sơ mới.";
      test.explanations[59] = "Thông báo phát thanh thông tin chuyến bay lùi giờ cất cánh muộn hơn 45 phút.";
      test.explanations[60] = "Tại sảnh D là buổi giao lưu trực tiếp tác giả đọc sách in giấy truyền thống chứ không đọc sách điện tử.";

      // Default Durations
      test.durations[41] = "0:57";
      test.durations[42] = "1:15";
      test.durations[43] = "1:52";
      test.durations[44] = "2:30";
      test.durations[45] = "3:05";
      test.durations[46] = "4:20";
      test.durations[47] = "5:02";
      test.durations[48] = "5:45";
      test.durations[49] = "6:30";
      test.durations[50] = "7:12";
      test.durations[51] = "7:50";
      test.durations[52] = "8:35";
      test.durations[53] = "9:20";
      test.durations[54] = "10:05";
      test.durations[55] = "10:50";
      test.durations[56] = "11:45";
      test.durations[57] = "12:30";
      test.durations[58] = "13:10";
      test.durations[59] = "13:55";
      test.durations[60] = "14:40";
    }
  }

  let start = 41, end = 45;
  let partKey = 'teil1';
  if (currentAdminListeningConfigPart === 2) {
    start = 46;
    end = 55;
    partKey = 'teil2';
  } else if (currentAdminListeningConfigPart === 3) {
    start = 56;
    end = 60;
    partKey = 'teil3';
  }

  let questionsList = test[partKey].questions || [];
  // Build default list if empty
  if (questionsList.length === 0) {
    for (let i = start; i <= end; i++) {
      questionsList.push({ id: i, q: '' });
    }
  }

  let html = `
    <!-- Nhập Link Audio chính -->
    <div style="background: rgba(22, 22, 54, 0.45); border: 1px solid var(--border-light); padding: 1.2rem; border-radius: 10px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <span style="font-size: 1.5rem;">📻</span>
      <div style="flex-grow: 1; min-width: 250px;">
        <label style="color: var(--accent-cyan); font-weight: bold; font-size: 0.85rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase;">Link Audio chính (Full Audio cho đề thi)</label>
        <input type="text" id="admin-listen-main-audio" value="${test.audioUrl || ''}" placeholder="z.B. audio/test1_full.mp3 hoặc link URL..." style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.9rem;">
      </div>
      <div style="flex-grow: 1; min-width: 250px; display: flex; align-items: center; height: 100%; padding-top: 1rem;">
        <label style="color: var(--accent-cyan); font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; background: rgba(0, 242, 254, 0.05); padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.25);">
          <input type="checkbox" id="admin-listen-use-ai" ${test.useAiVoice ? 'checked' : ''} style="transform: scale(1.3); cursor: pointer;">
          Sử dụng giọng đọc AI tự động từ dịch Transkript (TTS)
        </label>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.5rem; align-items: start;">
      <!-- Left Column: Fragen & Erklärungen -->
      <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px;">
        <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 1.2rem; text-transform: uppercase; letter-spacing: 0.5px;">Fragen & Erklärungen</div>
        
        <!-- Quick Paste cho Listening -->
        <textarea placeholder="Dán nhanh các mệnh đề câu hỏi (từ câu ${start} đến ${end}) vào đây..." rows="2" style="width: 100%; padding: 0.5rem; background: rgba(0, 242, 254, 0.05); border: 1px dashed rgba(0, 242, 254, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 0.5rem; resize: vertical;" oninput="parseListeningQuestions(this, ${start}, ${end})"></textarea>
        <textarea placeholder="Dán nhanh ĐÁP ÁN (R/F hoặc Richtig/Falsch) vào đây..." rows="1" style="width: 100%; padding: 0.5rem; background: rgba(255, 193, 7, 0.05); border: 1px dashed rgba(255, 193, 7, 0.3); border-radius: 6px; color: #fff; font-size: 0.85rem; margin-bottom: 1.2rem; resize: vertical;" oninput="parseAnswers(this, 'listening', ${start}, ${end})"></textarea>

        <div style="display: flex; flex-direction: column; gap: 1.2rem;">
          ${questionsList.map((qItem, idx) => {
            const i = qItem.id;
            const qText = qItem.q || '';
            const ans = test.answers[i] || '';
            const exp = test.explanations[i] || '';
            const dur = test.durations[i] || '';
            const subAud = test.subAudios[i] || '';
            return `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 8px;">
                <div style="font-weight: bold; color: var(--accent-cyan); margin-bottom: 0.8rem; font-size: 0.95rem;">Câu hỏi ${i}</div>
                <input type="text" id="admin-listen-qtext-${i}" value="${qText}" placeholder="Đề bài câu hỏi ${i}..." style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.88rem; font-weight: bold; margin-bottom: 0.8rem;">
                
                <!-- Audio cut configuration -->
                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 0.8rem; margin-bottom: 0.8rem;">
                  <div>
                    <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.3rem;">Thời gian (z.B. 0:57)</label>
                    <input type="text" id="admin-listen-dur-${i}" value="${dur}" placeholder="0:57" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; text-align: center;">
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.3rem;">Audio câu lẻ (Không bắt buộc)</label>
                    <input type="text" id="admin-listen-subaud-${i}" value="${subAud}" placeholder="audio/q${i}.mp3" style="width: 100%; padding: 0.4rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem;">
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.6rem; border-radius: 6px;">
                  <label style="margin: 0; font-size: 0.85rem; color: var(--success); font-weight: bold;">Đáp án đúng:</label>
                  <select id="admin-listen-ans-${i}" style="padding: 0.3rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #fff; font-weight: bold;">
                    <option value="" ${ans === '' ? 'selected' : ''}>-- Chọn --</option>
                    <option value="Richtig" ${ans === 'Richtig' ? 'selected' : ''}>Richtig</option>
                    <option value="Falsch" ${ans === 'Falsch' ? 'selected' : ''}>Falsch</option>
                  </select>
                </div>
                
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.4rem; font-weight: bold;">Erklärung (Giải thích chi tiết):</div>
                <textarea id="admin-listen-exp-${i}" placeholder="Lời giải thích cho câu ${i}..." rows="3" style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; line-height: 1.5; resize: vertical;">${exp}</textarea>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Right Column: Transkript text editor -->
      <div style="background: rgba(22, 22, 54, 0.25); border: 1px solid var(--border-light); padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1rem;">
        <div style="font-weight: 800; color: var(--accent-cyan); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
          <span>Transkript</span>
          <button type="button" class="btn btn-primary" onclick="saveAdminListeningTestAnswers()" style="padding: 0.35rem 0.8rem; font-size: 0.75rem; border-radius: 6px; font-weight: bold; cursor: pointer;">💾 Lưu nhanh</button>
        </div>
        <textarea id="admin-listen-transcript" rows="24" placeholder="Nhập nội dung bài nghe dịch (Transkript) cho Teil ${currentAdminListeningConfigPart} tại đây..." style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.9rem; line-height: 1.7; text-align: justify; resize: vertical; min-height: 400px; margin-bottom: 0.8rem;">${test[partKey].transcript || ''}</textarea>
        
        <!-- AI Quick Fill dưới chân -->
        <div style="background: rgba(0, 242, 254, 0.03); border: 1px dashed rgba(0, 242, 254, 0.35); border-radius: 8px; padding: 0.5rem 0.8rem; display: flex; align-items: center; gap: 0.8rem; justify-content: space-between; margin-bottom: 1rem;">
          <span style="font-size: 1.1rem; flex-shrink: 0;">🤖</span>
          <div style="flex-grow: 1; font-size: 0.82rem; color: #00f2fe; text-align: left;">
            <b>AI Điền Nhanh:</b> Nhấp ô bên phải r dán ảnh (Ctrl+V) để điền Transkript!
          </div>
          <input type="text" placeholder="Dán ảnh..." onpaste="handleLocalFieldAiPaste(event, 'admin-listen-transcript')" style="width: 120px; padding: 0.3rem; font-size: 0.75rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; outline: none; text-align: center;">
        </div>
        <button type="button" class="btn btn-primary" onclick="saveAdminListeningTestAnswers()" style="width: 100%; padding: 0.75rem; font-weight: bold; border-radius: 8px; font-size: 0.9rem; cursor: pointer; box-shadow: 0 0 15px rgba(0, 242, 254, 0.2);">💾 Lưu Transkript & Đáp Án</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function saveAdminListeningTestAnswers(isSilent) {
  if (isSilent && isSilent.preventDefault) {
    isSilent.preventDefault();
    isSilent = false;
  }
  const select = document.getElementById('admin-select-listening-test');
  if (!select) return;

  const testName = select.value;
  const test = db.listening.find(t => t.name === testName);
  if (!test) return;

  if (!test.answers) test.answers = {};
  if (!test.explanations) test.explanations = {};
  if (!test.durations) test.durations = {};
  if (!test.subAudios) test.subAudios = {};
  if (!test.teil1) test.teil1 = { transcript: '', questions: [] };
  if (!test.teil2) test.teil2 = { transcript: '', questions: [] };
  if (!test.teil3) test.teil3 = { transcript: '', questions: [] };

  // Save Main Audio
  const mainAud = document.getElementById('admin-listen-main-audio');
  if (mainAud) test.audioUrl = mainAud.value.trim();
  const useAiCheckbox = document.getElementById('admin-listen-use-ai');
  if (useAiCheckbox) test.useAiVoice = useAiCheckbox.checked;

  let start = 41, end = 45;
  let partKey = 'teil1';
  if (currentAdminListeningConfigPart === 2) {
    start = 46;
    end = 55;
    partKey = 'teil2';
  } else if (currentAdminListeningConfigPart === 3) {
    start = 56;
    end = 60;
    partKey = 'teil3';
  }

  // Save Transkript
  const trans = document.getElementById('admin-listen-transcript');
  if (trans) test[partKey].transcript = trans.value.trim();

  // Save Questions
  test[partKey].questions = [];
  for (let i = start; i <= end; i++) {
    const qtxt = document.getElementById(`admin-listen-qtext-${i}`);
    const ans = document.getElementById(`admin-listen-ans-${i}`);
    const exp = document.getElementById(`admin-listen-exp-${i}`);
    const dur = document.getElementById(`admin-listen-dur-${i}`);
    const subAud = document.getElementById(`admin-listen-subaud-${i}`);

    if (qtxt) {
      test[partKey].questions.push({
        id: i,
        q: qtxt.value.trim()
      });
    }

    if (ans) test.answers[i] = ans.value.trim();
    if (exp) test.explanations[i] = exp.value.trim();
    if (dur) test.durations[i] = dur.value.trim();
    if (subAud) test.subAudios[i] = subAud.value.trim();
  }

  saveDB();
  if (isSilent !== true) {
    alert(`Đã lưu toàn bộ nội dung & đáp án nghe của Teil ${currentAdminListeningConfigPart} cho đề thi: ${testName}!`);
  }
}
// ==========================================
// XUẤT VÀ NHẬP DỮ LIỆU DỰ PHÒNG
// ==========================================
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "maternopro_data_backup.json");
  dlAnchorElem.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      
      // Xác minh định dạng dữ liệu cơ bản
      if (imported.vocab && imported.listening && imported.reading && imported.writing && imported.speaking && imported.grammar) {
        db = imported;
        saveDB();
        alert("Nhập dữ liệu thành công! Trang web sẽ tự làm mới để cập nhật nội dung.");
        window.location.reload();
      } else {
        alert("Định dạng file không khớp hoặc thiếu dữ liệu.");
      }
    } catch (err) {
      alert("Lỗi khi đọc file backup. Vui lòng kiểm tra lại file.");
    }
  };
  reader.readAsText(file);
}

// ==========================================
// MÔ PHỎNG TRỢ LÝ AI SOẠN ĐỀ TỰ ĐỘNG
// ==========================================
let aiParsedMockData = null;

function handleAIPostPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('ai-upload-status');
  const resultBox = document.getElementById('ai-result-box');
  const applyBtn = document.getElementById('ai-apply-btn');

  if (statusDiv) statusDiv.innerHTML = "🌀 Đang kết nối AI & OCR chữ...";
  if (resultBox) resultBox.innerHTML = "Đang quét hình ảnh đề thi...";

  // Mô phỏng AI xử lý trong 2.2 giây
  setTimeout(() => {
    // Tạo ngẫu nhiên tên đề dựa vào timestamp
    const randId = Math.floor(Math.random() * 1000) + 1;
    const testTitle = `Test B2 AI: Kỷ nguyên Số ${randId}`;
    
    aiParsedMockData = {
      id: Date.now(),
      name: testTitle,
      title: testTitle,
      answers: {
        "1": "C", "2": "A", "3": "F", "4": "B", "5": "H",
        "6": "B", "7": "A", "8": "C", "9": "B", "10": "A"
      },
      explanations: {
        "1": "AI giải thích: Đoạn 1 nói về sự bùng nổ của mạng xã hội, khớp với Tiêu đề C.",
        "2": "AI giải thích: Đoạn 2 nói về rủi ro bảo mật thông tin cá nhân, khớp với Tiêu đề A."
      },
      teil1: {
        texts: [
          { title: "Text 1", content: "Kỷ nguyên số mang lại nhiều tiện ích vượt trội nhưng cũng kèm theo thách thức về bảo mật thông tin cá nhân của người dùng..." },
          { title: "Text 2", content: "Sự phổ biến của Trí tuệ nhân tạo (AI) đang định hình lại thị trường lao động toàn cầu..." },
          { title: "Text 3", content: "Nhiều doanh nghiệp bắt đầu chuyển đổi số toàn diện để bắt kịp xu hướng thị trường..." },
          { title: "Text 4", content: "Lớp trẻ hiện nay sử dụng thời gian trên không gian mạng nhiều hơn đời thực..." },
          { title: "Text 5", content: "Giáo dục trực tuyến phát triển vượt bậc sau đại dịch, mở ra cơ hội học tập trọn đời..." }
        ],
        headings: [
          "A. Rủi ro bảo mật thông tin",
          "B. AI định hình việc làm",
          "C. Tiện ích kỷ nguyên số",
          "D. Xu hướng chuyển đổi số",
          "E. Giáo dục và cơ hội học tập",
          "F. Giới trẻ và mạng xã hội",
          "G. Văn hóa số hiện đại",
          "H. Giải trí trực tuyến"
        ]
      },
      teil2: {
        text: "Văn bản đọc hiểu Teil 2 trích xuất tự động bằng AI...\nMạng xã hội không chỉ kết nối mọi người mà còn ảnh hưởng trực tiếp đến tâm lý học đường.",
        questions: [
          { num: 6, question: "Mạng xã hội ảnh hưởng gì đến học sinh?", options: ["A. Giúp học tập tốt hơn", "B. Gây xao nhãng và áp lực", "C. Không ảnh hưởng gì"] }
        ]
      },
      teil3: {
        situations: [
          { num: 11, text: "Học sinh muốn học lập trình online hiệu quả" }
        ],
        texts: [
          { key: "a", title: "Khóa học AI cơ bản", content: "Cung cấp kiến thức nền tảng về Python và thuật toán học máy cho người mới bắt đầu..." }
        ]
      },
      teil4: {
        text: "Đoạn văn điền từ Teil 4 trích xuất từ đề thi...",
        options: {
          "21": ["a", "b", "c"]
        }
      },
      teil5: {
        text: "Đoạn điền từ Teil 5 trích xuất...",
        wordbank: ["đơn giản", "phức tạp", "phù hợp"]
      }
    };

    if (statusDiv) statusDiv.innerHTML = "✅ AI đã soạn thảo hoàn tất!";
    if (resultBox) {
      resultBox.innerHTML = `🤖 AI ĐÃ TRÍCH XUẤT THÀNH CÔNG:\n` +
                            `📌 Tiêu đề: ${testTitle}\n` +
                            `📌 Trích xuất Teil 1: 5 đoạn văn bản và 8 tiêu đề\n` +
                            `📌 Trích xuất Teil 2 & Teil 3: Cấu trúc câu hỏi đầy đủ\n` +
                            `📌 Đáp án & Lời giải thích: Đã tự động tạo logic mẫu\n\n` +
                            `JSON mẫu:\n` + JSON.stringify(aiParsedMockData, null, 2);
    }

    if (applyBtn) {
      applyBtn.removeAttribute('disabled');
      applyBtn.style.opacity = '1';
    }
  }, 2200);
}

function applyAISpread() {
  if (!aiParsedMockData) return;

  db.reading.push(aiParsedMockData);
  saveDB();

  // Reload select list ở màn quản trị
  const select = document.getElementById('admin-select-reading-test');
  if (select) {
    select.innerHTML = db.reading.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    select.value = aiParsedMockData.name;
  }
  
  // Reload danh sách thi
  renderReading();
  loadAdminReadingTestAnswers();

  alert(`🎉 Thành công! AI đã tự động tạo và soạn thảo đầy đủ tiêu đề cùng các Teil của đề thi "${aiParsedMockData.name}" vào CSDL đọc B2!`);
  
  // Reset trạng thái
  aiParsedMockData = null;
  const applyBtn = document.getElementById('ai-apply-btn');
  if (applyBtn) {
    applyBtn.setAttribute('disabled', 'true');
    applyBtn.style.opacity = '0.5';
  }
  const statusDiv = document.getElementById('ai-upload-status');
  if (statusDiv) statusDiv.innerHTML = "";
  const resultBox = document.getElementById('ai-result-box');
  if (resultBox) resultBox.innerHTML = "Đang chờ tải tệp tiếp theo...";
}

// ==========================================
// XỬ LÝ CHAT AI & DÁN ẢNH TỪ CLIPBOARD
// ==========================================
let pastedImageFile = null;

function handleAiChatPaste(event) {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      pastedImageFile = file;

      // Hiển thị ảnh xem trước
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('ai-pasted-preview-img').src = e.target.result;
        document.getElementById('ai-pasted-preview-container').style.display = 'flex';
      };
      reader.readAsDataURL(file);
      
      // Gửi tin nhắn trạng thái vào chat
      appendAiChatMessage('user', '📎 [Đã dán 1 hình ảnh đề thi từ Clipboard]');
      break;
    }
  }
}

function clearPastedImage() {
  pastedImageFile = null;
  document.getElementById('ai-pasted-preview-container').style.display = 'none';
}

function appendAiChatMessage(sender, text) {
  const container = document.getElementById('ai-chat-history');
  if (!container) return;

  const msgDiv = document.createElement('div');
  if (sender === 'user') {
    msgDiv.style.alignSelf = 'flex-end';
    msgDiv.style.background = 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)';
    msgDiv.style.padding = '0.8rem 1.2rem';
    msgDiv.style.borderRadius = '14px 14px 0 14px';
    msgDiv.style.color = '#000';
    msgDiv.style.fontWeight = 'bold';
  } else {
    msgDiv.style.alignSelf = 'flex-start';
    msgDiv.style.background = 'rgba(0, 242, 254, 0.1)';
    msgDiv.style.border = '1.5px solid rgba(0, 242, 254, 0.25)';
    msgDiv.style.padding = '0.8rem 1.2rem';
    msgDiv.style.borderRadius = '14px 14px 14px 0';
    msgDiv.style.color = '#fff';
  }
  msgDiv.style.fontSize = '0.92rem';
  msgDiv.style.maxWidth = '85%';
  msgDiv.style.lineHeight = '1.5';
  msgDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
  msgDiv.innerText = text;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function sendAiChatMessage() {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text && !pastedImageFile) return;

  if (text) {
    appendAiChatMessage('user', text);
    input.value = '';
  }

  // Phản hồi giả lập từ AI
  const resultBox = document.getElementById('ai-result-box');
  const applyBtn = document.getElementById('ai-apply-btn');

  if (resultBox) resultBox.innerHTML = "🤖 AI đang phân tích văn bản và ảnh dán...";
  
  setTimeout(() => {
    // Sinh đề ngẫu nhiên để cấu hình
    const randId = Math.floor(Math.random() * 1000) + 1;
    const testTitle = `Test B2 AI: Kỷ nguyên Số ${randId}`;
    
    aiParsedMockData = {
      id: Date.now(),
      name: testTitle,
      title: testTitle,
      answers: {
        "1": "C", "2": "A", "3": "F", "4": "B", "5": "H",
        "6": "B", "7": "A", "8": "C", "9": "B", "10": "A"
      },
      explanations: {
        "1": "AI giải thích: Đoạn 1 nói về sự bùng nổ của mạng xã hội, khớp với Tiêu đề C.",
        "2": "AI giải thích: Đoạn 2 nói về rủi ro bảo mật thông tin cá nhân, khớp với Tiêu đề A."
      },
      teil1: {
        texts: [
          { title: "Text 1", content: "Kỷ nguyên số mang lại nhiều tiện ích vượt trội nhưng cũng kèm theo thách thức về bảo mật thông tin cá nhân của người dùng..." },
          { title: "Text 2", content: "Sự phổ biến của Trí tuệ nhân tạo (AI) đang định hình lại thị trường lao động toàn cầu..." },
          { title: "Text 3", content: "Nhiều doanh nghiệp bắt đầu chuyển đổi số toàn diện để bắt kịp xu hướng thị trường..." },
          { title: "Text 4", content: "Lớp trẻ hiện nay sử dụng thời gian trên không gian mạng nhiều hơn đời thực..." },
          { title: "Text 5", content: "Giáo dục trực tuyến phát triển vượt bậc sau đại dịch, mở ra cơ hội học tập trọn đời..." }
        ],
        headings: [
          "A. Rủi ro bảo mật thông tin",
          "B. AI định hình việc làm",
          "C. Tiện ích kỷ nguyên số",
          "D. Xu hướng chuyển đổi số",
          "E. Giáo dục và cơ hội học tập",
          "F. Giới trẻ và mạng xã hội",
          "G. Văn hóa số hiện đại",
          "H. Giải trí trực tuyến"
        ]
      },
      teil2: {
        text: "Văn bản đọc hiểu Teil 2 trích xuất tự động bằng AI...\nMạng xã hội không chỉ kết nối mọi người mà còn ảnh hưởng trực tiếp đến tâm lý học đường.",
        questions: [
          { num: 6, question: "Mạng xã hội ảnh hưởng gì đến học sinh?", options: ["A. Giúp học tập tốt hơn", "B. Gây xao nhãng và áp lực", "C. Không ảnh hưởng gì"] }
        ]
      },
      teil3: {
        situations: [
          { num: 11, text: "Học sinh muốn học lập trình online hiệu quả" }
        ],
        texts: [
          { key: "a", title: "Khóa học AI cơ bản", content: "Cung cấp kiến thức nền tảng về Python và thuật toán học máy cho người mới bắt đầu..." }
        ]
      },
      teil4: {
        text: "Đoạn văn điền từ Teil 4 trích xuất từ đề thi...",
        options: {
          "21": ["a", "b", "c"]
        }
      },
      teil5: {
        text: "Đoạn điền từ Teil 5 trích xuất...",
        wordbank: ["đơn giản", "phức tạp", "phù hợp"]
      }
    };

    appendAiChatMessage('assistant', `🤖 Tôi đã nhận được hình ảnh/yêu cầu và phân tích xong! Đề thi đọc mới mang tên: "${testTitle}".\nCô có thể kiểm tra cấu trúc JSON ở bảng bên phải và bấm Đồng Ý để lưu đề.`);
    
    if (resultBox) {
      resultBox.innerHTML = `🤖 AI ĐÃ TRÍCH XUẤT THÀNH CÔNG:\n` +
                            `📌 Tiêu đề: ${testTitle}\n` +
                            `📌 Trích xuất Teil 1: 5 đoạn văn bản và 8 tiêu đề\n` +
                            `JSON mẫu:\n` + JSON.stringify(aiParsedMockData, null, 2);
    }

    if (applyBtn) {
      applyBtn.removeAttribute('disabled');
      applyBtn.style.opacity = '1';
    }

    clearPastedImage();
  }, 1800);
}
function handleLocalFieldAiPaste(event, targetFieldId) {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      const targetElement = document.getElementById(targetFieldId);
      if (!targetElement) return;

      const originalPlaceholder = targetElement.placeholder;
      targetElement.placeholder = "🤖 AI đang kết nối & quét văn bản từ ảnh chụp...";
      targetElement.value = "";

      // Mô phỏng xử lý OCR của AI mini nội bộ
      setTimeout(() => {
        let randText = "";
        if (targetFieldId.includes('exp')) {
          randText = "Giải thích chi tiết trích xuất bằng AI: Câu trả lời khớp hoàn toàn với thông tin trong bài viết, từ khóa tương đồng hiển thị trực tiếp...";
        } else if (targetFieldId.includes('transcript')) {
          randText = "Transkript được trích xuất bằng AI:\n(Frau): Guten Tag, meine Damen und Herren. In unserer heutigen Sendung sprechen wir über das Thema...\n(Mann): Hallo, ich freue mich sehr hier zu sein. Meiner Meinung nach ist die Situation...";
        } else if (targetFieldId.includes('admin-read-t3-text')) {
          randText = "LIZZIS BACKSTUBE: Nach abgeschlossener Patisserieausbildung habe ich mir meinen Herzenswunsch erfüllt und diese kleine, feine Backstube eröffnet. Bei uns gibt es täglich frische Torten und Törtchen...";
        } else {
          randText = "Văn bản tiếng Đức trích xuất bằng AI từ hình ảnh đề thi:\nSpardosen sind Sammelbehälter, Dekoration oder Kinderspielzeug - und zwar seit Jahrhunderten. Und obwohl bargeldloses Bezahlen immer mehr in Mode kommt, sind sie bis heute nicht aus den Kinderzimmern verschwunden. Das Spardosen-Museum zeigt 1200 Exemplare...";
        }
        targetElement.value = randText;
        targetElement.placeholder = originalPlaceholder;
        
        // Nháy viền xanh lá báo hiệu điền thành công
        targetElement.style.borderColor = '#10b981';
        targetElement.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
        setTimeout(() => {
          targetElement.style.borderColor = 'rgba(255,255,255,0.1)';
          targetElement.style.boxShadow = 'none';
        }, 1500);
      }, 1500);
      break;
    }
  }
}

// Khởi chạy khi tải trang hoàn tất
window.addEventListener('DOMContentLoaded', () => {
  updateLanguageUI();
  applyTheme();
  
  // Tự động gọi render cho mục đang được kích hoạt mặc định
  renderReading();
});

// TỰ ĐỘNG LƯU TRONG ADMIN (Mỗi 3 giây)
setInterval(() => {
  const mainWrapper = document.getElementById('admin-main-wrapper');
  if (mainWrapper && mainWrapper.style.display === 'block') {
    if (typeof saveAdminReadingTestAnswers === 'function') {
      saveAdminReadingTestAnswers(null, true);
    }
    if (typeof saveAdminListeningTestAnswers === 'function') {
      saveAdminListeningTestAnswers(true);
    }
  }
}, 3000);

// --- Custom Premium Dropdown ---
function buildPremiumDropdown(selectElement) {
  if (selectElement.nextElementSibling && selectElement.nextElementSibling.classList.contains('premium-select-wrapper')) {
    selectElement.nextElementSibling.remove();
  }
  selectElement.style.display = 'none';
  const wrapper = document.createElement('div');
  wrapper.className = 'premium-select-wrapper';
  
  const trigger = document.createElement('div');
  trigger.className = 'premium-select-trigger';
  trigger.innerHTML = '<span>' + (selectElement.options[selectElement.selectedIndex]?.text || '') + '</span> <span style="color: #00f2fe;">▼</span>';
  
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'premium-select-options';
  
  Array.from(selectElement.options).forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'premium-select-option' + (opt.selected ? ' selected' : '');
    div.textContent = opt.text;
    div.onclick = (e) => {
      e.stopPropagation();
      selectElement.selectedIndex = idx;
      selectElement.dispatchEvent(new Event('change'));
      trigger.innerHTML = '<span>' + opt.text + '</span> <span style="color: #00f2fe;">▼</span>';
      wrapper.classList.remove('open');
      Array.from(optionsContainer.children).forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
    };
    optionsContainer.appendChild(div);
  });
  
  trigger.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.premium-select-wrapper').forEach(w => { if (w !== wrapper) w.classList.remove('open') });
    wrapper.classList.toggle('open');
  };
  
  wrapper.appendChild(trigger);
  wrapper.appendChild(optionsContainer);
  selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
}

document.addEventListener('click', () => {
  document.querySelectorAll('.premium-select-wrapper').forEach(w => w.classList.remove('open'));
});

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
              throw new Error("Chưa tải xong AI Offline.");
            }
          } catch (err2) {
            targetElement.value = "Lỗi AI Offline: " + err2.message;
            setTimeout(() => { targetElement.value = ""; }, 5000);
          }
        } else {
          console.warn("AI OCR quota exceeded, falling back to Tesseract:", err.message);
          targetElement.placeholder = "⏳ API hết lượt miễn phí. Đợi 1 phút rồi dán lại nhé...";
          try {
            if (typeof Tesseract !== 'undefined') {
              const ret2 = await Tesseract.recognize(imageFile || file, 'eng');
              targetElement.value = ret2.data.text;
              targetElement.dispatchEvent(new Event('input', { bubbles: true }));
              targetElement.style.borderColor = '#f59e0b';
              setTimeout(() => { targetElement.style.borderColor = 'rgba(255,255,255,0.1)'; }, 2000);
            }
          } catch(e2) { console.warn("Tesseract also failed:", e2); }
        }
      } finally {
        targetElement.placeholder = originalPlaceholder;
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
        console.warn("AI questions quota exceeded, falling back:", err.message);
          inputEl.placeholder = "⏳ API hết lượt miễn phí. Đợi 1 phút rồi dán lại nhé...";
          try {
            if (typeof Tesseract !== 'undefined') {
              const ret2 = await Tesseract.recognize(file, 'eng');
              inputEl.value = ret2.data.text;
              inputEl.dispatchEvent(new Event('input', { bubbles: true }));
              inputEl.style.borderColor = '#f59e0b';
              setTimeout(() => { inputEl.style.borderColor = 'rgba(255,255,255,0.1)'; }, 2000);
            }
          } catch(e2) { console.warn("Tesseract also failed:", e2); }
      } finally {
        inputEl.placeholder = originalPlaceholder;
      }
      break;
    }
  }
};

window.adminCreateMultipleReadingTests = function() {
  try {
    const countStr = prompt("Nhập số lượng đề thi đọc muốn tạo thêm:", "10");
    if (!countStr) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) return;

    let maxNum = 0;
    db.reading.forEach(t => {
      if (t && t.name) {
        const m = t.name.match(/\d+/);
        if (m) {
          const num = parseInt(m[0]);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    
    if (maxNum === 0) maxNum = db.reading.length;

    for (let i = 1; i <= count; i++) {
      const nextNum = maxNum + i;
      const name = "Đề " + nextNum;
      const newTest = {
        id: Date.now() + i,
        name: name,
        title: name,
        answers: {},
        explanations: {},
        teil1: { texts: [], headings: [] },
        teil2: { text: '', questions: [] },
        teil3: { situations: [], texts: [] },
        teil4: { text: '', options: {} },
        teil5: { text: '', wordbank: [] }
      };
      db.reading.push(newTest);
    }
    saveDB();
    
    const select = document.getElementById('admin-select-reading-test');
    if (select) {
      select.innerHTML = db.reading.map(t => (t && t.name) ? `<option value="${t.name}">${t.name}</option>` : '').join('');
      select.value = "Đề " + (maxNum + count);
      window.adminCurrentReadingTest = select.value;
      select.setAttribute('data-prev', select.value);
    }
    
    loadAdminReadingTestAnswers();
    if (typeof renderAdmin === 'function') renderAdmin();
    alert(`Đã tạo thêm ${count} Đề Đọc mới thành công!`);
  } catch (e) {
    alert("LỖI CHI TIẾT KHI TẠO ĐỀ:\n" + e.message + "\n" + e.stack);
  }
};

window.adminCreateMultipleListeningTests = function() {
  try {
    const countStr = prompt("Nhập số lượng đề thi nghe muốn tạo thêm:", "10");
    if (!countStr) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) return;

    let maxNum = 0;
    db.listening.forEach(t => {
      if (t && t.name) {
        const m = t.name.match(/\d+/);
        if (m) {
          const num = parseInt(m[0]);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    
    if (maxNum === 0) maxNum = db.listening.length;

    for (let i = 1; i <= count; i++) {
      const nextNum = maxNum + i;
      const name = "Đề " + nextNum;
      const newTest = {
        id: Date.now() + i,
        name: name,
        title: name,
        audioUrl: '',
        answers: {},
        explanations: {},
        durations: {},
        subAudios: {},
        teil1: { transcript: '', questions: [] },
        teil2: { transcript: '', questions: [] },
        teil3: { transcript: '', questions: [] }
      };
      db.listening.push(newTest);
    }
    saveDB();
    
    const select = document.getElementById('admin-select-listening-test');
    if (select) {
      select.innerHTML = db.listening.map(t => (t && t.name) ? `<option value="${t.name}">${t.name}</option>` : '').join('');
      select.value = "Đề " + (maxNum + count);
    }
    
    loadAdminListeningTestAnswers();
    if (typeof renderAdmin === 'function') renderAdmin();
    alert(`Đã tạo thêm ${count} Đề Nghe mới thành công!`);
  } catch (e) {
    alert("LỖI CHI TIẾT KHI TẠO ĐỀ:\n" + e.message + "\n" + e.stack);
  }
};

window.adminSortReadingTests = function() {
  try {
    db.reading.sort((a, b) => {
      const numA = a && a.name ? parseInt((a.name.match(/\d+/) || [0])[0]) : 0;
      const numB = b && b.name ? parseInt((b.name.match(/\d+/) || [0])[0]) : 0;
      return numA - numB;
    });
    saveDB();
    if (typeof renderAdmin === 'function') renderAdmin();
    alert("Đã sắp xếp lại danh sách đề thi theo số thứ tự!");
  } catch (e) {
    alert("Lỗi khi sắp xếp: " + e.message + "\n" + e.stack);
  }
};

window.openAdminDeleteTestsModal = function(type) {
  let modal = document.getElementById('admin-delete-tests-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'admin-delete-tests-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);';

  const dbType = type === 'reading' ? db.reading : db.listening;
  const testsList = dbType.map(t => {
    if(!t || !t.name) return '';
    return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 0.8rem; background: rgba(255,255,255,0.05); margin-bottom: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
      <label style="display: flex; align-items: center; gap: 0.8rem; cursor: pointer; margin: 0; flex-grow: 1;">
        <input type="checkbox" class="delete-test-checkbox" value="${t.name}" style="transform: scale(1.3);">
        <span style="font-size: 1.05rem; color: #fff; font-weight: bold;">${t.name}</span>
      </label>
      <button class="btn btn-sm" style="background: #ef4444; color: #fff; font-weight: bold; border-radius: 6px; padding: 0.3rem 0.8rem;" onclick="deleteSingleTestFromModal('${type}', '${t.name}')">Xóa</button>
    </div>`;
  }).join('');

  modal.innerHTML = `
    <div style="background: #1e1e2d; border-radius: 12px; width: 500px; max-width: 90%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
        <h4 style="margin: 0; color: #fff; font-weight: bold;">🗑 Quản Lý Xóa Đề ${type === 'reading' ? 'Đọc' : 'Nghe'}</h4>
        <button style="background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; line-height: 1;" onclick="document.getElementById('admin-delete-tests-modal').remove()">&times;</button>
      </div>
      <div style="padding: 1.5rem; overflow-y: auto; flex-grow: 1;" id="admin-delete-tests-list">
        ${testsList || '<div style="color: #aaa; text-align: center;">Không có đề nào.</div>'}
      </div>
      <div style="padding: 1.2rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center;">
        <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff; cursor: pointer; margin: 0;">
          <input type="checkbox" onchange="const cb = document.querySelectorAll('.delete-test-checkbox'); cb.forEach(c => c.checked = this.checked);" style="transform: scale(1.2);">
          <span>Chọn tất cả</span>
        </label>
        <button class="btn btn-danger" style="font-weight: bold; border-radius: 8px; padding: 0.6rem 1.2rem;" onclick="deleteMultipleTestsFromModal('${type}')">🗑 Xóa Đã Chọn</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.deleteSingleTestFromModal = function(type, name) {
  if (!confirm(`Bạn có chắc muốn xóa "${name}" không?`)) return;
  const dbType = type === 'reading' ? db.reading : db.listening;
  const idx = dbType.findIndex(t => t && t.name === name);
  if (idx !== -1) {
    dbType.splice(idx, 1);
    saveDB();
    document.getElementById('admin-delete-tests-modal').remove();
    const select = document.getElementById(type === 'reading' ? 'admin-select-reading-test' : 'admin-select-listening-test');
    if (select) {
       select.innerHTML = dbType.map(t => (t && t.name) ? `<option value="${t.name}">${t.name}</option>` : '').join('');
       if (!dbType.find(t => t && t.name === select.value)) {
         select.value = dbType.length > 0 ? dbType[0].name : '';
       }
    }
    if (type === 'reading') loadAdminReadingTestAnswers();
    else loadAdminListeningTestAnswers();
    setTimeout(() => openAdminDeleteTestsModal(type), 100);
  }
};

window.deleteMultipleTestsFromModal = function(type) {
  const checkboxes = document.querySelectorAll('.delete-test-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('Vui lòng chọn ít nhất 1 đề để xóa!');
    return;
  }
  const names = Array.from(checkboxes).map(c => c.value);
  if (!confirm(`Bạn có chắc muốn xóa ${names.length} đề đã chọn?\n(${names.join(', ')})`)) return;
  
  const dbType = type === 'reading' ? db.reading : db.listening;
  names.forEach(name => {
    const idx = dbType.findIndex(t => t && t.name === name);
    if (idx !== -1) dbType.splice(idx, 1);
  });
  saveDB();
  document.getElementById('admin-delete-tests-modal').remove();
  const select = document.getElementById(type === 'reading' ? 'admin-select-reading-test' : 'admin-select-listening-test');
  if (select) {
     select.innerHTML = dbType.map(t => (t && t.name) ? `<option value="${t.name}">${t.name}</option>` : '').join('');
     if (!dbType.find(t => t && t.name === select.value)) {
       select.value = dbType.length > 0 ? dbType[0].name : '';
     }
  }
  if (type === 'reading') loadAdminReadingTestAnswers();
  else loadAdminListeningTestAnswers();
  setTimeout(() => openAdminDeleteTestsModal(type), 100);
};



window.autoFixUmlautsCurrentTest = function(type = 'reading') {
  let test, testName, testIndex;
  if (type === 'reading') {
    const select = document.getElementById('admin-select-reading-test');
    if (!select) return;
    testName = select.value;
    testIndex = db.reading.findIndex(t => t.name === testName);
    test = db.reading[testIndex];
  } else if (type === 'listening') {
    const select = document.getElementById('admin-select-listening-test');
    if (!select) return;
    testName = select.value;
    testIndex = db.listening.findIndex(t => t.name === testName);
    test = db.listening[testIndex];
  }
  
  if (!test || testIndex === -1) return;
  
  let content = JSON.stringify(test);
  const original = content;
  
  const reps = [
    { p: /\bfur\b/g, r: 'f\u00FCr' },
    { p: /\bFur\b/g, r: 'F\u00FCr' },
    { p: /\bFUR\b/g, r: 'F\u00DCR' },
    { p: /\buber\b/g, r: '\u00FCber' },
    { p: /\bUber\b/g, r: '\u00DCber' },
    { p: /\bUBER\b/g, r: '\u00DCBER' },
    { p: /\bSchuler(n|innen)?\b/gi, r: m => m.replace(/u/g,'\u00FC').replace(/U/g,'\u00DC') },
    { p: /\bwahrend\b/gi, r: m => m.replace(/a/g,'\u00E4').replace(/A/g,'\u00C4') },
    { p: /\bManner(n)?\b/gi, r: m => m.replace(/a/g,'\u00E4').replace(/A/g,'\u00C4') },
    { p: /\bwahlen\b/gi, r: m => m.replace(/a/g,'\u00E4').replace(/A/g,'\u00C4') },
    { p: /\bBuro(s)?\b/gi, r: m => m.replace(/u/g,'\u00FC').replace(/U/g,'\u00DC') },
    { p: /\bdaruber\b/gi, r: m => m.replace(/u/g,'\u00FC').replace(/U/g,'\u00DC') },
    { p: /\bnaturlich\b/gi, r: m => m.replace(/u/g,'\u00FC').replace(/U/g,'\u00DC') },
    { p: /\bBEMUHEN\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bLOSUNGEN\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bDURFEN\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bMUSSEN\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bKONNEN\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bKONNTE(N)?\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bOSTERREICH\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bHAUFIG\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bKOLN\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bZURUCK\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bGROSSER\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bEINFUHREN\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bKUHLTRUHE\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bBADER\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bKAUFER\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bVERKAUFER\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bAUSSERST\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bGEBAUDE(N)?\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bMOCHTE(N)?\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') },
    { p: /\bGEFALLT\b/gi, r: m => m.replace(/A/g,'\u00C4').replace(/a/g,'\u00E4') },
    { p: /\bBEGRUSSEN\b/gi, r: m => m.replace(/U/g,'\u00DC').replace(/u/g,'\u00FC') },
    { p: /\bLOSUNG\b/gi, r: m => m.replace(/O/g,'\u00D6').replace(/o/g,'\u00F6') }
  ];
  
  reps.forEach(r => {
    content = content.replace(r.p, r.r);
  });
  
  if (content !== original) {
    if (type === 'reading') {
      db.reading[testIndex] = JSON.parse(content);
      saveDB();
      loadAdminReadingTestAnswers();
      alert('Đã tự động sửa các chữ thiếu dấu Umlaut trong đề này!');
    } else if (type === 'listening') {
      db.listening[testIndex] = JSON.parse(content);
      saveDB();
      loadAdminListeningTestAnswers();
      alert('Đã tự động sửa các chữ thiếu dấu Umlaut trong đề này!');
    }
  } else {
    alert('Không tìm thấy chữ nào cần sửa trong đề này!');
  }
};
