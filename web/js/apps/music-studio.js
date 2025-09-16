/**
 * Music Studio App for SwissKnife Web Desktop
 * Advanced audio creation and production with P2P collaboration
 */

(function() {
  'use strict';

  // Audio context and tools
  let audioContext = null;
  let masterGain = null;
  let tracks = [];
  let effects = [];
  let recordingState = {
    isRecording: false,
    mediaRecorder: null,
    audioChunks: []
  };
  
  // P2P collaboration
  let p2pSystem = null;
  let collaborationSession = null;
  let connectedPeers = [];

  // Audio presets and samples
  const audioPresets = {
    synthesizers: {
      lead: { type: 'sawtooth', attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8 },
      bass: { type: 'sine', attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 },
      pad: { type: 'triangle', attack: 0.8, decay: 0.4, sustain: 0.8, release: 1.2 }
    },
    drums: {
      kick: { frequency: 60, decay: 0.5 },
      snare: { frequency: 200, decay: 0.2, noise: true },
      hihat: { frequency: 8000, decay: 0.1, noise: true }
    },
    effects: {
      reverb: { roomSize: 0.5, damping: 0.5, wetLevel: 0.3 },
      delay: { delayTime: 0.3, feedback: 0.4, wetLevel: 0.2 },
      chorus: { rate: 1.5, depth: 0.3, wetLevel: 0.5 }
    }
  };

  // Initialize Audio System
  async function initializeAudioSystem() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      
      console.log('✅ Audio system initialized');
      updateStatus('audio_system', 'Ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio system:', error);
      updateStatus('audio_system', 'Error');
      return false;
    }
  }

  // Initialize P2P Collaboration
  async function initializeP2PCollaboration() {
    try {
      if (window.p2pSystem) {
        p2pSystem = window.p2pSystem;
        
        // Setup collaboration events
        p2pSystem.on('peer:connected', onPeerConnected);
        p2pSystem.on('peer:disconnected', onPeerDisconnected);
        p2pSystem.on('audio:shared', onAudioShared);
        p2pSystem.on('project:sync', onProjectSync);
        
        console.log('✅ P2P collaboration ready');
        updateStatus('p2p_collab', 'Ready');
        return true;
      } else {
        console.log('⚠️ P2P system not available');
        updateStatus('p2p_collab', 'Unavailable');
        return false;
      }
    } catch (error) {
      console.error('❌ P2P collaboration failed:', error);
      updateStatus('p2p_collab', 'Error');
      return false;
    }
  }

  function onPeerConnected(peerId) {
    connectedPeers.push(peerId);
    updateCollaboratorsList();
    console.log(`🤝 Peer connected: ${peerId}`);
  }

  function onPeerDisconnected(peerId) {
    connectedPeers = connectedPeers.filter(id => id !== peerId);
    updateCollaboratorsList();
    console.log(`👋 Peer disconnected: ${peerId}`);
  }

  function onAudioShared(data) {
    console.log('🎵 Audio shared from peer:', data);
    // Handle incoming audio data
    addSharedTrack(data);
  }

  function onProjectSync(projectData) {
    console.log('🔄 Project sync received:', projectData);
    // Sync project state with peers
    syncProjectState(projectData);
  }

  // Audio Generation Functions
  function createSynthesizer(preset) {
    const config = audioPresets.synthesizers[preset] || audioPresets.synthesizers.lead;
    
    return {
      play: (frequency, duration = 1.0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // ADSR envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + config.attack);
        gainNode.gain.exponentialRampToValueAtTime(config.sustain, audioContext.currentTime + config.attack + config.decay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration - config.release);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        return { oscillator, gainNode };
      }
    };
  }

  function createDrumSample(type) {
    const config = audioPresets.drums[type] || audioPresets.drums.kick;
    
    return {
      trigger: () => {
        if (config.noise) {
          // Create noise-based drum sound (snare, hihat)
          const bufferSize = audioContext.sampleRate * config.decay;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const data = buffer.getChannelData(0);
          
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
          }
          
          const source = audioContext.createBufferSource();
          const filter = audioContext.createBiquadFilter();
          const gainNode = audioContext.createGain();
          
          source.buffer = buffer;
          filter.type = 'bandpass';
          filter.frequency.value = config.frequency;
          
          gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.decay);
          
          source.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(masterGain);
          
          source.start();
        } else {
          // Create oscillator-based drum sound (kick)
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + config.decay);
          
          gainNode.gain.setValueAtTime(1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.decay);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + config.decay);
        }
      }
    };
  }

  // Recording Functions
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingState.mediaRecorder = new MediaRecorder(stream);
      recordingState.audioChunks = [];
      
      recordingState.mediaRecorder.ondataavailable = (event) => {
        recordingState.audioChunks.push(event.data);
      };
      
      recordingState.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordingState.audioChunks, { type: 'audio/wav' });
        addRecordedTrack(audioBlob);
      };
      
      recordingState.mediaRecorder.start();
      recordingState.isRecording = true;
      
      updateRecordingUI();
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Recording failed:', error);
    }
  }

  function stopRecording() {
    if (recordingState.mediaRecorder && recordingState.isRecording) {
      recordingState.mediaRecorder.stop();
      recordingState.isRecording = false;
      updateRecordingUI();
      console.log('⏹️ Recording stopped');
    }
  }

  function addRecordedTrack(audioBlob) {
    const track = {
      id: 'track_' + Date.now(),
      name: `Recording ${tracks.length + 1}`,
      type: 'audio',
      blob: audioBlob,
      url: URL.createObjectURL(audioBlob),
      volume: 1.0,
      muted: false
    };
    
    tracks.push(track);
    updateTracksList();
    
    // Share with peers if in collaboration mode
    if (collaborationSession && connectedPeers.length > 0) {
      shareTrackWithPeers(track);
    }
  }

  function addSharedTrack(trackData) {
    const track = {
      id: trackData.id,
      name: trackData.name + ' (Shared)',
      type: 'audio',
      url: trackData.url,
      volume: 1.0,
      muted: false,
      shared: true
    };
    
    tracks.push(track);
    updateTracksList();
  }

  async function shareTrackWithPeers(track) {
    if (p2pSystem && connectedPeers.length > 0) {
      try {
        const trackData = {
          id: track.id,
          name: track.name,
          url: track.url,
          timestamp: Date.now()
        };
        
        for (const peerId of connectedPeers) {
          await p2pSystem.sendToPeer(peerId, 'audio:shared', trackData);
        }
        
        console.log('🎵 Track shared with peers');
      } catch (error) {
        console.error('❌ Failed to share track:', error);
      }
    }
  }

  // UI Update Functions
  function updateStatus(component, status) {
    const statusEl = document.getElementById(`${component}-status`);
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `status ${status.toLowerCase().replace(' ', '-')}`;
    }
  }

  function updateRecordingUI() {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-record-btn');
    
    if (recordBtn && stopBtn) {
      recordBtn.style.display = recordingState.isRecording ? 'none' : 'inline-block';
      stopBtn.style.display = recordingState.isRecording ? 'inline-block' : 'none';
    }
  }

  function updateTracksList() {
    const tracksList = document.getElementById('tracks-list');
    if (!tracksList) return;
    
    tracksList.innerHTML = tracks.map(track => `
      <div class="track-item" data-track-id="${track.id}">
        <div class="track-header">
          <span class="track-name">${track.name}</span>
          <div class="track-controls">
            <button class="btn btn-sm btn-primary play-track" data-track-id="${track.id}">▶️</button>
            <button class="btn btn-sm btn-secondary mute-track" data-track-id="${track.id}">${track.muted ? '🔇' : '🔊'}</button>
            <button class="btn btn-sm btn-danger delete-track" data-track-id="${track.id}">🗑️</button>
          </div>
        </div>
        <div class="track-controls-extended">
          <label>Volume: <input type="range" class="volume-slider" data-track-id="${track.id}" min="0" max="1" step="0.1" value="${track.volume}"></label>
        </div>
      </div>
    `).join('');
    
    // Attach event listeners
    attachTrackEventListeners();
  }

  function updateCollaboratorsList() {
    const collabList = document.getElementById('collaborators-list');
    if (!collabList) return;
    
    collabList.innerHTML = connectedPeers.map(peerId => `
      <div class="collaborator-item">
        <span class="peer-indicator">🤝</span>
        <span class="peer-id">${peerId.substring(0, 8)}...</span>
        <span class="peer-status">Connected</span>
      </div>
    `).join('');
  }

  function attachTrackEventListeners() {
    // Play track buttons
    document.querySelectorAll('.play-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.getAttribute('data-track-id');
        playTrack(trackId);
      });
    });
    
    // Mute track buttons
    document.querySelectorAll('.mute-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.getAttribute('data-track-id');
        toggleTrackMute(trackId);
      });
    });
    
    // Delete track buttons
    document.querySelectorAll('.delete-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trackId = e.target.getAttribute('data-track-id');
        deleteTrack(trackId);
      });
    });
    
    // Volume sliders
    document.querySelectorAll('.volume-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const trackId = e.target.getAttribute('data-track-id');
        const volume = parseFloat(e.target.value);
        setTrackVolume(trackId, volume);
      });
    });
  }

  function playTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.url) return;
    
    const audio = new Audio(track.url);
    audio.volume = track.volume * (track.muted ? 0 : 1);
    audio.play();
  }

  function toggleTrackMute(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    track.muted = !track.muted;
    updateTracksList();
  }

  function deleteTrack(trackId) {
    tracks = tracks.filter(t => t.id !== trackId);
    updateTracksList();
  }

  function setTrackVolume(trackId, volume) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    track.volume = volume;
  }

  function renderApp(container) {
    container.innerHTML = `
      <div class="music-studio-container">
        <!-- Header Toolbar -->
        <div class="studio-toolbar">
          <div class="toolbar-section">
            <button class="btn btn-primary" id="new-project">🎵 New Project</button>
            <button class="btn btn-secondary" id="record-btn">🎤 Record</button>
            <button class="btn btn-danger" id="stop-record-btn" style="display: none;">⏹️ Stop</button>
            <button class="btn btn-secondary" id="import-audio">📁 Import</button>
          </div>
          <div class="toolbar-section">
            <div class="status-indicator">
              <span class="status-text">Audio: <span id="audio_system-status">Initializing...</span></span>
            </div>
            <div class="status-indicator">
              <span class="status-text">P2P: <span id="p2p_collab-status">Initializing...</span></span>
            </div>
          </div>
          <div class="toolbar-section">
            <button class="btn btn-success" id="start-collaboration">🤝 Collaborate</button>
            <button class="btn btn-warning" id="export-project">💾 Export</button>
          </div>
        </div>

        <!-- Main Studio Interface -->
        <div class="studio-content">
          <!-- Tracks Panel -->
          <div class="tracks-panel">
            <div class="panel-header">
              <h3>🎼 Tracks</h3>
              <div class="track-stats">
                <span class="stat-item">
                  <span class="stat-value" id="total-tracks">${tracks.length}</span>
                  <span class="stat-label">Tracks</span>
                </span>
              </div>
            </div>
            
            <div class="tracks-list" id="tracks-list">
              <!-- Tracks will be populated here -->
            </div>
          </div>

          <!-- Instruments Panel -->
          <div class="instruments-panel">
            <div class="panel-header">
              <h3>🎹 Instruments</h3>
            </div>
            
            <div class="instruments-grid">
              <div class="instrument-group">
                <h4>Synthesizers</h4>
                <button class="btn btn-instrument" data-synth="lead">🎵 Lead</button>
                <button class="btn btn-instrument" data-synth="bass">🎸 Bass</button>
                <button class="btn btn-instrument" data-synth="pad">🎹 Pad</button>
              </div>
              
              <div class="instrument-group">
                <h4>Drums</h4>
                <button class="btn btn-drum" data-drum="kick">🥁 Kick</button>
                <button class="btn btn-drum" data-drum="snare">🥁 Snare</button>
                <button class="btn btn-drum" data-drum="hihat">🥁 Hi-Hat</button>
              </div>
            </div>
          </div>

          <!-- Collaboration Panel -->
          <div class="collaboration-panel">
            <div class="panel-header">
              <h3>🤝 Collaborators</h3>
              <div class="collab-stats">
                <span class="stat-item">
                  <span class="stat-value" id="connected-peers">${connectedPeers.length}</span>
                  <span class="stat-label">Connected</span>
                </span>
              </div>
            </div>
            
            <div class="collaborators-list" id="collaborators-list">
              <!-- Collaborators will be populated here -->
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .music-studio-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .studio-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom: 1px solid #ddd;
        }
        
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .studio-content {
          display: flex;
          flex: 1;
          min-height: 0;
        }
        
        .tracks-panel, .instruments-panel, .collaboration-panel {
          flex: 1;
          border-right: 1px solid #ddd;
          display: flex;
          flex-direction: column;
        }
        
        .collaboration-panel {
          border-right: none;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }
        
        .tracks-list, .collaborators-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        
        .track-item {
          padding: 12px;
          margin: 4px 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .track-controls {
          display: flex;
          gap: 4px;
        }
        
        .instruments-grid {
          padding: 16px;
        }
        
        .instrument-group {
          margin-bottom: 16px;
        }
        
        .instrument-group h4 {
          margin: 0 0 8px 0;
          color: #666;
        }
        
        .btn-instrument, .btn-drum {
          display: block;
          width: 100%;
          margin: 4px 0;
          padding: 8px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-instrument:hover, .btn-drum:hover {
          background: #0056b3;
        }
        
        .collaborator-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 4px;
          margin: 4px 0;
        }
        
        .status {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .status.ready { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.unavailable { background: #fff3cd; color: #856404; }
      </style>
    `;
    
    // Attach event listeners
    attachEventListeners(container);
    
    // Initialize audio system
    initializeAudioSystem();
    initializeP2PCollaboration();
    
    // Update initial UI
    updateTracksList();
    updateCollaboratorsList();
  }

  function attachEventListeners(container) {
    // Record button
    container.querySelector('#record-btn')?.addEventListener('click', startRecording);
    container.querySelector('#stop-record-btn')?.addEventListener('click', stopRecording);
    
    // Synthesizer buttons
    container.querySelectorAll('.btn-instrument').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const synthType = e.target.getAttribute('data-synth');
        const synth = createSynthesizer(synthType);
        // Play a test note
        synth.play(440, 0.5); // A4 for 0.5 seconds
      });
    });
    
    // Drum buttons
    container.querySelectorAll('.btn-drum').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const drumType = e.target.getAttribute('data-drum');
        const drum = createDrumSample(drumType);
        drum.trigger();
      });
    });
    
    // Other toolbar buttons
    container.querySelector('#new-project')?.addEventListener('click', () => {
      tracks = [];
      updateTracksList();
    });
    
    container.querySelector('#start-collaboration')?.addEventListener('click', () => {
      if (p2pSystem) {
        collaborationSession = true;
        console.log('🤝 Collaboration session started');
      }
    });
  }

  // Export for global use
  window.renderMusicStudioApp = renderApp;

})();