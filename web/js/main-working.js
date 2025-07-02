// SwissKnife Web Desktop - Main Application
import '../css/desktop.css';
import '../css/windows.css';
import '../css/terminal.css';
import '../css/apps.css';
import '../css/aero-enhanced.css';
import SwissKnife from './swissknife-browser-clean.js';

console.log('SwissKnife Web Desktop starting...');

class SwissKnifeDesktop {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 0;
        this.activeWindow = null;
        this.apps = new Map();
        this.swissknife = SwissKnife;
        this.isSwissKnifeReady = false;
        this.enhancer = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing SwissKnife Web Desktop...');
        
        // Initialize the SwissKnife core
        try {
            const result = await this.swissknife.initialize({
                config: { storage: 'localstorage' },
                storage: { type: 'indexeddb', dbName: 'swissknife-web' },
                ai: { autoRegisterModels: true, autoRegisterTools: true },
                web: true
            });
            
            if (result.success) {
                console.log('SwissKnife core initialized successfully');
                this.isSwissKnifeReady = true;
            } else {
                throw new Error(result.error || 'Failed to initialize SwissKnife core');
            }
        } catch (error) {
            console.error('Failed to initialize SwissKnife core:', error);
            this.isSwissKnifeReady = false;
        }
        
        // Initialize desktop enhancer
        await this.initializeEnhancer();
        
        // Setup UI
        this.setupUI();
        
        // Register and load apps
        this.registerApps();
        
        console.log('SwissKnife Web Desktop ready!');
    }
    
    updateStatusDisplay(message, type = 'info') {
        const statusElement = document.getElementById('init-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `init-${type}`;
        }
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
    }
    
    initializeApps() {
        // Define available applications with working components
        this.apps.set('terminal', {
            name: 'SwissKnife Terminal',
            icon: '�️',
            component: 'terminal',
            singleton: false,
            description: 'Interactive terminal with SwissKnife commands'
        });
        
        this.apps.set('ai-chat', {
            name: 'AI Chat',
            icon: '🤖',
            component: 'ai-chat',
            singleton: false,
            description: 'Chat with AI models'
        });
        
        this.apps.set('file-manager', {
            name: 'File Manager',
            icon: '📁',
            component: 'file-manager',
            singleton: false,
            description: 'Browse and manage files in content-addressed storage'
        });
        
        this.apps.set('vibecode', {
            name: 'VibeCode',
            icon: '�',
            component: 'vibecode',
            singleton: false,
            description: 'Code editor with AI assistance'
        });
        
        this.apps.set('model-browser', {
            name: 'Model Browser',
            icon: '🧠',
            component: 'model-browser',
            singleton: false,
            description: 'Browse and manage AI models'
        });
        
        this.apps.set('settings', {
            name: 'Settings',
            icon: '⚙️',
            component: 'settings',
            singleton: true,
            description: 'Configure SwissKnife settings'
        });
        
        this.apps.set('mcp-control', {
            name: 'MCP Control',
            icon: '�',
            component: 'mcp-control',
            singleton: true,
            description: 'Manage Model Context Protocol servers'
        });
        
        this.apps.set('api-keys', {
            name: 'API Keys',
            icon: '🔑',
            component: 'api-keys',
            singleton: true,
            description: 'Manage API keys and credentials'
        });
        
        this.apps.set('task-manager', {
            name: 'Task Manager',
            icon: '⚡',
            component: 'task-manager',
            singleton: true,
            description: 'Monitor system processes and resources'
        });
        
        this.apps.set('ipfs-explorer', {
            name: 'IPFS Explorer',
            icon: '🌐',
            component: 'ipfs-explorer',
            singleton: false,
            description: 'Explore IPFS network and content'
        });
    }
    
    setupEventListeners() {
        // Desktop icon clicks
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                e.preventDefault();
                const appId = icon.dataset.app;
                if (appId) {
                    this.launchApp(appId);
                }
            });
        });
        
        // System menu
        const systemMenuBtn = document.getElementById('system-menu-btn');
        const systemMenu = document.getElementById('system-menu');
        
        if (systemMenuBtn && systemMenu) {
            // Initially hide the menu
            systemMenu.classList.add('hidden');
            
            systemMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                systemMenu.classList.toggle('hidden');
            });
            
            // Prevent menu from closing when clicking inside it
            systemMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Menu item clicks
        document.querySelectorAll('.menu-item[data-app]').forEach(item => {
            item.addEventListener('click', () => {
                const appId = item.dataset.app;
                if (appId) {
                    this.launchApp(appId);
                }
                // Close menu
                if (systemMenu) {
                    systemMenu.classList.add('hidden');
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (systemMenu && !systemMenu.classList.contains('hidden')) {
                // Only close if not clicking on the menu button or inside the menu
                if (!systemMenuBtn?.contains(e.target) && !systemMenu.contains(e.target)) {
                    systemMenu.classList.add('hidden');
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.launchApp('terminal');
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.launchApp('ai-chat');
                        }
                        break;
                }
            }
        });
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
                width: appId === 'terminal' ? 900 : 800,
                height: appId === 'terminal' ? 600 : 500,
                x: 100 + (this.windowCounter * 30),
                y: 100 + (this.windowCounter * 30)
            });
            
            // Load app component
            await this.loadAppComponent(window, appConfig);
            
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
                    <p>Loading ${options.title}...</p>
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
        
        // Make window draggable
        this.makeWindowDraggable(windowElement);
        
        // Make window resizable
        this.makeWindowResizable(windowElement);
        
        // Enable window snapping if enhancer is available
        if (this.enhancer) {
            this.enhancer.enableWindowSnapping(windowElement);
        }
        
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
        
        // Add to taskbar
        this.addToTaskbar(window);
        
        // Focus the new window
        this.focusWindow(windowElement);
        
        return window;
    }
    
    async loadAppComponent(window, appConfig) {
        const contentElement = document.getElementById(`${window.id}-content`);
        
        try {
            switch (appConfig.component) {
                case 'terminal':
                    await this.createTerminalApp(contentElement);
                    break;
                    
                case 'ai-chat':
                    await this.createAIChatApp(contentElement);
                    break;
                    
                case 'file-manager':
                    await this.createFileManagerApp(contentElement);
                    break;
                    
                case 'vibecode':
                    await this.createVibeCodeApp(contentElement);
                    break;
                    
                case 'model-browser':
                    await this.createModelBrowserApp(contentElement);
                    break;
                    
                case 'settings':
                    await this.createSettingsApp(contentElement);
                    break;
                    
                case 'mcp-control':
                    await this.createMCPControlApp(contentElement);
                    break;
                    
                case 'api-keys':
                    await this.createAPIKeysApp(contentElement);
                    break;
                    
                case 'task-manager':
                    await this.createTaskManagerApp(contentElement);
                    break;
                    
                case 'ipfs-explorer':
                    await this.createIPFSExplorerApp(contentElement);
                    break;
                    
                default:
                    this.createPlaceholderApp(contentElement, appConfig);
            }
            
        } catch (error) {
            console.error(`Failed to load app component ${appConfig.component}:`, error);
            this.createErrorApp(contentElement, appConfig, error);
        }
    }
    
    async createTerminalApp(contentElement) {
        // Import and create terminal app
        const { TerminalApp } = await import('./apps/terminal.js');
        const terminal = new TerminalApp(contentElement, this);
        return terminal;
    }
    
    async createFileManagerApp(contentElement) {
        const { FileManagerApp } = await import('./apps/file-manager.js');
        const fileManager = new FileManagerApp(this);
        await fileManager.initialize();
        const window = fileManager.createWindow();
        contentElement.innerHTML = '';
        contentElement.appendChild(window.querySelector('.file-manager-container'));
        return fileManager;
    }
    
    async createVibeCodeApp(contentElement) {
        const { VibeCodeApp } = await import('./apps/vibecode.js');
        const vibeCode = new VibeCodeApp(this);
        await vibeCode.initialize();
        const window = vibeCode.createWindow();
        contentElement.innerHTML = '';
        contentElement.appendChild(window.querySelector('.vibecode-container'));
        return vibeCode;
    }
    
    async createModelBrowserApp(contentElement) {
        const { ModelBrowserApp } = await import('./apps/model-browser.js');
        const modelBrowser = new ModelBrowserApp(this);
        await modelBrowser.initialize();
        const window = modelBrowser.createWindow();
        contentElement.innerHTML = '';
        contentElement.appendChild(window.querySelector('.model-browser-container'));
        return modelBrowser;
    }
    
    async createAIChatApp(contentElement) {
        const { AIChatApp } = await import('./apps/ai-chat.js');
        const aiChat = new AIChatApp(this);
        await aiChat.initialize();
        const window = aiChat.createWindow();
        contentElement.innerHTML = '';
        contentElement.appendChild(window.querySelector('.ai-chat-container'));
        return aiChat;
    }
    
    async createSettingsApp(contentElement) {
        const { SettingsApp } = await import('./apps/settings.js');
        const settings = new SettingsApp(this);
        await settings.initialize();
        const window = settings.createWindow();
        contentElement.innerHTML = '';
        contentElement.appendChild(window.querySelector('.settings-container'));
        return settings;
    }
    
    async createMCPControlApp(contentElement) {
        const { MCPControlApp } = await import('./apps/mcp-control.js');
        const mcpControl = new MCPControlApp();
        const html = await mcpControl.render();
        contentElement.innerHTML = html;
        await mcpControl.onMount();
        return mcpControl;
    }
    
    async createAPIKeysApp(contentElement) {
        const { APIKeysApp } = await import('./apps/api-keys.js');
        const apiKeys = new APIKeysApp();
        const html = await apiKeys.render();
        contentElement.innerHTML = html;
        await apiKeys.onMount();
        return apiKeys;
    }
    
    async createTaskManagerApp(contentElement) {
        // Create a simple task manager for now
        contentElement.innerHTML = `
            <div class="task-manager-app">
                <div class="app-header">
                    <h2>⚡ Task Manager</h2>
                </div>
                <div class="tasks-content">
                    <div class="task-list">
                        <h3>Running Processes</h3>
                        <div class="process-item">
                            <span class="process-name">SwissKnife Desktop</span>
                            <span class="process-cpu">15%</span>
                            <span class="process-memory">128MB</span>
                        </div>
                        <div class="process-item">
                            <span class="process-name">AI Engine</span>
                            <span class="process-cpu">8%</span>
                            <span class="process-memory">64MB</span>
                        </div>
                        <div class="process-item">
                            <span class="process-name">Storage Engine</span>
                            <span class="process-cpu">3%</span>
                            <span class="process-memory">32MB</span>
                        </div>
                        <div class="process-item">
                            <span class="process-name">Window Manager</span>
                            <span class="process-cpu">2%</span>
                            <span class="process-memory">16MB</span>
                        </div>
                    </div>
                    <div class="system-stats">
                        <h3>System Resources</h3>
                        <div class="stat-row">
                            <span>CPU Usage:</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 28%"></div>
                            </div>
                            <span>28%</span>
                        </div>
                        <div class="stat-row">
                            <span>Memory:</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 45%"></div>
                            </div>
                            <span>240MB / 512MB</span>
                        </div>
                        <div class="stat-row">
                            <span>Storage:</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 12%"></div>
                            </div>
                            <span>120MB / 1GB</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return { name: 'Task Manager' };
    }
    
    async createIPFSExplorerApp(contentElement) {
        // Create a simple IPFS explorer for now
        contentElement.innerHTML = `
            <div class="ipfs-explorer-app">
                <div class="app-header">
                    <h2>🌐 IPFS Explorer</h2>
                    <div class="ipfs-actions">
                        <button class="btn-primary">🔄 Refresh</button>
                        <button class="btn-secondary">➕ Add Content</button>
                    </div>
                </div>
                <div class="ipfs-content">
                    <div class="ipfs-stats">
                        <div class="stat-card">
                            <h4>Node Status</h4>
                            <span class="status-indicator online">Online</span>
                        </div>
                        <div class="stat-card">
                            <h4>Peers</h4>
                            <span class="stat-value">42</span>
                        </div>
                        <div class="stat-card">
                            <h4>Repo Size</h4>
                            <span class="stat-value">1.2 GB</span>
                        </div>
                    </div>
                    <div class="ipfs-files">
                        <h3>Pinned Content</h3>
                        <div class="file-item">
                            <span class="file-icon">📄</span>
                            <span class="file-name">config.json</span>
                            <span class="file-hash">QmX1...</span>
                            <span class="file-size">1.2KB</span>
                        </div>
                        <div class="file-item">
                            <span class="file-icon">📁</span>
                            <span class="file-name">website/</span>
                            <span class="file-hash">QmY2...</span>
                            <span class="file-size">-</span>
                        </div>
                        <div class="file-item">
                            <span class="file-icon">🎵</span>
                            <span class="file-name">music.mp3</span>
                            <span class="file-hash">QmZ3...</span>
                            <span class="file-size">4.2MB</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return { name: 'IPFS Explorer' };
    }

    setupWindowControls(windowElement) {
        const minimizeBtn = windowElement.querySelector('.window-control.minimize');
        const maximizeBtn = windowElement.querySelector('.window-control.maximize');
        const closeBtn = windowElement.querySelector('.window-control.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Find and remove from windows map
                let windowId = null;
                for (const [id, window] of this.windows.entries()) {
                    if (window.element === windowElement) {
                        windowId = id;
                        this.windows.delete(id);
                        break;
                    }
                }
                
                // Remove from taskbar
                if (windowId) {
                    this.removeFromTaskbar(windowId);
                }
                
                // Remove window element
                windowElement.remove();
            });
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.minimizeWindow(windowElement);
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                this.toggleMaximizeWindow(windowElement);
            });
        }
    }
    
    makeWindowDraggable(windowElement) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(windowElement.style.left);
            startTop = parseInt(windowElement.style.top);
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            e.preventDefault();
        });
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            windowElement.style.left = (startLeft + deltaX) + 'px';
            windowElement.style.top = (startTop + deltaY) + 'px';
        };
        
        const handleMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }
    
    makeWindowResizable(windowElement) {
        // Create resize handles
        const resizeHandles = [
            { class: 'n', cursor: 'ns-resize' },
            { class: 's', cursor: 'ns-resize' },
            { class: 'e', cursor: 'ew-resize' },
            { class: 'w', cursor: 'ew-resize' },
            { class: 'ne', cursor: 'ne-resize' },
            { class: 'nw', cursor: 'nw-resize' },
            { class: 'se', cursor: 'se-resize' },
            { class: 'sw', cursor: 'sw-resize' }
        ];

        resizeHandles.forEach(handle => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = `window-resize-handle ${handle.class}`;
            resizeHandle.style.cursor = handle.cursor;
            windowElement.appendChild(resizeHandle);

            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = windowElement.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                startLeft = parseInt(windowElement.style.left) || rect.left;
                startTop = parseInt(windowElement.style.top) || rect.top;

                windowElement.classList.add('resizing');
                document.addEventListener('mousemove', handleResize);
                document.addEventListener('mouseup', stopResize);
                e.preventDefault();
                e.stopPropagation();
            });

            const handleResize = (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                // Calculate new dimensions based on handle type
                if (handle.class.includes('e')) newWidth = startWidth + deltaX;
                if (handle.class.includes('w')) {
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                }
                if (handle.class.includes('s')) newHeight = startHeight + deltaY;
                if (handle.class.includes('n')) {
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                }

                // Apply minimum constraints
                const minWidth = 320;
                const minHeight = 200;
                
                if (newWidth < minWidth) {
                    if (handle.class.includes('w')) newLeft = startLeft + (startWidth - minWidth);
                    newWidth = minWidth;
                }
                if (newHeight < minHeight) {
                    if (handle.class.includes('n')) newTop = startTop + (startHeight - minHeight);
                    newHeight = minHeight;
                }

                // Apply changes
                windowElement.style.width = newWidth + 'px';
                windowElement.style.height = newHeight + 'px';
                windowElement.style.left = newLeft + 'px';
                windowElement.style.top = newTop + 'px';
            };

            const stopResize = () => {
                isResizing = false;
                windowElement.classList.remove('resizing');
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', stopResize);
            };
        });
    }
    
    minimizeWindow(windowElement) {
        windowElement.style.display = 'none';
        
        // Update window state
        for (const [id, window] of this.windows.entries()) {
            if (window.element === windowElement) {
                window.minimized = true;
                this.updateTaskbarItem(id, 'minimized');
                break;
            }
        }
        
        // Focus next window if this was active
        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
            const visibleWindows = Array.from(this.windows.values())
                .filter(w => !w.minimized && w.element.style.display !== 'none');
            if (visibleWindows.length > 0) {
                this.focusWindow(visibleWindows[visibleWindows.length - 1].element);
            }
        }
    }
    
    restoreWindow(windowElement) {
        windowElement.style.display = 'block';
        
        // Update window state
        for (const [id, window] of this.windows.entries()) {
            if (window.element === windowElement) {
                window.minimized = false;
                this.updateTaskbarItem(id, 'active');
                break;
            }
        }
        
        this.focusWindow(windowElement);
    }
    
    toggleMaximizeWindow(windowElement) {
        // Find window data
        let windowData = null;
        for (const window of this.windows.values()) {
            if (window.element === windowElement) {
                windowData = window;
                break;
            }
        }
        
        if (!windowData) return;
        
        if (windowData.maximized) {
            // Restore
            windowElement.style.width = windowData.originalWidth || '800px';
            windowElement.style.height = windowData.originalHeight || '600px';
            windowElement.style.left = windowData.originalLeft || '100px';
            windowElement.style.top = windowData.originalTop || '100px';
            windowData.maximized = false;
        } else {
            // Maximize
            windowData.originalWidth = windowElement.style.width;
            windowData.originalHeight = windowElement.style.height;
            windowData.originalLeft = windowElement.style.left;
            windowData.originalTop = windowElement.style.top;
            
            windowElement.style.width = '100%';
            windowElement.style.height = 'calc(100% - 50px)';
            windowElement.style.left = '0';
            windowElement.style.top = '0';
            windowData.maximized = true;
        }
    }
    
    focusWindow(windowElement) {
        // Remove focus from all windows
        document.querySelectorAll('.window').forEach(w => {
            w.classList.remove('window-focused');
        });
        
        // Add focus to this window
        windowElement.classList.add('window-focused');
        this.activeWindow = windowElement;
        
        // Update z-index to bring to front
        const maxZ = Math.max(...Array.from(document.querySelectorAll('.window'))
            .map(w => parseInt(w.style.zIndex) || 100));
        windowElement.style.zIndex = maxZ + 1;
        
        // Update taskbar
        for (const [id, window] of this.windows.entries()) {
            if (window.element === windowElement) {
                this.updateTaskbarItem(id, 'active');
            } else {
                this.updateTaskbarItem(id, window.minimized ? 'minimized' : 'inactive');
            }
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
            const status = this.isSwissKnifeReady ? 'Ready' : 'Limited';
            statusElement.textContent = `${status} | Windows: ${this.windows.size}`;
        }
    }
    
    setupContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'desktop') {
                e.preventDefault();
                // Could add desktop context menu here
            }
        });
    }
    
    startSystemMonitoring() {
        console.log('System monitoring started');
        // Additional monitoring could be added here
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        // Add to notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
        
        return notification;
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    openApp(appId, options = {}) {
        return this.launchApp(appId, options);
    }
    
    addToTaskbar(window) {
        const taskbarApps = document.getElementById('taskbar-apps');
        if (!taskbarApps) return;
        
        // Check if taskbar item already exists (for singleton apps)
        const existingItem = taskbarApps.querySelector(`[data-window-id="${window.id}"]`);
        if (existingItem) return;
        
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item active';
        taskbarItem.dataset.windowId = window.id;
        taskbarItem.innerHTML = `
            <span class="taskbar-icon">${this.apps.get(window.appId)?.icon || '📱'}</span>
            <span class="taskbar-label">${window.title}</span>
        `;
        
        // Click to focus/minimize window
        taskbarItem.addEventListener('click', () => {
            if (window.minimized) {
                this.restoreWindow(window.element);
            } else if (this.activeWindow === window.element) {
                this.minimizeWindow(window.element);
            } else {
                this.focusWindow(window.element);
            }
        });
        
        taskbarApps.appendChild(taskbarItem);
    }
    
    removeFromTaskbar(windowId) {
        const taskbarApps = document.getElementById('taskbar-apps');
        if (!taskbarApps) return;
        
        const taskbarItem = taskbarApps.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.remove();
        }
    }
    
    updateTaskbarItem(windowId, state) {
        const taskbarApps = document.getElementById('taskbar-apps');
        if (!taskbarApps) return;
        
        const taskbarItem = taskbarApps.querySelector(`[data-window-id="${windowId}"]`);
        if (!taskbarItem) return;
        
        // Update active state
        taskbarItem.classList.toggle('active', state === 'active');
        taskbarItem.classList.toggle('minimized', state === 'minimized');
    }
    
    async initializeEnhancer() {
        // Load desktop enhancer dynamically
        try {
            const script = document.createElement('script');
            script.src = './js/desktop-enhancer.js';
            script.onload = async () => {
                this.enhancer = new window.DesktopEnhancer();
                await this.enhancer.ready();
                console.log('Desktop enhancer initialized');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Failed to load desktop enhancer:', error);
        }
    }

    // ...existing code...
}

// Global functions for desktop functionality
window.showAbout = function() {
    const aboutContent = `
        <div class="about-dialog">
            <h2>🔪 SwissKnife Web Desktop</h2>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> ${new Date().toISOString().split('T')[0]}</p>
            <p><strong>Description:</strong> AI-powered development environment in the browser</p>
            <br>
            <p><strong>Features:</strong></p>
            <ul>
                <li>🤖 AI Chat & Code Generation</li>
                <li>🖥️ Browser Terminal</li>
                <li>📁 Content-Addressed File Management</li>
                <li>🧠 AI Model Management</li>
                <li>🔌 MCP Server Control</li>
                <li>🔑 API Key Management</li>
                <li>🌐 IPFS Integration</li>
                <li>⚡ WebNN/WebGPU Support</li>
            </ul>
            <br>
            <p><strong>GitHub:</strong> <a href="https://github.com/endomorphosis/swissknife" target="_blank">endomorphosis/swissknife</a></p>
        </div>
    `;
    
    if (window.desktop) {
        window.desktop.showDialog('About SwissKnife', aboutContent);
    } else {
        alert('SwissKnife Web Desktop v1.0.0');
    }
};

window.openTerminalHere = function() {
    if (window.desktop) {
        window.desktop.openApp('terminal');
    }
};

window.createNewFile = function() {
    const fileName = prompt('Enter file name:');
    if (fileName && window.desktop) {
        window.desktop.showNotification(`Created file: ${fileName}`, 'success');
    }
};

window.createNewFolder = function() {
    const folderName = prompt('Enter folder name:');
    if (folderName && window.desktop) {
        window.desktop.showNotification(`Created folder: ${folderName}`, 'success');
    }
};

window.refreshDesktop = function() {
    if (window.desktop) {
        window.desktop.showNotification('Desktop refreshed', 'info');
    }
    location.reload();
};

window.showDesktopProperties = function() {
    const props = `
        <div class="desktop-properties">
            <h3>Desktop Properties</h3>
            <div class="prop-row"><strong>Resolution:</strong> ${screen.width}x${screen.height}</div>
            <div class="prop-row"><strong>Color Depth:</strong> ${screen.colorDepth}-bit</div>
            <div class="prop-row"><strong>Browser:</strong> ${navigator.userAgent.split(' ')[0]}</div>
            <div class="prop-row"><strong>Platform:</strong> ${navigator.platform}</div>
            <div class="prop-row"><strong>Language:</strong> ${navigator.language}</div>
            <div class="prop-row"><strong>Online:</strong> ${navigator.onLine ? 'Yes' : 'No'}</div>
            <div class="prop-row"><strong>Local Storage:</strong> ${localStorage.length} items</div>
        </div>
    `;
    
    if (window.desktop) {
        window.desktop.showDialog('Desktop Properties', props);
    }
};

// Global notification system
window.showNotification = function(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    // Add to desktop
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
};

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': 
        default: return 'ℹ️';
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
