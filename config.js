/**
 * Advanced Streaming Server Configuration
 * Extended configuration for production deployment
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    ssl: {
      enabled: false,
      key: process.env.SSL_KEY,
      cert: process.env.SSL_CERT
    }
  },

  // Stream Configuration
  streaming: {
    defaultQuality: process.env.DEFAULT_QUALITY || '1080p60',
    maxQuality: process.env.MAX_QUALITY || '4k60',
    minQuality: process.env.MIN_QUALITY || '360p30',
    timeout: parseInt(process.env.STREAM_TIMEOUT) || 3600000,
    maxParticipants: parseInt(process.env.MAX_PARTICIPANTS) || 50,
    maxStreams: parseInt(process.env.MAX_STREAMS) || 100
  },

  // Video Encoding Profiles
  videoProfiles: {
    '4k60': {
      resolution: '3840x2160',
      bitrate: 15000,
      fps: 60,
      codec: 'libx264',
      preset: 'ultrafast',
      crf: 23
    },
    '1080p60': {
      resolution: '1920x1080',
      bitrate: 5000,
      fps: 60,
      codec: 'libx264',
      preset: 'ultrafast',
      crf: 23
    },
    '720p60': {
      resolution: '1280x720',
      bitrate: 2500,
      fps: 60,
      codec: 'libx264',
      preset: 'veryfast',
      crf: 24
    },
    '480p30': {
      resolution: '854x480',
      bitrate: 1200,
      fps: 30,
      codec: 'libx264',
      preset: 'veryfast',
      crf: 25
    },
    '360p30': {
      resolution: '640x360',
      bitrate: 600,
      fps: 30,
      codec: 'libx264',
      preset: 'fast',
      crf: 26
    }
  },

  // Audio Encoding
  audio: {
    codec: 'aac',
    sampleRate: 48000,
    channels: 2,
    bitrate: 128,
    profiles: {
      high: { sampleRate: 48000, bitrate: 128, channels: 2 },
      medium: { sampleRate: 48000, bitrate: 64, channels: 2 },
      low: { sampleRate: 16000, bitrate: 24, channels: 1 },
      ultraLow: { sampleRate: 8000, bitrate: 12, channels: 1 }
    }
  },

  // WebRTC Configuration
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  },

  // Network Thresholds
  network: {
    bufferThresholds: {
      critical: 2,    // seconds
      low: 5,
      normal: 10,
      high: 20
    },
    packetLossThresholds: {
      excellent: 0.5,
      good: 1,
      fair: 2,
      poor: 5
    },
    jitterThresholds: {
      excellent: 20,
      good: 50,
      fair: 100,
      poor: 150
    }
  },

  // Optimization Parameters
  optimization: {
    compressionLevels: {
      high: { ratio: 0.3, fps: 25, keyframeInterval: 5 },
      medium: { ratio: 0.5, fps: 30, keyframeInterval: 3 },
      low: { ratio: 0.7, fps: 60, keyframeInterval: 2 }
    },
    fecEnabled: true,
    dtxEnabled: true,
    prefetchEnabled: true
  },

  // HLS/DASH Configuration
  hls: {
    segmentDuration: 2,     // seconds
    windowSize: 10,         // segments in playlist
    targetDuration: 2,
    version: 3
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    file: './logs/streaming.log'
  },

  // Database (optional, for future use)
  database: {
    enabled: false,
    type: 'mongodb',
    uri: process.env.MONGODB_URI
  }
};

module.exports = config;
