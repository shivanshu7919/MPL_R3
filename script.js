// =========================================
// TRACK DATA
// =========================================

const tracks = {

    "Sports": {
        icon: "🏆",
        description: "Test your knowledge of sports, players, teams and legendary moments."
    },

    "Movies": {
        icon: "🎬",
        description: "Lights, camera, action! Identify movies, characters and famous scenes."
    },

    "Cartoons": {
        icon: "📺",
        description: "Test your knowledge of classic animations, iconic characters, and beloved animated worlds!"
    },

    "Memes": {
        icon: "📺",
        description: "Test your knowledge of classic animations, iconic characters, and beloved animated worlds!"
    },

    "Tiebreaker": {
        icon: "🏆",
        description: "The final challenge. Only the sharpest minds survive the tiebreaker."
    },

    "Maths": {
        icon: "π",
        description: "Put your mathematical skills and problem-solving abilities to the test."
    },

    "Songs": {
        icon: "♫",
        description: "Recognize songs, artists, lyrics and iconic musical moments."
    },

    "Games": {
        icon: "🎮",
        description: "Level up! Challenge yourself with questions from the world of gaming."
    },

    "Rapid Fire": {
        icon: "⚡",
        description: "No time to think. Answer as many questions as possible!"
    }

};


// =========================================
// ELEMENTS
// =========================================

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupText = document.getElementById("popupText");
const popupIcon = document.getElementById("popupIcon");

let selectedTrack = "";


// =========================================
// OPEN TRACK
// =========================================

function openTrack(trackName) {

    selectedTrack = trackName;

    const track = tracks[trackName];

    popupTitle.textContent = trackName.toUpperCase();

    popupText.textContent = track.description;

    popupIcon.textContent = track.icon;

    popup.classList.add("active");
}


// =========================================
// CLOSE POPUP
// =========================================

function closePopup() {

    popup.classList.remove("active");
}


// =========================================
// START TRACK
// =========================================

function startTrack() {

    alert(
        `Starting ${selectedTrack} track!`
    );

    closePopup();
}


// =========================================
// HOME BUTTON
// =========================================

function goHome() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================================
// RESET
// =========================================

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

function resetGame() {

    closePopup();

    document.body.classList.remove("powered");

    document.querySelectorAll(".track-card")
        .forEach(card => {

            card.style.boxShadow = "";

        });

    // Reset entire game - unmark all questions and re-randomize wildcards across all tracks
    try {
        localStorage.removeItem('mpl_used_questions');
        localStorage.removeItem('mpl_wildcards');
    } catch(e) {}

    // Show Game Reset message
    showResetToast("⚡ GAME RESET — ALL QUESTIONS RESTORED");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================================
// CLOSE POPUP WHEN CLICKING OUTSIDE
// =========================================

popup.addEventListener("click", function(event) {

    if (event.target === popup) {
        closePopup();
    }

});


// =========================================
// ESC KEY
// =========================================

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closePopup();
    }

});


// =========================================
// INTERACTIVE TECH FONT SWITCHER
// =========================================

const fontBtns = document.querySelectorAll('.fs-btn');
const wordmarkLine = document.querySelector('h1.wordmark .line1');

function setMathFont(fontName) {
    if (!wordmarkLine) return;
    wordmarkLine.classList.remove('font-chakra', 'font-audiowide', 'font-teko', 'font-syne');
    if (fontName && fontName !== 'michroma') {
        wordmarkLine.classList.add('font-' + fontName);
    }
    fontBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-font') === fontName);
    });
    try {
        localStorage.setItem('mpl_math_font', fontName);
    } catch(e) {}
}

fontBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const font = this.getAttribute('data-font');
        setMathFont(font);
    });
});

try {
    const savedFont = localStorage.getItem('mpl_math_font');
    if (savedFont) {
        setMathFont(savedFont);
    }
} catch(e) {}
