/* ==========================================
   VÒNG QUAY MAY MẮN - APPLICATION LOGIC
========================================== */

// 1. Theme and Color Preset Constants
const COLOR_THEMES = {
  default: {
    colors: ["#3369e8", "#d50f25", "#EEB211", "#009925"],
    textColor: "#ffffff",
    centerColor: "#ffffff",
    borderColor: "#e2e8f0"
  },
  kid: {
    colors: ["#ff7b90", "#fbc02d", "#4db6ac", "#ff9800", "#e040fb", "#26a69a"],
    textColor: "#ffffff",
    centerColor: "#ffffff",
    borderColor: "#e2e8f0"
  },
  luxury: {
    colors: ["#111827", "#d4af37", "#374151", "#9ca3af"],
    textColor: "#f8fafc",
    centerColor: "#d4af37",
    borderColor: "#1e293b"
  },
  tet: {
    colors: ["#d50f25", "#EEB211", "#009925", "#e53935", "#fbc02d"],
    textColor: "#ffffff",
    centerColor: "#ffffff",
    borderColor: "#f87171"
  },
  pastel: {
    colors: ["#fbc4ab", "#e8dbfc", "#fcf6bd", "#d6f2f2", "#ffccd5", "#cbf3f0"],
    textColor: "#334155",
    centerColor: "#ffffff",
    borderColor: "#cbd5e1"
  }
};

const STATIC_SHORT_SAMPLES = [
  "Năm mới, Chúa mời gọi bạn siêng năng chạy đến với Người qua Bí Tích Hòa Giải và Thánh Lễ. Tải ứng dụng Giờ Cha Chờ tra cứu Giờ Lễ & Giờ Xưng Tội tại: https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative&hl=vi (Giờ Cha Chờ)",
  "Xin Chúa chúc lành, gìn giữ và ban bình an cho anh/chị trong năm mới. (Ds 6,24-26)",
  "Năm nay, anh/chị đừng lo thiếu thốn, vì Chúa là Đấng chăn dắt đời mình. (Tv 23,1)",
  "Xin Chúa bổ sức tâm hồn và dẫn anh/chị đi trên đường ngay lành. (Tv 23,3)",
  "Dù năm mới có điều chưa biết trước, anh/chị vẫn không đơn độc vì Chúa ở cùng. (Tv 23,4)",
  "Chúa là ánh sáng của đời anh/chị; xin năm mới không còn sợ hãi. (Tv 27,1)",
  "Xin Chúa ban sức mạnh và chúc lành bình an cho gia đình anh/chị. (Tv 29,11)",
  "Hãy vững lòng, vì Chúa sẽ làm cho trái tim anh/chị mạnh mẽ hơn. (Tv 31,25)",
  "Xin cho anh/chị cảm nhận được Chúa tốt lành trong từng ngày của năm mới. (Tv 34,9)",
  "Hãy vui trong Chúa, Người sẽ chăm sóc những ước nguyện đẹp trong lòng anh/chị. (Tv 37,4)",
  "Hãy phó thác đường đời cho Chúa, Người sẽ âm thầm mở lối cho anh/chị. (Tv 37,5)",
  "Khi lòng chao đảo, xin anh/chị nhớ rằng Chúa là nơi nương náu vững vàng. (Tv 46,2)",
  "Hãy trao những gánh nặng cũ cho Chúa, để bước vào năm mới nhẹ lòng hơn. (Tv 55,23)",
  "Xin Chúa đội triều thiên ân phúc cho năm mới của anh/chị. (Tv 65,12)",
  "Chúa chẳng từ chối điều tốt lành cho ai sống chân thành trước mặt Người. (Tv 84,12)",
  "Xin bình an của Chúa trở về trong lòng và trong mái nhà anh/chị. (Tv 85,9)",
  "Xin Chúa cho công việc tay anh/chị làm trong năm mới được vững bền. (Tv 90,17)",
  "Xin Chúa sai thiên thần gìn giữ anh/chị trên mọi nẻo đường năm nay. (Tv 91,11)",
  "Năm mới, xin anh/chị đừng quên bao ơn lành Chúa đã âm thầm ban. (Tv 103,2)",
  "Đây là ngày Chúa làm ra; xin anh/chị vui lên và bắt đầu lại trong hy vọng. (Tv 118,24)"
];

const DEFAULT_ENTRIES = [...STATIC_SHORT_SAMPLES];

// 2. SoundManager using Web Audio API
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security autoplay policies)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTick() {
    if (!this.enabled) return;
    this.initContext();
    
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      // Retro mechanical click: rapid decay, medium-high pitch triangle
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      console.warn("Lỗi phát âm thanh click:", e);
    }
  }

  playWinnerSound() {
    if (!this.enabled) return;
    this.initContext();

    try {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Triumphant chord progression)
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        
        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.4);
        
        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.5);
      });
    } catch (e) {
      console.warn("Lỗi phát nhạc chúc mừng:", e);
    }
  }
}

// 3. Confetti Animation Engine
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.colors = ["#ff7b90", "#fbc02d", "#4db6ac", "#ff9800", "#e040fb", "#26a69a", "#3369e8", "#d50f25"];
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn() {
    this.particles = [];
    this.active = true;
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height, // Spawn above screen
        r: Math.random() * 6 + 4,
        d: Math.random() * this.canvas.height,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 3 + 3
      });
    }
    this.animate();
  }

  stop() {
    this.active = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  animate() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let finished = true;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speedY;
      p.x += p.speedX;
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 12;

      if (p.y <= this.canvas.height + 20) {
        finished = false;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    }

    if (!finished) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.stop();
    }
  }
}

// 4. Main App Controller State
const state = {
  entries: [...DEFAULT_ENTRIES],
  results: [],
  settings: {
    title: "Lời Chúa Chúc Xuân",
    duration: 5,
    theme: "default",
    soundEnabled: true,
    confettiEnabled: true,
    removeWinner: false
  },
  parishConfig: {
    parishName: "Giáo xứ Châu Sơn",
    programName: "Chúc Xuân Đầu Năm 2026",
    description: "Xin Chúa chúc lành, chữa lành và mở ra một năm đầy bình an cho anh/chị và gia đình.",
    organizer: "Ban Truyền Thông"
  },
  currentAngle: 0,
  isSpinning: false,
  winnerIndex: -1,
  visualWinnerIndex: -1,
  activeTab: 'entries'
};

// Sound & Confetti Instances
const soundManager = new SoundManager();
let confettiEngine = null;

// DOM Element Selectors
const elements = {
  canvas: document.getElementById('wheel-canvas'),
  txtEntries: document.getElementById('txt-entries'),
  btnSpin: document.getElementById('btn-spin'),
  badgeEntries: document.getElementById('badge-entries-count'),
  badgeResults: document.getElementById('badge-results-count'),
  displayTitle: document.getElementById('display-title'),
  listResults: document.getElementById('list-results'),
  resultsEmpty: document.getElementById('results-empty'),
  
  // Tab Elements
  tabEntries: document.getElementById('tab-entries'),
  tabResults: document.getElementById('tab-results'),
  paneEntries: document.getElementById('content-entries'),
  paneResults: document.getElementById('content-results'),
  
  // Controls
  btnShuffle: document.getElementById('btn-shuffle'),
  btnSort: document.getElementById('btn-sort'),
  btnCustomize: document.getElementById('btn-customize'),
  btnNew: document.getElementById('btn-new'),
  btnShare: document.getElementById('btn-share'),
  btnFullscreen: document.getElementById('btn-fullscreen'),
  btnClearResults: document.getElementById('btn-clear-results'),
  btnLoadSample: document.getElementById('btn-load-sample'),
  btnClearEntries: document.getElementById('btn-clear-entries'),
  btnResetDefault: document.getElementById('btn-reset-default'),
  chkNoRepeat: document.getElementById('chk-no-repeat'),
  
  // Winner Modal
  winnerModal: document.getElementById('winner-modal'),
  winnerParishName: document.getElementById('winner-parish-name'),
  winnerProgramName: document.getElementById('winner-program-name'),
  winnerLabelDisplay: document.getElementById('winner-label-display'),
  winnerBlessing: document.getElementById('winner-blessing-display'),
  btnCopyBlessing: document.getElementById('btn-copy-blessing'),
  btnWinnerRemove: document.getElementById('btn-winner-remove'),
  btnWinnerSpinAgain: document.getElementById('btn-winner-spin-again'),
  btnWinnerClose: document.getElementById('btn-winner-close'),
  
  // Customize Modal
  customizeModal: document.getElementById('customize-modal'),
  btnCustomizeCloseX: document.getElementById('btn-customize-close-x'),
  btnCustomizeClose: document.getElementById('btn-customize-close'),
  btnCustomizeSave: document.getElementById('btn-customize-save'),
  inputTitle: document.getElementById('settings-title'),
  inputDuration: document.getElementById('settings-duration'),
  labelDuration: document.getElementById('label-duration-val'),
  selectTheme: document.getElementById('settings-theme'),
  chkSound: document.getElementById('settings-sound-enabled'),
  chkConfetti: document.getElementById('settings-confetti-enabled'),
  chkRemoveWinner: document.getElementById('settings-remove-winner'),
  
  // Utility Toast
  toast: document.getElementById('toast-notification')
};

// Context variable for canvas
let ctx = null;

// Initialize Webpage
function init() {
  ctx = elements.canvas.getContext('2d');
  confettiEngine = new ConfettiEngine(document.getElementById('confetti-canvas'));
  
  loadLocalStorage();
  parseUrlHash();
  
  // Đồng bộ cấu hình Giáo xứ ra các ô input nhập liệu
  if (document.getElementById('cfg-parish-name')) {
    document.getElementById('cfg-parish-name').value = state.parishConfig.parishName;
  }
  if (document.getElementById('cfg-program-name')) {
    document.getElementById('cfg-program-name').value = state.parishConfig.programName;
  }
  if (document.getElementById('cfg-description')) {
    document.getElementById('cfg-description').value = state.parishConfig.description;
  }
  if (document.getElementById('cfg-organizer')) {
    document.getElementById('cfg-organizer').value = state.parishConfig.organizer;
  }
  
  // Đồng bộ checkbox Không lặp lại
  if (elements.chkNoRepeat) {
    elements.chkNoRepeat.checked = state.settings.removeWinner;
  }
  
  // Bind standard layout states
  updateTextarea();
  updateUI();
  setupEventListeners();
  drawWheel();
}

// Load configurations and entries from localStorage
function loadLocalStorage() {
  let savedEntries = localStorage.getItem('parish-wheel-entries');
  if (savedEntries) {
    try {
      state.entries = JSON.parse(savedEntries);
    } catch(e) {
      state.entries = [...DEFAULT_ENTRIES];
    }
  } else {
    state.entries = [...DEFAULT_ENTRIES];
  }

  let savedResults = localStorage.getItem('parish-wheel-results');
  if (savedResults) {
    try {
      state.results = JSON.parse(savedResults);
    } catch(e) {}
  }

  let savedSettings = localStorage.getItem('parish-wheel-settings');
  if (savedSettings) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    } catch(e) {}
  }
  
  let savedConfig = localStorage.getItem('parish-wheel-config');
  if (savedConfig) {
    try {
      state.parishConfig = { ...state.parishConfig, ...JSON.parse(savedConfig) };
    } catch(e) {}
  }

  // Sync state to components
  soundManager.enabled = state.settings.soundEnabled;
}

// Save state to localStorage
function saveLocalStorage() {
  localStorage.setItem('parish-wheel-entries', JSON.stringify(state.entries));
  localStorage.setItem('parish-wheel-results', JSON.stringify(state.results));
  localStorage.setItem('parish-wheel-settings', JSON.stringify(state.settings));
  localStorage.setItem('parish-wheel-config', JSON.stringify(state.parishConfig));
}

// Parse URL Hash (Sharing system support)
function parseUrlHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#names=')) {
    const encodedNames = hash.slice(7);
    try {
      const decoded = decodeURIComponent(encodedNames);
      const namesList = decoded.split(',').map(n => n.trim()).filter(n => n.length > 0);
      if (namesList.length > 0) {
        state.entries = namesList;
        // Strip hash to clean url after loaded
        history.replaceState(null, "", window.location.pathname);
      }
    } catch(e) {
      console.warn("Lỗi phân tích URL hash:", e);
    }
  }
}

// Update UI badges, text and settings elements
function updateUI() {
  elements.displayTitle.textContent = state.settings.title || "Lời Chúa Chúc Xuân";
  elements.badgeEntries.textContent = state.entries.length;
  elements.badgeResults.textContent = state.results.length;

  // Synced results rendering
  renderResultsList();
}

// Synced Textarea content update
function updateTextarea() {
  elements.txtEntries.value = state.entries.join('\n');
}

// Render Results UI list (Lịch sử vòng quay lộc xuân)
function renderResultsList() {
  elements.listResults.innerHTML = '';
  
  if (state.results.length === 0) {
    elements.resultsEmpty.style.display = 'flex';
  } else {
    elements.resultsEmpty.style.display = 'none';
    
    state.results.forEach((res, index) => {
      const li = document.createElement('li');
      li.className = 'result-item';
      
      const blessingText = res.blessingText || 'Nguyện xin Thiên Chúa ban bình an và phúc lành cho quý vị.';
      
      // Escape single quotes in blessing text to prevent JS syntax error in onclick
      const safeBlessingTextForOnClick = escapeHTML(blessingText).replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const safeParishForOnClick = escapeHTML(res.parishName || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const safeProgramForOnClick = escapeHTML(res.programName || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
      
      li.innerHTML = `
        <div class="result-item-parish">${escapeHTML(res.parishName || "Giáo xứ Châu Sơn")}</div>
        <div class="result-item-program">${escapeHTML(res.programName || "Chúc Xuân")}</div>
        <div class="result-item-blessing-desc">Lời Chúa muốn gửi đến anh/chị:</div>
        <div class="result-item-blessing">
          <span>“${escapeHTML(blessingText)}”</span>
          <button class="btn-copy-history-blessing" title="Sao chép lời chúc" onclick="copyBlessingText('${safeParishForOnClick}', '${safeProgramForOnClick}', '${safeBlessingTextForOnClick}')">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
        <div class="result-item-footer">
          <span class="result-index">#${res.spinNumber || (state.results.length - index)}</span>
          <span class="result-time">Thời gian: ${res.createdAt}</span>
        </div>
      `;
      elements.listResults.appendChild(li);
    });
  }
}

// Helper to escape HTML tags
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Canvas Wheel Drawing algorithm (Vòng quay tĩnh 12 ô màu phụng vụ với các biểu tượng thánh thiêng)
function drawWheel() {
  const width = elements.canvas.width;
  const height = elements.canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 15;
  
  ctx.clearRect(0, 0, width, height);

  const numSlices = 12;
  const icons = ["🕊️", "✝️", "📖", "🕯️", "🌸", "✨", "🍇", "🥖", "⚓", "👑", "🔔", "☀️"];
  
  // 6 màu ấm Công giáo được lặp lại 2 lần
  const colors = [
    "#b91c1c", // Đỏ rượu
    "#d97706", // Vàng gold
    "#1e3a8a", // Xanh navy
    "#166534", // Xanh lá phụng vụ
    "#701a75", // Tím phụng vụ
    "#c2410c", // Cam ấm
    "#b91c1c",
    "#d97706",
    "#1e3a8a",
    "#166534",
    "#701a75",
    "#c2410c"
  ];

  const arcWidth = (2 * Math.PI) / numSlices;

  // Draw slices
  for (let i = 0; i < numSlices; i++) {
    const startAngle = state.currentAngle + i * arcWidth;
    const endAngle = state.currentAngle + (i + 1) * arcWidth;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    
    ctx.fillStyle = colors[i];
    ctx.fill();
    
    // Slice border lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    
    // Draw icon inside slice
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arcWidth / 2);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px Outfit";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(icons[i], r - 60, 0);
    ctx.restore();
  }

  // Draw outer gold ring border
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#d97706";
  ctx.stroke();

  // Draw the Central circular Hub
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.20, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d97706";
  ctx.stroke();
}

// 5. Physics Wheel Spin Simulation
let lastSliceIndex = -1;

function checkTickSound(angle) {
  const numSlices = 12; // Luôn luôn là 12 ô visual

  const normalizedAngle = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const arcWidth = (2 * Math.PI) / numSlices;
  
  const sliceIndex = Math.floor((2 * Math.PI - normalizedAngle) / arcWidth) % numSlices;
  
  if (sliceIndex !== lastSliceIndex) {
    if (lastSliceIndex !== -1) {
      soundManager.playTick();
    }
    lastSliceIndex = sliceIndex;
  }
}

function startSpin() {
  if (state.isSpinning) return;
  if (state.entries.length === 0) {
    alert("Danh sách lời chúc đang trống. Vui lòng nhập lời chúc ở ô bên phải hoặc nhấn 'Nhập mẫu' để lấy danh sách lời chúc mặc định!");
    return;
  }

  soundManager.initContext();

  state.isSpinning = true;
  elements.btnSpin.disabled = true;
  elements.btnSpin.style.cursor = 'not-allowed';
  
  // Close any open modals
  closeModals();

  // Chọn ngẫu nhiên câu chúc từ danh sách entries
  const numEntries = state.entries.length;
  state.winnerIndex = Math.floor(Math.random() * numEntries);
  
  // Chọn ngẫu nhiên ô visual sẽ dừng lại (0 đến 11)
  state.visualWinnerIndex = Math.floor(Math.random() * 12);
  
  // Physics stop configuration cho 12 ô visual
  const arcWidth = (2 * Math.PI) / 12;
  
  // Mức xoay ngẫu nhiên từ 4 đến 6 vòng
  const minRotations = 4;
  const maxRotations = 6;
  const numRotations = minRotations + Math.random() * (maxRotations - minRotations);
  
  // Tính toán góc dừng để visualWinnerIndex nằm ở mũi tên chỉ bên phải (góc 0)
  const randomInnerOffset = (Math.random() - 0.5) * arcWidth * 0.8;
  const targetStopAngle = (2 * Math.PI * numRotations) - (state.visualWinnerIndex * arcWidth + arcWidth / 2) + randomInnerOffset;
  
  // Easing animation loop variables
  const spinDuration = state.settings.duration * 1000; // milliseconds
  const startAngleVal = state.currentAngle % (2 * Math.PI);
  const totalRotation = targetStopAngle - startAngleVal;
  
  let animationStart = null;
  lastSliceIndex = -1;

  function spinTick(timestamp) {
    if (!animationStart) animationStart = timestamp;
    const elapsed = timestamp - animationStart;
    const progress = Math.min(elapsed / spinDuration, 1);
    
    // Cubic Ease-out formula
    const ease = 1 - Math.pow(1 - progress, 3);
    state.currentAngle = startAngleVal + ease * totalRotation;
    
    // Phát âm thanh cơ học
    checkTickSound(state.currentAngle);
    
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(spinTick);
    } else {
      onSpinComplete();
    }
  }

  requestAnimationFrame(spinTick);
}

// Lấy thời gian hiện tại định dạng HH:MM - DD/MM/YYYY
function getFormattedDateTime() {
  const time = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  const hh = pad(time.getHours());
  const mm = pad(time.getMinutes());
  const dd = pad(time.getDate());
  const mo = pad(time.getMonth() + 1);
  const yyyy = time.getFullYear();
  return `${hh}:${mm} - ${dd}/${mo}/${yyyy}`;
}

// Spin ended - announce winner and blessing
function onSpinComplete() {
  state.isSpinning = false;
  elements.btnSpin.disabled = false;
  elements.btnSpin.style.cursor = 'pointer';

  const blessingText = state.entries[state.winnerIndex];
  
  // Lưu kết quả vào danh sách lịch sử
  const parishVal = state.parishConfig.parishName || "Giáo xứ Châu Sơn";
  const programVal = state.parishConfig.programName || "Chúc Xuân Đầu Năm 2026";
  const timeStr = getFormattedDateTime();
  
  state.results.unshift({
    id: 'res_' + Date.now(),
    entryId: 'entry_' + state.winnerIndex,
    parishName: parishVal,
    programName: programVal,
    blessingText: blessingText,
    createdAt: timeStr,
    spinNumber: state.results.length + 1
  });

  saveLocalStorage();
  updateUI();

  // Phát nhạc chúc mừng
  soundManager.playWinnerSound();

  // Đổ dữ liệu vào Modal Popup kết quả
  if (elements.winnerParishName) elements.winnerParishName.textContent = parishVal;
  if (elements.winnerProgramName) elements.winnerProgramName.textContent = programVal;
  if (elements.winnerLabelDisplay) elements.winnerLabelDisplay.textContent = state.parishConfig.description || "Lời Chúa muốn nói với anh/chị trong năm nay";
  if (elements.winnerBlessing) elements.winnerBlessing.textContent = `“${blessingText}”`;
  
  elements.winnerModal.classList.add('open');

  // Tạo hiệu ứng pháo giấy confetti
  if (state.settings.confettiEnabled) {
    confettiEngine.spawn();
  }
}

// 6. DOM Events & Modals listeners
function setupEventListeners() {
  // Spin button triggers
  elements.btnSpin.addEventListener('click', startSpin);
  elements.canvas.addEventListener('click', startSpin);
  
  // Input tracking
  elements.txtEntries.addEventListener('input', (e) => {
    const list = e.target.value.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    // Giới hạn nhập liệu
    if (list.length > 500) {
      alert("Danh sách vượt quá giới hạn 500 mục. Vui lòng rút gọn danh sách.");
      state.entries = list.slice(0, 500);
      updateTextarea();
    } else {
      state.entries = list;
    }
    
    saveLocalStorage();
    updateUI();
    drawWheel();
  });

  // Tab switching
  elements.tabEntries.addEventListener('click', () => switchTab('entries'));
  elements.tabResults.addEventListener('click', () => switchTab('results'));

  // Header Actions
  elements.btnNew.addEventListener('click', () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ danh sách lời chúc?")) {
      state.entries = [];
      updateTextarea();
      saveLocalStorage();
      updateUI();
      drawWheel();
    }
  });

  elements.btnShuffle.addEventListener('click', () => {
    if (state.entries.length < 2) return;
    
    // Fisher-Yates Shuffle
    for (let i = state.entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.entries[i], state.entries[j]] = [state.entries[j], state.entries[i]];
    }
    
    updateTextarea();
    saveLocalStorage();
    drawWheel();
  });

  elements.btnSort.addEventListener('click', () => {
    if (state.entries.length < 2) return;
    
    // Sắp xếp tiếng Việt chuẩn
    state.entries.sort((a, b) => a.localeCompare(b, 'vi'));
    
    updateTextarea();
    saveLocalStorage();
    drawWheel();
  });

  // Tải danh sách 100 lời Chúa từ file blessings.js
  if (elements.btnLoadSample) {
    elements.btnLoadSample.addEventListener('click', () => {
      if (typeof BLESSINGS !== 'undefined' && BLESSINGS.length > 0) {
        state.entries = BLESSINGS.map(b => `${b.text} (${b.quote})`);
        updateTextarea();
        saveLocalStorage();
        updateUI();
        drawWheel();
        showToast("Đã tải 100 lời Chúa chúc lành và Giờ Cha Chờ!");
      } else {
        alert("Không tìm thấy cơ sở dữ liệu blessings.js!");
      }
    });
  }

  // Xóa trống danh sách
  if (elements.btnClearEntries) {
    elements.btnClearEntries.addEventListener('click', () => {
      if (confirm("Bạn muốn xóa trống danh sách lời chúc?")) {
        state.entries = [];
        updateTextarea();
        saveLocalStorage();
        updateUI();
        drawWheel();
      }
    });
  }

  // Tải lại danh sách 20 câu mẫu ngắn
  if (elements.btnResetDefault) {
    elements.btnResetDefault.addEventListener('click', () => {
      state.entries = [...STATIC_SHORT_SAMPLES];
      updateTextarea();
      saveLocalStorage();
      updateUI();
      drawWheel();
      showToast("Đã tải lại 20 câu lời chúc mẫu ngắn!");
    });
  }

  // Checkbox Không lặp lại
  if (elements.chkNoRepeat) {
    elements.chkNoRepeat.addEventListener('change', (e) => {
      state.settings.removeWinner = e.target.checked;
      saveLocalStorage();
    });
  }

  // Cấu hình Giáo xứ
  ['cfg-parish-name', 'cfg-program-name', 'cfg-description', 'cfg-organizer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        const prop = id.replace('cfg-', '').replace('-name', 'Name');
        state.parishConfig[prop] = e.target.value;
        saveLocalStorage();
      });
    }
  });

  // Share link action (Copy to clipboard containing hash params)
  elements.btnShare.addEventListener('click', () => {
    if (state.entries.length === 0) {
      alert("Hãy nhập danh sách lời chúc trước khi tạo liên kết chia sẻ.");
      return;
    }
    
    const encoded = encodeURIComponent(state.entries.join(','));
    const shareUrl = `${window.location.origin}${window.location.pathname}#names=${encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast();
    }).catch(err => {
      console.error('Không thể copy link:', err);
      alert(`Liên kết chia sẻ của bạn là:\n${shareUrl}`);
    });
  });

  // Fullscreen support
  elements.btnFullscreen.addEventListener('click', toggleFullscreen);

  // Clear results history
  elements.btnClearResults.addEventListener('click', () => {
    if (confirm("Xóa toàn bộ lịch sử nhận lời chúc của phiên này?")) {
      state.results = [];
      saveLocalStorage();
      updateUI();
    }
  });

  // Winner modal actions
  elements.btnWinnerClose.addEventListener('click', () => {
    elements.winnerModal.classList.remove('open');
    confettiEngine.stop();
    
    if (state.settings.removeWinner) {
      removeWinnerAction();
    }
  });

  elements.btnWinnerSpinAgain.addEventListener('click', () => {
    elements.winnerModal.classList.remove('open');
    confettiEngine.stop();
    
    if (state.settings.removeWinner) {
      removeWinnerAction();
    }
    
    setTimeout(startSpin, 300);
  });

  elements.btnWinnerRemove.addEventListener('click', () => {
    elements.winnerModal.classList.remove('open');
    confettiEngine.stop();
    removeWinnerAction();
  });

  elements.btnCopyBlessing.addEventListener('click', () => {
    if (state.results.length > 0) {
      const latest = state.results[0];
      copyBlessingText(latest.parishName, latest.programName, latest.blessingText);
    }
  });

  // Customize settings panel modal actions
  elements.btnCustomize.addEventListener('click', openCustomizeModal);
  elements.btnCustomizeClose.addEventListener('click', closeModals);
  elements.btnCustomizeCloseX.addEventListener('click', closeModals);
  
  elements.inputDuration.addEventListener('input', (e) => {
    elements.labelDuration.textContent = `${e.target.value} giây`;
  });

  elements.btnCustomizeSave.addEventListener('click', () => {
    state.settings.title = elements.inputTitle.value.trim() || "Vòng Quay Lời Chúc";
    state.settings.duration = parseInt(elements.inputDuration.value, 10);
    state.settings.theme = elements.selectTheme.value;
    state.settings.soundEnabled = elements.chkSound.checked;
    state.settings.confettiEnabled = elements.chkConfetti.checked;
    state.settings.removeWinner = elements.chkRemoveWinner.checked;
    
    // Apply toggles
    soundManager.enabled = state.settings.soundEnabled;
    if (elements.chkNoRepeat) {
      elements.chkNoRepeat.checked = state.settings.removeWinner;
    }
    
    saveLocalStorage();
    updateUI();
    closeModals();
    drawWheel();
  });
}

// Collapsible config accordion helper
function toggleConfigPanel() {
  const panel = document.getElementById('config-body-panel');
  const chevron = document.getElementById('config-chevron');
  if (panel && chevron) {
    const isCollapsed = panel.classList.contains('collapsed');
    if (isCollapsed) {
      panel.classList.remove('collapsed');
      chevron.classList.add('rotated');
    } else {
      panel.classList.add('collapsed');
      chevron.classList.remove('rotated');
    }
  }
}
window.toggleConfigPanel = toggleConfigPanel;

// Remove winner helper
function removeWinnerAction() {
  if (state.winnerIndex === -1) return;
  state.entries.splice(state.winnerIndex, 1);
  state.winnerIndex = -1; // Reset
  
  updateTextarea();
  saveLocalStorage();
  updateUI();
  drawWheel();
}

// Switch tabs layout controller
function switchTab(tab) {
  state.activeTab = tab;
  
  if (tab === 'entries') {
    elements.tabEntries.classList.add('active');
    elements.tabResults.classList.remove('active');
    elements.paneEntries.classList.add('active');
    elements.paneResults.classList.remove('active');
  } else {
    elements.tabEntries.classList.remove('active');
    elements.tabResults.classList.add('active');
    elements.paneEntries.classList.remove('active');
    elements.paneResults.classList.add('active');
  }
}

// Toast indicator display helper with dynamic text support
function showToast(msg) {
  if (msg) {
    elements.toast.textContent = msg;
  } else {
    elements.toast.textContent = "Liên kết đã được sao chép vào bộ nhớ tạm!";
  }
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Copy blessing utility
function copyBlessingText(parish, program, blessingText) {
  const div = document.createElement('div');
  div.innerHTML = blessingText;
  const decodedText = div.textContent;
  
  const textToCopy = `✨ LỜI CHÚC TỪ GIÁO XỨ ✨\n⛪ ${parish}\n🎗️ Chương trình: ${program}\n\n🙏 Lời Chúa muốn nói với anh/chị:\n"${decodedText}"\n\nNguyện xin Chúa ban bình an và gìn giữ anh/chị trong năm mới!`;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast("Đã sao chép lời chúc!");
  }).catch(err => {
    console.error('Không thể copy lời chúc:', err);
    alert(`Lời chúc của bạn là:\n"${decodedText}"`);
  });
}
window.copyBlessingText = copyBlessingText;

// Open Customize Modal with current states
function openCustomizeModal() {
  elements.inputTitle.value = state.settings.title || "Vòng Quay Lời Chúc";
  elements.inputDuration.value = state.settings.duration;
  elements.labelDuration.textContent = `${state.settings.duration} giây`;
  elements.selectTheme.value = state.settings.theme;
  elements.chkSound.checked = state.settings.soundEnabled;
  elements.chkConfetti.checked = state.settings.confettiEnabled;
  elements.chkRemoveWinner.checked = state.settings.removeWinner;
  
  elements.customizeModal.classList.add('open');
}

// Close all active dialog modals
function closeModals() {
  elements.winnerModal.classList.remove('open');
  elements.customizeModal.classList.remove('open');
}

// Fullscreen toggle handler
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      alert(`Lỗi khi vào chế độ toàn màn hình: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Trigger initial setup
window.addEventListener('DOMContentLoaded', init);
