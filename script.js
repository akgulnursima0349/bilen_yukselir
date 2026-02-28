// ============================================
// CANVAS VE DOM ELEMENTLERI
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const playButton = document.getElementById('playButton');
const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const optionsGrid = document.getElementById('optionsGrid');
const timerIcon = document.getElementById('timerIcon');
const timerValue = document.getElementById('timerValue');
const timerProgressFill = document.getElementById('timerProgressFill');
const endScreen = document.getElementById('endScreen');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const uiOverlay = document.getElementById('uiOverlay');
const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');

// ============================================
// SES SİSTEMİ
// ============================================
const SoundManager = {
    sounds: {},
    enabled: true,
    initialized: false,

    // Sesleri yükle
    init() {
        if (this.initialized) return;

        const soundFiles = {
            click: 'Assets/sounds/click.mp3',
            correct: 'Assets/sounds/correct.mp3',
            wrong: 'Assets/sounds/wrong.mp3',
            drop: 'Assets/sounds/drop.mp3',
            land: 'Assets/sounds/land.mp3',
            fail: 'Assets/sounds/fail.mp3',
            tick: 'Assets/sounds/tick.mp3',
            celebration: 'Assets/sounds/celebration.mp3'
        };

        for (const [name, src] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio(src);
            this.sounds[name].preload = 'auto';
            // Hata olursa sessizce geç
            this.sounds[name].onerror = () => {
                console.log(`Ses dosyası bulunamadı: ${src}`);
            };
        }

        this.initialized = true;
    },

    // Ses çal
    play(soundName, volume = 1.0) {
        if (!this.enabled || !this.sounds[soundName]) return;

        try {
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = Math.min(1, Math.max(0, volume));
            sound.play().catch(() => {});
        } catch (e) {
            // Ses çalınamazsa sessizce geç
        }
    },

    // Sesi aç/kapat
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

// ============================================
// CİHAZ TESPİT SİSTEMİ
// ============================================
const DeviceDetector = {
    type: 'desktop', // 'mobile', 'tablet', 'smartboard', 'desktop'

    detect() {
        const ua = navigator.userAgent.toLowerCase();
        const touchPoints = navigator.maxTouchPoints || 0;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const maxDimension = Math.max(screenWidth, screenHeight);
        const minDimension = Math.min(screenWidth, screenHeight);

        // Akıllı tahta: Büyük dokunmatik ekran 
        if (touchPoints > 0 && minDimension >= 1000 && maxDimension >= 1800) {
            this.type = 'smartboard';
        }
        // Mobil telefon: Küçük ekran ve mobil user agent
        else if (/android|iphone|ipod|mobile/i.test(ua) || (touchPoints > 0 && maxDimension <= 900)) {
            this.type = 'mobile';
        }
        // Tablet: Orta boy dokunmatik ekran
        else if (/ipad|tablet|android/i.test(ua) || (touchPoints > 0 && maxDimension <= 1400)) {
            this.type = 'tablet';
        }
        // Masaüstü: Geri kalan her şey
        else {
            this.type = 'desktop';
        }

        console.log(`Cihaz tipi: ${this.type} (Ekran: ${screenWidth}x${screenHeight}, Touch: ${touchPoints})`);
        return this.type;
    },

    isMobile() { return this.type === 'mobile'; },
    isTablet() { return this.type === 'tablet'; },
    isSmartboard() { return this.type === 'smartboard'; },
    isDesktop() { return this.type === 'desktop'; },
    isTouchDevice() { return this.type !== 'desktop'; }
};

// Cihazı tespit et
DeviceDetector.detect();

// ============================================
// OYUN DURUMU
// ============================================
let gameState = 'start';
let score = 0;
let level = 0;
const maxLevel = 10;
let usedQuestions = [];
let currentQuestion = null;
let timerInterval = null;
let timeLeft = 10;

// ============================================
// ESNEK SORU SİSTEMİ
// ============================================
// Sorular şu formatlarda olabilir:
// 1. Basit format (mevcut): { question: "...", options: ["A", "B", "C", "D"], correct: 0 }
// 2. Görsel soru: { question: "...", questionImage: "path/to/image.png", options: [...], correct: 0 }
// 3. Görsel şıklar: { question: "...", options: [{ text: "A", image: "path.png" }, ...], correct: 0 }
// 4. Seviye ve konu: { level: 1, topic: "Matematik", question: "...", options: [...], correct: 0 }

// Varsayılan sorular (JSON'dan da yüklenebilir)
let questions = [
    { question: "Hangi gezegen Güneş'e en yakındır?", options: ["Merkür", "Venüs", "Mars", "Dünya"], correct: 0 },
    { question: "Gökkuşağında kaç renk vardır?", options: ["5", "6", "7", "8"], correct: 2 },
    { question: "Arılar ne üretir?", options: ["Süt", "Bal", "Yumurta", "Peynir"], correct: 1 },
    { question: "Bir yılda kaç ay vardır?", options: ["10", "11", "12", "13"], correct: 2 },
    { question: "Hangi hayvan havlamaz?", options: ["Köpek", "Kedi", "Kurt", "Tilki"], correct: 1 },
    { question: "Güneş hangi yönden doğar?", options: ["Batı", "Kuzey", "Güney", "Doğu"], correct: 3 },
    { question: "Su hangi sıcaklıkta donar?", options: ["10°C", "0°C", "-10°C", "5°C"], correct: 1 },
    { question: "Fil hangi kıtada yaşar?", options: ["Avrupa", "Antarktika", "Afrika", "Avustralya"], correct: 2 },
    { question: "Hangi meyve sarı renklidir?", options: ["Elma", "Muz", "Üzüm", "Erik"], correct: 1 },
    { question: "Bir üçgenin kaç kenarı vardır?", options: ["2", "3", "4", "5"], correct: 1 },
    { question: "Hangi hayvan uçabilir?", options: ["Balık", "Yılan", "Kuş", "Kaplumbağa"], correct: 2 },
    { question: "Bir haftada kaç gün vardır?", options: ["5", "6", "7", "8"], correct: 2 },
    { question: "Hangi renk kırmızı ve mavi karışımıdır?", options: ["Turuncu", "Yeşil", "Mor", "Sarı"], correct: 2 },
    { question: "Penguenler nerede yaşar?", options: ["Çölde", "Ormanda", "Antarktika'da", "Dağda"], correct: 2 },
    { question: "5 + 3 kaç eder?", options: ["6", "7", "8", "9"], correct: 2 },
    { question: "Hangi hayvan yavaş hareket eder?", options: ["Çita", "Kaplumbağa", "Tavşan", "Kartal"], correct: 1 },
    { question: "Hangi sebze turuncu renklidir?", options: ["Domates", "Havuç", "Salatalık", "Patlıcan"], correct: 1 },
    { question: "10 - 4 kaç eder?", options: ["5", "6", "7", "8"], correct: 1 },
    { question: "Hangi mevsimde yapraklar dökülür?", options: ["İlkbahar", "Yaz", "Sonbahar", "Kış"], correct: 2 },
    { question: "2 x 3 kaç eder?", options: ["5", "6", "7", "8"], correct: 1 }
];

// JSON'dan soru yükle
async function loadQuestionsFromJSON(url = 'questions.json') {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.questions && Array.isArray(data.questions)) {
                questions = data.questions;
                console.log(`${questions.length} soru JSON'dan yüklendi.`);
            }
        }
    } catch (e) {
        console.log('JSON yüklenemedi, varsayılan sorular kullanılıyor.');
    }
}

// ============================================
// KULE OYUNU DEĞİŞKENLERİ
// ============================================
let tower = [];
let currentBlock = null;
let hook = { x: 0, y: 80, baseY: 80, speed: 0.02, circleAngle: 0 };
let isBlockDropping = false;
let dropSpeed = 0;
const gravity = 0.12; // Çok yavaş düşme
const baseScore = 10;

// Devrilme animasyonu için
let isTipping = false;
let tipDirection = 0; // -1: sola, 1: sağa
let tipAngle = 0;
let tipSpeed = 0;

// Düşen bloklar (ekrandan çıkana kadar animasyon)
let fallingBlocks = [];

// Kamera
let cameraY = 0;
let targetCameraY = 0;

// Bulutlar
let clouds = [];
const cloudImage = new Image();
cloudImage.src = 'Assets/cloud.png';

// Arka plan
const backgroundImage = new Image();
backgroundImage.src = 'Assets/Background.png';

// Blok renkleri
const blockColors = [
    'blue_brick.png', 'pink_brick.png', 'yellow_brick.png',
    'green_brick.png', 'red_brick.png', 'orange_brick.png',
    'purple_brick.png', 'cyan_brick.png', 'light_yellow_brick.png'
];

// Görseller
const images = {
    hook: new Image(),
    sun: new Image(),
    blocks: {}
};

blockColors.forEach(color => {
    images.blocks[color] = new Image();
    images.blocks[color].src = `Assets/${color}`;
});

images.hook.src = 'Assets/hook.png';
images.sun.src = 'Assets/Sun.png';

// ============================================
// CANVAS BOYUTLANDIRMA
// ============================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initClouds();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================
// BULUT FONKSİYONLARI
// ============================================
function initClouds() {
    clouds = [];
    for (let i = 0; i < 6; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 30 + Math.random() * 150,
            speed: 0.3 + Math.random() * 0.5,
            scale: 0.4 + Math.random() * 0.6
        });
    }
}

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + 100) {
            cloud.x = -150;
            cloud.y = 30 + Math.random() * 150;
        }
    });
}

// ============================================
// BLOK FONKSİYONLARI
// ============================================
// Debug bilgisi (geçici)
let debugInfo = { mode: '', canvas: '', blok: '' };

function getBlockDimensions() {
    // Direkt canvas boyutuna göre blok boyutu hesapla
    let baseWidth;
    const isPortrait = canvas.height > canvas.width;
    const largerDim = Math.max(canvas.width, canvas.height);

    // Mod belirleme
    let mode = 'desktop';

    // MOBİL DİKEY: Dikey ekran VE genişlik 1024'den küçük
    if (isPortrait && canvas.width < 1024) {
        mode = 'mobile-portrait';
        baseWidth = canvas.width * 0.35; // Küçültülmüş bloklar
    }
    // MOBİL YATAY: Yatay ekran VE yükseklik 500'den küçük
    else if (!isPortrait && canvas.height < 500) {
        mode = 'mobile-landscape';
        baseWidth = canvas.height * 0.5;
    }
    // BÜYÜK EKRAN: Geniş ekran (width > 1400) veya her iki boyut da büyük
    else if (largerDim > 1400) {
        mode = 'desktop';
        baseWidth = Math.min(canvas.width * 0.2, 280);
    }
    // TABLET: Geri kalan orta boy ekranlar
    else {
        mode = 'tablet';
        baseWidth = Math.min(canvas.width * 0.3, 220);
    }

    // Debug bilgisini güncelle
    debugInfo = {
        mode: mode,
        canvas: `${canvas.width}x${canvas.height}`,
        blok: `${Math.round(baseWidth)}px`
    };

    console.log(`[BLOK] Mode: ${mode}, Canvas: ${canvas.width}x${canvas.height}, Blok: ${baseWidth}px`);

    return {
        width: baseWidth,
        height: baseWidth * 0.55,
        studHeight: baseWidth * 0.18
    };
}

// Ekranda debug bilgisi göster - BÜYÜK VE GÖRÜNÜR
function drawDebugInfo() {
    ctx.save();

    // Değerleri doğrudan hesapla
    const isPortrait = canvas.height > canvas.width;
    const w = canvas.width;
    const h = canvas.height;
    let mode = 'unknown';
    let blokW = 0;

    if (isPortrait && w < 1024) {
        mode = 'mobile-portrait';
        blokW = Math.round(w * 0.35); // Küçültülmüş bloklar
    } else if (!isPortrait && h < 500) {
        mode = 'mobile-landscape';
        blokW = Math.round(h * 0.5);
    } else if (Math.max(w, h) > 1400) {
        mode = 'desktop';
        blokW = Math.round(Math.min(w * 0.2, 280));
    } else {
        mode = 'tablet';
        blokW = Math.round(Math.min(w * 0.3, 220));
    }

    // Ekranın üst kısmında, büyük ve kırmızı arka plan
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`VER: 20260131d`, 10, 20);
    ctx.fillText(`Mode: ${mode}`, 10, 40);
    ctx.fillText(`Canvas: ${w}x${h}`, 10, 60);
    ctx.fillText(`Blok: ${blokW}px | isPortrait: ${isPortrait}`, 10, 80);
    ctx.fillText(`w<1024: ${w < 1024}`, 10, 97);
    ctx.restore();
}

function getGroundY() {
    return canvas.height * 0.92; // Platform daha aşağıda
}

function createReferenceBlock() {
    const blockDim = getBlockDimensions();
    const groundY = getGroundY();
    const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];

    return {
        x: canvas.width / 2 - blockDim.width / 2,
        y: groundY - blockDim.height,
        width: blockDim.width,
        height: blockDim.height,
        studHeight: blockDim.studHeight,
        color: randomColor,
        image: images.blocks[randomColor]
    };
}

// ============================================
// SORU FONKSİYONLARI
// ============================================
function getRandomQuestion() {
    if (usedQuestions.length >= questions.length) {
        usedQuestions = [];
    }
    let availableQuestions = questions.filter((q, i) => !usedQuestions.includes(i));
    let randomIndex = Math.floor(Math.random() * availableQuestions.length);
    let questionIndex = questions.indexOf(availableQuestions[randomIndex]);
    usedQuestions.push(questionIndex);
    return questions[questionIndex];
}

// Geliştirilmiş puan popup'ı
function showScorePopup(timeBonus, basePoints, total) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.innerHTML = `
        <div class="score-row">
            <span class="score-icon">🎯</span>
            <span class="score-label">Doğru Cevap:</span>
            <span class="score-value">+${basePoints}</span>
        </div>
        <div class="score-row">
            <span class="score-icon">⏱️</span>
            <span class="score-label">Süre Bonusu:</span>
            <span class="score-value time">+${timeBonus}</span>
        </div>
        <div class="score-row score-total">
            <span class="score-icon">🏆</span>
            <span class="score-value">+${total} Puan!</span>
        </div>
    `;
    document.getElementById('gameContainer').appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
}

// Show Question - Görsel destekli
function showQuestion() {
    gameState = 'question';
    currentQuestion = getRandomQuestion();

    // Soru metnini ve görselini göster
    const modalContent = document.querySelector('.modal-content');

    // Önceki soru görselini temizle
    const existingImg = modalContent.querySelector('.question-image');
    if (existingImg) existingImg.remove();

    // Soru görseli varsa ekle
    if (currentQuestion.questionImage) {
        const img = document.createElement('img');
        img.src = currentQuestion.questionImage;
        img.className = 'question-image';
        img.alt = 'Soru görseli';
        modalContent.insertBefore(img, questionText);
    }

    questionText.textContent = currentQuestion.question;

    // Şıkları oluştur
    optionsGrid.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
        const btn = document.createElement('button');

        // Şık görsel içeriyor mu kontrol et
        const isObjectOption = typeof option === 'object' && option !== null;
        const hasImage = isObjectOption && option.image;
        const optionText = isObjectOption ? option.text : option;

        btn.className = 'option-btn' + (hasImage ? ' with-image' : '');

        if (hasImage) {
            const img = document.createElement('img');
            img.src = option.image;
            img.alt = optionText;
            btn.appendChild(img);

            const span = document.createElement('span');
            span.textContent = optionText;
            btn.appendChild(span);
        } else {
            btn.textContent = optionText;
        }

        btn.onclick = () => checkAnswer(index, btn);
        optionsGrid.appendChild(btn);
    });

    timeLeft = 10;
    timerValue.textContent = '10';
    timerValue.classList.remove('warning');
    timerIcon.classList.remove('warning');
    timerProgressFill.style.width = '100%';
    timerProgressFill.classList.remove('warning');

    questionModal.classList.remove('hidden');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const percentage = (timeLeft / 10) * 100;
        timerProgressFill.style.width = `${percentage}%`;
        timerValue.textContent = Math.ceil(timeLeft);

        // Her saniye tick sesi
        if (Math.ceil(timeLeft) !== Math.ceil(timeLeft + 0.1) && timeLeft > 0 && timeLeft <= 5) {
            SoundManager.play('tick', 0.3);
        }

        if (timeLeft <= 3) {
            timerValue.classList.add('warning');
            timerIcon.classList.add('warning');
            timerProgressFill.classList.add('warning');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeLeft = 0;
            timerValue.textContent = "0";
            SoundManager.play('wrong', 0.6);
        }
    }, 100);
}

// Check Answer
function checkAnswer(selectedIndex, btn) {
    clearInterval(timerInterval);
    SoundManager.play('click', 0.5);

    const buttons = optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (selectedIndex === currentQuestion.correct) {
        btn.classList.add('correct');
        SoundManager.play('correct', 0.7);

        let timeBonus = Math.ceil(Math.max(0, timeLeft));
        let earnedScore = baseScore + timeBonus;
        score += earnedScore;
        scoreDisplay.textContent = score;

        showScorePopup(timeBonus, baseScore, earnedScore);

        setTimeout(() => {
            questionModal.classList.add('hidden');
            startStacking();
        }, 1500);
    } else {
        btn.classList.add('wrong');
        buttons[currentQuestion.correct].classList.add('correct');
        SoundManager.play('wrong', 0.6);

        setTimeout(() => {
            showQuestion();
        }, 1200);
    }
}

// ============================================
// YIĞINLAMA FONKSİYONLARI
// ============================================
function startStacking() {
    gameState = 'stacking';
    isBlockDropping = false;
    dropSpeed = 0;

    const blockDim = getBlockDimensions();
    const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];

    currentBlock = {
        x: canvas.width / 2 - blockDim.width / 2,
        y: cameraY + 120,
        width: blockDim.width,
        height: blockDim.height,
        studHeight: blockDim.studHeight,
        color: randomColor,
        image: images.blocks[randomColor]
    };

    hook.x = canvas.width / 2;
    hook.baseY = cameraY - 80; // Kanca ekranın çok üstünden dönüyor
    hook.y = hook.baseY;
    hook.circleAngle = 0; // Dairesel hareket açısı
    hook.speed = 0.004 + (level * 0.0003); // Daha da yavaş dönüş hızı
}

function dropBlock() {
    if (gameState === 'stacking' && !isBlockDropping && currentBlock) {
        isBlockDropping = true;
        SoundManager.play('drop', 0.5);
    }
}

// Stud hizalama - bloğu en yakın stud pozisyonuna snap et
function snapToStudGrid(block, referenceBlock) {
    const studCount = 4;
    const studSpacing = block.width / (studCount + 1);

    const blockCenter = block.x + block.width / 2;
    const refCenter = referenceBlock.x + referenceBlock.width / 2;
    const offset = blockCenter - refCenter;

    const snappedOffset = Math.round(offset / studSpacing) * studSpacing;
    block.x = refCenter + snappedOffset - block.width / 2;

    const minX = referenceBlock.x - block.width * 0.4;
    const maxX = referenceBlock.x + referenceBlock.width - block.width * 0.6;
    block.x = Math.max(minX, Math.min(maxX, block.x));
}

function checkLanding() {
    const groundY = getGroundY();
    const blockBottom = currentBlock.y + currentBlock.height;

    if (tower.length === 0) {
        if (blockBottom >= groundY) {
            currentBlock.y = groundY - currentBlock.height;
            return 'landed';
        }
    } else {
        const topBlock = tower[tower.length - 1];
        const targetY = topBlock.y - currentBlock.height + currentBlock.studHeight;

        if (blockBottom >= topBlock.y) {
            const overlapLeft = Math.max(currentBlock.x, topBlock.x);
            const overlapRight = Math.min(currentBlock.x + currentBlock.width, topBlock.x + topBlock.width);
            const overlap = overlapRight - overlapLeft;

            if (overlap > currentBlock.width * 0.3) {
                currentBlock.y = targetY;
                snapToStudGrid(currentBlock, topBlock);
                return 'landed';
            }

            if (overlap > 0 && overlap <= currentBlock.width * 0.3) {
                currentBlock.y = targetY;
                const blockCenter = currentBlock.x + currentBlock.width / 2;
                const topBlockCenter = topBlock.x + topBlock.width / 2;
                tipDirection = blockCenter < topBlockCenter ? -1 : 1;
                return 'tipping';
            }
        }
    }

    if (blockBottom >= groundY) {
        return 'missed';
    }

    return null;
}

function updateCamera() {
    if (tower.length > 0) {
        const topBlock = tower[tower.length - 1];
        const screenCenter = canvas.height * 0.5;

        if (topBlock.y - cameraY < screenCenter) {
            targetCameraY = topBlock.y - screenCenter;
        }
    }

    cameraY += (targetCameraY - cameraY) * 0.1;
    if (cameraY > 0) cameraY = 0;
}

// ============================================
// GERİ BİLDİRİM VE KUTLAMA
// ============================================
function showFeedback(success) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${success ? 'success' : 'fail'}`;
    feedback.textContent = success ? 'Harika!' : 'Kaçtı!';
    document.getElementById('gameContainer').appendChild(feedback);

    if (success) {
        SoundManager.play('land', 0.7);
    } else {
        SoundManager.play('fail', 0.6);
    }

    setTimeout(() => feedback.remove(), 1000);
}

function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00', '#9370DB', '#32CD32'];
    const confettiCount = 60;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (2 + Math.random() * 4) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = (10 + Math.random() * 15) + 'px';
        confetti.style.height = (10 + Math.random() * 15) + 'px';
        container.appendChild(confetti);
    }
}

function showGameComplete() {
    const overlay = document.createElement('div');
    overlay.className = 'game-complete-overlay';
    overlay.innerHTML = `
        <div class="game-complete-box">
            <div class="game-complete-icon">🎉</div>
            <div class="game-complete-title">OYUN BİTTİ!</div>
            <div class="game-complete-label">Toplam Puanın</div>
            <div class="game-complete-score">${score}</div>
        </div>
    `;
    document.getElementById('gameContainer').appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
        showCelebration();
    }, 2500);
}

function showCelebration() {
    gameState = 'end';
    finalScore.textContent = score;
    createConfetti();
    endScreen.classList.remove('hidden');
    SoundManager.play('celebration', 0.8);
}

// ============================================
// OYUN DÖNGÜSÜ
// ============================================
function update() {
    updateClouds();
    updateCamera();

    if (gameState === 'stacking' && currentBlock) {
        // Devrilme animasyonu - yavaş, az dönüş, ekran sonuna kadar
        if (isTipping) {
            // Maksimum 90 derece dönüş (1 çeyrek tur)
            if (Math.abs(tipAngle) < 90) {
                tipAngle += tipSpeed * tipDirection;
            }
            tipSpeed += 0.02;
            currentBlock.y += tipSpeed * 0.4;
            currentBlock.x += tipDirection * tipSpeed * 0.15;

            // Ekranın altına düştüğünde bloğu kaldır
            const screenBottom = cameraY + canvas.height + 200;
            if (currentBlock.y > screenBottom) {
                isTipping = false;
                tipAngle = 0;
                tipSpeed = 0;
                currentBlock = null;
                setTimeout(() => showQuestion(), 500);
            } else if (Math.abs(tipAngle) > 30 && !currentBlock.feedbackShown) {
                // Feedback'i sadece bir kez göster
                currentBlock.feedbackShown = true;
                showFeedback(false);
            }
            return;
        }

        if (!isBlockDropping) {
            // Akıcı karışık hareket - Lissajous benzeri eğri
            hook.circleAngle += hook.speed;

            const circleCenterX = canvas.width / 2;
            const circleRadius = currentBlock.width * 1.3;

            // Daha dairesel hareket + hafif dalgalanma
            // Ana dairesel hareket (baskın)
            const baseX = Math.sin(hook.circleAngle) * circleRadius;
            const baseY = Math.cos(hook.circleAngle) * circleRadius * 0.35;

            // Hafif ikincil dalgalanma (küçük)
            const secondaryX = Math.sin(hook.circleAngle * 2.5) * circleRadius * 0.15;
            const secondaryY = Math.sin(hook.circleAngle * 2) * 12;

            // Hepsini birleştir - kesintisiz akıcı hareket
            hook.x = circleCenterX + baseX + secondaryX;
            hook.y = hook.baseY + baseY + secondaryY;

            currentBlock.x = hook.x - currentBlock.width / 2;
            currentBlock.y = hook.y + 220; // Blok kancadan aşağıda, ipler görünür
        } else {
            dropSpeed += gravity;
            currentBlock.y += dropSpeed;

            const landed = checkLanding();

            if (landed === 'landed') {
                tower.push({...currentBlock});
                level++;
                levelDisplay.textContent = `${level}/${maxLevel}`;

                if (tower.length > 1) {
                    const topBlock = tower[tower.length - 2];
                    const centerDiff = Math.abs((currentBlock.x + currentBlock.width/2) - (topBlock.x + topBlock.width/2));
                    if (centerDiff < 10) {
                        score += 5;
                        scoreDisplay.textContent = score;
                    }
                }

                showFeedback(true);
                currentBlock = null;

                if (level >= maxLevel) {
                    setTimeout(() => {
                        showGameComplete();
                    }, 1000);
                } else {
                    setTimeout(() => showQuestion(), 1000);
                }
            } else if (landed === 'tipping') {
                isTipping = true;
                tipSpeed = 0.1; // Çok yavaş devrilme başlangıcı
                dropSpeed = 0;
            } else if (landed === 'missed') {
                // Blok düşmeye devam etsin, ekrandan çıkana kadar
                if (!currentBlock.isFalling) {
                    currentBlock.isFalling = true;
                    showFeedback(false);
                    setTimeout(() => showQuestion(), 800);
                }
                // Ekranın altına düştüğünde bloğu kaldır
                const screenBottom = cameraY + canvas.height + 200;
                if (currentBlock.y > screenBottom) {
                    currentBlock = null;
                }
            }
        }
    }
}

// ============================================
// ÇİZİM FONKSİYONLARI
// ============================================
function drawLegoBlock(block, yOffset, rotation = 0) {
    const drawY = block.y - yOffset;

    ctx.save();

    if (rotation !== 0) {
        const pivotX = block.x + block.width / 2;
        const pivotY = drawY + block.height;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-pivotX, -pivotY);
    }

    if (block.image && block.image.complete) {
        ctx.drawImage(block.image, block.x, drawY, block.width, block.height);
    } else {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(block.x, drawY, block.width, block.height);

        const studRadius = block.width * 0.08;
        const studCount = 4;
        const studSpacing = block.width / (studCount + 1);

        ctx.fillStyle = '#E6C200';
        for (let i = 1; i <= studCount; i++) {
            ctx.beginPath();
            ctx.arc(block.x + studSpacing * i, drawY, studRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// Arka planı aspect ratio koruyarak çiz (cover gibi, zemin hizalı)
function drawBackgroundCover(img, zoomLevel = 1.2) {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
        // Canvas daha geniş - genişliğe göre ölçekle
        drawWidth = canvas.width * zoomLevel;
        drawHeight = drawWidth / imgRatio;
    } else {
        // Canvas daha uzun - yüksekliğe göre ölçekle
        drawHeight = canvas.height * zoomLevel;
        drawWidth = drawHeight * imgRatio;
    }

    // Yatay ortala
    offsetX = (canvas.width - drawWidth) / 2;

    // Dikey: Arka plandaki zemini oyun zeminine hizala
    // Arka plan görselinin alt %15'i zemin olduğunu varsayıyoruz
    // Oyun zemini canvas.height * 0.85'te
    const gameGroundY = canvas.height * 0.85;
    const bgGroundRatio = 0.88; // Arka plandaki zeminin oranı (görsel bağlı)

    // Arka planın zeminini oyun zeminine hizala
    offsetY = gameGroundY - (drawHeight * bgGroundRatio);

    // Kamera hareketi ile paralaks
    offsetY -= cameraY * 0.25;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka plan - aspect ratio korunarak çizilir
    if (backgroundImage.complete) {
        drawBackgroundCover(backgroundImage, 1.3);

        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
        skyGradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
        skyGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4A90D9');
        gradient.addColorStop(0.5, '#87CEEB');
        gradient.addColorStop(1, '#90EE90');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Bulutlar
    if (cloudImage.complete) {
        clouds.forEach(cloud => {
            const cloudY = cloud.y - cameraY * 0.2;
            ctx.globalAlpha = 0.85;
            ctx.drawImage(cloudImage, cloud.x, cloudY, 140 * cloud.scale, 70 * cloud.scale);
            ctx.globalAlpha = 1;
        });
    }

    // Güneş
    if (images.sun.complete) {
        ctx.drawImage(images.sun, canvas.width - 130, 15, 110, 110);
    }

    // Platform
    const groundY = getGroundY();
    const groundScreenY = groundY - cameraY;
    if (tower.length > 0 && groundScreenY < canvas.height) {
        const firstBlock = tower[0];
        const platformWidth = firstBlock.width + 40;
        const platformX = firstBlock.x - 20;
        const platformScreenY = groundScreenY;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(platformX + platformWidth / 2, platformScreenY + 15, platformWidth / 2 + 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.roundRect(platformX, platformScreenY, platformWidth, 20, 8);
        ctx.fill();

        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.roundRect(platformX + 3, platformScreenY + 2, platformWidth - 6, 6, 4);
        ctx.fill();
    }

    // Kule
    tower.forEach(block => {
        drawLegoBlock(block, cameraY);
    });

    // Vinç ve blok
    if (gameState === 'stacking' && currentBlock) {
        const hookScreenY = hook.y - cameraY;
        const hookSize = 320; // Kanca boyutu - büyütüldü

        // Önce blok çizilir, sonra kanca - kanca blokun önünde görünür
        drawLegoBlock(currentBlock, cameraY, isTipping ? tipAngle : 0);

        // Kanca en son çizilir (blokun önünde kalır)
        if (images.hook.complete) {
            ctx.drawImage(images.hook, hook.x - hookSize/2, hookScreenY - 50, hookSize, hookSize);
        } else {
            ctx.beginPath();
            ctx.arc(hook.x, hookScreenY, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#666';
            ctx.fill();
        }
    }

    // Debug kaldırıldı
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// OYUN BAŞLATMA
// ============================================
function startGame() {
    score = 0;
    level = 0;
    tower = [];
    usedQuestions = [];
    currentBlock = null;
    cameraY = 0;
    targetCameraY = 0;

    const refBlock = createReferenceBlock();
    tower.push(refBlock);

    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '0/10';

    const confettiContainer = document.getElementById('confettiContainer');
    confettiContainer.innerHTML = '';

    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    uiOverlay.classList.remove('hidden');

    showQuestion();
}

// ============================================
// EVENT LISTENERS
// ============================================
playButton.addEventListener('click', () => {
    SoundManager.play('click', 0.5);
    startGame();
});

restartButton.addEventListener('click', () => {
    SoundManager.play('click', 0.5);
    startGame();
});

// Canvas tıklama ve dokunma
canvas.addEventListener('click', dropBlock);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropBlock();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
}, { passive: false });

// Klavye desteği
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'stacking') {
        e.preventDefault();
        dropBlock();
    }
});

// Dokunmatik ekranlarda çift dokunma yakınlaştırmayı engelle
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

// Dokunmatik ekranlarda sürükleme/kaydırmayı engelle
document.body.addEventListener('touchmove', (e) => {
    if (gameState === 'stacking') {
        e.preventDefault();
    }
}, { passive: false });

// ============================================
// BAŞLATMA
// ============================================
async function init() {
    SoundManager.init();
    await loadQuestionsFromJSON();
    initClouds();
    console.log(`${questions.length} soru yüklendi.`);
    gameLoop();
}

init();
