// server.js
const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Track connected clients
const clients = new Set();
let isPlaying = false;
let currentTime = 0;

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New client connected');

    // Send current playback state to new client
    ws.send(JSON.stringify({
        type: 'syncState',
        isPlaying: isPlaying,
        currentTime: currentTime
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