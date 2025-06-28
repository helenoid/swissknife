// SwissKnife Web Desktop - Main Application (Simplified for Testing)
import '../css/desktop.css';
import '../css/windows.css';
import '../css/terminal.css';
import '../css/apps.css';

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
        // Define available applications
        this.apps.set('terminal', {
            name: 'Terminal',
            icon: '💻',
            component: 'TerminalApp',
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
        
        this.apps.set('vibecode', {
            name: 'VibeCode',
            icon: '⚡',
            component: 'VibeCodeApp',
            singleton: false
        });
        
        this.apps.set('settings', {
            name: 'Settings',
            icon: '⚙️',
            component: 'SettingsApp',
            singleton: true
        });
    }
    
    setupEventListeners() {
        // Desktop icon clicks
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                e.preventDefault();
                const appId = icon.dataset.app;
                this.launchApp(appId);
            });
        });
        
        // System menu
        const systemMenuBtn = document.getElementById('system-menu-btn');
        const systemMenu = document.getElementById('system-menu');
        
        if (systemMenuBtn && systemMenu) {
            systemMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                systemMenu.classList.toggle('hidden');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            const systemMenu = document.getElementById('system-menu');
            if (systemMenu) {
                systemMenu.classList.add('hidden');
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
        
        // Placeholder implementation
        contentElement.innerHTML = `
            <div class="app-placeholder">
                <h2>${window.appId === 'terminal' ? '💻' : '🚀'} ${componentName}</h2>
                <p>SwissKnife app loading...</p>
                <p>Component: ${componentName}</p>
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SwissKnifeDesktop();
    });
} else {
    new SwissKnifeDesktop();
}
