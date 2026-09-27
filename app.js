// ==========================================================================
// 雙軌並行·多部共治·邁向百年 ｜ 開題答辯 PPT 簡報引擎交互邏輯
// ==========================================================================

let currentIndex = 1;
const totalSlides = 36;
const mainSlidesCount = 26;
let lastMainSlideIndex = 1;

let isNotesOpen = false;
let isLaserActive = false;
let noteFontSize = 17;

// 40 分鐘計時器狀態
let timerSeconds = 40 * 60; // 2400 秒
let timerInterval = null;
let isTimerRunning = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 依 URL Hash 加載特定投影片
    const hash = window.location.hash;
    if (hash) {
        const match = hash.match(/#(\d+)/);
        if (match) {
            const idx = parseInt(match[1]);
            if (idx >= 1 && idx <= totalSlides) {
                currentIndex = idx;
            }
        } else if (hash.startsWith('#b')) {
            const bMatch = hash.match(/#b(\d+)/);
            if (bMatch) {
                const bNum = parseInt(bMatch[1]);
                if (bNum >= 1 && bNum <= 10) {
                    currentIndex = 26 + bNum;
                }
            }
        }
    }
    
    goToSlide(currentIndex);
    setupKeyboardListeners();
    setupLaserPointer();
    setupTouchSwipe();
    startTimer(); // 自動啟動計時
});

// 切換投影片核心函數
function goToSlide(index) {
    if (index < 1) index = 1;
    if (index > totalSlides) index = totalSlides;

    // 紀錄最後一次主投影片位置
    if (currentIndex <= mainSlidesCount) {
        lastMainSlideIndex = currentIndex;
    }

    currentIndex = index;

    // 隱藏所有投影片，顯示當前
    document.querySelectorAll('.slide-view').forEach(el => {
        el.classList.remove('active');
    });

    const currentSlideEl = document.getElementById(`slide-${currentIndex}`);
    if (currentSlideEl) {
        currentSlideEl.classList.add('active');
        currentSlideEl.scrollTop = 0;
    }

    // 更新頂部資訊欄
    updateHeaderInfo();

    // 更新演講講稿內容
    updateSpeakerNotes();

    // 更新進度條
    updateProgressBar();

    // 更新全景目錄中選中狀態
    updateOverviewHighlight();

    // 更新 URL Hash
    if (currentIndex <= mainSlidesCount) {
        history.replaceState(null, '', `#${currentIndex}`);
    } else {
        history.replaceState(null, '', `#b${currentIndex - mainSlidesCount}`);
    }

    // 更新備用頁中的返回按鈕
    document.querySelectorAll('.return-slide-num').forEach(el => {
        el.textContent = lastMainSlideIndex;
    });
}

function nextSlide() {
    if (currentIndex < totalSlides) {
        goToSlide(currentIndex + 1);
    }
}

function prevSlide() {
    if (currentIndex > 1) {
        goToSlide(currentIndex - 1);
    }
}

function returnToLastMainSlide() {
    goToSlide(lastMainSlideIndex);
}

// 頂部資訊欄更新
function updateHeaderInfo() {
    const counterEl = document.getElementById('current-slide-counter');
    const sectionPill = document.getElementById('current-section-pill');

    if (currentIndex <= mainSlidesCount) {
        counterEl.textContent = `${String(currentIndex).padStart(2, '0')} / ${mainSlidesCount}`;
        counterEl.style.color = '#fbbf24';

        // 章節標籤
        const secMap = {
            1: "封面 ｜ 開題答辯",
            2: "第一部分 ｜ 選題背景",
            3: "第一部分 ｜ 題目解構",
            4: "第一部分 ｜ 選題論證",
            5: "第二部分 ｜ 學校生態",
            6: "第二部分 ｜ 管治基線",
            7: "第二部分 ｜ 拋節配額",
            8: "第二部分 ｜ 痛點收斂",
            9: "第三部分 ｜ 研究問題",
            10: "第三部分 ｜ 工作命題",
            11: "第四部分 ｜ 研究目標",
            12: "第五部分 ｜ 理論基石",
            13: "第五部分 ｜ 概念框架",
            14: "第五部分 ｜ 團隊操作化",
            15: "第六部分 ｜ 方法定位",
            16: "第六部分 ｜ 螺旋程序",
            17: "第六部分 ｜ 介入組件",
            18: "第六部分 ｜ 取證架構",
            19: "第六部分 ｜ 倫理防護",
            20: "第七部分 ｜ 垂直對齊",
            21: "第七部分 ｜ 進度路線",
            22: "第七部分 ｜ 預期成果",
            23: "第七部分 ｜ 組織保障",
            24: "第七部分 ｜ 研究邊界",
            25: "結語 ｜ 邁向百年",
            26: "致謝 ｜ 請益答辯"
        };
        sectionPill.textContent = secMap[currentIndex] || "開題答辯";
        sectionPill.style.background = "rgba(255, 255, 255, 0.12)";
        sectionPill.style.color = "#93c5fd";
    } else {
        const bIdx = currentIndex - mainSlidesCount;
        counterEl.textContent = `B${String(bIdx).padStart(2, '0')} / 10`;
        counterEl.style.color = '#f87171';
        sectionPill.textContent = `應答備用頁 ｜ Backup ${bIdx}`;
        sectionPill.style.background = "rgba(239, 68, 68, 0.2)";
        sectionPill.style.color = "#fca5a5";
    }
}

// 進度條更新
function updateProgressBar() {
    const fillEl = document.getElementById('progress-bar-fill');
    const ratio = (currentIndex / totalSlides) * 100;
    fillEl.style.width = `${ratio}%`;
}

function handleProgressClick(e) {
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    const targetIdx = Math.max(1, Math.min(totalSlides, Math.ceil(pct * totalSlides)));
    goToSlide(targetIdx);
}

// 講稿內容注入
function updateSpeakerNotes() {
    if (!window.DEFENSE_DECK) return;
    const sData = window.DEFENSE_DECK.slides[currentIndex - 1];
    if (!sData) return;

    const timeInd = document.getElementById('notes-time-indicator');
    const audInd = document.getElementById('notes-audience-indicator');
    const bodyEl = document.getElementById('notes-content-body');

    if (sData.type === 'main') {
        timeInd.textContent = `⏱️ 建議用時：${sData.audience_timing || '1.5 min'}`;
        audInd.textContent = `🎯 聽眾焦點：${sData.audience_timing ? sData.audience_timing.split('\n')[0] : '專家評委'}`;
    } else {
        timeInd.textContent = `🛡️ 應答武器庫：Backup ${currentIndex - mainSlidesCount}`;
        audInd.textContent = `🎯 提問情境：${sData.scenario || '專家提問'}`;
    }

    // 格式化講稿文本
    let speechHtml = '';
    if (sData.speech) {
        const lines = sData.speech.split('\n');
        speechHtml = lines.map(line => {
            let l = line.trim();
            if (!l) return '';
            // 標記
            l = l.replace(/(\[時間進度：[^\]]+\])/g, '<span class="notes-time-label" style="display:inline-block;margin-bottom:6px;">$1</span><br/>');
            l = l.replace(/(【切換投影片：[^】]+】)/g, '<span class="notes-switch-cue">🔄 $1</span>');
            l = l.replace(/(【(?!切換投影片)[^】]+】)/g, '<span class="notes-cue">👁️ $1</span>');
            return `<p style="margin-bottom: 14px;">${l}</p>`;
        }).join('');
    } else {
        speechHtml = '<p style="color:#94a3b8;">（本頁暫無逐字講稿，請聚焦投影片核心圖表自由發揮）</p>';
    }

    bodyEl.innerHTML = speechHtml;
    bodyEl.style.fontSize = `${noteFontSize}px`;
}

// 開關講稿抽屜
function toggleNotes() {
    isNotesOpen = !isNotesOpen;
    const drawer = document.getElementById('notes-drawer');
    const btn = document.getElementById('btn-notes');
    if (isNotesOpen) {
        drawer.classList.add('open');
        btn.classList.add('active');
    } else {
        drawer.classList.remove('open');
        btn.classList.remove('active');
    }
}

function adjustNoteFontSize(delta) {
    noteFontSize = Math.max(13, Math.min(26, noteFontSize + delta));
    const bodyEl = document.getElementById('notes-content-body');
    if (bodyEl) {
        bodyEl.style.fontSize = `${noteFontSize}px`;
    }
}

// 模態彈窗控制
function openBackupModal() {
    document.getElementById('backup-modal').classList.add('open');
}

function closeBackupModal() {
    document.getElementById('backup-modal').classList.remove('open');
}

function openOverviewModal() {
    document.getElementById('overview-modal').classList.add('open');
    updateOverviewHighlight();
}

function closeOverviewModal() {
    document.getElementById('overview-modal').classList.remove('open');
}

function handleModalOverlayClick(e, modalId) {
    if (e.target.id === modalId) {
        document.getElementById(modalId).classList.remove('open');
    }
}

function updateOverviewHighlight() {
    document.querySelectorAll('.overview-slide-card').forEach(c => c.classList.remove('current'));
    const currentCard = document.getElementById(`ov-card-${currentIndex}`);
    if (currentCard) {
        currentCard.classList.add('current');
    }
}

// 雷射筆
function toggleLaser() {
    isLaserActive = !isLaserActive;
    const layer = document.getElementById('laser-layer');
    const btn = document.getElementById('btn-laser');
    if (isLaserActive) {
        layer.classList.add('active');
        btn.classList.add('active');
    } else {
        layer.classList.remove('active');
        btn.classList.remove('active');
    }
}

function setupLaserPointer() {
    const dot = document.getElementById('laser-dot');
    document.addEventListener('mousemove', (e) => {
        if (isLaserActive) {
            dot.style.left = `${e.clientX}px`;
            dot.style.top = `${e.clientY}px`;
        }
    });
}

// 計時器
function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            renderTimerText();
        } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
        }
    }, 1000);
    renderTimerText();
}

function pauseTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = false;
    const timerBox = document.getElementById('timer-display');
    timerBox.style.opacity = '0.6';
}

function renderTimerText() {
    const timerBox = document.getElementById('timer-display');
    const timerText = document.getElementById('timer-text');
    timerBox.style.opacity = '1';

    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // 顏色預警：剩餘 10 分鐘（已用 30 分鐘）變黃；剩餘 5 分鐘（已用 35 分鐘）變紅
    if (timerSeconds <= 300) {
        timerBox.className = 'timer-box danger';
    } else if (timerSeconds <= 600) {
        timerBox.className = 'timer-box warning';
    } else {
        timerBox.className = 'timer-box';
    }
}

// 全螢幕切換
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Fullscreen error: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 鍵盤導航監聽
function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        // 如果在模態或輸入框中，不搶佔特定按鍵
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
            case 'Backspace':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides);
                break;
            case 's':
            case 'S':
                e.preventDefault();
                toggleNotes();
                break;
            case 'b':
            case 'B':
                e.preventDefault();
                openBackupModal();
                break;
            case 'o':
            case 'O':
                e.preventDefault();
                openOverviewModal();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                toggleLaser();
                break;
            case 't':
            case 'T':
                e.preventDefault();
                toggleTimer();
                break;
            case 'Escape':
                closeBackupModal();
                closeOverviewModal();
                if (isNotesOpen) toggleNotes();
                break;
        }
    });
}

// 觸控滑動支持（iPad / 手機）
function setupTouchSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // 水平滑動幅度大於 50px 且大於垂直滑動
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }, { passive: true });
}
