let ws;
let isServer = true; // Set to true on the controlling device
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const status = document.getElementById('status');
// Add new elements
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');

// Connect to WebSocket server
function connect() {
    ws = new WebSocket('ws://' + window.location.hostname + ':3000');

    ws.onopen = () => {
        status.textContent = 'Connected';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'play':
                audioPlayer.play();
                break;
            case 'pause':
                audioPlayer.pause();
                break;
            case 'syncTime':
                if (Math.abs(audioPlayer.currentTime - data.time) > 0.5) {
                    audioPlayer.currentTime = data.time;
                }
                break;
            case 'syncState':
                if (data.isPlaying) {
                    audioPlayer.play();
                }
                audioPlayer.currentTime = data.currentTime;
                break;
        }
    };

    ws.onclose = () => {
        status.textContent = 'Disconnected. Reconnecting...';
        setTimeout(connect, 1000);
    };
}

// Only show controls on server
if (!isServer) {
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
}

// Event listeners for controls (server only)
if (isServer) {
    playBtn.onclick = () => {
        ws.send(JSON.stringify({ type: 'play' }));
    };

    pauseBtn.onclick = () => {
        ws.send(JSON.stringify({ type: 'pause' }));
    };

    // Sync time periodically
    setInterval(() => {
        if (!audioPlayer.paused) {
            ws.send(JSON.stringify({
                type: 'updateTime',
                time: audioPlayer.currentTime
            }));
        }
    }, 1000);
}

// Add time formatting helper
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update progress bar and time display
audioPlayer.addEventListener('timeupdate', () => {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = percent;
    currentTime.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audioPlayer.duration);
    progressBar.value = 0;
});

// Handle seeking
progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audioPlayer.duration;
    currentTime.textContent = formatTime(time);
});

progressBar.addEventListener('change', () => {
    const time = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
    if (isServer) {
        ws.send(JSON.stringify({
            type: 'updateTime',
            time: time
        }));
    }
});

// Initialize connection
connect();