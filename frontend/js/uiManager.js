/**
 * UI Manager - Client Side
 * Manages user interface updates and interactions
 */

class UIManager {
  constructor() {
    this.participants = new Map();
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
  }

  /**
   * Initialize UI event listeners
   */
  initializeEventListeners() {
    // Stream controls
    document.getElementById('start-stream-btn').addEventListener('click', () => {
      this.onStartStream?.();
    });

    document.getElementById('stop-stream-btn').addEventListener('click', () => {
      this.onStopStream?.();
    });

    // Copy stream ID
    const copyBtn = document.getElementById('copy-stream-id-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const streamId = document.getElementById('stream-id-code').textContent;
        navigator.clipboard.writeText(streamId).then(() => {
          alert('Stream ID copied to clipboard!');
        });
      });
    }

    // Join stream
    const joinBtn = document.getElementById('join-stream-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        const streamId = document.getElementById('join-stream-id').value.trim();
        const userName = document.getElementById('participant-name').value.trim();
        
        if (!streamId) {
          alert('Please enter a stream ID');
          return;
        }
        if (!userName) {
          alert('Please enter your name');
          return;
        }
        
        const statusEl = document.getElementById('join-status');
        statusEl.textContent = 'Joining stream...';
        statusEl.style.display = 'block';
        
        this.onJoinStream?.(streamId, userName);
      });
    }

    // Media controls
    document.getElementById('toggle-video-btn').addEventListener('click', () => {
      this.toggleVideo();
    });

    document.getElementById('toggle-audio-btn').addEventListener('click', () => {
      this.toggleAudio();
    });

    document.getElementById('toggle-screen-btn').addEventListener('click', () => {
      this.onShareScreen?.();
    });

    // Quality selection
    document.getElementById('quality-select').addEventListener('change', (e) => {
      this.onQualityChange?.(e.target.value);
    });

    // Chat
    document.getElementById('send-message-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Modal
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('join-btn').addEventListener('click', () => {
      const streamId = document.getElementById('join-stream-id').value;
      const userName = document.getElementById('join-user-name').value;
      if (streamId && userName) {
        this.onJoinStream?.(streamId, userName);
        this.closeModal();
      }
    });
  }

  /**
   * Update main video
   */
  setMainVideo(stream) {
    const videoElement = document.getElementById('main-video');
    videoElement.srcObject = stream;
  }

  /**
   * Add participant video
   */
  addParticipantVideo(peerId, userName, stream) {
    let container = document.querySelector(`[data-peer-id="${peerId}"]`);
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'participant-video-container';
      container.setAttribute('data-peer-id', peerId);
      
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsinline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      
      const info = document.createElement('div');
      info.className = 'participant-info';
      info.textContent = userName;
      
      container.appendChild(video);
      container.appendChild(info);
      document.getElementById('participants-grid').appendChild(container);
      
      this.participants.set(peerId, { video, info, container });
    }

    const participant = this.participants.get(peerId);
    if (participant && stream) {
      participant.video.srcObject = stream;
    }
  }

  /**
   * Remove participant video
   */
  removeParticipantVideo(peerId) {
    const participant = this.participants.get(peerId);
    if (participant) {
      participant.container.remove();
      this.participants.delete(peerId);
    }
  }

  /**
   * Update network stats display
   */
  updateNetworkStats(stats) {
    document.getElementById('bitrate').textContent = stats.bandwidth;
    document.getElementById('ping').textContent = Math.round(stats.rtt);
    document.getElementById('bandwidth-info').textContent = stats.bandwidth + ' kbps';
    document.getElementById('packet-loss-info').textContent = Math.round(stats.packetLoss * 100) / 100 + '%';
    document.getElementById('jitter-info').textContent = Math.round(stats.jitter) + ' ms';
  }

  /**
   * Update quality badge
   */
  updateQualityBadge(quality) {
    document.getElementById('video-quality').textContent = quality;
  }

  /**
   * Update network quality score
   */
  updateNetworkScore(score) {
    document.getElementById('quality-score').textContent = score + '/100';
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (connected) {
      indicator.classList.add('connected');
      text.textContent = 'Connected';
    } else {
      indicator.classList.remove('connected');
      text.textContent = 'Disconnected';
    }
  }

  /**
   * Toggle video
   */
  toggleVideo() {
    this.isVideoEnabled = !this.isVideoEnabled;
    const btn = document.getElementById('toggle-video-btn');
    btn.textContent = this.isVideoEnabled ? '📹 Disable Video' : '📹 Enable Video';
    btn.classList.toggle('btn-secondary');
    btn.classList.toggle('btn-danger');
    this.onVideoToggle?.(this.isVideoEnabled);
  }

  /**
   * Toggle audio
   */
  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    const btn = document.getElementById('toggle-audio-btn');
    btn.textContent = this.isAudioEnabled ? '🎤 Disable Audio' : '🎤 Enable Audio';
    btn.classList.toggle('btn-secondary');
    btn.classList.toggle('btn-danger');
    this.onAudioToggle?.(this.isAudioEnabled);
  }

  /**
   * Send chat message
   */
  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
      this.addChatMessage('You', message);
      this.onSendMessage?.(message);
      input.value = '';
    }
  }

  /**
   * Add chat message to display
   */
  addChatMessage(userName, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    messageElement.innerHTML = `
      <div class="user">${userName}</div>
      <div class="text">${this.escapeHtml(message)}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Update participants count
   */
  updateParticipantCount(count) {
    document.getElementById('participant-count').textContent = count;
  }

  /**
   * Update participants list
   */
  updateParticipantsList(participants) {
    const list = document.getElementById('participants-list');
    list.innerHTML = '';
    
    participants.forEach(participant => {
      const item = document.createElement('div');
      item.className = 'participant-item';
      
      const status = document.createElement('div');
      status.className = `participant-status ${participant.role === 'host' ? 'host' : ''}`;
      
      const name = document.createElement('span');
      name.textContent = `${participant.userId} ${participant.role === 'host' ? '(Host)' : ''}`;
      
      item.appendChild(status);
      item.appendChild(name);
      list.appendChild(item);
    });
  }

  /**
   * Show optimization tips
   */
  showOptimizationTips(recommendations) {
    const container = document.getElementById('optimization-tips');
    container.innerHTML = '';
    
    recommendations.forEach(rec => {
      const tip = document.createElement('div');
      tip.style.color = rec.severity === 'critical' ? '#ef476f' : '#ffd166';
      tip.textContent = `⚠️ ${rec.message}`;
      container.appendChild(tip);
    });
  }

  /**
   * Set control button states
   */
  setControlButtonStates(isStreaming) {
    document.getElementById('start-stream-btn').disabled = isStreaming;
    document.getElementById('stop-stream-btn').disabled = !isStreaming;
  }

  /**
   * Display stream ID for sharing
   */
  displayStreamId(streamId) {
    const display = document.getElementById('stream-id-display');
    const code = document.getElementById('stream-id-code');
    code.textContent = streamId;
    display.style.display = 'block';
  }

  /**
   * Show modal
   */
  showModal() {
    document.getElementById('join-modal').classList.add('active');
  }

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById('join-modal').classList.remove('active');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get stream title
   */
  getStreamTitle() {
    return document.getElementById('stream-title').value || 'Untitled Stream';
  }

  /**
   * Get selected quality
   */
  getSelectedQuality() {
    return document.getElementById('quality-select').value;
  }

  /**
   * Update buffer length display
   */
  updateBufferLength(seconds) {
    document.getElementById('buffer').textContent = Math.round(seconds);
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
