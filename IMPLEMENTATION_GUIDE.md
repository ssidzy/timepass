# Advanced Implementation Guide

## 1. Server Installation & Setup

### Step 1: Install Dependencies
```bash
npm install
```

This installs:
- **express**: Web server framework
- **socket.io**: Real-time WebSocket communication
- **fluent-ffmpeg**: FFmpeg wrapper for video encoding
- **wrtc**: WebRTC implementation for Node.js
- **compression**: HTTP compression middleware
- **body-parser**: JSON parsing middleware
- **dotenv**: Environment variable management
- **uuid**: Unique ID generation

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3000
DEFAULT_QUALITY=1080p60
MAX_QUALITY=4k60
MAX_PARTICIPANTS=50
STREAM_TIMEOUT=3600000
```

### Step 3: Verify FFmpeg
```bash
ffmpeg -version
```

FFmpeg is required for:
- Video encoding to H.264
- Audio encoding to AAC
- HLS segment generation
- Multi-bitrate transcoding

### Step 4: Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## 2. Understanding the Streaming Pipeline

### Video Encoding Process

```
Input Video (any format)
    ↓
FFmpeg Pipeline
    ├─→ Decode
    ├─→ Scale Resolution (1920x1080, 1280x720, etc.)
    ├─→ Encode H.264 (libx264 codec)
    ├─→ Set Bitrate (5000k, 2500k, etc.)
    ├─→ Set Frame Rate (60fps, 30fps)
    └─→ Create Segments (2-second chunks)
    ↓
HLS Playlist (playlist.m3u8)
    ├─→ segment_0.ts (0-2s)
    ├─→ segment_1.ts (2-4s)
    ├─→ segment_2.ts (4-6s)
    └─→ ...
```

### Quality Adaptation Flow

```
Network Monitoring (every 1s)
    ↓ (collect stats)
WebRTC Stats API
    ├─→ Video bitrate
    ├─→ Packet loss
    ├─→ Jitter
    └─→ RTT (round-trip time)
    ↓ (analyze)
AdaptiveBitrate.recommendQuality()
    ├─→ Calculate effective bandwidth
    ├─→ Analyze buffer state
    ├─→ Apply hysteresis (smooth transitions)
    └─→ Return recommended quality
    ↓ (apply)
Client Adjusts Quality
    ├─→ Update codec settings
    ├─→ Update frame rate
    └─→ Update bitrate allocation
    ↓
Quality Badge Updates in UI
```

## 3. Algorithm Deep Dive

### DASH Algorithm Implementation

The Adaptive Bitrate implementation uses the DASH (Dynamic Adaptive Streaming over HTTP) algorithm:

```javascript
// Pseudo-code for DASH algorithm
function recommendQuality(stats) {
  // Step 1: Calculate effective bandwidth
  let effectiveBW = stats.bandwidth * (1 - stats.packetLoss / 100);
  
  // Step 2: Apply jitter penalty
  if (stats.jitter > 50) {
    effectiveBW *= (1 - (stats.jitter - 50) / 1000);
  }
  
  // Step 3: Determine buffer state
  let bufferState = 'normal';
  if (stats.bufferLength < 2) bufferState = 'critical';
  else if (stats.bufferLength < 5) bufferState = 'low';
  else if (stats.bufferLength > 20) bufferState = 'high';
  
  // Step 4: Select appropriate multiplier
  let multiplier = 0.8; // normal
  if (bufferState === 'critical') multiplier = 0.5;  // 50% of BW
  else if (bufferState === 'low') multiplier = 0.7;  // 70% of BW
  else if (bufferState === 'high') multiplier = 0.9; // 90% of BW
  
  // Step 5: Find best quality that fits
  const targetBitrate = effectiveBW * multiplier;
  for (let quality of qualityLevels) {
    if (quality.bitrate <= targetBitrate) {
      recommendedQuality = quality;
    }
  }
  
  return recommendedQuality;
}
```

### Data Optimization Strategy

```javascript
// Compression level selection based on bandwidth
if (bandwidth < 500) {
  // Very low bandwidth
  return { compression: 'high', dataReduction: '70%' };
} else if (bandwidth < 1000) {
  // Low bandwidth
  return { compression: 'medium', dataReduction: '50%' };
} else if (bandwidth > 5000) {
  // Good bandwidth
  return { compression: 'low', dataReduction: '30%' };
}

// Frame dropping policy
if (bandwidth < 1000) {
  // Keep 25 fps (drop 50% of frames)
  return { fps: 25, dropIntensity: 'high' };
}
```

### Network Quality Scoring

```javascript
// 0-100 score based on network metrics
function calculateNetworkScore(bandwidth, packetLoss, jitter) {
  let score = 100;
  
  // Bandwidth component (max 40 points)
  // 10 Mbps = 40 points, 0 Mbps = 0 points
  score -= Math.min(40, (10000 - bandwidth) / 250);
  
  // Packet loss component (max 30 points)
  // 5% loss = 0 points, 0% loss = 30 points
  score -= Math.min(30, packetLoss * 6);
  
  // Jitter component (max 30 points)
  // 150ms jitter = 0 points, 0ms = 30 points
  score -= Math.min(30, jitter / 5);
  
  return Math.max(0, Math.round(score));
}
```

Score Interpretation:
- **90-100:** Excellent (4K streaming possible)
- **70-89:** Good (1080p60 recommended)
- **50-69:** Fair (720p60 recommended)
- **20-49:** Poor (480p30 recommended)
- **< 20:** Critical (360p30, consider alternate network)

## 4. WebRTC Peer Connection Management

### Establishing a Connection

```javascript
// Host side
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// Add local audio/video tracks
localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, localStream);
});

// Create and send offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
socket.emit('offer', { to: participantId, offer });

// Receive answer
socket.on('answer', async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
});
```

### ICE Candidate Handling

```javascript
// Send ICE candidates as they're discovered
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      candidate: event.candidate.toJSON()
    });
  }
};

// Receive and add ICE candidates
socket.on('ice-candidate', async (data) => {
  try {
    await peerConnection.addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
});
```

### Statistics Collection

```javascript
// Periodically collect statistics
setInterval(async () => {
  const stats = await peerConnection.getStats();
  
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
      console.log('Video bitrate:', report.bytesReceived);
      console.log('Packet loss:', report.packetsLost);
      console.log('Frame rate:', report.framesPerSecond);
    }
    
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      console.log('RTT:', report.currentRoundTripTime);
      console.log('Available bitrate:', report.availableOutgoingBitrate);
    }
  });
}, 1000);
```

## 5. Performance Optimization Techniques

### Frame Dropping Algorithm

When bandwidth is limited, drop frames intelligently:

```javascript
function getFrameDropPolicy(bandwidth) {
  if (bandwidth < 500) {
    // Very low: drop to 15 fps
    return { targetFPS: 15, keepEveryNthFrame: 4 };
  } else if (bandwidth < 1500) {
    // Low: drop to 24 fps
    return { targetFPS: 24, keepEveryNthFrame: 2.5 };
  } else if (bandwidth < 3000) {
    // Medium: drop to 30 fps
    return { targetFPS: 30, keepEveryNthFrame: 2 };
  } else {
    // Good: keep all 60 fps
    return { targetFPS: 60, keepEveryNthFrame: 1 };
  }
}
```

### Audio Codec Selection

```javascript
function selectAudioCodec(bandwidth) {
  if (bandwidth < 500) {
    // Opus at 12 kbps, 8kHz mono
    return {
      codec: 'opus',
      bitrate: 12,
      sampleRate: 8000,
      channels: 1
    };
  } else if (bandwidth < 1000) {
    // Opus at 24 kbps, 16kHz mono
    return {
      codec: 'opus',
      bitrate: 24,
      sampleRate: 16000,
      channels: 1
    };
  } else {
    // Opus at 128 kbps, 48kHz stereo
    return {
      codec: 'opus',
      bitrate: 128,
      sampleRate: 48000,
      channels: 2
    };
  }
}
```

### Buffer Management

```javascript
// Buffer size should adapt to network conditions
function getOptimalBufferSize(bandwidth, jitter) {
  let baseBuffer = 10; // 10 seconds
  
  // Low bandwidth needs larger buffer
  if (bandwidth < 1000) baseBuffer = 20;
  else if (bandwidth < 3000) baseBuffer = 15;
  
  // High jitter needs larger buffer
  if (jitter > 100) baseBuffer += 5;
  else if (jitter > 50) baseBuffer += 2;
  
  return baseBuffer;
}
```

## 6. Troubleshooting Guide

### Issue: High CPU Usage

**Cause:** Encoding preset too slow
```javascript
// Solution: Use faster preset
const profile = {
  preset: 'ultrafast',  // Instead of 'medium'
  bitrate: '5000k'
};
```

**Cause:** Processing too many participants
```javascript
// Solution: Limit participants
const MAX_PARTICIPANTS = 20;
if (participants.length >= MAX_PARTICIPANTS) {
  rejectNewParticipant();
}
```

### Issue: High Latency

**Cause:** Large buffer size
```javascript
// Solution: Use smaller buffer for live streaming
const bufferSize = 5; // Instead of 10
```

**Cause:** Encoding preset too high quality
```javascript
// Solution: Use faster encoding
ffmpeg.outputOptions([
  '-preset ultrafast',  // Instead of 'medium'
  '-crf 24'            // Quality 24 instead of 18
]);
```

### Issue: Packet Loss

**Cause:** Network congestion
```javascript
// Solution: Enable FEC and reduce quality
const optimization = {
  fecEnabled: true,
  qualityReduction: true
};
```

### Issue: No Video

**Cause:** Permission denied
```javascript
// Solution: Request permissions first
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Please allow camera and microphone access');
  }
}
```

## 7. Scaling for Production

### Multi-Server Architecture

```
Load Balancer
    ↓
├─→ Server 1 (streams 1-25)
├─→ Server 2 (streams 26-50)
└─→ Server 3 (streams 51-75)
    ↓
Redis (Session Store)
    ↓
CDN (Static Files & Segments)
```

### Database Integration

```javascript
// Add MongoDB for persistence
const StreamSession = {
  id: String,
  hostId: String,
  title: String,
  quality: String,
  startTime: Date,
  endTime: Date,
  participants: [String],
  stats: {
    totalViewers: Number,
    averageQuality: String,
    dataUsed: Number
  }
};
```

### CDN Integration

```javascript
// Upload HLS segments to CDN
async function uploadTocdn(segmentPath) {
  const segment = fs.readFileSync(segmentPath);
  const cdnUrl = `https://cdn.example.com/${streamId}/${segmentName}`;
  
  await s3Client.putObject({
    Bucket: 'streaming-segments',
    Key: `${streamId}/${segmentName}`,
    Body: segment,
    ContentType: 'video/mp2t'
  });
  
  return cdnUrl;
}
```

## 8. Security Considerations

### Secure WebRTC Connections

```javascript
// All WebRTC connections use DTLS-SRTP by default (encrypted)
const peerConnection = new RTCPeerConnection({
  iceServers: [...],
  // No additional config needed - encryption is default
});
```

### Token-Based Authentication

```javascript
// Verify stream access
app.post('/api/stream/:streamId/verify', (req, res) => {
  const token = req.headers.authorization;
  
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ authorized: true });
});
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 9. Monitoring & Analytics

### Collect Stream Metrics

```javascript
async function collectStreamMetrics(streamId) {
  const session = sessions.get(streamId);
  
  return {
    streamId,
    duration: Date.now() - session.startTime,
    participantCount: session.participants.length,
    averageBitrate: session.stats.bitrate,
    dataUsed: calculateDataUsage(session),
    networkQuality: calculateAverageQuality(session.stats)
  };
}
```

### Real-Time Dashboar

```javascript
// Emit metrics to dashboard
io.emit('stream-metrics', {
  activeStreams: sessions.size,
  totalParticipants: getTotalParticipants(),
  averageBitrate: getAverageBitrate(),
  networkHealth: getNetworkHealth()
});
```

---

**This guide covers production-ready streaming implementation with robust error handling, optimization, and scalability.**
