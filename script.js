const video = document.getElementById('video');
const playerContainer = document.getElementById('player-container');
const setupUI = document.getElementById('setup-ui');
const streamInput = document.getElementById('stream-url');
const loadBtn = document.getElementById('load-btn');
const spinner = document.getElementById('spinner');
const controls = document.getElementById('video-controls');
const errorDisplay = document.getElementById('error-display');

let hls = null;

// Initialize Settings from LocalStorage
const savedVolume = localStorage.getItem('playerVolume') || 1;
const savedSpeed = localStorage.getItem('playerSpeed') || 1;
video.volume = savedVolume;
video.playbackRate = savedSpeed;
document.getElementById('volume-slider').value = savedVolume;
document.getElementById('speed-control').value = savedSpeed;

// --- CORE PLAYBACK LOGIC ---

function loadStream(url) {
    if (!url) return;
    
    // Clear previous instance
    if (hls) {
        hls.destroy();
    }
    
    spinner.classList.remove('hidden');
    setupUI.classList.add('hidden');
    controls.classList.remove('hidden');
    errorDisplay.textContent = "";

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log("Autoplay blocked"));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) handleError("Stream loading failed.");
        });
    } 
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari/iOS)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    } else {
        handleError("Your browser does not support HLS playback.");
    }
}

function handleError(msg) {
    spinner.classList.add('hidden');
    setupUI.classList.remove('hidden');
    errorDisplay.textContent = msg;
}

// --- UI CONTROLS ---

// Play/Pause toggle
const playPauseBtn = document.getElementById('play-pause');
playPauseBtn.onclick = () => video.paused ? video.play() : video.pause();
video.onplay = () => playPauseBtn.textContent = '⏸';
video.onpause = () => playPauseBtn.textContent = '▶';

// Volume & Mute
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');

volumeSlider.oninput = (e) => {
    video.volume = e.target.value;
    video.muted = video.volume === 0;
    localStorage.setItem('playerVolume', video.volume);
    updateMuteIcon();
};

muteBtn.onclick = () => {
    video.muted = !video.muted;
    updateMuteIcon();
};

function updateMuteIcon() {
    muteBtn.textContent = (video.muted || video.volume === 0) ? '🔇' : '🔊';
}

// Progress Bar
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');

video.ontimeupdate = () => {
    const percent = (video.currentTime / video.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    currentTimeDisplay.textContent = formatTime(video.currentTime);
};

video.onloadedmetadata = () => {
    durationDisplay.textContent = formatTime(video.duration);
    spinner.classList.add('hidden');
};

progressBar.onclick = (e) => {
    const scrubTime = (e.offsetX / progressBar.offsetWidth) * video.duration;
    video.currentTime = scrubTime;
};

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}` : `${m}:${s < 10 ? '0'+s : s}`;
}

// Playback Speed
document.getElementById('speed-control').onchange = (e) => {
    video.playbackRate = parseFloat(e.target.value);
    localStorage.setItem('playerSpeed', video.playbackRate);
};

// Fullscreen
document.getElementById('fullscreen-btn').onclick = () => {
    if (!document.fullscreenElement) {
        playerContainer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

// PiP
document.getElementById('pip-btn').onclick = async () => {
    try {
        if (video !== document.pictureInPictureElement) {
            await video.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
    } catch (error) {
        console.error("PiP failed", error);
    }
};

// --- KEYBOARD SHORTCUTS ---

window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return;
    
    switch(e.code) {
        case 'Space': e.preventDefault(); playPauseBtn.click(); break;
        case 'ArrowRight': video.currentTime += 5; break;
        case 'ArrowLeft': video.currentTime -= 5; break;
        case 'ArrowUp': 
            e.preventDefault(); 
            video.volume = Math.min(1, video.volume + 0.1); 
            volumeSlider.value = video.volume;
            break;
        case 'ArrowDown': 
            e.preventDefault(); 
            video.volume = Math.max(0, video.volume - 0.1); 
            volumeSlider.value = video.volume;
            break;
        case 'KeyF': document.getElementById('fullscreen-btn').click(); break;
        case 'KeyM': muteBtn.click(); break;
    }
});

// --- UTILITIES & EMBED LOGIC ---

loadBtn.onclick = () => loadStream(streamInput.value);

// Auto-load if URL parameter is present
const urlParams = new URLSearchParams(window.location.search);
const streamUrl = urlParams.get('url');
const isEmbed = urlParams.get('embed');

if (streamUrl) {
    streamInput.value = streamUrl;
    loadStream(streamUrl);
}

if (isEmbed === 'true') {
    playerContainer.classList.add('embed-mode');
}

// Copy Player Link
document.getElementById('copy-link-btn').onclick = () => {
    const url = streamInput.value;
    if (!url) return alert("Enter a stream URL first!");
    const shareLink = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert("Player link copied to clipboard!");
    });
};

// Auto-hide controls when mouse is idle
let timeout;
playerContainer.onmousemove = () => {
    if (video.paused) return;
    controls.classList.remove('hidden');
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        if (!video.paused) controls.classList.add('hidden');
    }, 3000);
};
