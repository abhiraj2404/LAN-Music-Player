// server.js
const express = require('express');
const WebSocket = require('ws');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.static('public'));
app.use('/songs', express.static('songs'));
app.use(fileUpload());

// Create songs directory if it doesn't exist
const songsDir = path.join(__dirname, 'songs');
if (!fs.existsSync(songsDir)) {
    fs.mkdirSync(songsDir);
}

// Add playlist storage path
const playlistPath = path.join(__dirname, 'playlist.json');

// Load saved playlist on startup
try {
    const savedData = fs.readFileSync(playlistPath, 'utf8');
    const savedState = JSON.parse(savedData);
    playlist = savedState.playlist || [];
    currentIndex = savedState.currentIndex || 0;
} catch (err) {
    console.log('No saved playlist found, starting fresh');
    playlist = [];
    currentIndex = 0;
}

// Function to save playlist state
function savePlaylistState() {
    const state = {
        playlist,
        currentIndex
    };
    fs.writeFileSync(playlistPath, JSON.stringify(state, null, 2));
}

// Track state
const clients = new Set();
let isPlaying = false;
let currentTime = 0;

// Handle file uploads
app.post('/upload', (req, res) => {
    if (!req.files || !req.files.song) {
        return res.status(400).send('No file uploaded');
    }

    const file = req.files.song;
    const filename = Date.now() + '-' + file.name.replace(/\s+/g, '-');
    const filepath = path.join(songsDir, filename);

    file.mv(filepath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        // Don't add to playlist here, let the WebSocket handler do it
        res.json({ filename });
    });
});

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New client connected');

    // Send current state to new client with the full playlist
    ws.send(JSON.stringify({
        type: 'syncPlaylist',
        songs: playlist,
        currentIndex,
        isPlaying,
        currentTime
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'play':
                isPlaying = true;
                broadcast({ type: 'play' });
                break;
            case 'pause':
                isPlaying = false;
                broadcast({ type: 'pause' });
                break;
            case 'updateTime':
                currentTime = data.time;
                broadcast({
                    type: 'syncTime',
                    time: currentTime
                });
                break;
            case 'addSong':
                playlist.push({
                    filename: data.filename,
                    title: data.title
                });
                savePlaylistState();
                broadcast({
                    type: 'syncPlaylist',
                    songs: playlist,
                    currentIndex,
                    isPlaying,
                    currentTime
                });
                break;
            case 'changeSong':
                currentIndex = data.index;
                savePlaylistState();
                broadcast({
                    type: 'syncPlaylist',
                    songs: playlist,
                    currentIndex,
                    isPlaying,
                    currentTime
                });
                break;
            case 'deleteSong':
                const songToDelete = playlist[data.index];
                if (songToDelete) {
                    const filepath = path.join(songsDir, songToDelete.filename);
                    fs.unlink(filepath, (err) => {
                        if (err) {
                            console.error('Failed to delete file:', err);
                        }
                    });
                    playlist.splice(data.index, 1);
                    savePlaylistState();
                    broadcast({
                        type: 'syncPlaylist',
                        songs: playlist,
                        currentIndex,
                        isPlaying,
                        currentTime
                    });
                }
                break;
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

server.listen(3000, () => {
    console.log('Server running on port 3000');
});