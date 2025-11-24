/**
 * WebRTC Manager - Client Side
 * Handles peer connections and media streams
 */

class WebRTCManager {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };
  }

  /**
   * Get user media (camera and microphone)
   */
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  /**
   * Get display media (screen sharing)
   */
  async getDisplayMedia(constraints = { video: true, audio: false }) {
    try {
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(peerId) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId);
    }

    const peerConnection = new RTCPeerConnection(this.configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote track
    peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      this.onRemoteTrack?.(peerId, event.stream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(peerId, event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${peerConnection.connectionState}`);
      this.onConnectionStateChange?.(peerId, peerConnection.connectionState);
    };

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  /**
   * Create offer
   */
  async createOffer(peerId) {
    const peerConnection = this.createPeerConnection(peerId);
    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Create answer
   */
  async createAnswer(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) throw new Error('Peer connection not found');

    try {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Handle offer
   */
  async handleOffer(peerId, offer) {
    const peerConnection = this.createPeerConnection(peerId);
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      return true;
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  /**
   * Handle answer
   */
  async handleAnswer(peerId, answer) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) throw new Error('Peer connection not found');

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      return true;
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(peerId, candidate) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) throw new Error('Peer connection not found');

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      return false;
    }
  }

  /**
   * Get peer connection statistics
   */
  async getPeerStats(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return null;

    try {
      const stats = await peerConnection.getStats();
      const result = {
        audio: {},
        video: {},
        connection: {}
      };

      stats.forEach(report => {
        if (report.type === 'inbound-rtp') {
          if (report.mediaType === 'audio') {
            result.audio.bytesReceived = report.bytesReceived;
            result.audio.packetsLost = report.packetsLost;
            result.audio.jitter = report.jitter;
          } else if (report.mediaType === 'video') {
            result.video.bytesReceived = report.bytesReceived;
            result.video.packetsLost = report.packetsLost;
            result.video.framesDecoded = report.framesDecoded;
            result.video.frameRate = report.framesPerSecond;
          }
        }

        if (report.type === 'outbound-rtp') {
          if (report.mediaType === 'video') {
            result.video.bytesSent = report.bytesSent;
            result.video.framesSent = report.framesSent;
            result.video.bitrate = report.bytesSent * 8;
          }
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.connection.roundTripTime = report.currentRoundTripTime * 1000;
          result.connection.availableBitrate = report.availableOutgoingBitrate;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  /**
   * Close peer connection
   */
  closePeerConnection(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.stopLocalStream();
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebRTCManager;
}
