/**
 * Vite Entry Point for SwissKnife Web
 * 
 * This replaces the multiple script tags with a single modern entry point
 */

import './css/desktop.css'  // Import main CSS
import './css/windows.css'  // Import window management CSS
import './css/apps.css'     // Import app-specific CSS

// Simplified browser core for initial setup
class SwissKnifeBrowserCore {
  private options: any;
  
  constructor(options: any) {
    this.options = options;
  }
  
  async initialize() {
    console.log('SwissKnife Browser Core initializing...');
    // Initialization logic will be implemented as we migrate
    return Promise.resolve();
  }
}

// Type definitions for global objects
declare global {
  interface Window {
    SwissKnife: any;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('SwissKnife Web - Initializing with Vite...');
  
  try {
    // Show loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatus = document.getElementById('loading-status');
    const loadingProgress = document.getElementById('loading-progress');
    
    const updateLoadingStatus = (status: string, progress: number) => {
      if (loadingStatus) loadingStatus.textContent = status;
      if (loadingProgress) loadingProgress.style.width = `${progress}%`;
    };
    
    updateLoadingStatus('Initializing core systems...', 10);
    
    // Initialize SwissKnife core
    const swissknife = new SwissKnifeBrowserCore({
      storage: {
        type: 'indexeddb',
        dbName: 'swissknife-web'
      },
      ai: {
        autoRegisterModels: true,
        autoRegisterTools: true
      },
      config: {
        debug: true
      }
    });
    
    updateLoadingStatus('Loading AI models...', 30);
    await swissknife.initialize();
    
    updateLoadingStatus('Initializing desktop environment...', 60);
    
    // Make SwissKnife globally available
    window.SwissKnife = swissknife;
    
    // Initialize desktop components
    await initializeDesktop();
    
    updateLoadingStatus('Ready!', 100);
    
    // Hide loading screen after a brief moment
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 300);
      }
    }, 500);
    
    console.log('SwissKnife Web - Initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize SwissKnife:', error);
    
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) {
      loadingStatus.textContent = 'Failed to initialize. Check console for details.';
      loadingStatus.style.color = '#ff6b6b';
    }
  }
});

// Desktop initialization function
async function initializeDesktop() {
  // Initialize window manager
  initializeWindowManager();
  
  // Initialize desktop manager
  initializeDesktopManager();
  
  // Initialize system components
  initializeSystemComponents();
  
  // Setup event listeners
  setupEventListeners();
}

function initializeWindowManager() {
  // Basic window management functionality
  console.log('Window Manager initialized');
}

function initializeDesktopManager() {
  // Desktop icons and interaction
  const icons = document.querySelectorAll('.icon');
  icons.forEach(icon => {
    icon.addEventListener('dblclick', (e) => {
      const app = (e.currentTarget as HTMLElement).dataset.app;
      if (app) {
        openApp(app);
      }
    });
  });
  
  // System menu
  const systemMenuBtn = document.getElementById('system-menu-btn');
  const systemMenu = document.getElementById('system-menu');
  
  if (systemMenuBtn && systemMenu) {
    systemMenuBtn.addEventListener('click', () => {
      systemMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!systemMenuBtn.contains(e.target as Node) && !systemMenu.contains(e.target as Node)) {
        systemMenu.classList.add('hidden');
      }
    });
  }
}

function initializeSystemComponents() {
  // Update system time
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  
  // Initialize status indicators
  updateStatusIndicators();
}

function setupEventListeners() {
  // Context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Show context menu logic here
  });
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Handle global shortcuts
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      openApp('terminal');
    }
  });
}

function openApp(appName: string) {
  console.log(`Opening app: ${appName}`);
  // App opening logic will be implemented here
  // For now, just show a notification
  showNotification(`Opening ${appName}...`);
}

function updateSystemTime() {
  const timeElement = document.getElementById('system-time');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

function updateStatusIndicators() {
  // Update AI status
  const aiStatus = document.getElementById('ai-status');
  if (aiStatus) {
    aiStatus.title = 'AI Engine: Ready';
  }
  
  // Update IPFS status  
  const ipfsStatus = document.getElementById('ipfs-status');
  if (ipfsStatus) {
    ipfsStatus.title = 'IPFS: Connecting...';
  }
  
  // Update GPU status
  const gpuStatus = document.getElementById('gpu-status');
  if (gpuStatus) {
    if (navigator.gpu) {
      gpuStatus.title = 'WebGPU: Available';
    } else {
      gpuStatus.title = 'WebGPU: Not available';
    }
  }
}

function showNotification(message: string) {
  // Simple notification system
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-family: system-ui, sans-serif;
    font-size: 14px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Global functions that might be called from HTML
(window as any).showAbout = () => {
  showNotification('SwissKnife Web Desktop v1.0 - AI-powered development environment');
};

(window as any).openTerminalHere = () => openApp('terminal');
(window as any).createNewFile = () => showNotification('New file creation not implemented yet');
(window as any).createNewFolder = () => showNotification('New folder creation not implemented yet');
(window as any).refreshDesktop = () => location.reload();
(window as any).showDesktopProperties = () => showNotification('Desktop properties not implemented yet');