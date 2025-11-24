/**
 * Network Manager - Client Side
 * Monitors and reports network conditions
 */

class NetworkManager {
  constructor() {
    this.stats = {
      bandwidth: 0,
      packetLoss: 0,
      jitter: 0,
      rtt: 0,
      bufferLength: 10
    };
    this.bandwidthHistory = [];
    this.statsIntervalId = null;
  }

  /**
   * Start monitoring network statistics
   */
  startMonitoring(webrtcManager, interval = 1000) {
    this.statsIntervalId = setInterval(async () => {
      await this.updateStats(webrtcManager);
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  }

  /**
   * Update network statistics from WebRTC
   */
  async updateStats(webrtcManager) {
    let totalStats = {
      bandwidth: 0,
      packetLoss: 0,
      jitter: 0,
      rtt: 0,
      videoStats: { bytesReceived: 0, framesDecoded: 0 }
    };

    let peerCount = 0;

    // Collect stats from all peers
    for (const [peerId, _] of webrtcManager.peerConnections) {
      const stats = await webrtcManager.getPeerStats(peerId);
      if (stats) {
        peerCount++;

        if (stats.video) {
          totalStats.bandwidth += stats.video.bitrate || 0;
          totalStats.packetLoss += stats.video.packetsLost || 0;
          totalStats.videoStats.bytesReceived += stats.video.bytesReceived || 0;
          totalStats.videoStats.framesDecoded += stats.video.framesDecoded || 0;
        }

        if (stats.audio) {
          totalStats.jitter += stats.audio.jitter || 0;
          totalStats.packetLoss += stats.audio.packetsLost || 0;
        }

        if (stats.connection) {
          totalStats.rtt += stats.connection.roundTripTime || 0;
        }
      }
    }

    if (peerCount > 0) {
      totalStats.bandwidth = totalStats.bandwidth / peerCount;
      totalStats.jitter = totalStats.jitter / peerCount;
      totalStats.rtt = totalStats.rtt / peerCount;
    }

    // Calculate packet loss percentage
    if (totalStats.videoStats.framesDecoded > 0) {
      totalStats.packetLoss = (totalStats.packetLoss / (totalStats.videoStats.framesDecoded * 10)) * 100;
    }

    this.stats = {
      ...this.stats,
      bandwidth: Math.round(totalStats.bandwidth / 1000), // Convert to kbps
      packetLoss: Math.min(100, Math.max(0, totalStats.packetLoss)),
      jitter: Math.round(totalStats.jitter * 1000),
      rtt: Math.round(totalStats.rtt)
    };

    // Update bandwidth history for trend analysis
    this.bandwidthHistory.push(this.stats.bandwidth);
    if (this.bandwidthHistory.length > 60) {
      this.bandwidthHistory.shift();
    }

    this.onStatsUpdate?.(this.stats);
  }

  /**
   * Measure bandwidth using RMTP (Real-time Measurement Protocol)
   */
  async measureBandwidth(duration = 5000) {
    const startTime = Date.now();
    let bytesSent = 0;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(interval);
          const bandwidth = (bytesSent * 8) / (duration / 1000); // bits per second
          resolve(bandwidth / 1000); // convert to kbps
        }
      }, 100);
    });
  }

  /**
   * Get current network quality
   */
  getNetworkQuality() {
    const { bandwidth, packetLoss, jitter } = this.stats;

    let quality = 'excellent';
    if (bandwidth < 1000 || packetLoss > 5 || jitter > 150) {
      quality = 'poor';
    } else if (bandwidth < 3000 || packetLoss > 2 || jitter > 100) {
      quality = 'fair';
    } else if (bandwidth < 5000 || packetLoss > 1 || jitter > 50) {
      quality = 'good';
    }

    return quality;
  }

  /**
   * Calculate network score (0-100)
   */
  calculateNetworkScore() {
    const { bandwidth, packetLoss, jitter } = this.stats;

    // Bandwidth score (0-40 points)
    const bandwidthScore = Math.min(40, (bandwidth / 10000) * 40);

    // Packet loss score (0-30 points)
    const packetLossScore = Math.max(0, 30 - (packetLoss * 6));

    // Jitter score (0-30 points)
    const jitterScore = Math.max(0, 30 - (jitter / 5));

    return Math.round(bandwidthScore + packetLossScore + jitterScore);
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get bandwidth history
   */
  getBandwidthHistory() {
    return [...this.bandwidthHistory];
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkManager;
}
