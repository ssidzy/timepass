/**
 * DataOptimizer Module
 * Implements compression, buffering, and transmission optimization
 * Reduces data usage while maintaining quality
 */

class DataOptimizer {
  constructor() {
    this.compressionLevels = {
      high: { ratio: 0.3, fps: 25, keyframeInterval: 5 },      // 70% reduction
      medium: { ratio: 0.5, fps: 30, keyframeInterval: 3 },    // 50% reduction
      low: { ratio: 0.7, fps: 60, keyframeInterval: 2 }        // 30% reduction
    };

    this.bufferStrategies = {
      aggressive: { size: 5, prefill: 2, target: 8 },
      normal: { size: 10, prefill: 4, target: 12 },
      conservative: { size: 20, prefill: 8, target: 16 }
    };
  }

  /**
   * Optimize transmission parameters based on network conditions
   */
  optimizeTransmission(networkStats) {
    const { bandwidth = 0, packetLoss = 0, jitter = 0 } = networkStats;

    // Determine compression level based on bandwidth
    let compressionLevel = 'high';
    if (bandwidth > 8000) {
      compressionLevel = 'low';
    } else if (bandwidth > 3000) {
      compressionLevel = 'medium';
    }

    // Determine buffer strategy based on packet loss
    let bufferStrategy = 'normal';
    if (packetLoss > 5) {
      bufferStrategy = 'conservative';
    } else if (packetLoss < 1) {
      bufferStrategy = 'aggressive';
    }

    const compression = this.compressionLevels[compressionLevel];
    const buffer = this.bufferStrategies[bufferStrategy];

    return {
      compression: {
        level: compressionLevel,
        ...compression,
        dataReduction: `${Math.round((1 - compression.ratio) * 100)}%`
      },
      buffer: {
        strategy: bufferStrategy,
        ...buffer
      },
      packetFragmentation: this.calculateOptimalFragmentation(bandwidth),
      retransmissionPolicy: this.getRetransmissionPolicy(packetLoss),
      encodingProfile: this.selectEncodingProfile(bandwidth, jitter)
    };
  }

  /**
   * Calculate optimal packet fragmentation size
   * Smaller packets for lossy networks, larger for stable networks
   */
  calculateOptimalFragmentation(bandwidth) {
    // MTU (Maximum Transmission Unit) is typically 1500 bytes
    // Adjust based on available bandwidth and expected packet loss
    
    if (bandwidth < 1000) {
      return { size: 500, reason: 'Low bandwidth - smaller packets' };
    } else if (bandwidth < 5000) {
      return { size: 1000, reason: 'Medium bandwidth - standard packets' };
    } else {
      return { size: 1500, reason: 'High bandwidth - maximum packet size' };
    }
  }

  /**
   * Select retransmission policy based on packet loss
   */
  getRetransmissionPolicy(packetLoss) {
    let policy = {
      enabled: true,
      timeout: 100,      // milliseconds
      maxRetries: 3,
      backoffMultiplier: 1.5
    };

    if (packetLoss < 0.5) {
      policy.maxRetries = 1;  // Minimal retransmission
      policy.timeout = 50;
    } else if (packetLoss < 2) {
      policy.maxRetries = 2;
      policy.timeout = 75;
    } else if (packetLoss < 5) {
      policy.maxRetries = 3;
      policy.timeout = 100;
    } else {
      policy.maxRetries = 5;   // Aggressive retransmission for poor networks
      policy.timeout = 200;
    }

    return {
      packetLoss,
      policy,
      fecEnabled: packetLoss > 2  // Enable Forward Error Correction for lossy networks
    };
  }

  /**
   * Select encoding profile based on network conditions
   */
  selectEncodingProfile(bandwidth, jitter) {
    const profiles = {
      low_latency: {
        name: 'Low Latency',
        preset: 'ultrafast',
        profile: 'baseline',
        latency: '< 100ms',
        suited_for: 'Live streaming, Real-time communication'
      },
      balanced: {
        name: 'Balanced',
        preset: 'veryfast',
        profile: 'main',
        latency: '100-200ms',
        suited_for: 'General streaming'
      },
      high_quality: {
        name: 'High Quality',
        preset: 'fast',
        profile: 'high',
        latency: '200-500ms',
        suited_for: 'On-demand streaming'
      }
    };

    // Select based on jitter
    if (jitter > 100) {
      return { selected: 'low_latency', ...profiles.low_latency };
    } else if (jitter > 50) {
      return { selected: 'balanced', ...profiles.balanced };
    } else {
      return { selected: 'high_quality', ...profiles.high_quality };
    }
  }

  /**
   * Implement Content Delivery Optimization (CDO)
   * Uses frame dropping and quality reduction intelligently
   */
  getFrameDropPolicy(bandwidth, fps, desiredFps = 60) {
    const availableCapacity = bandwidth / 1000; // in Mbps

    // Calculate how many frames can fit
    const framesPerSecond = fps;
    const targetFrameRate = Math.min(fps, desiredFps);

    if (availableCapacity < 1) {
      // Very low bandwidth - aggressive frame dropping
      return {
        dropFrames: true,
        targetFrameRate: Math.max(15, Math.floor(targetFrameRate / 2)),
        dropPattern: 'uniform',
        intensity: 'high'
      };
    } else if (availableCapacity < 2) {
      // Low bandwidth
      return {
        dropFrames: true,
        targetFrameRate: Math.max(24, Math.floor(targetFrameRate * 0.66)),
        dropPattern: 'uniform',
        intensity: 'medium'
      };
    } else {
      // Good bandwidth
      return {
        dropFrames: false,
        targetFrameRate: targetFrameRate,
        dropPattern: 'none',
        intensity: 'low'
      };
    }
  }

  /**
   * Implement Efficient Audio Coding
   */
  getAudioOptimization(bandwidth, quality = 'normal') {
    const audioProfiles = {
      ultra_low: {
        codec: 'opus',
        bitrate: 12,
        sampleRate: 8000,
        channels: 1,
        frameSize: 20
      },
      low: {
        codec: 'opus',
        bitrate: 24,
        sampleRate: 16000,
        channels: 1,
        frameSize: 20
      },
      medium: {
        codec: 'opus',
        bitrate: 64,
        sampleRate: 48000,
        channels: 2,
        frameSize: 20
      },
      high: {
        codec: 'opus',
        bitrate: 128,
        sampleRate: 48000,
        channels: 2,
        frameSize: 20
      }
    };

    let selectedProfile = 'medium';
    if (bandwidth < 500) {
      selectedProfile = 'ultra_low';
    } else if (bandwidth < 1000) {
      selectedProfile = 'low';
    } else if (bandwidth > 5000) {
      selectedProfile = 'high';
    }

    return {
      profile: selectedProfile,
      ...audioProfiles[selectedProfile],
      dtxEnabled: true  // Discontinuous Transmission (silence suppression)
    };
  }

  /**
   * Implement Bandwidth-Aware Prefetching
   */
  getPrefetchStrategy(bandwidth, bufferLength) {
    const minBuffer = bufferLength;
    const prefetchSize = Math.max(5, Math.min(20, bandwidth / 500));

    return {
      enabled: true,
      prefetchSeconds: prefetchSize,
      strategy: bandwidth > 5000 ? 'aggressive' : 'conservative',
      parallelDownloads: bandwidth > 3000 ? 4 : 2
    };
  }

  /**
   * Calculate data savings from optimization
   */
  calculateDataSavings(originalBitrate, optimizedBitrate, duration) {
    const originalData = (originalBitrate * duration) / 8; // Convert to bytes
    const optimizedData = (optimizedBitrate * duration) / 8;
    const savings = originalData - optimizedData;

    return {
      originalSize: this.formatBytes(originalData),
      optimizedSize: this.formatBytes(optimizedData),
      savings: this.formatBytes(savings),
      percentageSaved: Math.round((savings / originalData) * 100),
      duration
    };
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get real-time optimization recommendations
   */
  getOptimizationRecommendations(networkStats) {
    const { bandwidth = 0, packetLoss = 0, jitter = 0, bufferLength = 10 } = networkStats;
    const recommendations = [];

    // Bandwidth recommendations
    if (bandwidth < 1000) {
      recommendations.push({
        category: 'Bandwidth',
        severity: 'critical',
        message: 'Very low bandwidth detected. Consider reducing quality or enabling aggressive compression.'
      });
    } else if (bandwidth < 3000) {
      recommendations.push({
        category: 'Bandwidth',
        severity: 'warning',
        message: 'Low bandwidth. Adaptive bitrate adjustment recommended.'
      });
    }

    // Packet loss recommendations
    if (packetLoss > 5) {
      recommendations.push({
        category: 'Network Quality',
        severity: 'critical',
        message: 'High packet loss detected. Consider using FEC or reducing bitrate.'
      });
    } else if (packetLoss > 2) {
      recommendations.push({
        category: 'Network Quality',
        severity: 'warning',
        message: 'Moderate packet loss. Enable retransmission policies.'
      });
    }

    // Jitter recommendations
    if (jitter > 150) {
      recommendations.push({
        category: 'Network Stability',
        severity: 'warning',
        message: 'High jitter detected. Increase buffer size to reduce stuttering.'
      });
    }

    // Buffer recommendations
    if (bufferLength < 3) {
      recommendations.push({
        category: 'Buffering',
        severity: 'warning',
        message: 'Low buffer. Quality adjustment may occur soon.'
      });
    }

    return recommendations;
  }
}

module.exports = DataOptimizer;
