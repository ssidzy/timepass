/**
 * Utility Functions for Streaming Application
 * Common helper functions used across the application
 */

/**
 * Convert bitrate from kbps to human-readable format
 */
function formatBitrate(kbps) {
  if (kbps >= 1000) {
    return (kbps / 1000).toFixed(2) + ' Mbps';
  }
  return Math.round(kbps) + ' kbps';
}

/**
 * Convert bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time duration
 */
function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate bandwidth usage for a stream
 */
function calculateBandwidthUsage(bitrate, duration) {
  // bitrate in kbps, duration in seconds
  // result in bytes
  return (bitrate * 1000 * duration) / 8;
}

/**
 * Estimate network quality
 */
function estimateNetworkQuality(bandwidth, packetLoss, jitter) {
  let score = 100;

  // Bandwidth penalty
  if (bandwidth < 500) score -= 40;
  else if (bandwidth < 1000) score -= 25;
  else if (bandwidth < 3000) score -= 10;

  // Packet loss penalty
  score -= Math.min(30, packetLoss * 6);

  // Jitter penalty
  score -= Math.min(30, jitter / 5);

  return Math.max(0, Math.round(score));
}

/**
 * Calculate optimal buffer size
 */
function calculateOptimalBuffer(bandwidth, jitter) {
  let baseBuffer = 10; // seconds
  
  // Increase buffer for low bandwidth
  if (bandwidth < 1000) baseBuffer = 20;
  else if (bandwidth < 3000) baseBuffer = 15;

  // Increase buffer for high jitter
  if (jitter > 100) baseBuffer += 5;
  else if (jitter > 50) baseBuffer += 2;

  return baseBuffer;
}

/**
 * Generate stream ID
 */
function generateStreamId() {
  return 'stream_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Validate stream quality
 */
function isValidQuality(quality) {
  const validQualities = ['4k60', '1080p60', '720p60', '480p30', '360p30'];
  return validQualities.includes(quality);
}

/**
 * Calculate bitrate reduction percentage
 */
function calculateBitrateReduction(originalBitrate, optimizedBitrate) {
  if (originalBitrate === 0) return 0;
  return Math.round(((originalBitrate - optimizedBitrate) / originalBitrate) * 100);
}

/**
 * Check if network conditions support quality
 */
function canSupportQuality(quality, bandwidth, packetLoss, jitter) {
  const qualityRequirements = {
    '4k60': { minBandwidth: 15000, maxPacketLoss: 0.5, maxJitter: 30 },
    '1080p60': { minBandwidth: 5000, maxPacketLoss: 1, maxJitter: 50 },
    '720p60': { minBandwidth: 2500, maxPacketLoss: 2, maxJitter: 75 },
    '480p30': { minBandwidth: 1200, maxPacketLoss: 3, maxJitter: 100 },
    '360p30': { minBandwidth: 600, maxPacketLoss: 5, maxJitter: 150 }
  };

  const requirements = qualityRequirements[quality];
  if (!requirements) return false;

  return (
    bandwidth >= requirements.minBandwidth &&
    packetLoss <= requirements.maxPacketLoss &&
    jitter <= requirements.maxJitter
  );
}

/**
 * Smooth quality transition
 */
function getQualityTransitionPath(currentQuality, targetQuality) {
  const qualities = ['360p30', '480p30', '720p60', '1080p60', '4k60'];
  const currentIndex = qualities.indexOf(currentQuality);
  const targetIndex = qualities.indexOf(targetQuality);

  if (currentIndex === -1 || targetIndex === -1) {
    return [targetQuality];
  }

  const path = [];
  if (currentIndex < targetIndex) {
    for (let i = currentIndex; i <= targetIndex; i++) {
      path.push(qualities[i]);
    }
  } else {
    for (let i = currentIndex; i >= targetIndex; i--) {
      path.push(qualities[i]);
    }
  }

  return path;
}

/**
 * Parse quality string to resolution
 */
function qualityToResolution(quality) {
  const resolutions = {
    '4k60': '3840x2160',
    '1080p60': '1920x1080',
    '720p60': '1280x720',
    '480p30': '854x480',
    '360p30': '640x360'
  };
  return resolutions[quality] || '1280x720';
}

/**
 * Calculate FPS from quality
 */
function qualityToFps(quality) {
  return quality.includes('60') ? 60 : 30;
}

module.exports = {
  formatBitrate,
  formatBytes,
  formatDuration,
  calculateBandwidthUsage,
  estimateNetworkQuality,
  calculateOptimalBuffer,
  generateStreamId,
  isValidQuality,
  calculateBitrateReduction,
  canSupportQuality,
  getQualityTransitionPath,
  qualityToResolution,
  qualityToFps
};
