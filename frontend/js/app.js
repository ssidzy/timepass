/**
 * Main Application Logic
 * Orchestrates streaming, WebRTC, and real-time communication
 */

let socket;
let webrtcManager;
let networkManager;
let uiManager;
let currentStreamId = null;
let currentUserId = null;
let isHost = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize managers
    webrtcManager = new WebRTCManager();
    networkManager = new NetworkManager();
    uiManager = new UIManager();

    // Setup UI event listeners
    uiManager.initializeEventListeners();

    // Connect to server
    connectToServer();

    // Setup WebRTC callbacks
    setupWebRTCCallbacks();

    // Setup network monitoring
    networkManager.onStatsUpdate = (stats) => {
      uiManager.updateNetworkStats(stats);
      
      const score = networkManager.calculateNetworkScore();
      uiManager.updateNetworkScore(score);

      // Get optimization recommendations
      const recommendations = getOptimizationRecommendations(stats);
      if (recommendations.length > 0) {
        uiManager.showOptimizationTips(recommendations);
      }
    };

    // Setup UI callbacks
    setupUICallbacks();

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

/**
 * Connect to WebSocket server
 */
function connectToServer() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    uiManager.updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    uiManager.updateConnectionStatus(false);
  });

  // Stream events
  socket.on('participant-joined', (data) => {
    console.log('Participant joined:', data);
    uiManager.updateParticipantCount(data.participantCount);
  });

  socket.on('participant-left', (data) => {
    console.log('Participant left:', data);
    webrtcManager.closePeerConnection(data.userId);
    uiManager.removeParticipantVideo(data.userId);
    uiManager.updateParticipantCount(data.participantCount);
  });

  socket.on('current-participants', (data) => {
    console.log('Current participants:', data);
    uiManager.updateParticipantsList(data.participants);
  });

  // WebRTC signaling
  socket.on('offer', async (data) => {
    console.log('Received offer from:', data.from);
    try {
      await webrtcManager.handleOffer(data.from, data.offer);
      const answer = await webrtcManager.createAnswer(data.from);
      socket.emit('answer', {
        streamId: currentStreamId,
        to: data.from,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  });

  socket.on('answer', async (data) => {
    console.log('Received answer from:', data.from);
    try {
      await webrtcManager.handleAnswer(data.from, data.answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  });

  socket.on('ice-candidate', async (data) => {
    console.log('Received ICE candidate from:', data.from);
    try {
      await webrtcManager.addIceCandidate(data.from, data.candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  });

  // Network optimization
  socket.on('quality-recommendation', (data) => {
    console.log('Quality recommendation:', data);
    if (data.suggested !== data.current) {
      // Auto-adjust quality if needed
      document.getElementById('quality-select').value = data.suggested;
    }
  });

  socket.on('optimization-params', (data) => {
    console.log('Optimization parameters:', data);
  });

  // Chat
  socket.on('chat-message', (data) => {
    uiManager.addChatMessage(data.userName, data.message);
  });

  socket.on('error', (data) => {
    console.error('Server error:', data.message);
    alert(`Error: ${data.message}`);
  });
}

/**
 * Setup WebRTC callbacks
 */
function setupWebRTCCallbacks() {
  webrtcManager.onRemoteTrack = (peerId, stream) => {
    console.log('Remote track received from:', peerId);
    uiManager.addParticipantVideo(peerId, peerId, stream);
  };

  webrtcManager.onIceCandidate = (peerId, candidate) => {
    socket.emit('ice-candidate', {
      streamId: currentStreamId,
      candidate: candidate.toJSON()
    });
  };

  webrtcManager.onConnectionStateChange = (peerId, state) => {
    if (state === 'failed' || state === 'disconnected') {
      uiManager.removeParticipantVideo(peerId);
    }
  };
}

/**
 * Setup UI callbacks
 */
function setupUICallbacks() {
  // Start stream
  uiManager.onStartStream = async () => {
    try {
      const title = uiManager.getStreamTitle();
      const quality = uiManager.getSelectedQuality();

      // Get user media
      const stream = await webrtcManager.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: true
      });

      // Set local video
      uiManager.setMainVideo(stream);

      // Create stream on server
      const response = await fetch('/api/stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId || 'user-' + Math.random().toString(36).substr(2, 9),
          title,
          quality
        })
      });

      const data = await response.json();
      currentStreamId = data.streamId;
      isHost = true;
      currentUserId = data.streamId;

      // Display stream ID for sharing
      uiManager.displayStreamId(data.streamId);

      // Join stream
      socket.emit('join-stream', {
        streamId: currentStreamId,
        userId: currentUserId,
        role: 'host'
      });

      // Start network monitoring
      networkManager.startMonitoring(webrtcManager, 1000);

      uiManager.updateConnectionStatus(true);
      uiManager.setControlButtonStates(true);
      uiManager.updateParticipantCount(1);

      console.log('Stream started:', currentStreamId);
    } catch (error) {
      console.error('Error starting stream:', error);
      alert('Failed to start stream: ' + error.message);
    }
  };

  // Stop stream
  uiManager.onStopStream = () => {
    webrtcManager.closeAll();
    networkManager.stopMonitoring();
    socket.emit('leave-stream', {
      streamId: currentStreamId,
      userId: currentUserId
    });
    uiManager.setControlButtonStates(false);
    currentStreamId = null;
    isHost = false;
  };

  // Toggle video
  uiManager.onVideoToggle = (enabled) => {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  // Toggle audio
  uiManager.onAudioToggle = (enabled) => {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  // Share screen
  uiManager.onShareScreen = async () => {
    try {
      const screenStream = await webrtcManager.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      webrtcManager.peerConnections.forEach(async (peerConnection) => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      // Show screen in main video
      uiManager.setMainVideo(screenStream);

      // Stop screen sharing when user stops
      videoTrack.onended = () => {
        if (webrtcManager.localStream) {
          const originalTrack = webrtcManager.localStream.getVideoTracks()[0];
          webrtcManager.peerConnections.forEach(async (peerConnection) => {
            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(originalTrack);
            }
          });
          uiManager.setMainVideo(webrtcManager.localStream);
        }
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  // Quality change
  uiManager.onQualityChange = (quality) => {
    console.log('Quality changed to:', quality);
    uiManager.updateQualityBadge(quality);
    // In real implementation, would re-encode video at new quality
  };

  // Send message
  uiManager.onSendMessage = (message) => {
    socket.emit('chat-message', {
      streamId: currentStreamId,
      userName: currentUserId,
      message
    });
  };

  // Join stream
  uiManager.onJoinStream = (streamId, userName) => {
    currentStreamId = streamId;
    currentUserId = userName;

    // Get user media
    webrtcManager.getUserMedia({
      video: { 
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60 }
      },
      audio: true
    }).then(stream => {
      uiManager.setMainVideo(stream);

      // Join stream
      socket.emit('join-stream', {
        streamId,
        userId: userName,
        role: 'participant'
      });

      // Create offer to host
      webrtcManager.createOffer('host').then(offer => {
        socket.emit('offer', {
          streamId,
          to: 'host',
          offer
        });
      });

      // Start network monitoring
      networkManager.startMonitoring(webrtcManager, 1000);
      uiManager.setControlButtonStates(false);
    }).catch(error => {
      console.error('Error getting user media:', error);
      alert('Failed to access camera/microphone');
    });
  };
}

/**
 * Get optimization recommendations
 */
function getOptimizationRecommendations(stats) {
  const recommendations = [];

  if (stats.bandwidth < 1000) {
    recommendations.push({
      category: 'Bandwidth',
      severity: 'critical',
      message: 'Very low bandwidth. Consider reducing quality.'
    });
  } else if (stats.bandwidth < 3000) {
    recommendations.push({
      category: 'Bandwidth',
      severity: 'warning',
      message: 'Low bandwidth detected.'
    });
  }

  if (stats.packetLoss > 5) {
    recommendations.push({
      category: 'Network Quality',
      severity: 'critical',
      message: 'High packet loss. Network unstable.'
    });
  }

  if (stats.jitter > 150) {
    recommendations.push({
      category: 'Stability',
      severity: 'warning',
      message: 'High jitter. Increase buffer size.'
    });
  }

  return recommendations;
}

// Show join modal on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    uiManager?.showModal?.();
  }, 500);
});
