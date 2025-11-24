/**
 * WebRTCManager
 * Manages peer-to-peer connections for real-time video/audio communication
 * between host and participants
 */

const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = require('wrtc');

class WebRTCManager {
  constructor() {
    this.peers = new Map();
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ];
    this.peerConfig = {
      iceServers: this.iceServers
    };
  }

  /**
   * Create a new peer connection
   */
  createPeerConnection(peerId, streamId) {
    try {
      const peerConnection = new RTCPeerConnection(this.peerConfig);
      
      const peerData = {
        id: peerId,
        streamId,
        connection: peerConnection,
        dataChannels: new Map(),
        stats: {
          bytesReceived: 0,
          bytesSent: 0,
          packetsLost: 0,
          jitter: 0,
          roundTripTime: 0
        },
        createdAt: Date.now()
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('ice-candidate', {
            peerId,
            candidate: event.candidate.toJSON()
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`Peer ${peerId} connection state: ${state}`);
        peerData.connectionState = state;
        
        if (state === 'failed' || state === 'disconnected') {
          this.closePeerConnection(peerId);
        }
      };

      // Handle ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
      };

      // Handle track additions
      peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        peerData.remoteTracks = peerData.remoteTracks || [];
        peerData.remoteTracks.push(event.track);
      };

      this.peers.set(peerId, peerData);
      return peerData;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  /**
   * Create an offer for initiating connection
   */
  async createOffer(peerId) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      const offer = await peerData.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerData.connection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Create an answer to received offer
   */
  async createAnswer(peerId) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      const answer = await peerData.connection.createAnswer();
      await peerData.connection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Handle received offer
   */
  async handleOffer(peerId, offer) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      await peerData.connection.setRemoteDescription(new RTCSessionDescription(offer));
      return true;
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  /**
   * Handle received answer
   */
  async handleAnswer(peerId, answer) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      await peerData.connection.setRemoteDescription(new RTCSessionDescription(answer));
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
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Non-critical error
      return false;
    }
  }

  /**
   * Create data channel for metadata, chat, etc.
   */
  createDataChannel(peerId, label) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      const dataChannel = peerData.connection.createDataChannel(label, {
        ordered: true
      });

      this.setupDataChannelHandlers(dataChannel, peerId);
      peerData.dataChannels.set(label, dataChannel);
      return dataChannel;
    } catch (error) {
      console.error('Error creating data channel:', error);
      throw error;
    }
  }

  /**
   * Setup data channel event handlers
   */
  setupDataChannelHandlers(dataChannel, peerId) {
    dataChannel.onopen = () => {
      console.log(`Data channel open for peer ${peerId}`);
    };

    dataChannel.onmessage = (event) => {
      console.log(`Message from ${peerId}:`, event.data);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for peer ${peerId}:`, error);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed for peer ${peerId}`);
    };
  }

  /**
   * Get peer connection statistics
   */
  async getPeerStats(peerId) {
    const peerData = this.peers.get(peerId);
    if (!peerData) {
      return null;
    }

    try {
      const stats = await peerData.connection.getStats();
      const result = {
        peerId,
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
          if (report.mediaType === 'audio') {
            result.audio.bytesSent = report.bytesSent;
          } else if (report.mediaType === 'video') {
            result.video.bytesSent = report.bytesSent;
            result.video.framesSent = report.framesSent;
            result.video.frameRate = report.framesPerSecond;
          }
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.connection.roundTripTime = report.currentRoundTripTime;
          result.connection.availableOutgoingBitrate = report.availableOutgoingBitrate;
          result.connection.bandwidth = report.availableOutgoingBitrate;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting peer stats:', error);
      return null;
    }
  }

  /**
   * Close peer connection
   */
  closePeerConnection(peerId) {
    const peerData = this.peers.get(peerId);
    if (peerData) {
      peerData.dataChannels.forEach(channel => {
        try {
          channel.close();
        } catch (e) {}
      });

      try {
        peerData.connection.close();
      } catch (e) {}

      this.peers.delete(peerId);
      console.log(`Peer connection ${peerId} closed`);
      return true;
    }
    return false;
  }

  /**
   * Get all active peers
   */
  getActivePeers(streamId) {
    const activePeers = [];
    this.peers.forEach((peerData, peerId) => {
      if (peerData.streamId === streamId) {
        activePeers.push({
          id: peerId,
          state: peerData.connection.connectionState,
          stats: peerData.stats
        });
      }
    });
    return activePeers;
  }
}

module.exports = WebRTCManager;
