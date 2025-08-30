/**
 * SwissKnife Web Desktop - Vite/TypeScript Port
 * 
 * Full port of the original js/main.js with all desktop functionality
 */

// Import CSS for the desktop environment from public folder
import '/css/aero-enhanced.css';
import '/css/desktop.css';
import '/css/windows.css';
import '/css/terminal.css';
import '/css/apps.css';
import '/css/model-browser.css';
import '/css/strudel.css';
import '/css/strudel-grandma.css';

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
  
  // Initialize AI Infrastructure (IPFS Accelerate Bridge + AI Router)
  async initializeAIInfrastructure() {
    try {
      console.log('🧠 Initializing AI Infrastructure...');
      
      // Load AI infrastructure scripts
      await Promise.all([
        this.loadScript('/js/ipfs-accelerate-bridge.js'),
        this.loadScript('/js/ai-model-router.js')
      ]);
      
      console.log('✅ AI Infrastructure scripts loaded successfully');
      
      // Wait for global objects to be available
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        if ((window as any).ipfsAccelerateBridge && (window as any).aiModelRouter) {
          console.log('✅ AI Infrastructure initialized successfully');
          
          // Set up integration between components
          this.setupAIIntegration();
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      
      if (retries >= maxRetries) {
        console.warn('⚠️ AI Infrastructure initialization timeout - some features may be limited');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize AI Infrastructure:', error);
      console.log('🔄 Continuing with limited AI functionality...');
    }
  }
  
  setupAIIntegration() {
    // Connect AI components for better integration
    const bridge = (window as any).ipfsAccelerateBridge;
    const router = (window as any).aiModelRouter;
    
    if (bridge && router) {
      // Bridge events to router for automatic endpoint discovery
      bridge.on('bridge:initialized', () => {
        console.log('🔗 IPFS Accelerate Bridge connected to AI Router');
        router.discoverEndpoints();
      });
      
      // Setup model loading coordination
      bridge.on('model:loaded', (data: any) => {
        console.log(`🧠 Model ${data.modelId} loaded - updating router endpoints`);
        router.discoverEndpoints();
      });
      
      // Global availability for apps
      (window as any).transformersModelServer = bridge.modelServer;
      console.log('🌐 Transformers Model Server available globally');
    }
  }
  
  initializeDesktop() {
    // Initialize AI infrastructure
    this.initializeAIInfrastructure();
    
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
    
    this.apps.set('p2p-network', {
      name: 'P2P Network',
      icon: '🔗',
      component: 'P2PNetworkApp',
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
          
        case 'p2pnetworkapp':
          console.log('🔗 Loading P2P Network app...');
          this.loadP2PNetworkApp(contentElement);
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
        
        <div class="device-tabs">
          <button class="device-tab active" data-tab="devices">Devices</button>
          <button class="device-tab" data-tab="drivers">Drivers</button>
          <button class="device-tab" data-tab="performance">Performance</button>
        </div>
        
        <div class="device-content">
          <!-- Devices Tab -->
          <div class="device-tab-content active" id="devices-tab">
            <div class="device-tree">
              <div class="device-category">
                <div class="category-header">
                  <span class="category-icon">🖥️</span>
                  <span class="category-name">Display adapters</span>
                  <span class="expand-icon">▼</span>
                </div>
                <div class="category-items">
                  <div class="device-item">
                    <span class="device-icon">📺</span>
                    <span class="device-name">Generic Display Adapter</span>
                    <span class="device-status working">WORKING</span>
                  </div>
                </div>
              </div>
              
              <div class="device-category">
                <div class="category-header">
                  <span class="category-icon">🔊</span>
                  <span class="category-name">Audio devices</span>
                  <span class="expand-icon">▼</span>
                </div>
                <div class="category-items">
                  <div class="device-item">
                    <span class="device-icon">🎵</span>
                    <span class="device-name">Default Audio Device</span>
                    <span class="device-status working">WORKING</span>
                  </div>
                </div>
              </div>
              
              <div class="device-category">
                <div class="category-header">
                  <span class="category-icon">🖱️</span>
                  <span class="category-name">Input devices</span>
                  <span class="expand-icon">▼</span>
                </div>
                <div class="category-items">
                  <div class="device-item">
                    <span class="device-icon">⌨️</span>
                    <span class="device-name">Standard Keyboard</span>
                    <span class="device-status working">WORKING</span>
                  </div>
                  <div class="device-item">
                    <span class="device-icon">🖱️</span>
                    <span class="device-name">Standard Mouse</span>
                    <span class="device-status working">WORKING</span>
                  </div>
                </div>
              </div>
              
              <div class="device-category">
                <div class="category-header">
                  <span class="category-icon">🌐</span>
                  <span class="category-name">Network adapters</span>
                  <span class="expand-icon">▼</span>
                </div>
                <div class="category-items">
                  <div class="device-item">
                    <span class="device-icon">📡</span>
                    <span class="device-name">Network Adapter</span>
                    <span class="device-status working">WORKING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Drivers Tab -->
          <div class="device-tab-content" id="drivers-tab">
            <div class="drivers-list">
              <div class="driver-item">
                <div class="driver-info">
                  <div class="driver-name">Browser WebGL Driver</div>
                  <div class="driver-version">Version 1.0.0</div>
                  <div class="driver-date">Date: ${new Date().toLocaleDateString()}</div>
                </div>
                <div class="driver-status working">Up to date</div>
              </div>
              
              <div class="driver-item">
                <div class="driver-info">
                  <div class="driver-name">Web Audio API Driver</div>
                  <div class="driver-version">Version 1.0.0</div>
                  <div class="driver-date">Date: ${new Date().toLocaleDateString()}</div>
                </div>
                <div class="driver-status working">Up to date</div>
              </div>
            </div>
          </div>
          
          <!-- Performance Tab -->
          <div class="device-tab-content" id="performance-tab">
            <div class="performance-metrics">
              <div class="metric-card">
                <div class="metric-title">CPU Usage</div>
                <div class="metric-value" id="cpu-usage">0%</div>
                <div class="metric-bar">
                  <div class="metric-fill" style="width: 0%"></div>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-title">Memory Usage</div>
                <div class="metric-value" id="memory-usage">0 MB</div>
                <div class="metric-bar">
                  <div class="metric-fill" style="width: 0%"></div>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-title">GPU Memory</div>
                <div class="metric-value" id="gpu-memory">Unknown</div>
                <div class="metric-bar">
                  <div class="metric-fill" style="width: 0%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add tab switching functionality
    const tabButtons = contentElement.querySelectorAll('.device-tab');
    const tabContents = contentElement.querySelectorAll('.device-tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = (button as HTMLElement).dataset.tab;
        
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        const targetContent = contentElement.querySelector(`#${tabName}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
    
    // Add category expand/collapse functionality
    const categoryHeaders = contentElement.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const category = header.parentElement;
        const items = category?.querySelector('.category-items') as HTMLElement;
        const expandIcon = header.querySelector('.expand-icon');
        
        if (category?.classList.contains('collapsed')) {
          category.classList.remove('collapsed');
          if (items) items.style.display = 'block';
          if (expandIcon) expandIcon.textContent = '▼';
        } else {
          category?.classList.add('collapsed');
          if (items) items.style.display = 'none';
          if (expandIcon) expandIcon.textContent = '▶';
        }
      });
    });
    
    // Simulate performance metrics
    const updatePerformanceMetrics = () => {
      const cpuUsage = Math.floor(Math.random() * 100);
      const memoryUsage = Math.floor(Math.random() * 8192); // MB
      
      const cpuElement = contentElement.querySelector('#cpu-usage');
      const memoryElement = contentElement.querySelector('#memory-usage');
      
      if (cpuElement) {
        cpuElement.textContent = `${cpuUsage}%`;
        const cpuBar = cpuElement.parentElement?.querySelector('.metric-fill') as HTMLElement;
        if (cpuBar) cpuBar.style.width = `${cpuUsage}%`;
      }
      
      if (memoryElement) {
        memoryElement.textContent = `${memoryUsage} MB`;
        const memoryBar = memoryElement.parentElement?.querySelector('.metric-fill') as HTMLElement;
        if (memoryBar) memoryBar.style.width = `${(memoryUsage / 8192) * 100}%`;
      }
    };
    
    // Update performance metrics every 2 seconds
    const performanceInterval = setInterval(updatePerformanceMetrics, 2000);
    updatePerformanceMetrics(); // Initial update
    
    // Clean up interval when window is closed
    const windowElement = contentElement.closest('.window');
    if (windowElement) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach((node) => {
              if (node === windowElement) {
                clearInterval(performanceInterval);
                observer.disconnect();
              }
            });
          }
        });
      });
      observer.observe(windowElement.parentElement!, { childList: true });
    }
  }
  
  loadNaviApp(contentElement: HTMLElement) {
    // Check if the chat app exists before creating iframe
    const chatAppPath = window.location.origin + '/chat/webapp/app.html';
    
    contentElement.innerHTML = `
      <div class="navi-app" style="width: 100%; height: 100%; position: relative;">
        <div class="navi-loading" style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5;">
          <div style="text-align: center;">
            <img src="/assets/icons/navi-icon.png" style="width: 64px; height: 64px; border-radius: 8px; margin-bottom: 16px;">
            <h3>Loading NAVI...</h3>
            <p>Initializing chat application</p>
          </div>
        </div>
      </div>
    `;
    
    // Test if chat app is available first
    fetch(chatAppPath, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          // Chat app exists, load it in iframe
          this.loadNaviIframe(contentElement, chatAppPath);
        } else {
          // Chat app not found, show placeholder
          this.showNaviPlaceholder(contentElement);
        }
      })
      .catch(() => {
        // Network error or chat app not available
        this.showNaviPlaceholder(contentElement);
      });
  }
  
  loadNaviIframe(contentElement: HTMLElement, chatAppPath: string) {
    const iframe = document.createElement('iframe');
    iframe.src = chatAppPath;
    iframe.style.cssText = `
      width: 100%; 
      height: 100%; 
      border: none; 
      background: white;
    `;
    iframe.allow = "camera; microphone; autoplay";
    iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-modals";
    iframe.title = "NAVI Chat Application";
    
    // Handle iframe load success
    iframe.addEventListener('load', () => {
      const loadingDiv = contentElement.querySelector('.navi-loading') as HTMLElement;
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    });
    
    // Handle iframe load errors
    iframe.addEventListener('error', () => {
      this.showNaviPlaceholder(contentElement);
    });
    
    // Add cleanup when window is closed
    const windowElement = contentElement.closest('.window');
    if (windowElement) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach((node) => {
              if (node === windowElement) {
                // Clean up iframe when window is closed
                if (iframe.parentNode) {
                  iframe.src = 'about:blank';
                  iframe.remove();
                }
                observer.disconnect();
              }
            });
          }
        });
      });
      observer.observe(windowElement.parentElement!, { childList: true });
    }
    
    contentElement.querySelector('.navi-app')!.appendChild(iframe);
  }
  
  showNaviPlaceholder(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="app-placeholder" style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
        <img src="/assets/icons/navi-icon.png" style="width: 64px; height: 64px; border-radius: 8px; margin: 0 auto 16px;">
        <h2>NAVI Chat Application</h2>
        <p>The NAVI chat application is not currently available.</p>
        <p>Please ensure the chat application is properly installed in the <code>/chat</code> directory.</p>
        <div style="margin-top: 20px;">
          <button onclick="location.reload()" style="margin: 5px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Application
          </button>
          <button onclick="this.closest('.window').querySelector('.window-control.close').click()" style="margin: 5px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
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
      <div class="api-keys-app">
        <div class="app-header">
          <h2>🔑 API Key Manager</h2>
          <p>Manage your API keys for various services</p>
        </div>
        
        <div class="api-keys-content">
          <div class="api-keys-list">
            <div class="api-key-item">
              <div class="api-key-service">🤖 OpenAI</div>
              <div class="api-key-status">
                <span class="status-indicator ${localStorage.getItem('swissknife_openai_key') ? 'active' : 'inactive'}">
                  ${localStorage.getItem('swissknife_openai_key') ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div class="api-key-actions">
                <button class="btn-small" onclick="this.closest('.api-keys-app').querySelector('#openai-key-input').style.display='block'">
                  ${localStorage.getItem('swissknife_openai_key') ? 'Update' : 'Set'}
                </button>
                ${localStorage.getItem('swissknife_openai_key') ? '<button class="btn-small btn-danger" onclick="localStorage.removeItem(\'swissknife_openai_key\'); location.reload();">Remove</button>' : ''}
              </div>
            </div>
            
            <div class="api-key-input-group" id="openai-key-input" style="display: none;">
              <input type="password" id="openai-key" placeholder="Enter your OpenAI API key" value="${localStorage.getItem('swissknife_openai_key') || ''}">
              <button onclick="localStorage.setItem('swissknife_openai_key', document.getElementById('openai-key').value); location.reload();" class="btn-primary">Save</button>
              <button onclick="document.getElementById('openai-key-input').style.display='none'" class="btn-secondary">Cancel</button>
            </div>
            
            <div class="api-key-item">
              <div class="api-key-service">🧠 Anthropic</div>
              <div class="api-key-status">
                <span class="status-indicator inactive">Not Set</span>
              </div>
              <div class="api-key-actions">
                <button class="btn-small">Set</button>
              </div>
            </div>
            
            <div class="api-key-item">
              <div class="api-key-service">🌐 IPFS</div>
              <div class="api-key-status">
                <span class="status-indicator inactive">Not Connected</span>
              </div>
              <div class="api-key-actions">
                <button class="btn-small">Configure</button>
              </div>
            </div>
          </div>
          
          <div class="api-keys-help">
            <h3>📖 Help</h3>
            <p>• API keys are stored locally in your browser</p>
            <p>• Keys are never transmitted except to their respective services</p>
            <p>• You can remove keys at any time</p>
          </div>
        </div>
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
  
  // Utility method to dynamically load scripts
  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
  
  async loadP2PNetworkApp(contentElement: HTMLElement) {
    try {
      // Load P2P Network app script and IPFS bridge
      await Promise.all([
        this.loadScript('/js/apps/p2p-network.js'),
        this.loadScript('/js/p2p-ml-bridge-ipfs.js')
      ]);
      
      // Initialize the P2P Network app
      if ((window as any).createP2PNetworkApp) {
        const p2pApp = (window as any).createP2PNetworkApp();
        p2pApp.init(contentElement);
      } else {
        throw new Error('P2P Network app not loaded properly');
      }
    } catch (error) {
      console.error('Failed to load P2P Network app:', error);
      contentElement.innerHTML = `
        <div class="app-placeholder">
          <h2>🔗 P2P Network Manager</h2>
          <p>P2P networking functionality will be implemented here.</p>
          <div class="p2p-preview">
            <h3>Features:</h3>
            <ul>
              <li>🌐 Peer Discovery & Connection</li>
              <li>🧠 Distributed ML Computing</li>
              <li>📤 Resource Sharing</li>
              <li>🔄 Task Distribution</li>
              <li>🤝 Model Collaboration</li>
              <li>💾 IPFS Model Storage</li>
              <li>📊 Network Model Discovery</li>
            </ul>
          </div>
          <button onclick="this.closest('.window').querySelector('.window-control.close').click()">Close</button>
        </div>
      `;
    }
  }
  
  loadCronApp(contentElement: HTMLElement) {
    contentElement.innerHTML = `
      <div class="cron-app">
        <div class="cron-header">
          <h2>⏰ AI Cron Scheduler</h2>
          <p>Schedule AI-powered actions and automated tasks</p>
        </div>
        
        <div class="cron-tabs">
          <button class="cron-tab active" data-tab="active">Active Crons</button>
          <button class="cron-tab" data-tab="create">Create New</button>
          <button class="cron-tab" data-tab="history">History</button>
        </div>
        
        <div class="cron-content">
          <!-- Active Crons Tab -->
          <div class="cron-tab-content active" id="active-crons">
            <div class="cron-list" id="cron-list">
              <div class="cron-item">
                <div class="cron-icon">🤖</div>
                <div class="cron-details">
                  <div class="cron-name">Daily Code Review</div>
                  <div class="cron-schedule">Every day at 09:00</div>
                  <div class="cron-description">AI analyzes recent commits and provides suggestions</div>
                </div>
                <div class="cron-status active">Active</div>
                <div class="cron-actions">
                  <button class="btn-small">Edit</button>
                  <button class="btn-small btn-danger">Delete</button>
                </div>
              </div>
              
              <div class="cron-item">
                <div class="cron-icon">📊</div>
                <div class="cron-details">
                  <div class="cron-name">Weekly Performance Report</div>
                  <div class="cron-schedule">Fridays at 17:00</div>
                  <div class="cron-description">Generate and send performance analytics</div>
                </div>
                <div class="cron-status active">Active</div>
                <div class="cron-actions">
                  <button class="btn-small">Edit</button>
                  <button class="btn-small btn-danger">Delete</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Create New Cron Tab -->
          <div class="cron-tab-content" id="create-cron">
            <form class="cron-form" id="cron-form">
              <div class="form-group">
                <label>Cron Name</label>
                <input type="text" id="cron-name" placeholder="Enter a descriptive name" required>
              </div>
              
              <div class="form-group">
                <label>Schedule</label>
                <div class="schedule-builder">
                  <select id="schedule-type">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Cron</option>
                  </select>
                  <input type="time" id="schedule-time" value="09:00">
                  <input type="text" id="cron-expression" placeholder="0 9 * * *" style="display:none;">
                </div>
              </div>
              
              <div class="form-group">
                <label>AI Action Type</label>
                <select id="action-type">
                  <option value="analysis">Code Analysis</option>
                  <option value="summary">Generate Summary</option>
                  <option value="report">Performance Report</option>
                  <option value="backup">Automated Backup</option>
                  <option value="custom">Custom AI Prompt</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Description/Instructions</label>
                <textarea id="cron-description" rows="3" placeholder="Describe what this cron should do..."></textarea>
              </div>
              
              <div class="form-group" id="ai-prompt-group" style="display:none;">
                <label>AI Prompt</label>
                <textarea id="ai-prompt" rows="4" placeholder="Enter the AI prompt to execute..."></textarea>
              </div>
              
              <div class="form-group">
                <label>
                  <input type="checkbox" id="send-notifications"> Send notifications when executed
                </label>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn-primary">Create Cron</button>
                <button type="button" class="btn-secondary" onclick="document.getElementById('cron-form').reset()">Reset</button>
              </div>
            </form>
          </div>
          
          <!-- History Tab -->
          <div class="cron-tab-content" id="cron-history">
            <div class="history-list">
              <div class="history-item">
                <div class="history-time">2025-06-27 09:00:15</div>
                <div class="history-name">Daily Code Review</div>
                <div class="history-status success">Success</div>
                <div class="history-result">Analyzed 15 files, found 3 suggestions</div>
              </div>
              <div class="history-item">
                <div class="history-time">2025-06-26 17:00:32</div>
                <div class="history-name">Weekly Performance Report</div>
                <div class="history-status success">Success</div>
                <div class="history-result">Report generated and sent</div>
              </div>
              <div class="history-item">
                <div class="history-time">2025-06-26 09:00:12</div>
                <div class="history-name">Daily Code Review</div>
                <div class="history-status error">Error</div>
                <div class="history-result">API rate limit exceeded</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize cron app functionality
    this.initializeCronApp(contentElement);
  }
  
  initializeCronApp(contentElement: HTMLElement) {
    // Tab switching
    const tabs = contentElement.querySelectorAll('.cron-tab');
    const tabContents = contentElement.querySelectorAll('.cron-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        tabContents.forEach(content => content.classList.remove('active'));
        const targetContent = contentElement.querySelector(`#${tabName === 'active' ? 'active-crons' : tabName === 'create' ? 'create-cron' : 'cron-history'}`);
        if (targetContent) targetContent.classList.add('active');
      });
    });
    
    // Schedule type handling
    const scheduleType = contentElement.querySelector('#schedule-type') as HTMLSelectElement;
    const cronExpression = contentElement.querySelector('#cron-expression') as HTMLInputElement;
    const scheduleTime = contentElement.querySelector('#schedule-time') as HTMLInputElement;
    
    scheduleType?.addEventListener('change', () => {
      if (scheduleType.value === 'custom') {
        cronExpression.style.display = 'block';
        scheduleTime.style.display = 'none';
      } else {
        cronExpression.style.display = 'none';
        scheduleTime.style.display = 'block';
      }
    });
    
    // Action type handling
    const actionType = contentElement.querySelector('#action-type') as HTMLSelectElement;
    const aiPromptGroup = contentElement.querySelector('#ai-prompt-group') as HTMLElement;
    
    actionType?.addEventListener('change', () => {
      if (actionType.value === 'custom') {
        aiPromptGroup.style.display = 'block';
      } else {
        aiPromptGroup.style.display = 'none';
      }
    });
    
    // Form submission
    const cronForm = contentElement.querySelector('#cron-form') as HTMLFormElement;
    cronForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createNewCron(contentElement);
    });
  }
  
  createNewCron(contentElement: HTMLElement) {
    const form = contentElement.querySelector('#cron-form') as HTMLFormElement;
    
    const cronData = {
      id: Date.now().toString(),
      name: (contentElement.querySelector('#cron-name') as HTMLInputElement)?.value || '',
      scheduleType: (contentElement.querySelector('#schedule-type') as HTMLSelectElement)?.value || '',
      time: (contentElement.querySelector('#schedule-time') as HTMLInputElement)?.value || '',
      cronExpression: (contentElement.querySelector('#cron-expression') as HTMLInputElement)?.value || '',
      actionType: (contentElement.querySelector('#action-type') as HTMLSelectElement)?.value || '',
      description: (contentElement.querySelector('#cron-description') as HTMLTextAreaElement)?.value || '',
      aiPrompt: (contentElement.querySelector('#ai-prompt') as HTMLTextAreaElement)?.value || '',
      notifications: (contentElement.querySelector('#send-notifications') as HTMLInputElement)?.checked || false,
      created: new Date().toISOString(),
      lastRun: null,
      nextRun: this.calculateNextRun((contentElement.querySelector('#schedule-type') as HTMLSelectElement)?.value || '', (contentElement.querySelector('#schedule-time') as HTMLInputElement)?.value || ''),
      status: 'active'
    };
    
    // Store in localStorage for persistence
    let savedCrons = JSON.parse(localStorage.getItem('swissknife-crons') || '[]');
    savedCrons.push(cronData);
    localStorage.setItem('swissknife-crons', JSON.stringify(savedCrons));
    
    console.log('Creating new cron:', cronData);
    
    // Show success notification
    this.showNotification('AI Cron job created successfully! 🤖⏰', 'success');
    
    // Switch to active crons tab
    const activeTab = contentElement.querySelector('.cron-tab[data-tab="active"]') as HTMLElement;
    activeTab?.click();
    
    // Reset form
    form?.reset();
  }
  
  calculateNextRun(scheduleType: string, time: string): string {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours || 0, minutes || 0, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow/next occurrence
    if (nextRun <= now) {
      switch (scheduleType) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
        default:
          nextRun.setDate(nextRun.getDate() + 1);
      }
    }
    
    return nextRun.toISOString();
  }
  
  showNotification(message: string, type: string = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
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
      
      // Set up snapping state
      this.dragState.isDragging = true;
      this.dragState.draggedWindow = windowElement;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      e.preventDefault();
    });
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Check if window is currently snapped and should be unsnapped
      const windowId = windowElement.getAttribute('data-window-id') || windowElement.id;
      const windowData = this.windows.get(windowId);
      
      if (windowData && windowData.isSnapped) {
        // Unsnap the window when starting to drag
        this.unSnapWindow(windowElement);
        
        // Restore a more reasonable size for dragging
        const newWidth = Math.min(800, Math.max(400, windowData.preSnapState?.width || 600));
        const newHeight = Math.min(600, Math.max(300, windowData.preSnapState?.height || 400));
        
        // Position window under cursor
        const newLeft = e.clientX - newWidth / 2;
        const newTop = Math.max(0, e.clientY - 30); // 30px for titlebar
        
        windowElement.style.width = newWidth + 'px';
        windowElement.style.height = newHeight + 'px';
        windowElement.style.left = newLeft + 'px';
        windowElement.style.top = newTop + 'px';
        
        // Update start positions for continued dragging
        startX = e.clientX;
        startY = e.clientY;
        startLeft = newLeft;
        startTop = newTop;
        
        if (windowData) {
          windowData.x = newLeft;
          windowData.y = newTop;
          windowData.width = newWidth;
          windowData.height = newHeight;
        }
        
        return; // Don't continue with normal drag logic this frame
      }
      
      const newLeft = startLeft + deltaX;
      const newTop = Math.max(0, startTop + deltaY); // Prevent dragging above desktop
      
      windowElement.style.left = newLeft + 'px';
      windowElement.style.top = newTop + 'px';
      
      // Update window data
      if (windowData) {
        windowData.x = newLeft;
        windowData.y = newTop;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Snapping is handled by the global mouse handlers in setupWindowSnapping
    };
  }
  
  unSnapWindow(windowElement: HTMLElement) {
    // Remove snapped class
    windowElement.classList.remove('window-snapped');
    
    // Re-enable resize handles
    const resizeHandles = windowElement.querySelectorAll('.window-resize-handle');
    resizeHandles.forEach(handle => {
      (handle as HTMLElement).style.display = '';
    });
    
    // Update window data
    const windowId = windowElement.getAttribute('data-window-id');
    const windowData = windowId ? this.windows.get(windowId) : null;
    if (windowData) {
      windowData.isSnapped = false;
      windowData.snapZone = null;
    }
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
    const dateString = now.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Add timezone info
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortTimezone = timezone.split('/').pop();
    
    timeElement.innerHTML = `
      <div class="system-time-main">${timeString}</div>
      <div class="system-time-date">${dateString}</div>
      <div class="system-time-zone">${shortTimezone}</div>
    `;
  }
  
  updateSystemStatus() {
    const hwStatus = this.swissknife?.getHardwareStatus ? this.swissknife.getHardwareStatus() : {
      webnn: false,
      webgpu: !!(navigator as any).gpu
    };
    
    // Update AI status
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
      aiStatus.className = 'status-indicator ' + (hwStatus.webnn ? 'active' : 'inactive');
      aiStatus.title = `AI Engine: ${hwStatus.webnn ? 'WebNN Available' : 'API Only'}`;
    }
    
    // Update IPFS status
    const ipfsStatus = document.getElementById('ipfs-status');
    if (ipfsStatus) {
      ipfsStatus.className = 'status-indicator inactive'; // TODO: implement IPFS detection
      ipfsStatus.title = 'IPFS: Not connected';
    }
    
    // Update GPU status
    const gpuStatus = document.getElementById('gpu-status');
    if (gpuStatus) {
      gpuStatus.className = 'status-indicator ' + (hwStatus.webgpu ? 'active' : 'inactive');
      gpuStatus.title = `GPU: ${hwStatus.webgpu ? 'WebGPU Available' : 'Not available'}`;
    }
  }
  
  setupContextMenu() {
    // Basic context menu setup
  }
  
  setupWindowManagement() {
    // Set up window snapping functionality
    this.setupWindowSnapping();
    
    // Set up window drag boundaries
    this.setupDragBoundaries();
    
    // Set up snap zones
    this.createSnapZones();
  }
  
  setupWindowSnapping() {
    // Track dragging state for snapping
    this.dragState = {
      isDragging: false,
      draggedWindow: null,
      snapZones: [],
      snapThreshold: 20
    };
    
    // Listen for window drag events
    document.addEventListener('mousemove', (e) => {
      if (this.dragState.isDragging) {
        this.handleWindowDragSnapping(e);
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (this.dragState.isDragging) {
        this.handleWindowSnapRelease(e);
      }
    });
  }
  
  createSnapZones() {
    // Define snap zones for different window arrangements
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    
    const rect = desktop.getBoundingClientRect();
    const taskbarHeight = 40;
    const availableHeight = rect.height - taskbarHeight;
    
    // Calculate intelligent sizing based on screen thirds and minimum sizes
    const minWidth = 400;  // Minimum readable width
    const minHeight = 300; // Minimum readable height
    
    // Use thirds of screen for better content display
    const oneThirdWidth = Math.max(minWidth, rect.width / 3);
    const twoThirdsWidth = Math.max(minWidth * 1.5, (rect.width * 2) / 3);
    const halfWidth = Math.max(minWidth, rect.width / 2);
    const fullWidth = rect.width;
    
    const oneThirdHeight = Math.max(minHeight, availableHeight / 3);
    const halfHeight = Math.max(minHeight, availableHeight / 2);
    const twoThirdsHeight = Math.max(minHeight * 1.5, (availableHeight * 2) / 3);
    const fullHeight = availableHeight;
    
    this.dragState.snapZones = [
      // Full screen (top edge - larger trigger area)
      {
        name: 'fullscreen',
        x: 0, y: 0, width: fullWidth, height: fullHeight,
        trigger: { x: rect.width * 0.3, y: 0, width: rect.width * 0.4, height: 30 }
      },
      // Left third (left edge)
      {
        name: 'left-third',
        x: 0, y: 0, width: oneThirdWidth, height: fullHeight,
        trigger: { x: 0, y: 100, width: 30, height: availableHeight - 200 }
      },
      // Right third (right edge)
      {
        name: 'right-third',
        x: rect.width - oneThirdWidth, y: 0, width: oneThirdWidth, height: fullHeight,
        trigger: { x: rect.width - 30, y: 100, width: 30, height: availableHeight - 200 }
      },
      // Left half (left edge - center area)
      {
        name: 'left-half',
        x: 0, y: 0, width: halfWidth, height: fullHeight,
        trigger: { x: 0, y: 50, width: 20, height: availableHeight - 100 }
      },
      // Right half (right edge - center area)
      {
        name: 'right-half',
        x: halfWidth, y: 0, width: halfWidth, height: fullHeight,
        trigger: { x: rect.width - 20, y: 50, width: 20, height: availableHeight - 100 }
      },
      // Top-left quarter (corner - larger for easier targeting)
      {
        name: 'top-left-quarter',
        x: 0, y: 0, width: halfWidth, height: halfHeight,
        trigger: { x: 0, y: 0, width: 60, height: 60 }
      },
      // Top-right quarter
      {
        name: 'top-right-quarter',
        x: halfWidth, y: 0, width: halfWidth, height: halfHeight,
        trigger: { x: rect.width - 60, y: 0, width: 60, height: 60 }
      },
      // Bottom-left quarter
      {
        name: 'bottom-left-quarter',
        x: 0, y: halfHeight, width: halfWidth, height: halfHeight,
        trigger: { x: 0, y: availableHeight - 60, width: 60, height: 60 }
      },
      // Bottom-right quarter
      {
        name: 'bottom-right-quarter',
        x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight,
        trigger: { x: rect.width - 60, y: availableHeight - 60, width: 60, height: 60 }
      }
    ];
  }
      
  handleWindowDragSnapping(e: MouseEvent) {
    if (!this.dragState.draggedWindow) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Prioritize corner snaps, then edge snaps
    const cornerZones = this.dragState.snapZones.filter(zone =>
      zone.name.includes('quarter') || zone.name.includes('corner')
    );
    const edgeZones = this.dragState.snapZones.filter(zone => 
      zone.name.includes('half') || zone.name.includes('third')
    );
    const specialZones = this.dragState.snapZones.filter(zone => 
      zone.name.includes('fullscreen') || zone.name.includes('center')
    );
    
    // Check corners first (highest priority)
    let activeZone = cornerZones.find(zone => this.isInTriggerArea(mouseX, mouseY, zone.trigger));
    
    // Then check edges if no corner match
    if (!activeZone) {
      activeZone = edgeZones.find(zone => this.isInTriggerArea(mouseX, mouseY, zone.trigger));
    }
    
    // Finally check special zones
    if (!activeZone) {
      activeZone = specialZones.find(zone => this.isInTriggerArea(mouseX, mouseY, zone.trigger));
    }
    
    // Show/hide snap preview
    this.showSnapPreview(activeZone);
  }
  
  isInTriggerArea(mouseX: number, mouseY: number, trigger: any): boolean {
    return mouseX >= trigger.x && mouseX <= trigger.x + trigger.width &&
           mouseY >= trigger.y && mouseY <= trigger.y + trigger.height;
  }
  
  showSnapPreview(zone: any) {
    // Remove existing preview
    const existingPreview = document.querySelector('.snap-preview');
    if (existingPreview) {
      existingPreview.remove();
    }
    
    if (zone) {
      // Create snap preview
      const preview = document.createElement('div');
      preview.className = 'snap-preview';
      preview.style.cssText = `
        position: fixed;
        left: ${zone.x}px;
        top: ${zone.y}px;
        width: ${zone.width}px;
        height: ${zone.height}px;
        background: rgba(220, 53, 69, 0.3);
        border: 2px solid rgba(220, 53, 69, 0.8);
        pointer-events: none;
        z-index: 10000;
        border-radius: 8px;
        backdrop-filter: blur(2px);
      `;
      document.body.appendChild(preview);
      
      // Store active zone for snap release
      this.dragState.activeSnapZone = zone;
    } else {
      this.dragState.activeSnapZone = null;
    }
  }
  
  handleWindowSnapRelease(e: MouseEvent) {
    const window = this.dragState.draggedWindow;
    const zone = this.dragState.activeSnapZone;
    
    // Remove snap preview
    const preview = document.querySelector('.snap-preview');
    if (preview) {
      preview.remove();
    }
    
    // Apply snap if in zone
    if (window && zone) {
      this.snapWindowToZone(window, zone);
    }
    
    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.draggedWindow = null;
    this.dragState.activeSnapZone = null;
  }
  
  snapWindowToZone(windowElement: HTMLElement, zone: any) {
    // Animate window to snap position
    windowElement.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    windowElement.style.left = zone.x + 'px';
    windowElement.style.top = zone.y + 'px';
    windowElement.style.width = zone.width + 'px';
    windowElement.style.height = zone.height + 'px';
    
    // Add snapped class for styling
    windowElement.classList.add('window-snapped');
    
    // Disable resize handles when snapped
    const resizeHandles = windowElement.querySelectorAll('.window-resize-handle');
    resizeHandles.forEach(handle => {
      (handle as HTMLElement).style.display = 'none';
    });
    
    // Update window data
    const windowId = windowElement.getAttribute('data-window-id');
    const windowData = windowId ? this.windows.get(windowId) : null;
    if (windowData) {
      windowData.x = zone.x;
      windowData.y = zone.y;
      windowData.width = zone.width;
      windowData.height = zone.height;
      windowData.isSnapped = true;
      windowData.snapZone = zone.name;
      windowData.preSnapState = {
        x: windowData.x,
        y: windowData.y,
        width: windowData.width,
        height: windowData.height
      };
    }
    
    // Remove transition after animation
    setTimeout(() => {
      windowElement.style.transition = '';
    }, 300);
    
    console.log(`Window snapped to ${zone.name} (${zone.width}x${zone.height})`);
  }
  
  setupDragBoundaries() {
    // Ensure windows can't be dragged outside the desktop area
    // This is handled in the window creation and drag handlers
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
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing SwissKnife Web Desktop with Vite...');
  
  // Initialize shared system components
  try {
    // Dynamic import to handle potential module loading issues
    const { configManager, aiManager, eventBus, initializeDefaultProviders } = await import('../src/shared/index.js');
    
    // Initialize default AI providers
    initializeDefaultProviders({
      openai: {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        enabled: true
      },
      ollama: {
        name: 'Ollama',
        apiUrl: 'http://localhost:11434',
        models: ['llama2', 'codellama'],
        enabled: true
      }
    });
    
    // Make shared system available globally for the enhanced CLI adapter
    (window as any).swissKnifeShared = {
      configManager,
      aiManager,
      eventBus,
      initialized: true
    };
    
    console.log('✅ SwissKnife shared system initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize shared system, using fallback:', error);
    (window as any).swissKnifeShared = {
      initialized: false,
      error: error.message
    };
  }
  
  window.desktop = new SwissKnifeDesktop();
});