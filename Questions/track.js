/* =========================================================
   COMMON TRACK PAGE JAVASCRIPT - MATH PREMIER LEAGUE
   
   Supports:
   - Dynamic Question Modals
   - Wild Card / Mystery Question Bidding Flow
   - 30-Second Countdown Timer with Warning & Times-Up States
   - Persistent Used Card State (marked ONLY after answer viewed)
   - Universal Game Reset with Cyber Toast Notification
   - Power-Up visual enhancement mode
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const questionCards =
    document.querySelectorAll(".question-card");

const popup =
    document.getElementById("questionPopup");

const popupTrack =
    document.getElementById("popupTrack");

const popupQuestion =
    document.getElementById("popupQuestion");

const popupPoints =
    document.getElementById("popupPoints");

const popupAnswer =
    document.getElementById("popupAnswer");

const closePopup =
    document.getElementById("closePopup");

const answerButton =
    document.getElementById("answerButton");

const homeButton =
    document.getElementById("homeButton");

const resetButton =
    document.getElementById("resetButton");

/* Bidding / Wild Card Modal Elements */
const biddingPopup =
    document.getElementById("biddingPopup");

const closeBidding =
    document.getElementById("closeBidding");

const revealQuestionBtn =
    document.getElementById("revealQuestionBtn");

/* Timer Elements */
const popupTimer =
    document.getElementById("popupTimer");

const timerCount =
    document.getElementById("timerCount");

/* Power-Up Elements */
let powerUpButton =
    document.getElementById("powerUpButton");

let powerUpPopup =
    document.getElementById("powerUpPopup");

let closePowerUp =
    document.getElementById("closePowerUp");

let powerUpBenefitText =
    document.getElementById("powerUpBenefitText");


/* =========================================================
   PERSISTENT USED QUESTIONS & RANDOM HIDDEN WILDCARDS
========================================================= */

function getCardKey(card, index) {
    const track = (card.dataset.track || '').trim().toUpperCase();
    const idx = (typeof index === 'number' && index >= 0)
        ? index
        : Array.from(questionCards).indexOf(card);
    const points = (card.dataset.points || '').toString().trim();
    return `${track}_${idx}_${points}`;
}

function initUsedQuestions() {
    try {
        const stored = JSON.parse(localStorage.getItem('mpl_used_questions') || '[]');
        questionCards.forEach((card, idx) => {
            const key = getCardKey(card, idx);
            const legacyKey = `${(card.dataset.track || '').trim().toUpperCase()}_${(card.dataset.points || idx).toString().trim()}`;
            if (stored.includes(key) || stored.includes(legacyKey)) {
                card.classList.add("used");
            }
        });
    } catch (e) { }
}

function getTrackKey() {
    if (questionCards.length > 0 && questionCards[0].dataset.track) {
        return questionCards[0].dataset.track.trim().toUpperCase();
    }
    return document.title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}

function isPowerupDisabledTrack() {
    const trackKey = getTrackKey();
    return (
        trackKey === 'RAPID FIRE' ||
        trackKey === 'RAPID_FIRE' ||
        trackKey === 'RAPIDFIRE' ||
        trackKey.includes('RAPID') ||
        trackKey === 'TIEBREAKER' ||
        trackKey.includes('TIEBREAKER')
    );
}

function initWildcards() {
    if (questionCards.length === 0) return;

    // Reset mystery dataset attributes on cards
    questionCards.forEach(card => {
        delete card.dataset.mystery;
    });

    // Rapid Fire and Tiebreaker tracks have only normal questions (no powerups or wildcards)
    if (isPowerupDisabledTrack()) {
        return;
    }

    const trackKey = getTrackKey();
    let wildcardMap = {};
    try {
        wildcardMap = JSON.parse(localStorage.getItem('mpl_wildcards') || '{}');
    } catch (e) {
        wildcardMap = {};
    }

    let wildcardIdx = wildcardMap[trackKey];

    // If wildcard index not yet set or invalid, randomly select one among all questions
    if (typeof wildcardIdx !== 'number' || wildcardIdx < 0 || wildcardIdx >= questionCards.length) {
        wildcardIdx = Math.floor(Math.random() * questionCards.length);
        wildcardMap[trackKey] = wildcardIdx;
        try {
            localStorage.setItem('mpl_wildcards', JSON.stringify(wildcardMap));
        } catch (e) { }
    }

    // Mark card as mystery in dataset only (hidden behind the question number on board)
    if (questionCards[wildcardIdx]) {
        questionCards[wildcardIdx].dataset.mystery = "true";
    }
}

initUsedQuestions();
initWildcards();


/* =========================================================
   COUNTDOWN TIMER & TIME'S UP "FAHHHHHH" SOUND
========================================================= */

let timerInterval = null;
let timeLeft = 30;

function getQuestionDuration(card, index) {
    const trackKey = getTrackKey();
    if (trackKey === 'RAPID FIRE' || trackKey === 'RAPID_FIRE' || trackKey === 'RAPIDFIRE' || trackKey.includes('RAPID')) {
        return 20;
    }
    if (trackKey === 'TIEBREAKER' || trackKey.includes('TIEBREAKER')) {
        return 30;
    }
    let idx = index;
    if (typeof idx !== 'number' || idx < 0) {
        idx = Array.from(questionCards).indexOf(card);
    }
    // q1: 25s, q2: 30s, q3: 35s, q4: 40s, q5: 45s, q6: 50s
    const durationMap = [25, 30, 35, 40, 45, 50];
    if (idx >= 0 && idx < durationMap.length) {
        return durationMap[idx];
    }
    return 30;
}

// Audio instance from sound folder
const timeUpAudio = new Audio("../sound/fahhh_KcgAXfs.mp3");
timeUpAudio.preload = "auto";

let isAudioUnlocked = false;
function unlockAudio() {
    if (isAudioUnlocked) return;
    isAudioUnlocked = true;
    try {
        const p = timeUpAudio.play();
        if (p !== undefined) {
            p.then(() => {
                timeUpAudio.pause();
                timeUpAudio.currentTime = 0;
            }).catch(() => {
                isAudioUnlocked = false;
            });
        }
    } catch (e) {}
}

document.addEventListener("click", unlockAudio, { once: true });

function stopTimesUpSound() {
    try {
        timeUpAudio.pause();
        timeUpAudio.currentTime = 0;
    } catch (e) {}
}

function playTimesUpSound() {
    stopTimesUpSound();

    const audioPaths = [
        "../sound/fahhh_KcgAXfs.mp3",
        "sound/fahhh_KcgAXfs.mp3",
        "../sound/fahhh.mp3",
        "sound/fahhh.mp3",
        "../assets/audio/fahhh_KcgAXfs.mp3"
    ];

    function tryPath(idx) {
        if (idx >= audioPaths.length) return;
        const soundSrc = audioPaths[idx];
        const audio = new Audio(soundSrc);
        audio.volume = 1.0;

        let failed = false;
        const next = () => {
            if (!failed) {
                failed = true;
                tryPath(idx + 1);
            }
        };

        audio.addEventListener("error", next);
        const p = audio.play();
        if (p !== undefined) {
            p.catch(next);
        }
    }

    tryPath(0);
}

function resetTimerDisplay(duration = 30) {
    timeLeft = duration;
    if (timerCount) {
        timerCount.textContent = timeLeft < 10 ? ('0' + Math.max(0, timeLeft)) : timeLeft;
    }
    if (popupTimer) {
        popupTimer.classList.remove("warning", "times-up");
    }
    stopTimesUpSound();
}

function stopQuestionTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function startQuestionTimer(duration = 30) {
    stopQuestionTimer();
    resetTimerDisplay(duration);

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerCount) {
            timerCount.textContent = timeLeft < 10 ? ('0' + Math.max(0, timeLeft)) : timeLeft;
        }

        if (timeLeft <= 10 && timeLeft > 0) {
            if (popupTimer) {
                popupTimer.classList.add("warning");
                popupTimer.classList.remove("times-up");
            }
        }

        if (timeLeft <= 0) {
            stopQuestionTimer();
            if (timerCount) {
                timerCount.textContent = "00";
            }
            if (popupTimer) {
                popupTimer.classList.remove("warning");
                popupTimer.classList.add("times-up");
            }
            playTimesUpSound();
        }
    }, 1000);
}


/* =========================================================
   QUESTION & BIDDING STATE
========================================================= */

let currentCard = null;
let currentCardIndex = -1;
let currentIsWildcard = false;
let pendingMysteryCard = null;
let pendingMysteryIndex = -1;


/* =========================================================
   6 EXCLUSIVE POWER-UP DEFINITIONS & NO-REPEAT ALLOCATION
========================================================= */

const POWER_UPS_POOL = [
    {
        id: "2x_reward",
        title: "2X THE REWARD!",
        icon: "⚡",
        desc: "You are earning DOUBLE POINTS for this question."
    },
    {
        id: "points_heist",
        title: "POINTS HEIST",
        icon: "💰",
        desc: "Steal 50% of the points from the other team’s correct answer."
    },
    {
        id: "one_more_question",
        title: "ONE MORE QUESTION!",
        icon: "🎯",
        desc: "Get an extra question to boost your score."
    },
    {
        id: "skip_turn",
        title: "SKIP THEIR TURN!",
        icon: "🚫",
        desc: "Force the other team to skip their next question. No question, no points!"
    },
    {
        id: "cut_reward",
        title: "CUT THEIR REWARD!",
        icon: "✂️",
        desc: "If the other team answers correctly, they receive only 50% of the points."
    },
    {
        id: "your_challenge",
        title: "YOUR QUESTION. THEIR CHALLENGE!",
        icon: "⚔️",
        desc: "Choose the next question and make the other team answer it. If they answer correctly, both teams receive 50% of the points!"
    }
];

function getPowerUpForCard(card, index) {
    if (!card) return POWER_UPS_POOL[0];

    const cardKey = getCardKey(card, index);
    let assignments = {};
    try {
        assignments = JSON.parse(localStorage.getItem('mpl_powerup_assignments') || '{}');
    } catch (e) {
        assignments = {};
    }

    // Return already assigned power-up for this card if present
    if (assignments[cardKey]) {
        const found = POWER_UPS_POOL.find(p => p.id === assignments[cardKey]);
        if (found) return found;
    }

    // Ensure power-ups do not repeat across assigned cards/tracks
    const assignedIds = Object.values(assignments);
    let available = POWER_UPS_POOL.filter(p => !assignedIds.includes(p.id));

    // If all 6 power-ups have already been assigned, restart clean draw pool
    if (available.length === 0) {
        available = [...POWER_UPS_POOL];
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    assignments[cardKey] = chosen.id;
    try {
        localStorage.setItem('mpl_powerup_assignments', JSON.stringify(assignments));
    } catch (e) { }

    return chosen;
}

function closePowerUpModal() {
    if (powerUpPopup) {
        powerUpPopup.classList.remove("active");
    }
}

function renderPowerUpModal(card, index) {
    const powerUp = getPowerUpForCard(card, index);
    ensurePowerUpElements();

    if (powerUpPopup) {
        const powerUpBox = powerUpPopup.querySelector(".powerup-box");
        if (powerUpBox) {
            powerUpBox.innerHTML = `
                <button class="close-powerup" id="closePowerUp">×</button>
                <div class="powerup-badge">⚡ POWER-UP UNLOCKED! ⚡</div>
                <div class="powerup-card-body">
                    <div class="powerup-icon-badge">${powerUp.icon}</div>
                    <div class="powerup-title">${powerUp.title}</div>
                    <div class="powerup-benefit-text">${powerUp.desc}</div>
                </div>
                <button type="button" class="powerup-claim-btn" id="claimPowerUpBtn">CLAIM POWER-UP</button>
            `;

            const newClose = powerUpBox.querySelector("#closePowerUp");
            if (newClose) newClose.addEventListener("click", closePowerUpModal);

            const claimBtn = powerUpBox.querySelector("#claimPowerUpBtn");
            if (claimBtn) claimBtn.addEventListener("click", closePowerUpModal);
        }

        powerUpPopup.classList.add("active");
    }
}

function ensurePowerUpElements() {
    if (isPowerupDisabledTrack()) {
        if (powerUpButton) powerUpButton.style.display = "none";
        if (powerUpPopup) powerUpPopup.classList.remove("active");
        return;
    }

    if (!powerUpButton) {
        powerUpButton = document.getElementById("powerUpButton");
    }
    if (!powerUpButton) {
        const popupContent = document.querySelector(".popup-content");
        if (popupContent) {
            powerUpButton = document.createElement("button");
            powerUpButton.id = "powerUpButton";
            powerUpButton.className = "powerup-button";
            powerUpButton.innerHTML = "<span>⚡ POWER UP</span>";
            powerUpButton.style.display = "none";
            popupContent.appendChild(powerUpButton);
        }
    }

    if (!powerUpPopup) {
        powerUpPopup = document.getElementById("powerUpPopup");
    }
    if (!powerUpPopup) {
        powerUpPopup = document.createElement("div");
        powerUpPopup.id = "powerUpPopup";
        powerUpPopup.className = "powerup-popup";
        powerUpPopup.innerHTML = `
            <div class="powerup-box">
                <button class="close-powerup" id="closePowerUp">×</button>
                <div class="powerup-badge">⚡ POWER-UP UNLOCKED! ⚡</div>
                <div class="powerup-card-body">
                    <div class="powerup-icon-badge">⚡</div>
                    <div class="powerup-title">2X THE REWARD!</div>
                    <div class="powerup-benefit-text">You are earning DOUBLE POINTS for this question.</div>
                </div>
                <button type="button" class="powerup-claim-btn" id="claimPowerUpBtn">CLAIM POWER-UP</button>
            </div>
        `;
        document.body.appendChild(powerUpPopup);
    }

    closePowerUp = document.getElementById("closePowerUp");

    if (powerUpButton && !powerUpButton._hasPowerUpListener) {
        powerUpButton._hasPowerUpListener = true;
        powerUpButton.addEventListener("click", () => {
            renderPowerUpModal(currentCard, currentCardIndex);
        });
    }

    if (closePowerUp && !closePowerUp._hasPowerUpListener) {
        closePowerUp._hasPowerUpListener = true;
        closePowerUp.addEventListener("click", closePowerUpModal);
    }

    if (powerUpPopup && !powerUpPopup._hasPowerUpListener) {
        powerUpPopup._hasPowerUpListener = true;
        powerUpPopup.addEventListener("click", event => {
            if (event.target === powerUpPopup) {
                closePowerUpModal();
            }
        });
    }
}

// Ensure elements ready
ensurePowerUpElements();
document.addEventListener("DOMContentLoaded", ensurePowerUpElements);


/* =========================================================
   OPEN QUESTION MODAL
========================================================= */

function openQuestionModal(card, index) {
    if (!card) return;
    unlockAudio();
    ensurePowerUpElements();

    currentCard = card;
    currentCardIndex = index;
    currentIsWildcard = !isPowerupDisabledTrack() && (card.dataset.mystery === "true");

    // Ensure PowerUp button is hidden initially
    if (powerUpButton) {
        powerUpButton.style.display = "none";
    }
    closePowerUpModal();

    const track = card.dataset.track || '';
    const question = card.dataset.question || '';
    const points = card.dataset.points || '';
    const answer = card.dataset.answer || '';
    const isMystery = !isPowerupDisabledTrack() && (card.dataset.mystery === "true");
    const audioSrc = (card.dataset.audio || '').trim();

    if (popupTrack) {
        popupTrack.innerHTML = isMystery
            ? `${track} &bull; <span style="color: var(--gold); text-shadow: 0 0 10px rgba(240,180,41,0.5);">WILD CARD</span>`
            : track;
    }

    const duration = getQuestionDuration(card, index);

    // Support audio clue (Song track / Music clips)
    if (audioSrc && audioSrc !== '' && audioSrc !== '#') {
        const textContent = question || '';

        // Stage 1: Music Player & Move to Question button
        if (popupQuestion) {
            popupQuestion.innerHTML = `
                <div class="popup-music-container" id="popupMusicContainer">
                    <div class="popup-music-header">
                        <div class="music-disc-icon-wrap rotating">
                            <span class="music-icon">🎵</span>
                        </div>
                        <div class="music-track-info">
                            <div class="music-badge">AUDIO CLUE</div>
                            <div class="music-title">Play & Listen to Song Clip</div>
                        </div>
                    </div>
                    <audio class="popup-music-audio" id="songAudioPlayer" src="${audioSrc}" controls autoplay></audio>
                    <button type="button" class="proceed-to-question-btn" id="proceedToQuestionBtn">
                        <span>Move to Question ➔</span>
                    </button>
                </div>
                <div class="popup-question-text" id="songQuestionText" style="display: none;">
                    ${textContent}
                </div>
            `;
        }

        // Hide answer button until question is revealed
        if (answerButton) {
            answerButton.style.display = "none";
        }

        // Reset timer display and wait until "Move to Question" is clicked
        stopQuestionTimer();
        resetTimerDisplay(duration);

        // Bind "Move to Question" button
        const proceedBtn = document.getElementById("proceedToQuestionBtn");
        const songContainer = document.getElementById("popupMusicContainer");
        const songText = document.getElementById("songQuestionText");

        if (proceedBtn) {
            proceedBtn.addEventListener("click", () => {
                if (songContainer) songContainer.style.display = "none";
                if (songText) songText.style.display = "block";
                if (answerButton) answerButton.style.display = "inline-flex";

                // Start countdown timer once question text is revealed!
                startQuestionTimer(duration);
            }, { once: true });
        }
    } else {
        // Normal question (Text, Video, Photo, or Standard)
        if (answerButton) {
            answerButton.style.display = "inline-flex";
        }

        const clueVideo = card.querySelector('.question-video, video');
        const clueImg = card.querySelector('.question-img, img');
        const clueText = card.querySelector('.question-text');
        let finalQuestionContent = '';

        if (clueVideo) {
            const videoSrc = (clueVideo.getAttribute('src') || clueVideo.currentSrc || '').trim();
            const textContent = clueText ? clueText.innerHTML.trim() : (question || '');

            if (videoSrc && videoSrc !== '' && videoSrc !== '#') {
                finalQuestionContent = `
                    <div class="popup-photo-container">
                        <video src="${videoSrc}" class="popup-video-clue" controls autoplay loop playsinline></video>
                    </div>
                    <div class="popup-question-text">${textContent}</div>
                `;
            } else {
                finalQuestionContent = `
                    <div class="popup-question-text">${textContent}</div>
                `;
            }
        } else if (clueImg || clueText) {
            const imgSrc = clueImg ? (clueImg.getAttribute('src') || '').trim() : '';
            const textContent = clueText ? clueText.innerHTML.trim() : (question || '');

            if (imgSrc && imgSrc !== '' && imgSrc !== '#') {
                finalQuestionContent = `
                    <div class="popup-photo-container">
                        <img src="${imgSrc}" alt="Question Clue" class="popup-photo-clue" onerror="this.parentElement.style.display='none'">
                    </div>
                    <div class="popup-question-text">${textContent}</div>
                `;
            } else {
                // src is empty — show text question only without broken image icon
                finalQuestionContent = `
                    <div class="popup-question-text">${textContent}</div>
                `;
            }
        } else {
            finalQuestionContent = question;
        }

        if (popupQuestion) popupQuestion.innerHTML = finalQuestionContent;

        // Start countdown timer immediately for normal questions
        startQuestionTimer(duration);
    }

    if (popupPoints) popupPoints.textContent = points;
    if (popupAnswer) popupAnswer.textContent = answer;

    // Reset answer reveal
    if (popupAnswer) popupAnswer.classList.remove("show");
    if (answerButton) answerButton.textContent = "SHOW ANSWER";

    // Show question popup
    if (popup) popup.classList.add("active");
}


/* =========================================================
   CARD CLICK HANDLER (REGULAR & MYSTERY)
========================================================= */

questionCards.forEach((card, index) => {
    card.addEventListener("click", () => {
        unlockAudio();
        const isMystery = !isPowerupDisabledTrack() && (card.dataset.mystery === "true");
        const isRevealed = card.dataset.revealed === "true";
        const isUsed = card.classList.contains("used");

        // Hidden wildcard: pop up the Wild Card bidding modal first
        if (isMystery && !isRevealed && !isUsed) {
            pendingMysteryCard = card;
            pendingMysteryIndex = index;
            if (biddingPopup) {
                biddingPopup.classList.add("active");
            } else {
                openQuestionModal(card, index);
            }
        } else {
            openQuestionModal(card, index);
        }
    });
});


/* =========================================================
   BIDDING MODAL HANDLERS
========================================================= */

if (revealQuestionBtn) {
    revealQuestionBtn.addEventListener("click", () => {
        if (biddingPopup) biddingPopup.classList.remove("active");
        if (pendingMysteryCard) {
            pendingMysteryCard.dataset.revealed = "true";
            openQuestionModal(pendingMysteryCard, pendingMysteryIndex);
            pendingMysteryCard = null;
            pendingMysteryIndex = -1;
        }
    });
}

function closeBiddingModal() {
    if (biddingPopup) biddingPopup.classList.remove("active");
    pendingMysteryCard = null;
    pendingMysteryIndex = -1;
}

if (closeBidding) {
    closeBidding.addEventListener("click", closeBiddingModal);
}

if (biddingPopup) {
    biddingPopup.addEventListener("click", event => {
        if (event.target === biddingPopup) {
            closeBiddingModal();
        }
    });
}


/* =========================================================
   CLOSE QUESTION MODAL
========================================================= */

function closeQuestion() {
    if (popup) {
        popup.querySelectorAll('video, audio').forEach(media => {
            try { media.pause(); media.currentTime = 0; } catch(e) {}
        });
        popup.classList.remove("active");
    }
    if (popupAnswer) popupAnswer.classList.remove("show");
    if (powerUpButton) powerUpButton.style.display = "none";
    if (answerButton) answerButton.style.display = "inline-flex";
    closePowerUpModal();
    stopQuestionTimer();
    resetTimerDisplay();
}

if (closePopup) {
    closePopup.addEventListener("click", closeQuestion);
}

if (popup) {
    popup.addEventListener("click", event => {
        if (event.target === popup) {
            closeQuestion();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closePowerUpModal();
        closeBiddingModal();
        closeQuestion();
    }
});


/* =========================================================
   SHOW / HIDE ANSWER & MARK USED WHEN VIEWED
========================================================= */

if (answerButton) {
    answerButton.addEventListener("click", () => {
        const visible = popupAnswer && popupAnswer.classList.contains("show");

        if (visible) {
            popupAnswer.classList.remove("show");
            answerButton.textContent = "SHOW ANSWER";
            if (powerUpButton) {
                powerUpButton.style.display = "none";
            }
        } else {
            if (popupAnswer) popupAnswer.classList.add("show");
            answerButton.textContent = "HIDE ANSWER";

            // Stop timer once answer is viewed
            stopQuestionTimer();

            // Reveal PowerUp button if this was a Wild Card question
            if (currentIsWildcard && powerUpButton) {
                powerUpButton.style.display = "inline-flex";
            }

            /* -----------------------------------------
               Mark question as used ONLY when answer is viewed
            ----------------------------------------- */
            if (currentCard) {
                currentCard.classList.add("used");

                try {
                    const key = getCardKey(currentCard, currentCardIndex);
                    let stored = JSON.parse(localStorage.getItem('mpl_used_questions') || '[]');
                    if (!stored.includes(key)) {
                        stored.push(key);
                        localStorage.setItem('mpl_used_questions', JSON.stringify(stored));
                    }
                } catch (e) { }
            }
        }
    });
}


/* =========================================================
   HOME BUTTON
========================================================= */

if (homeButton) {
    homeButton.addEventListener("click", () => {
        window.location.href = "../index.html";
    });
}


/* =========================================================
   RESET ENTIRE GAME
========================================================= */

function showResetToast(msg) {
    let toast = document.getElementById("gameResetToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "gameResetToast";
        toast.className = "cyber-toast";
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="toast-icon">↻</span> <span class="toast-text">${msg || "GAME RESET"}</span>`;
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

    if (toast.timer) clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

if (resetButton) {
    resetButton.addEventListener("click", () => {
        questionCards.forEach(card => {
            card.classList.remove("used");
            card.style.boxShadow = "";
            delete card.dataset.revealed;
        });

        // Reset entire game: unmark all questions, wildcards and power-up assignments across all tracks
        try {
            localStorage.removeItem('mpl_used_questions');
            localStorage.removeItem('mpl_wildcards');
            localStorage.removeItem('mpl_powerup_assignments');
        } catch (e) { }

        // Re-randomize wildcard for current track
        initWildcards();

        // Show Game Reset message
        showResetToast("⚡ GAME RESET — ALL QUESTIONS RESTORED");

        closeBiddingModal();
        closeQuestion();
    });
}