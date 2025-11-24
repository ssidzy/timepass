# 4K/1080p Movie Streaming App with Video Conferencing

A high-performance streaming application built with Node.js, WebRTC, and adaptive bitrate technology. Stream movies in 4K@60fps or 1080p@60fps while enabling real-time video conferencing with participants.

## Features

✨ **Streaming Capabilities:**
- 4K 60fps streaming (3840x2160)
- Full HD 60fps streaming (1920x1080)
- Adaptive bitrate streaming (DASH/HLS)
- Multi-quality support (720p, 480p, 360p)
- Efficient H.264 video encoding
- AAC audio encoding

📹 **Video Conferencing:**
- Real-time peer-to-peer video/audio communication
- Host can see all participant faces and hear their voices
- WebRTC signaling with ICE candidate handling
- Automatic NAT/firewall traversal with STUN servers

🌐 **Network Optimization:**
- **Adaptive Bitrate (DASH):** Automatically adjusts quality based on bandwidth
- **Data Compression:** Intelligent frame dropping and bitrate reduction
- **Buffer Management:** Smart prefetching and buffer strategies
- **Network Monitoring:** Real-time bandwidth, packet loss, and jitter tracking
- **FEC Support:** Forward Error Correction for lossy networks
- **Network Score:** 0-100 quality score based on network metrics

⚡ **Performance & Efficiency:**
- Reduces data usage by 30-70% while maintaining quality
- Low-latency encoding with ultrafast presets
- Discontinuous transmission (DTX) for audio
- Efficient packet fragmentation
- Intelligent retransmission policies
- Bandwidth-aware prefetching

💬 **Communication:**
- Real-time chat messaging
- WebRTC data channels for metadata
- Automatic quality recommendations
- Network health notifications

## Architecture

```
streaming-app/
├── backend/
│   ├── server.js                 # Main Express server with Socket.IO
│   ├── modules/
│   │   ├── streamingManager.js   # HLS/DASH streaming & transcoding
│   │   ├── webrtcManager.js      # WebRTC peer connection management
│   │   ├── adaptiveBitrate.js    # DASH algorithm implementation
│   │   └── dataOptimizer.js      # Compression & optimization
│   └── routes/
├── frontend/
│   ├── index.html                # Main UI
│   ├── css/
│   │   └── styles.css            # Responsive styling
│   └── js/
│       ├── app.js                # Application logic
│       ├── webrtcManager.js       # Client WebRTC management
│       ├── networkManager.js      # Network monitoring
│       └── uiManager.js           # UI updates
├── utils/
├── package.json
├── .env.example
└── README.md
```

## Installation

### Prerequisites
- Node.js v14+ and npm
- FFmpeg (for video transcoding)
- Modern web browser with WebRTC support

### Setup

#### Prerequisites Check
First, verify you have Node.js and npm installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/ (LTS version recommended)

1. **Navigate to project:**
```bash
cd streaming-app
```

2. **Install dependencies:**
```bash
npm install
```

This will install all required packages:
- express (web server)
- socket.io (real-time communication)
- cors (cross-origin requests)
- compression (HTTP compression)
- body-parser (request parsing)
- uuid (unique IDs)
- wrtc (WebRTC)
- fluent-ffmpeg (video encoding)
- dotenv (environment variables)

3. **Configure environment (optional):**
```bash
cp .env.example .env
# Edit .env with your custom settings (defaults work fine)
```

4. **Install FFmpeg (required for video encoding):**
   - **Windows:** 
     - Download from https://ffmpeg.org/download.html
     - Extract and add to PATH, or just download standalone
   - **macOS:** `brew install ffmpeg`
   - **Linux:** `sudo apt-get install ffmpeg`
   
   Verify installation:
   ```bash
   ffmpeg -version
   ```

## Usage

### Start the Server

```bash
npm start
```

Server will run on `http://localhost:3000`

### Using the Application

1. **Host a Stream:**
   - Click "Start Stream" button
   - Enter stream title and select quality
   - Share your camera/microphone
   - Share the Stream ID with participants

2. **Join a Stream:**
   - Enter Stream ID from host
   - Enter your name
   - Click "Join Stream"
   - Allow camera/microphone access

3. **Media Controls:**
   - Toggle Video: Disable/enable your camera
   - Toggle Audio: Mute/unmute microphone
   - Share Screen: Share your desktop

4. **Monitor Network:**
   - View real-time bitrate, ping, packet loss
   - Check quality score (0-100)
   - Receive optimization recommendations

5. **Chat:**
   - Send messages to all participants
   - Messages display in real-time

## Algorithms & Technologies

### 1. **Adaptive Bitrate Streaming (DASH)**
Implements Dynamic Adaptive Streaming over HTTP with:
- Bandwidth estimation from WebRTC stats
- Packet loss monitoring
- Jitter detection
- Buffer-based quality decision
- Smooth quality transitions with hysteresis

Quality selection formula:
```
Effective Bandwidth = Available Bandwidth × (1 - Packet Loss%) × (1 - Jitter Penalty)
Recommended Quality = Max Quality where bitrate ≤ Effective Bandwidth × 0.8
```

### 2. **Data Optimization**
- **Compression Levels:**
  - High: 70% reduction (12 Mbps link)
  - Medium: 50% reduction (3-8 Mbps link)
  - Low: 30% reduction (8+ Mbps link)

- **Frame Dropping:** Intelligent frame dropping based on available bandwidth
- **Audio Optimization:** Opus codec with DTX (silence suppression)
- **FEC:** Forward Error Correction for networks with >2% packet loss

### 3. **Network Monitoring**
Real-time metrics collected via WebRTC stats API:
- Video/Audio bitrate (kbps)
- Packet loss percentage
- Network jitter (ms)
- Round-trip time (ms)
- Frame rate (fps)

### 4. **Buffer Strategy**
- **Aggressive:** 5-8s buffer for stable networks
- **Normal:** 10-12s buffer for general use
- **Conservative:** 16-20s buffer for lossy networks

## API Endpoints

### REST API

**Create Stream:**
```
POST /api/stream/create
Body: { userId, title, quality }
Response: { streamId, success, message }
```

**Get Stream Info:**
```
GET /api/stream/:streamId
Response: { id, userId, title, quality, participants, stats }
```

**Health Check:**
```
GET /api/health
Response: { status, timestamp }
```

### WebSocket Events

**Client → Server:**
- `join-stream`: { streamId, userId, role }
- `leave-stream`: { streamId, userId }
- `offer`: { streamId, to, offer }
- `answer`: { streamId, to, answer }
- `ice-candidate`: { streamId, candidate }
- `network-stats`: { streamId, bandwidth, packetLoss, jitter }
- `request-quality-change`: { streamId, quality }
- `chat-message`: { streamId, userName, message }

**Server → Client:**
- `participant-joined`: { userId, role, participantCount }
- `participant-left`: { userId, participantCount }
- `current-participants`: { participants }
- `offer`: { from, offer }
- `answer`: { from, answer }
- `ice-candidate`: { from, candidate }
- `quality-recommendation`: { suggested, current }
- `optimization-params`: { compression, buffer, retransmission }
- `chat-message`: { userName, message }

## Performance Metrics

### Bandwidth Usage (per quality, approximate)
- **4K 60fps:** 15 Mbps
- **1080p 60fps:** 5 Mbps
- **720p 60fps:** 2.5 Mbps
- **480p 30fps:** 1.2 Mbps
- **360p 30fps:** 600 kbps

### Data Reduction with Optimization
- **High Compression:** 70% reduction in data
- **Medium Compression:** 50% reduction
- **Low Compression:** 30% reduction

Example: 1 hour of 1080p@60fps
- Original: 2.25 GB
- With optimization: 0.67-1.5 GB (saved: 750 MB - 1.58 GB)

### Latency
- WebRTC setup: < 1 second
- Frame-to-display: 100-200ms (with optimization)
- Chat message round-trip: < 50ms

## Configuration Options

Edit `.env` file to customize:

```env
PORT=3000                    # Server port
NODE_ENV=development        # Environment
DEFAULT_QUALITY=1080p60     # Default stream quality
MAX_QUALITY=4k60            # Maximum allowed quality
MAX_PARTICIPANTS=50         # Max participants per stream
STREAM_TIMEOUT=3600000      # Stream timeout (ms)
ICE_SERVERS=...             # STUN/TURN servers
```

## Troubleshooting

### No Video from Participants
- Check browser permissions for camera/microphone
- Ensure firewall allows WebRTC
- Try alternative STUN servers in `.env`

### High Packet Loss
- Quality will auto-reduce to 480p/360p
- Move closer to router
- Use wired connection if possible

### High Latency/Jitter
- App automatically reduces quality
- Close other bandwidth-consuming apps
- Check system CPU usage

### Stream Won't Start
- Verify FFmpeg is installed: `ffmpeg -version`
- Check logs for errors
- Ensure port 3000 is not in use

## Development

### Add New Video Quality
Edit `backend/modules/streamingManager.js`:
```javascript
this.videoProfiles['720p30'] = {
  resolution: '1280x720',
  bitrate: '2000k',
  fps: 30,
  codec: 'libx264',
  preset: 'veryfast'
};
```

### Custom Encoding Presets
Modify encoding parameters in `createHLSSegment()`:
- `preset`: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower
- `profile`: baseline, main, high
- `crf`: quality (0-51, lower=better)

### Extend Optimization
Add logic in `DataOptimizer.js` to implement:
- VP9/AV1 codec support
- Perceptual quality metrics
- Machine learning-based bitrate prediction

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Partial support (some WebRTC limitations)
- Opera: ✅ Full support

## License

MIT

## Contributing

Contributions welcome! Please submit pull requests with:
- Feature description
- Performance impact analysis
- Browser compatibility notes

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Check browser console for errors
4. Verify network connectivity

## Future Enhancements

- [ ] VP9/AV1 codec support
- [ ] ML-based bitrate prediction
- [ ] Recording & playback
- [ ] Stream analytics dashboard
- [ ] Advanced network diagnostics
- [ ] Multi-bitrate HLS manifest generation
- [ ] CDN integration
- [ ] Scalable backend (clustering)

## Technical Stack

**Backend:**
- Node.js v14+
- Express.js (REST API)
- Socket.IO (Real-time communication)
- WebRTC (peer connections)
- FFmpeg (video encoding)

**Frontend:**
- HTML5
- CSS3 (responsive design)
- JavaScript (ES6+)
- WebRTC API
- Canvas API

**Protocols:**
- DASH (Dynamic Adaptive Streaming)
- HLS (HTTP Live Streaming)
- WebRTC (DTLS-SRTP encrypted)
- HTTP/2 (for faster loading)

---

**Built with ❤️ for efficient, real-time streaming**
