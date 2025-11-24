/**
 * AdaptiveBitrate Module
 * Implements DASH (Dynamic Adaptive Streaming over HTTP) algorithm
 * Automatically adjusts video quality based on network conditions
 */

class AdaptiveBitrate {
  constructor() {
    this.qualityLevels = [
      { name: '4k60', bitrate: 15000, resolution: '3840x2160', fps: 60 },
      { name: '1080p60', bitrate: 5000, resolution: '1920x1080', fps: 60 },
      { name: '720p60', bitrate: 2500, resolution: '1280x720', fps: 60 },
      { name: '480p30', bitrate: 1200, resolution: '854x480', fps: 30 },
      { name: '360p30', bitrate: 600, resolution: '640x360', fps: 30 }
    ];

    this.bufferThresholds = {
      critical: 2,    // Less than 2 seconds
      low: 5,         // 5 seconds
      normal: 10,     // 10 seconds
      high: 20        // More than 20 seconds
    };
  }

  /**
   * DASH Algorithm: Recommend quality based on bandwidth and buffer
   * Reference: https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP
   */
  recommendQuality(networkStats) {
    const {
      bandwidth = 0,        // Available bandwidth in kbps
      packetLoss = 0,       // Packet loss percentage
      jitter = 0,          // Network jitter in ms
      bufferLength = 10,   // Buffer length in seconds
      currentQuality = '1080p60'
    } = networkStats;

    // Calculate effective bandwidth considering packet loss
    const effectiveBandwidth = bandwidth * (1 - packetLoss / 100);

    // Apply jitter penalty (high jitter reduces effective bandwidth)
    const jitterPenalty = Math.max(0, (jitter - 50) / 1000); // Penalty if jitter > 50ms
    const adjustedBandwidth = effectiveBandwidth * (1 - jitterPenalty);

    // Determine buffer state
    let bufferState = 'normal';
    if (bufferLength < this.bufferThresholds.critical) {
      bufferState = 'critical';
    } else if (bufferLength < this.bufferThresholds.low) {
      bufferState = 'low';
    } else if (bufferLength > this.bufferThresholds.high) {
      bufferState = 'high';
    }

    // Find suitable quality level
    let recommendedQuality = this.qualityLevels[this.qualityLevels.length - 1]; // Default to lowest

    // Buffer-based decision: if buffer is critical, reduce quality
    if (bufferState === 'critical') {
      for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
        if (this.qualityLevels[i].bitrate <= adjustedBandwidth * 0.5) {
          recommendedQuality = this.qualityLevels[i];
          break;
        }
      }
    } else if (bufferState === 'low') {
      // Conservative: use bitrate that's 70% of available bandwidth
      for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
        if (this.qualityLevels[i].bitrate <= adjustedBandwidth * 0.7) {
          recommendedQuality = this.qualityLevels[i];
          break;
        }
      }
    } else if (bufferState === 'high') {
      // Aggressive: can use bitrate that's 90% of available bandwidth
      for (let i = 0; i < this.qualityLevels.length; i++) {
        if (this.qualityLevels[i].bitrate <= adjustedBandwidth * 0.9) {
          recommendedQuality = this.qualityLevels[i];
        }
      }
    } else {
      // Normal buffer: use bitrate that's 80% of available bandwidth
      for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
        if (this.qualityLevels[i].bitrate <= adjustedBandwidth * 0.8) {
          recommendedQuality = this.qualityLevels[i];
          break;
        }
      }
    }

    return {
      recommended: recommendedQuality.name,
      bitrate: recommendedQuality.bitrate,
      bandwidth: {
        available: bandwidth,
        effective: adjustedBandwidth,
        recommended: recommendedQuality.bitrate
      },
      bufferState,
      bufferLength,
      networkMetrics: {
        packetLoss,
        jitter,
        quality: packetLoss < 1 && jitter < 50 ? 'good' : packetLoss < 5 && jitter < 100 ? 'fair' : 'poor'
      }
    };
  }

  /**
   * Predict future quality based on bandwidth trend
   */
  predictQuality(bandwidthHistory) {
    if (bandwidthHistory.length < 3) {
      return this.qualityLevels[2]; // Default to middle quality
    }

    // Calculate bandwidth trend (simple moving average)
    const recentBandwidth = bandwidthHistory.slice(-5);
    const avgBandwidth = recentBandwidth.reduce((a, b) => a + b, 0) / recentBandwidth.length;
    
    // Calculate trend direction
    const trend = recentBandwidth[recentBandwidth.length - 1] - avgBandwidth;

    // If bandwidth is decreasing, be conservative
    let multiplier = trend < 0 ? 0.7 : 0.85;

    for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
      if (this.qualityLevels[i].bitrate <= avgBandwidth * multiplier) {
        return this.qualityLevels[i];
      }
    }

    return this.qualityLevels[this.qualityLevels.length - 1];
  }

  /**
   * Get quality transition recommendation (smooth transitions)
   */
  getQualityTransition(currentQuality, recommendedQuality) {
    const currentIndex = this.qualityLevels.findIndex(q => q.name === currentQuality);
    const recommendedIndex = this.qualityLevels.findIndex(q => q.name === recommendedQuality);

    if (currentIndex === -1 || recommendedIndex === -1) {
      return {
        transition: false,
        reason: 'Invalid quality'
      };
    }

    const diff = recommendedIndex - currentIndex;

    // Implement hysteresis to avoid rapid quality changes
    if (Math.abs(diff) <= 1) {
      return {
        transition: false,
        reason: 'Within hysteresis threshold'
      };
    }

    return {
      transition: true,
      from: currentQuality,
      to: recommendedQuality,
      steps: Math.abs(diff),
      direction: diff > 0 ? 'upgrade' : 'downgrade'
    };
  }

  /**
   * Calculate network score (0-100)
   */
  calculateNetworkScore(networkStats) {
    const { bandwidth = 0, packetLoss = 0, jitter = 0 } = networkStats;

    // Bandwidth score (0-40 points)
    const bandwidthScore = Math.min(40, (bandwidth / 10000) * 40);

    // Packet loss score (0-30 points)
    const packetLossScore = Math.max(0, 30 - (packetLoss * 6));

    // Jitter score (0-30 points)
    const jitterScore = Math.max(0, 30 - (jitter / 5));

    const totalScore = bandwidthScore + packetLossScore + jitterScore;

    return {
      score: Math.round(totalScore),
      components: {
        bandwidth: Math.round(bandwidthScore),
        packetLoss: Math.round(packetLossScore),
        jitter: Math.round(jitterScore)
      },
      quality: totalScore >= 75 ? 'excellent' : totalScore >= 50 ? 'good' : totalScore >= 25 ? 'fair' : 'poor'
    };
  }

  /**
   * Get all quality levels
   */
  getQualityLevels() {
    return this.qualityLevels;
  }

  /**
   * Get quality by bitrate (find closest match)
   */
  getQualityByBitrate(bitrate) {
    let closest = this.qualityLevels[0];
    let minDiff = Math.abs(this.qualityLevels[0].bitrate - bitrate);

    for (const quality of this.qualityLevels) {
      const diff = Math.abs(quality.bitrate - bitrate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = quality;
      }
    }

    return closest;
  }
}

module.exports = AdaptiveBitrate;
