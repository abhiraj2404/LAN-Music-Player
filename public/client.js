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
const playlist = document.getElementById('playlist');
const fileInput = document.getElementById('fileInput');
const currentSongTitle = document.getElementById('currentSongTitle');

let currentPlaylistIndex = 0;
let songs = [];

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
            case 'syncPlaylist':
                songs = data.songs || [];
                currentPlaylistIndex = data.currentIndex;
                updatePlaylistUI();
                
                // Load the current song if we have songs and no audio is playing
                if (songs.length > 0) {
                    const currentSong = songs[currentPlaylistIndex];
                    const newSrc = `/songs/${currentSong.filename}`;
                    
                    if (audioPlayer.src !== newSrc) {
                        audioPlayer.src = newSrc;
                        currentSongTitle.textContent = currentSong.title;
                    }
                    
                    if (data.isPlaying) {
                        audioPlayer.currentTime = data.currentTime;
                        audioPlayer.play();
                    }
                } else {
                    currentSongTitle.textContent = 'No song playing';
                    audioPlayer.src = '';
                }
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

    // Add file input handler (server only)
    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('song', file);
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                ws.send(JSON.stringify({
                    type: 'addSong',
                    filename: data.filename,
                    title: file.name
                }));
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
    };
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

function addSongToPlaylist(filename, title) {
    songs.push({ filename, title });
    updatePlaylistUI();
}

function updatePlaylistUI() {
    playlist.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${
            index === currentPlaylistIndex ? 'bg-blue-50' : ''
        }`;
        
        // Add playing indicator
        if (index === currentPlaylistIndex) {
            const playingIcon = document.createElement('span');
            playingIcon.className = 'text-blue-500';
            playingIcon.innerHTML = '▶'; // or use an SVG icon
            li.appendChild(playingIcon);
        }
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'truncate';
        titleSpan.textContent = song.title;
        li.appendChild(titleSpan);
        
        if (isServer) {
            li.onclick = () => {
                currentPlaylistIndex = index;
                loadAndPlaySong(song.filename, song.title);
                ws.send(JSON.stringify({
                    type: 'changeSong',
                    index: index
                }));
            };
        }
        
        playlist.appendChild(li);
    });
}

function loadAndPlaySong(filename, title) {
    const newSrc = `/songs/${filename}`;
    if (audioPlayer.src !== newSrc) {
        audioPlayer.src = newSrc;
        currentSongTitle.textContent = title;
        audioPlayer.play();
        if (isServer) {
            ws.send(JSON.stringify({ type: 'play' }));
        }
    }
}

// Handle end of song
audioPlayer.addEventListener('ended', () => {
    if (isServer && songs.length > 0) {
        currentPlaylistIndex = (currentPlaylistIndex + 1) % songs.length;
        const nextSong = songs[currentPlaylistIndex];
        loadAndPlaySong(nextSong.filename, nextSong.title);
        updatePlaylistUI();
        ws.send(JSON.stringify({
            type: 'changeSong',
            index: currentPlaylistIndex
        }));
    }
});

// Initialize connection
connect();