/**
 * Quick Start Guide - Code Examples
 */

// ==========================================
// 1. STARTING A STREAM (Host)
// ==========================================

// Client-side code (JavaScript)
async function startStreamAsHost() {
  // Get user media
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { 
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 60 }
    },
    audio: true
  });

  // Display in video element
  document.getElementById('main-video').srcObject = stream;

  // Create stream on server
  const response = await fetch('/api/stream/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'my-user-id',
      title: 'My Awesome Stream',
      quality: '1080p60'
    })
  });

  const { streamId } = await response.json();

  // Join stream via WebSocket
  socket.emit('join-stream', {
    streamId,
    userId: 'my-user-id',
    role: 'host'
  });

  console.log('Stream started! Share this ID:', streamId);
}

// ==========================================
// 2. JOINING A STREAM (Participant)
// ==========================================

async function joinStreamAsParticipant(streamId, userName) {
  // Get user media
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { ideal: 1920, height: { ideal: 1080 } },
    audio: true
  });

  // Display locally
  document.getElementById('main-video').srcObject = stream;

  // Join stream
  socket.emit('join-stream', {
    streamId,
    userId: userName,
    role: 'participant'
  });

  // Create offer to establish peer connection
  const offer = await webrtcManager.createOffer('host');
  socket.emit('offer', {
    streamId,
    to: 'host',
    offer
  });
}

// ==========================================
// 3. MONITORING NETWORK QUALITY
// ==========================================

// Get real-time network stats
async function monitorNetwork() {
  setInterval(async () => {
    const stats = await webrtcManager.getPeerStats('peer-id');
    
    console.log('Video Bitrate:', stats.video.bytesSent * 8, 'bps');
    console.log('Packet Loss:', stats.video.packetsLost, 'packets');
    console.log('Jitter:', stats.audio.jitter * 1000, 'ms');
    console.log('RTT:', stats.connection.roundTripTime * 1000, 'ms');

    // Send to server for adaptive bitrate adjustment
    socket.emit('network-stats', {
      streamId,
      bandwidth: stats.connection.availableBitrate / 1000,
      packetLoss: (stats.video.packetsLost / 1000) * 100,
      jitter: stats.audio.jitter * 1000
    });
  }, 1000);
}

// ==========================================
// 4. HANDLING QUALITY RECOMMENDATIONS
// ==========================================

socket.on('quality-recommendation', (data) => {
  console.log(`Suggested quality: ${data.suggested}`);
  console.log(`Current quality: ${data.current}`);

  // Auto-switch if bandwidth improved significantly
  if (isQualityUpgrade(data.current, data.suggested)) {
    switchQuality(data.suggested);
  }
});

// ==========================================
// 5. SERVER-SIDE: PROCESSING STREAMS
// ==========================================

// In backend/server.js
const streamingManager = new StreamingManager();

// Create HLS segments
app.post('/api/stream/:streamId/transcode', async (req, res) => {
  const { quality } = req.body;
  
  const profile = streamingManager.videoProfiles[quality];
  const outputPath = `/streams/${streamId}/${quality}`;

  // Transcode video
  const result = await streamingManager.transcodeMultiQuality(
    inputVideoPath,
    streamId
  );

  res.json({ success: true, profiles: result });
});

// ==========================================
// 6. ADAPTIVE BITRATE SELECTION
// ==========================================

const adaptiveBitrate = new AdaptiveBitrate();

function selectQuality(networkStats) {
  const recommendation = adaptiveBitrate.recommendQuality({
    bandwidth: 5000,          // kbps
    packetLoss: 1.5,          // %
    jitter: 45,               // ms
    bufferLength: 10          // seconds
  });

  console.log('Recommended quality:', recommendation.recommended);
  console.log('Network quality:', recommendation.networkMetrics.quality);
  
  return recommendation;
}

// ==========================================
// 7. DATA OPTIMIZATION
// ==========================================

const dataOptimizer = new DataOptimizer();

function optimizeStream(networkStats) {
  const optimization = dataOptimizer.optimizeTransmission({
    bandwidth: 3000,
    packetLoss: 2,
    jitter: 80
  });

  console.log('Compression level:', optimization.compression.level);
  console.log('Data reduction:', optimization.compression.dataReduction);
  console.log('Buffer strategy:', optimization.buffer.strategy);
  console.log('FEC enabled:', optimization.retransmissionPolicy.fecEnabled);

  return optimization;
}

// ==========================================
// 8. REAL-TIME CHAT
// ==========================================

// Send message
function sendChatMessage(message) {
  socket.emit('chat-message', {
    streamId,
    userName: currentUserId,
    message
  });
}

// Receive message
socket.on('chat-message', (data) => {
  addChatMessageToUI(data.userName, data.message);
});

// ==========================================
// 9. SCREEN SHARING
// ==========================================

async function shareScreen() {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false
  });

  const screenTrack = screenStream.getVideoTracks()[0];

  // Replace video track in all peer connections
  webrtcManager.peerConnections.forEach(async (peerConnection) => {
    const videoSender = peerConnection.getSenders()
      .find(s => s.track?.kind === 'video');
    
    if (videoSender) {
      await videoSender.replaceTrack(screenTrack);
    }
  });

  // Stop screen sharing
  screenTrack.onended = async () => {
    const cameraTrack = webrtcManager.localStream.getVideoTracks()[0];
    webrtcManager.peerConnections.forEach(async (peerConnection) => {
      const videoSender = peerConnection.getSenders()
        .find(s => s.track?.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(cameraTrack);
      }
    });
  };
}

// ==========================================
// 10. ERROR HANDLING
// ==========================================

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
  socket.emit('error-report', {
    streamId,
    error: event.error.message,
    stack: event.error.stack
  });
});

// WebSocket errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
  alert('Connection error: ' + error);
});

// WebRTC connection errors
webrtcManager.onConnectionStateChange = (peerId, state) => {
  if (state === 'failed') {
    console.error('WebRTC connection failed with', peerId);
    // Attempt reconnection
    reconnectPeer(peerId);
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatBitrate(kbps) {
  return kbps >= 1000 ? 
    (kbps / 1000).toFixed(2) + ' Mbps' : 
    Math.round(kbps) + ' kbps';
}

function calculateNetworkScore(bandwidth, packetLoss, jitter) {
  let score = 100;
  score -= Math.min(40, (5000 - bandwidth) / 100);
  score -= Math.min(30, packetLoss * 6);
  score -= Math.min(30, jitter / 5);
  return Math.max(0, Math.round(score));
}

function canSupportQuality(quality, bandwidth) {
  const requirements = {
    '4k60': 15000,
    '1080p60': 5000,
    '720p60': 2500,
    '480p30': 1200,
    '360p30': 600
  };
  return bandwidth >= (requirements[quality] || 5000);
}
