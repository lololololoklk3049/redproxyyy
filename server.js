const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { epoxyServer } = require('epoxy-client');
const { scramjetPath } = require("@mercuryworkshop/scramjet/path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scram', express.static(path.join(__dirname, 'node_modules/@mercuryworkshop/scramjet/dist')));

// Epoxy WebSocket server for Wisp protocol
wss.on('connection', (ws, req) => {
    if (req.url?.startsWith('/wisp/')) {
        const epoxy = new epoxyServer(ws, {
            type: 'websocket',
            onClose: () => console.log('Epoxy connection closed'),
            onError: (err) => console.error('Epoxy error:', err)
        });
        
        ws.on('message', (data) => {
            try {
                epoxy.handle(data);
            } catch (err) {
                console.error('Epoxy handle error:', err);
            }
        });
        
        ws.on('close', () => epoxy.close());
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle proxy requests
app.all('/proxy/*', async (req, res) => {
    // Scramjet will handle these through service worker
    res.status(404).send('Proxy requests handled by service worker');
});

const PORT = process.env.PORT || 1337;
server.listen(PORT, () => {
    console.log(`🔥 Red Proxy running at http://localhost:${PORT}`);
    console.log(`📡 Epoxy/Wisp server ready for connections`);
});
