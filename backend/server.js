const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Store active sessions
const sessions = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: '🎬 4K Streaming App Server is Running!'
    }));
    return;
  }

  if (pathname === '/api/stream/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const streamId = Math.random().toString(36).substr(2, 9);
      const session = {
        id: streamId,
        startTime: Date.now(),
        participants: [],
        stats: { bitrate: 0, bandwidth: 0, packetLoss: 0 }
      };
      sessions.set(streamId, session);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        streamId,
        message: 'Stream session created'
      }));
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, '../frontend', pathname === '/' ? 'index.html' : pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.js') contentType = 'text/javascript';
    if (ext === '.json') contentType = 'application/json';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🎬 4K STREAMING APP - SERVER RUNNING               ║
║                                                       ║
║   Server: http://localhost:${PORT}                     ║
║   API: http://localhost:${PORT}/api/health            ║
║                                                       ║
║   Open your browser and navigate to the URL above    ║
╚═══════════════════════════════════════════════════════╝
  `);
  console.log('Press Ctrl+C to stop the server');
});
