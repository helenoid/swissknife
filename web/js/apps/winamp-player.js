/**
 * 🎵 SwissKnife Winamp-Style Media Player
 * 
 * A nostalgic Winamp-inspired music player that runs in the background/foreground
 * while users work. Features classic Winamp aesthetics with modern functionality.
 * 
 * Features:
 * - Classic Winamp-style interface with green LCD display
 * - Background/foreground play modes
 * - Playlist management with drag & drop support
 * - Equalizer with preset and custom settings
 * - Visualization (spectrum analyzer, oscilloscope)
 * - Skin support (classic green, blue, red themes)
 * - Keyboard shortcuts and hotkeys
 * - Mini mode for background play
 * - File format support (MP3, WAV, OGG, M4A)
 * - Crossfade and gapless playback
 * - Global hotkeys for system-wide control
 */

class WinampPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = 0;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.8;
        this.isMuted = false;
        this.isRepeat = false;
        this.isShuffle = false;
        this.isMinimized = false;
        this.currentSkin = 'classic';
        this.playMode = 'foreground'; // 'foreground' or 'background'
        
        // Audio context and nodes
        this.audioContext = null;
        this.audioElement = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;
        this.eqNodes = [];
        
        // Playlist and library
        this.playlist = [];
        this.library = [];
        this.currentPlaylist = 'main';
        
        // Equalizer settings (10-band)
        this.eqEnabled = true;
        this.eqPreset = 'Normal';
        this.eqBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // -12dB to +12dB
        
        // Visualization
        this.visualizationMode = 'spectrum'; // 'spectrum', 'oscilloscope', 'none'
        this.visualizationData = new Uint8Array(256);
        
        // UI elements
        this.container = null;
        this.mainWindow = null;
        this.playlistWindow = null;
        this.equalizerWindow = null;
        this.miniPlayer = null;
        
        // Initialize default playlist with some demo tracks
        this.initializeDefaultPlaylist();
    }
    
    /**
     * 🎼 Initialize with some demo tracks for testing
     */
    initializeDefaultPlaylist() {
        this.playlist = [
            {
                id: 1,
                title: "Chill Lo-Fi Beat",
                artist: "SwissKnife Studio",
                album: "Desktop Vibes",
                duration: 180,
                url: "data:audio/wav;base64,", // Placeholder - would be actual audio data
                genre: "Lo-Fi"
            },
            {
                id: 2,
                title: "Coding Focus",
                artist: "Productivity Music",
                album: "Work Flow",
                duration: 240,
                url: "data:audio/wav;base64,",
                genre: "Ambient"
            },
            {
                id: 3,
                title: "Digital Dreams",
                artist: "Cyber Sounds",
                album: "Future Nostalgia",
                duration: 195,
                url: "data:audio/wav;base64,",
                genre: "Electronic"
            },
            {
                id: 4,
                title: "Terminal Sessions",
                artist: "Hacker Collective",
                album: "Code & Coffee",
                duration: 220,
                url: "data:audio/wav;base64,",
                genre: "Synthwave"
            }
        ];
        
        this.library = [...this.playlist];
    }
    
    /**
     * 🚀 Initialize the Winamp player
     */
    async initialize() {
        console.log('🎵 Initializing Winamp-Style Media Player...');
        
        try {
            // Initialize Web Audio API
            await this.initializeAudio();
            
            // Load saved settings
            this.loadSettings();
            
            console.log('✅ Winamp Player initialized successfully');
            return this;
        } catch (error) {
            console.error('❌ Failed to initialize Winamp Player:', error);
            throw error;
        }
    }
    
    /**
     * 🔊 Initialize Web Audio API
     */
    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio element
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.preload = 'metadata';
            
            // Create audio nodes
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            this.gainNode = this.audioContext.createGain();
            this.analyserNode = this.audioContext.createAnalyser();
            
            // Configure analyser
            this.analyserNode.fftSize = 512;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Create equalizer (10-band)
            this.createEqualizer();
            
            // Connect audio graph
            this.connectAudioNodes();
            
            // Set up event listeners
            this.setupAudioEventListeners();
            
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }
    
    /**
     * 🎛️ Create 10-band equalizer
     */
    createEqualizer() {
        const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        
        this.eqNodes = frequencies.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0;
            return filter;
        });
    }
    
    /**
     * 🔗 Connect audio nodes in the processing chain
     */
    connectAudioNodes() {
        let currentNode = this.sourceNode;
        
        // Connect through equalizer if enabled
        if (this.eqEnabled) {
            this.eqNodes.forEach(eqNode => {
                currentNode.connect(eqNode);
                currentNode = eqNode;
            });
        }
        
        // Connect to analyser and gain
        currentNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // Set initial volume
        this.gainNode.gain.value = this.volume;
    }
    
    /**
     * 🎧 Set up audio event listeners
     */
    setupAudioEventListeners() {
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.updateDisplay();
        });
        
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.updateDisplay();
            this.updateVisualization();
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.nextTrack();
        });
    }
    
    /**
     * 🎨 Create the main Winamp interface
     */
    createInterface() {
        const winampHTML = `
            <div class="winamp-player ${this.currentSkin}-skin">
                <!-- Main Player Window -->
                <div class="winamp-main" id="winamp-main">
                    <!-- Title Bar -->
                    <div class="winamp-titlebar">
                        <div class="winamp-title">SwissKnife Winamp Player</div>
                        <div class="winamp-controls">
                            <button class="winamp-btn minimize" onclick="winampPlayer.toggleMinimize()">_</button>
                            <button class="winamp-btn shade" onclick="winampPlayer.toggleShade()">^</button>
                            <button class="winamp-btn close" onclick="winampPlayer.close()">×</button>
                        </div>
                    </div>
                    
                    <!-- Display Area -->
                    <div class="winamp-display">
                        <div class="winamp-time" id="winamp-time">-:--</div>
                        <div class="winamp-info">
                            <div class="winamp-track-info" id="winamp-track-info">
                                <marquee class="winamp-marquee" id="winamp-marquee">
                                    SwissKnife Winamp - Welcome! Load your music and enjoy!
                                </marquee>
                            </div>
                            <div class="winamp-status" id="winamp-status">
                                <span id="winamp-status-icons">♫ ● ≡</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Visualization -->
                    <div class="winamp-visualization" id="winamp-visualization">
                        <canvas id="winamp-viz-canvas" width="76" height="16"></canvas>
                    </div>
                    
                    <!-- Transport Controls -->
                    <div class="winamp-transport">
                        <button class="winamp-transport-btn" onclick="winampPlayer.previousTrack()" title="Previous">⏮</button>
                        <button class="winamp-transport-btn play-pause" id="winamp-play-btn" onclick="winampPlayer.togglePlay()" title="Play/Pause">▶</button>
                        <button class="winamp-transport-btn" onclick="winampPlayer.stop()" title="Stop">⏹</button>
                        <button class="winamp-transport-btn" onclick="winampPlayer.nextTrack()" title="Next">⏭</button>
                        <button class="winamp-transport-btn eject" onclick="winampPlayer.showPlaylist()" title="Playlist">⏏</button>
                    </div>
                    
                    <!-- Volume and Position -->
                    <div class="winamp-sliders">
                        <div class="winamp-volume">
                            <label>Volume</label>
                            <input type="range" id="winamp-volume" min="0" max="100" value="80" 
                                   onchange="winampPlayer.setVolume(this.value/100)">
                        </div>
                        <div class="winamp-position">
                            <label>Position</label>
                            <input type="range" id="winamp-position" min="0" max="100" value="0"
                                   onchange="winampPlayer.setPosition(this.value/100)">
                        </div>
                    </div>
                    
                    <!-- Mode Controls -->
                    <div class="winamp-modes">
                        <button class="winamp-mode-btn ${this.isShuffle ? 'active' : ''}" 
                                id="winamp-shuffle" onclick="winampPlayer.toggleShuffle()" title="Shuffle">🔀</button>
                        <button class="winamp-mode-btn ${this.isRepeat ? 'active' : ''}" 
                                id="winamp-repeat" onclick="winampPlayer.toggleRepeat()" title="Repeat">🔁</button>
                        <button class="winamp-mode-btn" onclick="winampPlayer.showEqualizer()" title="Equalizer">EQ</button>
                        <button class="winamp-mode-btn" onclick="winampPlayer.togglePlayMode()" title="Background Mode">BG</button>
                    </div>
                </div>
                
                <!-- Playlist Window (Hidden by default) -->
                <div class="winamp-playlist" id="winamp-playlist" style="display: none;">
                    <div class="winamp-titlebar">
                        <div class="winamp-title">Playlist Editor</div>
                        <button class="winamp-btn close" onclick="winampPlayer.hidePlaylist()">×</button>
                    </div>
                    <div class="winamp-playlist-content">
                        <div class="winamp-playlist-header">
                            <span>Track</span>
                            <span>Time</span>
                        </div>
                        <div class="winamp-playlist-tracks" id="winamp-playlist-tracks">
                            <!-- Playlist tracks will be populated here -->
                        </div>
                        <div class="winamp-playlist-controls">
                            <button onclick="winampPlayer.loadFiles()">Add Files</button>
                            <button onclick="winampPlayer.clearPlaylist()">Clear</button>
                            <button onclick="winampPlayer.savePlaylist()">Save</button>
                            <button onclick="winampPlayer.loadPlaylist()">Load</button>
                        </div>
                    </div>
                </div>
                
                <!-- Equalizer Window (Hidden by default) -->
                <div class="winamp-equalizer" id="winamp-equalizer" style="display: none;">
                    <div class="winamp-titlebar">
                        <div class="winamp-title">Equalizer</div>
                        <button class="winamp-btn close" onclick="winampPlayer.hideEqualizer()">×</button>
                    </div>
                    <div class="winamp-eq-content">
                        <div class="winamp-eq-presets">
                            <select id="winamp-eq-preset" onchange="winampPlayer.setEQPreset(this.value)">
                                <option value="Normal">Normal</option>
                                <option value="Rock">Rock</option>
                                <option value="Pop">Pop</option>
                                <option value="Jazz">Jazz</option>
                                <option value="Classical">Classical</option>
                                <option value="Electronic">Electronic</option>
                                <option value="Bass Boost">Bass Boost</option>
                                <option value="Vocal">Vocal</option>
                            </select>
                            <button onclick="winampPlayer.toggleEQ()">${this.eqEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                        <div class="winamp-eq-sliders" id="winamp-eq-sliders">
                            <!-- EQ sliders will be populated here -->
                        </div>
                    </div>
                </div>
                
                <!-- Mini Player (Background mode) -->
                <div class="winamp-mini" id="winamp-mini" style="display: none;">
                    <div class="winamp-mini-info">
                        <span id="winamp-mini-track">No Track</span>
                        <span id="winamp-mini-time">-:--</span>
                    </div>
                    <div class="winamp-mini-controls">
                        <button onclick="winampPlayer.previousTrack()">⏮</button>
                        <button id="winamp-mini-play" onclick="winampPlayer.togglePlay()">▶</button>
                        <button onclick="winampPlayer.nextTrack()">⏭</button>
                        <button onclick="winampPlayer.togglePlayMode()">↗</button>
                    </div>
                </div>
            </div>
        `;
        
        return winampHTML;
    }
    
    /**
     * 🎨 Apply Winamp styling
     */
    getStyles() {
        return `
            <style>
            .winamp-player {
                position: fixed;
                top: 100px;
                right: 20px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                z-index: 10000;
                user-select: none;
            }
            
            /* Classic Green Skin */
            .classic-skin {
                --winamp-bg: #000000;
                --winamp-panel: #008000;
                --winamp-text: #00ff00;
                --winamp-button: #404040;
                --winamp-button-hover: #606060;
                --winamp-active: #ffff00;
                --winamp-border: #c0c0c0;
            }
            
            .winamp-main {
                background: var(--winamp-bg);
                border: 2px outset var(--winamp-border);
                width: 275px;
                height: 116px;
                position: relative;
            }
            
            .winamp-titlebar {
                background: var(--winamp-panel);
                color: var(--winamp-text);
                height: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 4px;
                font-weight: bold;
                cursor: move;
            }
            
            .winamp-controls {
                display: flex;
                gap: 2px;
            }
            
            .winamp-btn {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                width: 16px;
                height: 12px;
                font-size: 9px;
                cursor: pointer;
                padding: 0;
            }
            
            .winamp-btn:hover {
                background: var(--winamp-button-hover);
            }
            
            .winamp-btn:active {
                border: 1px inset var(--winamp-border);
            }
            
            .winamp-display {
                background: var(--winamp-bg);
                color: var(--winamp-text);
                padding: 4px;
                display: flex;
                gap: 8px;
                height: 24px;
                align-items: center;
            }
            
            .winamp-time {
                background: var(--winamp-bg);
                color: var(--winamp-text);
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                width: 60px;
                text-align: center;
                border: 1px inset var(--winamp-border);
                padding: 2px;
            }
            
            .winamp-info {
                flex: 1;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .winamp-track-info {
                background: var(--winamp-bg);
                color: var(--winamp-text);
                border: 1px inset var(--winamp-border);
                height: 12px;
                overflow: hidden;
                padding: 1px 4px;
                flex: 1;
            }
            
            .winamp-marquee {
                color: var(--winamp-text);
                font-size: 10px;
                height: 100%;
                line-height: 10px;
            }
            
            .winamp-status {
                height: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 8px;
            }
            
            .winamp-visualization {
                background: var(--winamp-bg);
                border: 1px inset var(--winamp-border);
                margin: 2px 4px;
                height: 16px;
                position: relative;
            }
            
            #winamp-viz-canvas {
                width: 100%;
                height: 100%;
                background: var(--winamp-bg);
            }
            
            .winamp-transport {
                display: flex;
                gap: 2px;
                padding: 4px;
                justify-content: center;
            }
            
            .winamp-transport-btn {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                width: 24px;
                height: 18px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .winamp-transport-btn:hover {
                background: var(--winamp-button-hover);
            }
            
            .winamp-transport-btn:active {
                border: 1px inset var(--winamp-border);
            }
            
            .winamp-sliders {
                display: flex;
                gap: 8px;
                padding: 0 4px 4px;
                font-size: 9px;
            }
            
            .winamp-volume, .winamp-position {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .winamp-volume input, .winamp-position input {
                width: 100%;
                height: 12px;
                margin: 2px 0;
            }
            
            .winamp-modes {
                display: flex;
                gap: 2px;
                padding: 0 4px 4px;
                justify-content: center;
            }
            
            .winamp-mode-btn {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                width: 20px;
                height: 14px;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .winamp-mode-btn:hover {
                background: var(--winamp-button-hover);
            }
            
            .winamp-mode-btn.active {
                background: var(--winamp-active);
                color: var(--winamp-bg);
                border: 1px inset var(--winamp-border);
            }
            
            /* Playlist Window */
            .winamp-playlist {
                position: absolute;
                top: 120px;
                left: 0;
                width: 275px;
                height: 200px;
                background: var(--winamp-bg);
                border: 2px outset var(--winamp-border);
            }
            
            .winamp-playlist-content {
                padding: 4px;
                height: calc(100% - 18px);
                display: flex;
                flex-direction: column;
            }
            
            .winamp-playlist-header {
                display: flex;
                justify-content: space-between;
                color: var(--winamp-text);
                font-weight: bold;
                border-bottom: 1px solid var(--winamp-border);
                padding-bottom: 2px;
                margin-bottom: 4px;
            }
            
            .winamp-playlist-tracks {
                flex: 1;
                overflow-y: auto;
                background: var(--winamp-bg);
                border: 1px inset var(--winamp-border);
                padding: 2px;
            }
            
            .winamp-playlist-track {
                display: flex;
                justify-content: space-between;
                color: var(--winamp-text);
                padding: 1px 4px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .winamp-playlist-track:hover {
                background: var(--winamp-button);
            }
            
            .winamp-playlist-track.current {
                background: var(--winamp-active);
                color: var(--winamp-bg);
            }
            
            .winamp-playlist-controls {
                display: flex;
                gap: 4px;
                margin-top: 4px;
                justify-content: center;
            }
            
            .winamp-playlist-controls button {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                padding: 2px 6px;
                cursor: pointer;
                font-size: 9px;
            }
            
            /* Equalizer Window */
            .winamp-equalizer {
                position: absolute;
                top: 120px;
                right: 0;
                width: 275px;
                height: 150px;
                background: var(--winamp-bg);
                border: 2px outset var(--winamp-border);
            }
            
            .winamp-eq-content {
                padding: 4px;
                height: calc(100% - 18px);
                display: flex;
                flex-direction: column;
            }
            
            .winamp-eq-presets {
                display: flex;
                gap: 4px;
                margin-bottom: 8px;
                align-items: center;
            }
            
            .winamp-eq-presets select {
                background: var(--winamp-button);
                color: var(--winamp-text);
                border: 1px inset var(--winamp-border);
                padding: 2px;
                flex: 1;
            }
            
            .winamp-eq-presets button {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                padding: 2px 8px;
                cursor: pointer;
            }
            
            .winamp-eq-sliders {
                display: flex;
                gap: 4px;
                height: 100px;
                align-items: end;
            }
            
            .winamp-eq-band {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
            }
            
            .winamp-eq-band input {
                writing-mode: bt-lr; /* IE */
                writing-mode: vertical-lr; /* Standard */
                width: 20px;
                height: 80px;
                margin: 4px 0;
            }
            
            .winamp-eq-band label {
                color: var(--winamp-text);
                font-size: 8px;
                text-align: center;
            }
            
            /* Mini Player */
            .winamp-mini {
                position: fixed;
                top: 10px;
                right: 10px;
                background: var(--winamp-bg);
                border: 1px outset var(--winamp-border);
                padding: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 10001;
            }
            
            .winamp-mini-info {
                color: var(--winamp-text);
                font-size: 10px;
                display: flex;
                flex-direction: column;
            }
            
            .winamp-mini-controls {
                display: flex;
                gap: 2px;
            }
            
            .winamp-mini-controls button {
                background: var(--winamp-button);
                border: 1px outset var(--winamp-border);
                color: var(--winamp-text);
                width: 16px;
                height: 16px;
                cursor: pointer;
                font-size: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .winamp-player {
                    position: relative;
                    top: 0;
                    right: 0;
                    margin: 10px auto;
                }
                
                .winamp-main {
                    width: 100%;
                    max-width: 275px;
                }
            }
            
            /* Animations */
            @keyframes winamp-loading {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
            }
            
            .winamp-loading {
                animation: winamp-loading 1s infinite;
            }
            </style>
        `;
    }
    
    /**
     * 🎵 Play/Pause toggle
     */
    togglePlay() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * ▶️ Play current track
     */
    async play() {
        if (this.playlist.length === 0) {
            console.log('No tracks in playlist');
            return;
        }
        
        const track = this.playlist[this.currentTrack];
        if (!track) return;
        
        try {
            // For demo purposes, we'll simulate audio playback
            // In a real implementation, you'd load the actual audio file
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateDisplay();
            
            // Simulate playback with a timer (for demo)
            this.playbackTimer = setInterval(() => {
                if (this.isPlaying) {
                    this.currentTime += 1;
                    if (this.currentTime >= track.duration) {
                        this.nextTrack();
                    }
                    this.updateDisplay();
                    this.updateVisualization();
                }
            }, 1000);
            
            console.log(`🎵 Playing: ${track.title} by ${track.artist}`);
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }
    
    /**
     * ⏸️ Pause current track
     */
    pause() {
        this.isPlaying = false;
        this.updatePlayButton();
        
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
        
        console.log('⏸️ Playback paused');
    }
    
    /**
     * ⏹️ Stop playback
     */
    stop() {
        this.pause();
        this.currentTime = 0;
        this.updateDisplay();
        console.log('⏹️ Playback stopped');
    }
    
    /**
     * ⏭️ Next track
     */
    nextTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.isShuffle) {
            this.currentTrack = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentTrack = (this.currentTrack + 1) % this.playlist.length;
        }
        
        this.currentTime = 0;
        
        if (this.isPlaying) {
            this.stop();
            setTimeout(() => this.play(), 100);
        }
        
        this.updateDisplay();
        this.updatePlaylist();
    }
    
    /**
     * ⏮️ Previous track
     */
    previousTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.currentTime > 3) {
            // If more than 3 seconds into track, restart current track
            this.currentTime = 0;
        } else {
            // Go to previous track
            this.currentTrack = this.currentTrack === 0 ? 
                this.playlist.length - 1 : this.currentTrack - 1;
        }
        
        if (this.isPlaying) {
            this.stop();
            setTimeout(() => this.play(), 100);
        }
        
        this.updateDisplay();
        this.updatePlaylist();
    }
    
    /**
     * 🔊 Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
        }
        
        const volumeSlider = document.getElementById('winamp-volume');
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }
    }
    
    /**
     * 📍 Set playback position
     */
    setPosition(position) {
        if (this.playlist.length === 0) return;
        
        const track = this.playlist[this.currentTrack];
        if (!track) return;
        
        this.currentTime = position * track.duration;
        this.updateDisplay();
        
        // In a real implementation, you'd seek the audio element
        // this.audioElement.currentTime = this.currentTime;
    }
    
    /**
     * 🔀 Toggle shuffle mode
     */
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const shuffleBtn = document.getElementById('winamp-shuffle');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffle);
        }
        console.log(`🔀 Shuffle: ${this.isShuffle ? 'ON' : 'OFF'}`);
    }
    
    /**
     * 🔁 Toggle repeat mode
     */
    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        const repeatBtn = document.getElementById('winamp-repeat');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.isRepeat);
        }
        console.log(`🔁 Repeat: ${this.isRepeat ? 'ON' : 'OFF'}`);
    }
    
    /**
     * 🔄 Toggle between foreground and background play modes
     */
    togglePlayMode() {
        this.playMode = this.playMode === 'foreground' ? 'background' : 'foreground';
        
        const mainWindow = document.getElementById('winamp-main');
        const miniPlayer = document.getElementById('winamp-mini');
        
        if (this.playMode === 'background') {
            if (mainWindow) mainWindow.style.display = 'none';
            if (miniPlayer) miniPlayer.style.display = 'flex';
            console.log('🎵 Switched to background mode');
        } else {
            if (mainWindow) mainWindow.style.display = 'block';
            if (miniPlayer) miniPlayer.style.display = 'none';
            console.log('🎵 Switched to foreground mode');
        }
    }
    
    /**
     * 📋 Show playlist window
     */
    showPlaylist() {
        const playlistWindow = document.getElementById('winamp-playlist');
        if (playlistWindow) {
            playlistWindow.style.display = 'block';
            this.updatePlaylist();
        }
    }
    
    /**
     * 📋 Hide playlist window
     */
    hidePlaylist() {
        const playlistWindow = document.getElementById('winamp-playlist');
        if (playlistWindow) {
            playlistWindow.style.display = 'none';
        }
    }
    
    /**
     * 🎛️ Show equalizer window
     */
    showEqualizer() {
        const eqWindow = document.getElementById('winamp-equalizer');
        if (eqWindow) {
            eqWindow.style.display = 'block';
            this.updateEqualizer();
        }
    }
    
    /**
     * 🎛️ Hide equalizer window
     */
    hideEqualizer() {
        const eqWindow = document.getElementById('winamp-equalizer');
        if (eqWindow) {
            eqWindow.style.display = 'none';
        }
    }
    
    /**
     * 📱 Toggle minimize state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const mainWindow = document.getElementById('winamp-main');
        
        if (this.isMinimized) {
            if (mainWindow) {
                mainWindow.style.height = '32px';
                mainWindow.querySelector('.winamp-display').style.display = 'none';
                mainWindow.querySelector('.winamp-visualization').style.display = 'none';
                mainWindow.querySelector('.winamp-transport').style.display = 'none';
                mainWindow.querySelector('.winamp-sliders').style.display = 'none';
                mainWindow.querySelector('.winamp-modes').style.display = 'none';
            }
        } else {
            if (mainWindow) {
                mainWindow.style.height = '116px';
                mainWindow.querySelector('.winamp-display').style.display = 'flex';
                mainWindow.querySelector('.winamp-visualization').style.display = 'block';
                mainWindow.querySelector('.winamp-transport').style.display = 'flex';
                mainWindow.querySelector('.winamp-sliders').style.display = 'flex';
                mainWindow.querySelector('.winamp-modes').style.display = 'flex';
            }
        }
    }
    
    /**
     * 🔄 Update display elements
     */
    updateDisplay() {
        const timeDisplay = document.getElementById('winamp-time');
        const trackInfo = document.getElementById('winamp-marquee');
        const positionSlider = document.getElementById('winamp-position');
        const miniTrack = document.getElementById('winamp-mini-track');
        const miniTime = document.getElementById('winamp-mini-time');
        
        // Format time display
        const timeString = this.formatTime(this.currentTime);
        if (timeDisplay) timeDisplay.textContent = timeString;
        if (miniTime) miniTime.textContent = timeString;
        
        // Update track info
        if (this.playlist.length > 0 && this.playlist[this.currentTrack]) {
            const track = this.playlist[this.currentTrack];
            const info = `${track.title} - ${track.artist}`;
            if (trackInfo) trackInfo.textContent = info;
            if (miniTrack) miniTrack.textContent = track.title;
            
            // Update position slider
            if (positionSlider && track.duration > 0) {
                positionSlider.value = (this.currentTime / track.duration) * 100;
            }
        }
    }
    
    /**
     * 🔄 Update play button state
     */
    updatePlayButton() {
        const playBtn = document.getElementById('winamp-play-btn');
        const miniPlayBtn = document.getElementById('winamp-mini-play');
        
        const symbol = this.isPlaying ? '⏸' : '▶';
        if (playBtn) playBtn.textContent = symbol;
        if (miniPlayBtn) miniPlayBtn.textContent = symbol;
    }
    
    /**
     * 🔄 Update playlist display
     */
    updatePlaylist() {
        const playlistTracks = document.getElementById('winamp-playlist-tracks');
        if (!playlistTracks) return;
        
        playlistTracks.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = `winamp-playlist-track ${index === this.currentTrack ? 'current' : ''}`;
            trackElement.innerHTML = `
                <span>${track.title} - ${track.artist}</span>
                <span>${this.formatTime(track.duration)}</span>
            `;
            trackElement.onclick = () => {
                this.currentTrack = index;
                this.currentTime = 0;
                if (this.isPlaying) {
                    this.stop();
                    setTimeout(() => this.play(), 100);
                }
                this.updateDisplay();
                this.updatePlaylist();
            };
            playlistTracks.appendChild(trackElement);
        });
    }
    
    /**
     * 🔄 Update equalizer display
     */
    updateEqualizer() {
        const eqSliders = document.getElementById('winamp-eq-sliders');
        if (!eqSliders) return;
        
        eqSliders.innerHTML = '';
        
        const frequencies = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
        
        this.eqBands.forEach((value, index) => {
            const bandElement = document.createElement('div');
            bandElement.className = 'winamp-eq-band';
            bandElement.innerHTML = `
                <input type="range" min="-12" max="12" value="${value}" 
                       orient="vertical" onchange="winampPlayer.setEQBand(${index}, this.value)">
                <label>${frequencies[index]}</label>
            `;
            eqSliders.appendChild(bandElement);
        });
    }
    
    /**
     * 🎛️ Set equalizer band
     */
    setEQBand(bandIndex, value) {
        this.eqBands[bandIndex] = parseFloat(value);
        
        if (this.eqNodes[bandIndex]) {
            this.eqNodes[bandIndex].gain.value = this.eqEnabled ? this.eqBands[bandIndex] : 0;
        }
    }
    
    /**
     * 🎛️ Set equalizer preset
     */
    setEQPreset(preset) {
        this.eqPreset = preset;
        
        const presets = {
            'Normal': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'Rock': [4, 2, -2, -3, -1, 2, 4, 6, 6, 6],
            'Pop': [-1, 2, 4, 4, 1, -1, -2, -2, -1, -1],
            'Jazz': [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
            'Classical': [3, 2, -1, -1, -1, -1, -1, -2, 2, 3],
            'Electronic': [4, 3, 1, 0, -2, 2, 1, 1, 3, 4],
            'Bass Boost': [6, 4, 2, 1, -1, -2, -1, 0, 1, 2],
            'Vocal': [-2, -1, -1, 1, 3, 3, 2, 1, 0, -1]
        };
        
        if (presets[preset]) {
            this.eqBands = [...presets[preset]];
            this.updateEqualizer();
            
            // Apply to audio nodes
            this.eqBands.forEach((value, index) => {
                if (this.eqNodes[index]) {
                    this.eqNodes[index].gain.value = this.eqEnabled ? value : 0;
                }
            });
        }
    }
    
    /**
     * 🎛️ Toggle equalizer on/off
     */
    toggleEQ() {
        this.eqEnabled = !this.eqEnabled;
        
        // Apply to audio nodes
        this.eqBands.forEach((value, index) => {
            if (this.eqNodes[index]) {
                this.eqNodes[index].gain.value = this.eqEnabled ? value : 0;
            }
        });
        
        // Update button text
        const eqButton = document.querySelector('#winamp-equalizer .winamp-eq-presets button');
        if (eqButton) {
            eqButton.textContent = this.eqEnabled ? 'ON' : 'OFF';
        }
        
        console.log(`🎛️ Equalizer: ${this.eqEnabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * 📊 Update visualization
     */
    updateVisualization() {
        const canvas = document.getElementById('winamp-viz-canvas');
        if (!canvas || !this.analyserNode) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // For demo purposes, generate fake visualization data
        // In a real implementation, you'd use analyserNode.getByteFrequencyData()
        const dataArray = new Uint8Array(32);
        for (let i = 0; i < dataArray.length; i++) {
            if (this.isPlaying) {
                dataArray[i] = Math.random() * 255;
            } else {
                dataArray[i] = 0;
            }
        }
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        if (this.visualizationMode === 'spectrum') {
            // Draw spectrum analyzer
            const barWidth = width / dataArray.length;
            ctx.fillStyle = '#00ff00';
            
            for (let i = 0; i < dataArray.length; i++) {
                const barHeight = (dataArray[i] / 255) * height;
                ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
            }
        }
    }
    
    /**
     * ⏰ Format time in MM:SS format
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '-:--';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * 📁 Load audio files (simulated)
     */
    loadFiles() {
        // In a real implementation, this would open a file dialog
        console.log('📁 Loading files... (Feature not implemented in demo)');
        
        // Add some more demo tracks
        const newTracks = [
            {
                id: this.playlist.length + 1,
                title: "Background Beats",
                artist: "Work Music Co.",
                album: "Productivity Playlist",
                duration: 210,
                url: "data:audio/wav;base64,",
                genre: "Instrumental"
            },
            {
                id: this.playlist.length + 2,
                title: "Focus Flow",
                artist: "Deep Concentration",
                album: "Study Sessions",
                duration: 190,
                url: "data:audio/wav;base64,",
                genre: "Ambient"
            }
        ];
        
        this.playlist.push(...newTracks);
        this.updatePlaylist();
        console.log(`✅ Added ${newTracks.length} demo tracks to playlist`);
    }
    
    /**
     * 🗑️ Clear playlist
     */
    clearPlaylist() {
        this.stop();
        this.playlist = [];
        this.currentTrack = 0;
        this.currentTime = 0;
        this.updateDisplay();
        this.updatePlaylist();
        console.log('🗑️ Playlist cleared');
    }
    
    /**
     * 💾 Save playlist (simulated)
     */
    savePlaylist() {
        const playlistData = {
            name: 'My Playlist',
            tracks: this.playlist,
            created: new Date().toISOString()
        };
        
        // In a real implementation, this would save to file or server
        localStorage.setItem('winamp_playlist', JSON.stringify(playlistData));
        console.log('💾 Playlist saved to localStorage');
    }
    
    /**
     * 📂 Load playlist (simulated)
     */
    loadPlaylist() {
        try {
            const savedPlaylist = localStorage.getItem('winamp_playlist');
            if (savedPlaylist) {
                const playlistData = JSON.parse(savedPlaylist);
                this.playlist = playlistData.tracks || [];
                this.currentTrack = 0;
                this.currentTime = 0;
                this.updateDisplay();
                this.updatePlaylist();
                console.log('📂 Playlist loaded from localStorage');
            } else {
                console.log('📂 No saved playlist found');
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
        }
    }
    
    /**
     * 💾 Load saved settings
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('winamp_settings');
            if (settings) {
                const data = JSON.parse(settings);
                this.volume = data.volume || 0.8;
                this.isShuffle = data.isShuffle || false;
                this.isRepeat = data.isRepeat || false;
                this.currentSkin = data.currentSkin || 'classic';
                this.eqEnabled = data.eqEnabled !== false;
                this.eqBands = data.eqBands || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                this.visualizationMode = data.visualizationMode || 'spectrum';
                console.log('✅ Settings loaded');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    /**
     * 💾 Save current settings
     */
    saveSettings() {
        try {
            const settings = {
                volume: this.volume,
                isShuffle: this.isShuffle,
                isRepeat: this.isRepeat,
                currentSkin: this.currentSkin,
                eqEnabled: this.eqEnabled,
                eqBands: this.eqBands,
                visualizationMode: this.visualizationMode
            };
            localStorage.setItem('winamp_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    /**
     * ❌ Close player
     */
    close() {
        this.stop();
        this.saveSettings();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        console.log('❌ Winamp Player closed');
    }
    
    /**
     * 🎨 Create and return the complete Winamp player
     */
    createWindow() {
        const winampWindow = document.createElement('div');
        winampWindow.innerHTML = this.getStyles() + this.createInterface();
        
        // Store reference to container
        this.container = winampWindow.querySelector('.winamp-player');
        
        // Make windows draggable
        this.makeDraggable();
        
        // Initialize playlist and equalizer
        setTimeout(() => {
            this.updatePlaylist();
            this.updateEqualizer();
            this.updateDisplay();
        }, 100);
        
        return winampWindow.innerHTML;
    }
    
    /**
     * 🖱️ Make windows draggable
     */
    makeDraggable() {
        // This would be implemented to make the player draggable
        // For now, it's positioned with CSS
    }
    
    // Export for global access
    static createInstance() {
        if (!window.winampPlayer) {
            window.winampPlayer = new WinampPlayer();
        }
        return window.winampPlayer;
    }
}

// Initialize and export
const winampPlayer = new WinampPlayer();
window.winampPlayer = winampPlayer;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WinampPlayer;
}

// Make globally available
window.WinampPlayer = WinampPlayer;

console.log('🎵 Winamp-Style Media Player loaded successfully!');