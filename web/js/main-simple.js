// SwissKnife Web Desktop - Main Application (Simplified for Testing)

console.log('SwissKnife Web Desktop starting...');

class SwissKnifeDesktop {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 0;
        this.activeWindow = null;
        this.apps = new Map();
        this.isSwissKnifeReady = false;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing SwissKnife Web Desktop...');
        
        // Initialize desktop components
        this.initializeDesktop();
        this.initializeApps();
        this.setupEventListeners();
        this.startSystemMonitoring();
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 3000);
        
        console.log('SwissKnife Web Desktop ready!');
    }
    
    initializeDesktop() {
        // Initialize system time
        this.updateSystemTime();
        setInterval(() => this.updateSystemTime(), 1000);
        
        // Initialize system status
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 5000);
        
        // Setup desktop context menu
        this.setupContextMenu();
        
        // Setup window management
        this.setupWindowManagement();
    }
    
    initializeApps() {
        console.log('🔧 Initializing apps...');
        
        // Core applications
        this.apps.set('terminal', {
            name: 'SwissKnife Terminal',
            icon: '🖥️',
            component: 'TerminalApp',
            singleton: false
        });
        
        this.apps.set('vibecode', {
            name: 'VibeCode Editor',
            icon: '🎯',
            component: 'VibeCodeApp',
            singleton: false
        });
        
        this.apps.set('strudel-ai-daw', {
            name: 'Strudel AI DAW',
            icon: '🎵',
            component: 'StrudelAIDAWApp',
            singleton: false
        });
        
        this.apps.set('ai-chat', {
            name: 'AI Chat',
            icon: '🤖',
            component: 'AIChatApp',
            singleton: false
        });
        
        this.apps.set('file-manager', {
            name: 'File Manager',
            icon: '📁',
            component: 'FileManagerApp',
            singleton: true
        });
        
        this.apps.set('task-manager', {
            name: 'Task Manager',
            icon: '⚡',
            component: 'TaskManagerApp',
            singleton: true
        });
        
        this.apps.set('model-browser', {
            name: 'AI Model Browser',
            icon: '🧠',
            component: 'ModelBrowserApp',
            singleton: true
        });
        
        this.apps.set('ipfs-explorer', {
            name: 'IPFS Explorer',
            icon: '🌐',
            component: 'IPFSExplorerApp',
            singleton: true
        });
        
        this.apps.set('device-manager', {
            name: 'Device Manager',
            icon: '🔧',
            component: 'DeviceManagerApp',
            singleton: true
        });
        
        this.apps.set('settings', {
            name: 'Settings',
            icon: '⚙️',
            component: 'SettingsApp',
            singleton: true
        });

        this.apps.set('mcp-control', {
            name: 'MCP Control',
            icon: '🔌',
            component: 'MCPControlApp',
            singleton: true
        });

        this.apps.set('api-keys', {
            name: 'API Keys',
            icon: '🔑',
            component: 'APIKeysApp',
            singleton: true
        });

        this.apps.set('github', {
            name: 'GitHub',
            icon: '🐙',
            component: 'GitHubApp',
            singleton: true
        });

        this.apps.set('oauth-login', {
            name: 'OAuth Login',
            icon: '🔐',
            component: 'OAuthLoginApp',
            singleton: true
        });

        this.apps.set('cron', {
            name: 'AI Cron Scheduler',
            icon: '⏰',
            component: 'CronApp',
            singleton: true
        });

        this.apps.set('navi', {
            name: 'NAVI',
            icon: '<img src="/assets/icons/navi-icon.png" style="width: 24px; height: 24px; border-radius: 4px;">',
            component: 'NaviApp',
            singleton: true
        });

        this.apps.set('strudel', {
            name: '🎵 Music Studio',
            icon: '🎵',
            component: 'GrandmaStrudelDAW',
            singleton: false
        });
        
        this.apps.set('p2p-network', {
            name: 'P2P Network Manager',
            icon: '🔗',
            component: 'P2PNetworkApp',
            singleton: true
        });
        
        this.apps.set('neural-network-designer', {
            name: 'Neural Network Designer',
            icon: '🧠',
            component: 'NeuralNetworkDesignerApp',
            singleton: false
        });
        
        this.apps.set('training-manager', {
            name: 'Training Manager',
            icon: '🎯',
            component: 'TrainingManagerApp',
            singleton: true
        });
        
        // Essential utility apps
        this.apps.set('calculator', {
            name: 'Calculator',
            icon: '🧮',
            component: 'CalculatorApp',
            singleton: true
        });
        
        this.apps.set('clock', {
            name: 'Clock & Timers',
            icon: '🕐',
            component: 'ClockApp',
            singleton: true
        });
        
        this.apps.set('image-viewer', {
            name: 'Image Viewer',
            icon: '🖼️',
            component: 'ImageViewerApp',
            singleton: false
        });
        
        this.apps.set('notes', {
            name: 'Notes',
            icon: '📝',
            component: 'NotesApp',
            singleton: false
        });
        
        this.apps.set('system-monitor', {
            name: 'System Monitor',
            icon: '📊',
            component: 'SystemMonitorApp',
            singleton: true
        });
        
        console.log('📱 Total apps registered:', this.apps.size);
        console.log('📱 Apps list:', Array.from(this.apps.keys()));
    }
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Desktop icon clicks - changed to single click
        const desktopIcons = document.querySelectorAll('.icon');
        console.log('🖱️ Found desktop icons:', desktopIcons.length);
        
        desktopIcons.forEach((icon, index) => {
            const appId = icon.dataset.app;
            console.log(`🔗 Setting up icon ${index + 1}: ${appId}`);
            
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🖱️ Desktop icon clicked: ${appId}`);
                if (appId) {
                    this.launchApp(appId);
                }
            });
        });
        
        // System menu
        const systemMenuBtn = document.getElementById('system-menu-btn');
        const systemMenu = document.getElementById('system-menu');
        
        if (systemMenuBtn && systemMenu) {
            // Ensure menu starts hidden
            systemMenu.classList.add('hidden');
            
            systemMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (systemMenu.classList.contains('hidden')) {
                    systemMenu.classList.remove('hidden');
                } else {
                    systemMenu.classList.add('hidden');
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!systemMenu.contains(e.target) && !systemMenuBtn.contains(e.target)) {
                    systemMenu.classList.add('hidden');
                }
            });
            
            // Menu item clicks
            const menuItems = document.querySelectorAll('.menu-item[data-app]');
            console.log('📋 Found menu items:', menuItems.length);
            
            menuItems.forEach((item, index) => {
                const appId = item.dataset.app;
                console.log(`📋 Setting up menu item ${index + 1}: ${appId}`);
                
                item.addEventListener('click', () => {
                    console.log(`📋 Menu item clicked: ${appId}`);
                    if (appId) {
                        this.launchApp(appId);
                    }
                    systemMenu.classList.add('hidden');
                });
            });
        }
        
        // Set up global functions for HTML onclick handlers
        window.showDesktopProperties = () => this.showDesktopProperties();
        window.openTerminalHere = () => this.openTerminalHere();
        window.createNewFile = () => this.createNewFile();
        window.createNewFolder = () => this.createNewFolder();
        window.refreshDesktop = () => this.refreshDesktop();
        window.showAbout = () => this.showAbout();
    }
    
    async launchApp(appId) {
        console.log(`Launching app: ${appId}`);
        
        const appConfig = this.apps.get(appId);
        if (!appConfig) {
            console.error(`App ${appId} not found`);
            return;
        }
        
        // Check if singleton app is already running
        if (appConfig.singleton) {
            const existingWindow = Array.from(this.windows.values())
                .find(w => w.appId === appId);
            if (existingWindow) {
                this.focusWindow(existingWindow.element);
                return;
            }
        }
        
        try {
            // Create new window for the app
            const window = await this.createWindow({
                title: appConfig.name,
                icon: appConfig.icon,
                appId: appId,
                width: 800,
                height: 600,
                x: 100 + (this.windowCounter * 30),
                y: 100 + (this.windowCounter * 30)
            });
            
            // Load app component (placeholder for now)
            await this.loadAppComponent(window, appConfig.component);
            
            console.log(`Launched ${appConfig.name}`);
        } catch (error) {
            console.error(`Failed to launch ${appConfig.name}:`, error);
        }
    }
    
    async createWindow(options) {
        const windowId = `window-${++this.windowCounter}`;
        
        const windowElement = document.createElement('div');
        windowElement.className = 'window window-enter';
        windowElement.id = windowId;
        windowElement.style.left = options.x + 'px';
        windowElement.style.top = options.y + 'px';
        windowElement.style.width = options.width + 'px';
        windowElement.style.height = options.height + 'px';
        
        // Create window structure
        windowElement.innerHTML = `
            <div class="window-titlebar">
                <span class="window-icon">${options.icon}</span>
                <span class="window-title">${options.title}</span>
                <div class="window-controls">
                    <button class="window-control minimize" title="Minimize">−</button>
                    <button class="window-control maximize" title="Maximize">□</button>
                    <button class="window-control close" title="Close">×</button>
                </div>
            </div>
            <div class="window-content" id="${windowId}-content">
                <div class="window-loading">
                    <div class="window-loading-spinner"></div>
                </div>
            </div>
        `;
        
        // Add window to container
        const windowsContainer = document.getElementById('windows-container');
        if (windowsContainer) {
            windowsContainer.appendChild(windowElement);
        }
        
        // Setup window controls
        this.setupWindowControls(windowElement);
        
        // Store window reference
        const window = {
            id: windowId,
            element: windowElement,
            appId: options.appId,
            title: options.title,
            minimized: false,
            maximized: false
        };
        
        this.windows.set(windowId, window);
        
        return window;
    }
    
    async loadAppComponent(window, componentName) {
        const contentElement = document.getElementById(`${window.id}-content`);
        
        try {
            switch (componentName) {
                case 'TerminalApp':
                    await this.createTerminalApp(contentElement);
                    break;
                    
                case 'VibeCodeApp':
                    await this.createVibeCodeApp(contentElement);
                    break;
                    
                case 'StrudelAIDAWApp':
                    await this.createStrudelAIDAWApp(contentElement);
                    break;
                    
                case 'AIChatApp':
                    await this.createAIChatApp(contentElement);
                    break;
                    
                case 'FileManagerApp':
                    await this.createFileManagerApp(contentElement);
                    break;
                    
                case 'TaskManagerApp':
                    await this.createTaskManagerApp(contentElement);
                    break;
                    
                case 'ModelBrowserApp':
                    await this.createModelBrowserApp(contentElement);
                    break;
                    
                case 'IPFSExplorerApp':
                    await this.createIPFSExplorerApp(contentElement);
                    break;
                    
                case 'DeviceManagerApp':
                    await this.createDeviceManagerApp(contentElement);
                    break;
                    
                case 'SettingsApp':
                    await this.createSettingsApp(contentElement);
                    break;
                    
                case 'MCPControlApp':
                    await this.createMCPControlApp(contentElement);
                    break;
                    
                case 'APIKeysApp':
                    await this.createAPIKeysApp(contentElement);
                    break;
                    
                case 'GitHubApp':
                    await this.createGitHubApp(contentElement);
                    break;
                    
                case 'OAuthLoginApp':
                    await this.createOAuthLoginApp(contentElement);
                    break;
                    
                case 'CronApp':
                    await this.createCronApp(contentElement);
                    break;
                    
                case 'NaviApp':
                    await this.createNaviApp(contentElement);
                    break;
                    
                case 'CalculatorApp':
                    await this.createCalculatorApp(contentElement);
                    break;
                    
                case 'ClockApp':
                    await this.createClockApp(contentElement);
                    break;
                    
                case 'ImageViewerApp':
                    await this.createImageViewerApp(contentElement);
                    break;
                    
                case 'NotesApp':
                    await this.createNotesApp(contentElement);
                    break;
                    
                case 'SystemMonitorApp':
                    await this.createSystemMonitorApp(contentElement);
                    break;
                    
                case 'NeuralNetworkDesignerApp':
                    await this.createNeuralNetworkDesignerApp(contentElement);
                    break;
                    
                default:
                    this.createPlaceholderApp(contentElement, componentName);
            }
        } catch (error) {
            console.error(`Failed to load app component ${componentName}:`, error);
            this.createErrorApp(contentElement, componentName, error);
        }
    }

    // App creation methods
    async createTerminalApp(contentElement) {
        try {
            console.log('🔧 Creating terminal app...');
            const { TerminalApp } = await import('./apps/terminal.js');
            console.log('✅ Terminal module imported successfully');
            
            const terminal = new TerminalApp(this);
            console.log('✅ Terminal instance created');
            
            await terminal.initialize(contentElement);
            console.log('✅ Terminal initialized successfully');
            
            return terminal;
        } catch (error) {
            console.error('❌ Terminal creation error:', error);
            throw error;
        }
    }

    async createVibeCodeApp(contentElement) {
        const { VibeCodeApp } = await import('./apps/vibecode.js');
        const vibeCode = new VibeCodeApp(this);
        await vibeCode.initialize();
        const html = await vibeCode.render();
        contentElement.innerHTML = html;
        return vibeCode;
    }

    async createStrudelAIDAWApp(contentElement) {
        const { StrudelAIDAWApp } = await import('./apps/strudel-ai-daw.js');
        const strudelAI = new StrudelAIDAWApp(this);
        await strudelAI.initialize();
        const html = await strudelAI.render();
        contentElement.innerHTML = html;
        return strudelAI;
    }

    async createAIChatApp(contentElement) {
        const { AIChatApp } = await import('./apps/ai-chat.js');
        const aiChat = new AIChatApp(this);
        await aiChat.initialize();
        const html = await aiChat.render();
        contentElement.innerHTML = html;
        return aiChat;
    }

    async createFileManagerApp(contentElement) {
        const { FileManagerApp } = await import('./apps/file-manager.js');
        const fileManager = new FileManagerApp(this);
        await fileManager.initialize();
        const html = await fileManager.render();
        contentElement.innerHTML = html;
        return fileManager;
    }

    async createTaskManagerApp(contentElement) {
        const { TaskManagerApp } = await import('./apps/task-manager.js');
        const taskManager = new TaskManagerApp(this);
        await taskManager.initialize();
        const html = await taskManager.render();
        contentElement.innerHTML = html;
        return taskManager;
    }

    async createModelBrowserApp(contentElement) {
        const { ModelBrowserApp } = await import('./apps/model-browser.js');
        const modelBrowser = new ModelBrowserApp(this);
        await modelBrowser.initialize();
        const html = await modelBrowser.render();
        contentElement.innerHTML = html;
        return modelBrowser;
    }

    async createIPFSExplorerApp(contentElement) {
        const { IPFSExplorerApp } = await import('./apps/ipfs-explorer.js');
        const ipfsExplorer = new IPFSExplorerApp(this);
        await ipfsExplorer.initialize();
        const html = await ipfsExplorer.render();
        contentElement.innerHTML = html;
        return ipfsExplorer;
    }

    async createDeviceManagerApp(contentElement) {
        const { DeviceManagerApp } = await import('./apps/device-manager.js');
        const deviceManager = new DeviceManagerApp(this);
        await deviceManager.initialize();
        const html = await deviceManager.render();
        contentElement.innerHTML = html;
        return deviceManager;
    }

    async createSettingsApp(contentElement) {
        const { SettingsApp } = await import('./apps/settings.js');
        const settings = new SettingsApp(this);
        await settings.initialize();
        const html = await settings.render();
        contentElement.innerHTML = html;
        return settings;
    }

    async createMCPControlApp(contentElement) {
        const { MCPControlApp } = await import('./apps/mcp-control.js');
        const mcpControl = new MCPControlApp();
        const html = await mcpControl.render();
        contentElement.innerHTML = html;
        // Store global reference for other apps to use
        window.mcpControlApp = mcpControl;
        return mcpControl;
    }

    async createAPIKeysApp(contentElement) {
        const { APIKeysApp } = await import('./apps/api-keys.js');
        const apiKeys = new APIKeysApp(this);
        await apiKeys.initialize();
        const html = await apiKeys.render();
        contentElement.innerHTML = html;
        return apiKeys;
    }

    async createGitHubApp(contentElement) {
        const { GitHubApp } = await import('./apps/github.js');
        const github = new GitHubApp();
        const html = await github.render();
        contentElement.innerHTML = html;
        // Store global reference for OAuth integration
        window.githubApp = github;
        return github;
    }

    async createOAuthLoginApp(contentElement) {
        const { OAuthLoginSystem } = await import('./apps/oauth-login.js');
        const oauth = new OAuthLoginSystem();
        const html = await oauth.render();
        contentElement.innerHTML = html;
        // Store global reference for other apps to use
        window.oauthSystem = oauth;
        return oauth;
    }

    async createCronApp(contentElement) {
        const { CronApp } = await import('./apps/cron.js');
        const cron = new CronApp(this);
        await cron.initialize();
        const html = await cron.render();
        contentElement.innerHTML = html;
        return cron;
    }

    async createNaviApp(contentElement) {
        const { NaviApp } = await import('./apps/navi.js');
        const navi = new NaviApp(this);
        await navi.initialize();
        const html = await navi.render();
        contentElement.innerHTML = html;
        return navi;
    }

    async createCalculatorApp(contentElement) {
        const { CalculatorApp } = await import('./apps/calculator.js');
        const calculator = new CalculatorApp(this);
        await calculator.initialize();
        const html = await calculator.render();
        contentElement.innerHTML = html;
        return calculator;
    }

    async createClockApp(contentElement) {
        const { ClockApp } = await import('./apps/clock.js');
        const clock = new ClockApp(this);
        await clock.initialize();
        const html = await clock.render();
        contentElement.innerHTML = html;
        return clock;
    }

    async createImageViewerApp(contentElement) {
        const { ImageViewerApp } = await import('./apps/image-viewer.js');
        const imageViewer = new ImageViewerApp(this);
        await imageViewer.initialize();
        const html = await imageViewer.render();
        contentElement.innerHTML = html;
        return imageViewer;
    }

    async createNotesApp(contentElement) {
        const { NotesApp } = await import('./apps/notes.js');
        const notes = new NotesApp(this);
        await notes.initialize();
        const html = await notes.render();
        contentElement.innerHTML = html;
        return notes;
    }

    async createSystemMonitorApp(contentElement) {
        const { SystemMonitorApp } = await import('./apps/system-monitor.js');
        const systemMonitor = new SystemMonitorApp(this);
        await systemMonitor.initialize();
        const html = await systemMonitor.render();
        contentElement.innerHTML = html;
        return systemMonitor;
    }

    async createNeuralNetworkDesignerApp(contentElement) {
        const { NeuralNetworkDesignerApp } = await import('./apps/neural-network-designer.js');
        const neuralNetworkDesigner = new NeuralNetworkDesignerApp(this);
        await neuralNetworkDesigner.initialize();
        const html = await neuralNetworkDesigner.createWindow();
        contentElement.innerHTML = html;
        return neuralNetworkDesigner;
    }

    createPlaceholderApp(contentElement, componentName) {
        contentElement.innerHTML = `
            <div class="app-placeholder">
                <h2>🚀 ${componentName}</h2>
                <p>SwissKnife app loading...</p>
                <p>Component: ${componentName}</p>
                <button onclick="this.closest('.window').remove()">Close</button>
            </div>
        `;
    }

    createErrorApp(contentElement, componentName, error) {
        contentElement.innerHTML = `
            <div class="app-error">
                <h2>❌ App Load Error</h2>
                <p>Failed to load ${componentName}</p>
                <p>Error: ${error.message}</p>
                <button onclick="this.closest('.window').remove()">Close</button>
            </div>
        `;
    }
    
    setupWindowControls(windowElement) {
        const closeBtn = windowElement.querySelector('.window-control.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                windowElement.remove();
            });
        }
    }
    
    updateSystemTime() {
        const timeElement = document.getElementById('system-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString();
        }
    }
    
    updateSystemStatus() {
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.textContent = `Ready | Windows: ${this.windows.size}`;
        }
    }
    
    setupContextMenu() {
        // Simple context menu setup
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'desktop') {
                e.preventDefault();
                console.log('Desktop context menu');
            }
        });
    }
    
    setupWindowManagement() {
        // Basic window management setup
        console.log('Window management initialized');
    }
    
    startSystemMonitoring() {
        // Basic system monitoring
        console.log('System monitoring started');
    }
    
    // Add missing methods for HTML onclick handlers
    showDesktopProperties() {
        this.launchApp('settings');
    }
    
    openTerminalHere() {
        this.launchApp('terminal');
    }
    
    createNewFile() {
        console.log('Create new file requested');
    }
    
    createNewFolder() {
        console.log('Create new folder requested');
    }
    
    refreshDesktop() {
        location.reload();
    }
    
    showAbout() {
        // Show about dialog
        this.createWindow({
            title: 'About SwissKnife Web Desktop',
            icon: '🇨🇭',
            appId: 'about',
            width: 400,
            height: 300,
            x: 200,
            y: 200
        }).then(window => {
            const contentElement = document.getElementById(`${window.id}-content`);
            if (contentElement) {
                contentElement.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h2>🇨🇭 SwissKnife Web Desktop</h2>
                        <p>Version 1.0.0</p>
                        <p>A modern AI-powered desktop environment for the browser</p>
                        <p>Built with Swiss precision 🏔️</p>
                        <p><strong>Total Apps:</strong> ${this.apps.size}</p>
                        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
                    </div>
                `;
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SwissKnifeDesktop();
    });
} else {
    new SwissKnifeDesktop();
}
