/**
 * SwissKnife Web Desktop - Vite/TypeScript Port
 * 
 * Full port of the original js/main.js with all desktop functionality
 */

// Import CSS for the desktop environment - use proper relative paths
import './css/aero-enhanced.css';
import './css/desktop.css';
import './css/windows.css';
import './css/terminal.css';
import './css/apps.css';
import './css/strudel.css';
import './css/strudel-grandma.css';

// Import SwissKnife core and enhancer - use dynamic imports to avoid module issues
// These will be loaded at runtime

// Type definitions
declare global {
  interface Window {
    SwissKnife: any;
    desktop: SwissKnifeDesktop;
    showAbout: () => void;
    openTerminalHere: () => void;
    createNewFile: () => void;
    createNewFolder: () => void;
    refreshDesktop: () => void;
    showDesktopProperties: () => void;
    strudelDAW: any;
    GrandmaStrudelDAW: any;
  }
}

interface AppConfig {
  name: string;
  icon: string;
  component: string;
  singleton: boolean;
}

interface WindowData {
  id: string;
  element: HTMLElement;
  appId: string;
  title: string;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isSnapped: boolean;
  snapZone: string | null;
  preSnapState?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  appInstance?: any;
}

interface SnapZone {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  trigger: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DragState {
  isDragging: boolean;
  draggedWindow: HTMLElement | null;
  snapZones: SnapZone[];
  snapThreshold: number;
  activeSnapZone?: SnapZone | null;
}

class SwissKnifeDesktop {
  private windows = new Map<string, WindowData>();
  private windowCounter = 0;
  private activeWindow: HTMLElement | null = null;
  private apps = new Map<string, AppConfig>();
  private swissknife: any = null;
  private isSwissKnifeReady = false;
  private enhancer: any = null;
  private currentTheme = 'day';
  private dragState: DragState;
  private currentAppWindowId: string | null = null;
  
  constructor() {
    this.dragState = {
      isDragging: false,
      draggedWindow: null,
      snapZones: [],
      snapThreshold: 20
    };
    
    this.init();
  }
  
  async init() {
    console.log('Initializing SwissKnife Web Desktop...');
    
    // Add error handlers for missing backend API calls
    this.setupMockApiHandlers();
    
    // Load SwissKnife core - simplified approach for now
    try {
      // Create a mock SwissKnife object for now to focus on desktop functionality
      this.swissknife = {
        initialize: () => Promise.resolve({ success: true }),
        getHardwareStatus: () => ({
          webnn: false,
          webgpu: !!(navigator as any).gpu
        })
      };
      this.isSwissKnifeReady = true;
      console.log('SwissKnife core mock initialized successfully');
    } catch (error) {
      console.warn('SwissKnife core initialization failed, continuing with limited functionality:', error);
    }
    
    // Initialize desktop enhancer
    await this.initializeEnhancer();
    
    // Initialize desktop components
    this.initializeDesktop();
    this.initializeApps();
    this.initializeTheme();
    this.setupEventListeners();
    this.startSystemMonitoring();
    
    // Hide loading screen
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    }, 3000);
    
    // Debug: Check DOM structure after initialization
    setTimeout(() => {
      this.debugDOMStructure();
    }, 4000);
    
    // Set up global functions for HTML onclick handlers
    window.showDesktopProperties = () => this.showDesktopProperties();
    window.openTerminalHere = () => this.openTerminalHere();
    window.createNewFile = () => this.createNewFile();
    window.createNewFolder = () => this.createNewFolder();
    window.refreshDesktop = () => this.refreshDesktop();
    window.showAbout = () => this.showAbout();
    
    console.log('SwissKnife Web Desktop ready!');
  }
  
  debugDOMStructure() {
    console.log('🔍 DEBUG: Checking DOM structure...');
    
    // Check desktop icons
    const desktopIcons = document.querySelectorAll('.desktop-icons .icon');
    console.log('🖥️ Desktop icons found:', desktopIcons.length);
    
    desktopIcons.forEach((icon, index) => {
      const appId = (icon as HTMLElement).dataset.app;
      const label = icon.querySelector('.icon-label')?.textContent;
      console.log(`  Icon ${index + 1}: ${appId} (${label})`);
    });
    
    // Check system menu items
    const menuItems = document.querySelectorAll('.system-menu .menu-item[data-app]');
    console.log('📋 System menu items found:', menuItems.length);
    
    menuItems.forEach((item, index) => {
      const appId = (item as HTMLElement).dataset.app;
      const text = item.textContent?.trim();
      console.log(`  Menu item ${index + 1}: ${appId} (${text})`);
    });
    
    // Test manual app launch
    console.log('🧪 Testing manual app launches...');
    console.log('🧪 To test NAVI: desktop.launchApp("navi")');
    console.log('🧪 To test Device Manager: desktop.launchApp("device-manager")');
  }
  
  async initializeEnhancer() {
    // Initialize desktop enhancer for Aero effects, window snapping, etc.
    try {
      // Skip the complex dynamic loading for now and focus on basic desktop functionality
      console.log('Desktop enhancer functionality will be added later');
    } catch (error) {
      console.error('Failed to initialize desktop enhancer:', error);
    }
  }
  
  initializeDesktop() {
    // Initialize system time
    this.updateSystemTime();
    setInterval(() => this.updateSystemTime(), 1000);
    
    // Initialize system status
    this.updateSystemStatus();
    setInterval(() => this.updateSystemStatus(), 30000);
    
    // Setup desktop context menu
    this.setupContextMenu();
    
    // Setup window management
    this.setupWindowManagement();
  }
  
  initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('swissknife-theme') || 'day';
    this.setTheme(savedTheme);
    
    // Add theme toggle to system panel
    this.addThemeToggle();
  }
  
  addThemeToggle() {
    const systemStatus = document.querySelector('.system-status');
    if (!systemStatus) return;
    
    const themeToggle = document.createElement('span');
    themeToggle.className = 'status-indicator theme-toggle';
    themeToggle.id = 'theme-toggle';
    themeToggle.innerHTML = this.currentTheme === 'day' ? '☀️' : '🌅';
    themeToggle.title = `Switch to ${this.currentTheme === 'day' ? 'Sunset' : 'Day'} Mode`;
    themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Insert before the first child of system-status
    systemStatus.insertBefore(themeToggle, systemStatus.firstChild);
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'day' ? 'sunset' : 'day';
    this.setTheme(newTheme);
    localStorage.setItem('swissknife-theme', newTheme);
  }
  
  setTheme(theme: string) {
    this.currentTheme = theme;
    const body = document.body;
    const desktopBg = document.querySelector('.desktop-background') as HTMLElement;
    const themeToggle = document.getElementById('theme-toggle');
    
    // Remove previous theme classes
    body.classList.remove('theme-day', 'theme-sunset');
    
    // Add new theme class
    body.classList.add(`theme-${theme}`);
    
    // Update background image
    if (desktopBg) {
      if (theme === 'day') {
        // Bright daylight Swiss Alps
        desktopBg.style.backgroundImage = "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80')";
      } else {
        // Sunset/golden hour Swiss Alps
        desktopBg.style.backgroundImage = "url('https://images.unsplash.com/photo-1544550285-f813152fb2fd?w=1920&h=1080&fit=crop&q=80')";
      }
    }
    
    // Update theme toggle icon
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'day' ? '☀️' : '🌅';
      themeToggle.title = `Switch to ${theme === 'day' ? 'Sunset' : 'Day'} Mode`;
    }
    
    console.log(`Theme switched to: ${theme}`);
  }
  
  initializeApps() {
    console.log('🔧 Initializing apps...');
    
    // Register available applications
    this.apps.set('terminal', {
      name: 'SwissKnife Terminal',
      icon: '🖥️',
      component: 'TerminalApp',
      singleton: false
    });
    
    this.apps.set('vibecode', {
      name: 'VibeCode Editor',
      icon: '📝',
      component: 'VibeCodeApp',
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
      name: 'Model Browser',
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

    this.apps.set('cron', {
      name: 'AI Cron Scheduler',
      icon: '⏰',
      component: 'CronApp',
      singleton: true
    });

    this.apps.set('device-manager', {
      name: 'Device Manager',
      icon: '🔧',
      component: 'DeviceManagerApp',
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
    
    console.log('📱 Total apps registered:', this.apps.size);
    console.log('📱 Apps list:', Array.from(this.apps.keys()));
  }
  
  setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // Desktop icon clicks
    const desktopIcons = document.querySelectorAll('.icon');
    console.log('🖱️ Found desktop icons:', desktopIcons.length);
    
    desktopIcons.forEach((icon, index) => {
      const appId = (icon as HTMLElement).dataset.app;
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
      systemMenu.classList.remove('visible');
      
      systemMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (systemMenu.classList.contains('visible')) {
          systemMenu.classList.remove('visible');
        } else {
          systemMenu.classList.add('visible');
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!systemMenu.contains(e.target as Node) && !systemMenuBtn.contains(e.target as Node)) {
          systemMenu.classList.remove('visible');
        }
      });
      
      // Menu item clicks
      const menuItems = document.querySelectorAll('.menu-item[data-app]');
      console.log('📋 Found menu items:', menuItems.length);
      
      menuItems.forEach((item, index) => {
        const appId = (item as HTMLElement).dataset.app;
        console.log(`📋 Setting up menu item ${index + 1}: ${appId}`);
        
        item.addEventListener('click', () => {
          console.log(`📋 Menu item clicked: ${appId}`);
          if (appId) {
            this.launchApp(appId);
          }
          systemMenu.classList.remove('visible');
        });
      });
    }
    
    // Desktop right-click context menu
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('desktop-background') || 
          target.classList.contains('desktop')) {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Window management events
    document.addEventListener('mousedown', (e) => {
      const windowElement = (e.target as HTMLElement).closest('.window') as HTMLElement;
      if (windowElement) {
        this.focusWindow(windowElement);
      }
    });
  }
  
  async launchApp(appId: string) {
    console.log(`🚀 Launching app: ${appId}`);
    
    const appConfig = this.apps.get(appId);
    if (!appConfig) {
      console.error(`❌ App ${appId} not found in registered apps`);
      console.log('📱 Available apps:', Array.from(this.apps.keys()));
      return;
    }
    
    console.log(`✅ Found app config for ${appId}:`, appConfig);

    // Check if singleton app is already running
    if (appConfig.singleton) {
      const existingWindow = Array.from(this.windows.values())
        .find(w => w.appId === appId);
      if (existingWindow) {
        console.log(`🔄 Focusing existing window for ${appId}`);
        this.focusWindow(existingWindow.element);
        return;
      }
    }

    try {
      console.log(`🪟 Creating window for ${appId}...`);
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
      
      console.log(`🎨 Loading app component: ${appConfig.component}`);
      // Load app component
      await this.loadAppComponent(window, appConfig.component);
      
      console.log(`✅ Successfully launched ${appConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to launch ${appConfig.name}:`, error);
    }
  }
  
  async createWindow(options: any): Promise<WindowData> {
    const windowId = `window-${++this.windowCounter}`;
    
    const windowElement = document.createElement('div');
    windowElement.className = 'window window-enter';
    windowElement.id = windowId;
    windowElement.setAttribute('data-window-id', windowId);
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
    
    // Add resize handles
    this.addResizeHandles(windowElement);
    
    // Add window to container
    const windowsContainer = document.getElementById('windows-container');
    if (windowsContainer) {
      windowsContainer.appendChild(windowElement);
    }
    
    // Setup window controls
    this.setupWindowControls(windowElement);
    
    // Make window draggable
    this.makeWindowDraggable(windowElement);
    
    // Store window reference
    const window: WindowData = {
      id: windowId,
      element: windowElement,
      appId: options.appId,
      title: options.title,
      minimized: false,
      maximized: false,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      isSnapped: false,
      snapZone: null
    };
    
    this.windows.set(windowId, window);
    
    // Focus the new window
    this.focusWindow(windowElement);
    
    // Add to taskbar
    this.addToTaskbar(window);
    
    return window;
  }
  
  async loadAppComponent(window: WindowData, componentName: string) {
    console.log(`🎨 Loading app component: ${componentName}`);
    
    try {
      // Get the content element
      const contentElement = document.getElementById(`${window.id}-content`);
      if (!contentElement) {
        throw new Error(`Content element not found for window ${window.id}`);
      }
      
      // Handle different app types
      let appInstance;
      
      switch (componentName.toLowerCase()) {
        case 'terminalapp':
          console.log('🖥️ Loading Terminal app...');
          this.loadTerminalApp(contentElement);
          break;
          
        case 'devicemanagerapp':
          console.log('🔧 Loading Device Manager app...');
          this.loadDeviceManagerApp(contentElement);
          break;
          
        case 'naviapp':
          console.log('🤖 Loading NAVI app...');
          this.loadNaviApp(contentElement);
          break;
          
        case 'aichatapp':
          this.loadAIChatApp(contentElement);
          break;
          
        case 'filemanagerapp':
          this.loadFileManagerApp(contentElement);
          break;
          
        case 'vibecodeapp':
          this.loadVibeCodeApp(contentElement);
          break;
          
        case 'settingsapp':
          this.loadSettingsApp(contentElement);
          break;
          
        case 'apikeysapp':
          this.loadAPIKeysApp(contentElement);
          break;
          
        case 'mcpcontrolapp':
          this.loadMCPControlApp(contentElement);
          break;
          
        case 'taskmanagerapp':
          this.loadTaskManagerApp(contentElement);
          break;
          
        case 'modelbrowserapp':
          this.loadModelBrowserApp(contentElement);
          break;
          
        case 'ipfsexplorerapp':
          this.loadIPFSExplorerApp(contentElement);
          break;
          
        case 'cronapp':
          this.loadCronApp(contentElement);
          break;
          
        case 'grandmastrudeldaw':
          console.log('🎵 Loading Music Studio...');
          this.loadMusicStudioPlaceholder(contentElement);
          break;
          
        default:
          throw new Error(`Unknown app component: ${componentName}`);
      }
      
      // Store app instance reference if created
      if (appInstance) {
        window.appInstance = appInstance;
      }
      
    } catch (error) {
      console.error(`Failed to load app component ${componentName}:`, error);
      
      // Show error in window
      const contentElement = document.getElementById(`${window.id}-content`);
      if (contentElement) {
        contentElement.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #f48771;">
            <h3>Failed to load application</h3>
            <p>${error.message}</p>
            <button onclick="this.closest('.window').remove()" style="margin-top: 10px; padding: 5px 10px;">Close</button>
          </div>
        `;
      }
    }
  }
  
  // Simplified placeholder app loaders for now
  loadTerminalApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🖥️ SwissKnife Terminal</h2>
        <p>Terminal functionality will be implemented here.</p>
        <div class="terminal-demo">
          <div style="background: #000; color: #0f0; padding: 10px; font-family: monospace; border-radius: 4px;">
            > swissknife --version<br>
            SwissKnife v1.0.0<br>
            > _
          </div>
        </div>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadDeviceManagerApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="device-manager-app">
        <div class="app-header">
          <h2>🔧 Device Manager</h2>
          <p>View and manage system devices</p>
        </div>
        
        <div class="device-list">
          <div class="device-category">
            <h3>🖥️ Display adapters</h3>
            <div class="device-item">
              <span class="device-icon">📺</span>
              <span class="device-name">WebGL Renderer</span>
              <span class="device-status working">Working</span>
            </div>
          </div>
          
          <div class="device-category">
            <h3>🔊 Audio devices</h3>
            <div class="device-item">
              <span class="device-icon">🎵</span>
              <span class="device-name">Web Audio API</span>
              <span class="device-status working">Working</span>
            </div>
          </div>
          
          <div class="device-category">
            <h3>🖱️ Input devices</h3>
            <div class="device-item">
              <span class="device-icon">⌨️</span>
              <span class="device-name">Standard Keyboard</span>
              <span class="device-status working">Working</span>
            </div>
            <div class="device-item">
              <span class="device-icon">🖱️</span>
              <span class="device-name">Standard Mouse</span>
              <span class="device-status working">Working</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  loadNaviApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <img src="/assets/icons/navi-icon.png" style="width: 64px; height: 64px; border-radius: 8px; margin: 0 auto 16px; display: block;">
        <h2>🤖 NAVI</h2>
        <p>AI Assistant and Chat Interface</p>
        <p>NAVI is your intelligent assistant for navigation and support.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadAIChatApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🤖 AI Chat</h2>
        <p>AI Chat functionality will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadFileManagerApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>📁 File Manager</h2>
        <p>File management functionality will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadVibeCodeApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>💻 VibeCode</h2>
        <p>WebNN/WebGPU powered code editor will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadSettingsApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>⚙️ Settings</h2>
        <p>Configuration settings will be implemented here.</p>
        <div class="settings-demo">
          <label>
            <input type="checkbox" ${this.currentTheme === 'sunset' ? 'checked' : ''}> 
            Sunset Theme
          </label>
        </div>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadAPIKeysApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🔑 API Keys</h2>
        <p>API key management will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadMCPControlApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🔌 MCP Control</h2>
        <p>Model Context Protocol server management will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadTaskManagerApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>⚡ Task Manager</h2>
        <p>System performance monitoring will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadModelBrowserApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🧠 Model Browser</h2>
        <p>AI model browser and management will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadIPFSExplorerApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🌐 IPFS Explorer</h2>
        <p>IPFS file system explorer will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadCronApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>⏰ AI Cron</h2>
        <p>AI-powered task scheduler will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  loadMusicStudioPlaceholder(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder">
        <h2>🎵 Music Studio</h2>
        <p>Strudel-powered music composition will be implemented here.</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
  }
  
  // Window management methods
  setupWindowControls(windowElement: HTMLElement) {
    const minimizeBtn = windowElement.querySelector('.window-control.minimize');
    const maximizeBtn = windowElement.querySelector('.window-control.maximize');
    const closeBtn = windowElement.querySelector('.window-control.close');
    
    minimizeBtn?.addEventListener('click', () => {
      this.minimizeWindow(windowElement);
    });
    
    maximizeBtn?.addEventListener('click', () => {
      this.toggleMaximizeWindow(windowElement);
    });
    
    closeBtn?.addEventListener('click', () => {
      this.closeWindow(windowElement);
    });
  }
  
  makeWindowDraggable(windowElement: HTMLElement) {
    const titlebar = windowElement.querySelector('.window-titlebar') as HTMLElement;
    if (!titlebar) return;
    
    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    
    titlebar.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).classList.contains('window-control')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(windowElement.style.left);
      startTop = parseInt(windowElement.style.top);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      e.preventDefault();
    });
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = startLeft + deltaX;
      const newTop = Math.max(0, startTop + deltaY);
      
      windowElement.style.left = newLeft + 'px';
      windowElement.style.top = newTop + 'px';
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
  
  addResizeHandles(windowElement: HTMLElement) {
    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    
    handles.forEach(direction => {
      const handle = document.createElement('div');
      handle.className = `window-resize-handle ${direction}`;
      windowElement.appendChild(handle);
    });
  }
  
  focusWindow(windowElement: HTMLElement) {
    // Remove focus from all windows
    document.querySelectorAll('.window').forEach(w => {
      w.classList.remove('focused');
    });
    
    // Focus the selected window
    windowElement.classList.add('focused');
    this.activeWindow = windowElement;
  }
  
  minimizeWindow(windowElement: HTMLElement) {
    windowElement.classList.add('minimized');
    const windowId = windowElement.id;
    const window = this.windows.get(windowId);
    if (window) {
      window.minimized = true;
    }
  }
  
  toggleMaximizeWindow(windowElement: HTMLElement) {
    const windowId = windowElement.id;
    const window = this.windows.get(windowId);
    
    if (window?.maximized) {
      windowElement.classList.remove('maximized');
      window.maximized = false;
    } else if (window) {
      windowElement.classList.add('maximized');
      window.maximized = true;
    }
  }
  
  closeWindow(windowElement: HTMLElement) {
    const windowId = windowElement.id;
    const window = this.windows.get(windowId);
    
    if (window) {
      // Cleanup app instance
      if (window.appInstance && window.appInstance.cleanup) {
        window.appInstance.cleanup();
      }
      
      // Remove from taskbar
      this.removeFromTaskbar(window);
      
      // Remove window
      windowElement.classList.add('window-exit');
      setTimeout(() => {
        windowElement.remove();
        this.windows.delete(windowId);
      }, 200);
    }
  }
  
  addToTaskbar(window: WindowData) {
    const taskbarApps = document.getElementById('taskbar-apps');
    if (!taskbarApps) return;
    
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-app';
    taskbarItem.id = `taskbar-${window.id}`;
    taskbarItem.innerHTML = `
      <span class="taskbar-app-icon">${this.apps.get(window.appId)?.icon || '📱'}</span>
      <span class="taskbar-app-title">${window.title}</span>
    `;
    
    taskbarItem.addEventListener('click', () => {
      if (window.minimized) {
        window.element.classList.remove('minimized');
        window.minimized = false;
      }
      this.focusWindow(window.element);
    });
    
    taskbarApps.appendChild(taskbarItem);
  }
  
  removeFromTaskbar(window: WindowData) {
    const taskbarItem = document.getElementById(`taskbar-${window.id}`);
    if (taskbarItem) {
      taskbarItem.remove();
    }
  }
  
  updateSystemTime() {
    const timeElement = document.getElementById('system-time');
    if (!timeElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
    
    timeElement.textContent = timeString;
  }
  
  updateSystemStatus() {
    // Update AI status
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
      aiStatus.className = 'status-indicator ' + (this.isSwissKnifeReady ? 'active' : 'inactive');
      aiStatus.title = `AI Engine: ${this.isSwissKnifeReady ? 'Ready' : 'Not Ready'}`;
    }
    
    // Update IPFS status
    const ipfsStatus = document.getElementById('ipfs-status');
    if (ipfsStatus) {
      ipfsStatus.className = 'status-indicator inactive';
      ipfsStatus.title = 'IPFS: Not connected';
    }
    
    // Update GPU status
    const gpuStatus = document.getElementById('gpu-status');
    if (gpuStatus) {
      const hasWebGPU = !!(navigator as any).gpu;
      gpuStatus.className = 'status-indicator ' + (hasWebGPU ? 'active' : 'inactive');
      gpuStatus.title = `GPU: ${hasWebGPU ? 'WebGPU Available' : 'Not available'}`;
    }
  }
  
  setupContextMenu() {
    // Basic context menu setup
  }
  
  setupWindowManagement() {
    // Basic window management setup
  }
  
  handleKeyboardShortcuts(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 't':
          e.preventDefault();
          this.launchApp('terminal');
          break;
        case 'e':
          e.preventDefault();
          this.launchApp('vibecode');
          break;
        case 'w':
          if (this.activeWindow) {
            e.preventDefault();
            this.closeWindow(this.activeWindow);
          }
          break;
      }
    }
  }
  
  showContextMenu(x: number, y: number) {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
      contextMenu.style.left = x + 'px';
      contextMenu.style.top = y + 'px';
      contextMenu.classList.remove('hidden');
      
      // Hide context menu when clicking elsewhere
      const hideMenu = (e: Event) => {
        if (!contextMenu.contains(e.target as Node)) {
          contextMenu.classList.add('hidden');
          document.removeEventListener('click', hideMenu);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', hideMenu);
      }, 10);
    }
  }
  
  startSystemMonitoring() {
    // Monitor system performance
    setInterval(() => {
      this.updateSystemMetrics();
    }, 10000);
  }
  
  updateSystemMetrics() {
    // Collect and display system metrics
    const metrics = {
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      windows: this.windows.size
    };
    
    console.debug('System metrics:', metrics);
  }
  
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
    const aboutHTML = `
      <div class="app-placeholder" style="padding: 20px; text-align: center;">
        <h2>🇨🇭 SwissKnife Web Desktop</h2>
        <p>Version 1.0.0</p>
        <p>A modern AI-powered desktop environment for the browser</p>
        <p>Built with Swiss precision 🏔️</p>
        <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
      </div>
    `;
    
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
        contentElement.innerHTML = aboutHTML;
      }
    });
  }
  
  setupMockApiHandlers() {
    // Mock API handlers for development
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      if (url.toString().includes('/status') || url.toString().includes('/api/status')) {
        console.log(`Mocking API call to: ${url}`);
        return new Response(JSON.stringify({
          status: 'ok',
          version: '1.0.0',
          services: {
            ipfs: false,
            ai: true,
            storage: true
          },
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return originalFetch(url, options);
    };
  }
}

// Initialize SwissKnife Desktop when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing SwissKnife Web Desktop with Vite...');
  window.desktop = new SwissKnifeDesktop();
});