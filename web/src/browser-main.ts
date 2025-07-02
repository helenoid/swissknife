/**
 * Browser Main Entry Point
 * 
 * This is the main entry point for the SwissKnife browser application.
 * It initializes the desktop environment and integrates with the compiled TypeScript core.
 */

import { SwissKnifeBrowserCore } from './swissknife-browser-core';

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Browser Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Initialize SwissKnife when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('SwissKnife Browser - Initializing...');
  
  try {
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
    
    await swissknife.initialize();
    
    // Make SwissKnife globally available
    (window as any).SwissKnife = swissknife;
    
    // Initialize desktop environment
    await initializeDesktop(swissknife);
    
    console.log('SwissKnife Browser - Initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize SwissKnife:', error);
    showError('Failed to initialize SwissKnife: ' + error.message);
  }
});

async function initializeDesktop(swissknife: SwissKnifeBrowserCore) {
  // Initialize desktop icons
  initializeDesktopIcons(swissknife);
  
  // Initialize taskbar
  initializeTaskbar(swissknife);
  
  // Initialize window manager
  initializeWindowManager();
  
  // Hide loading overlay
  hideLoadingOverlay();
}

function initializeDesktopIcons(swissknife: SwissKnifeBrowserCore) {
  const icons = document.querySelectorAll('.desktop-icon');
  
  icons.forEach(icon => {
    icon.addEventListener('click', async (event) => {
      const target = event.currentTarget as HTMLElement;
      const appName = target.getAttribute('data-app');
      
      if (appName) {
        try {
          await openApplication(appName, swissknife);
        } catch (error) {
          console.error(`Failed to open application ${appName}:`, error);
          showError(`Failed to open ${appName}: ` + error.message);
        }
      }
    });
    
    // Add double-click support
    icon.addEventListener('dblclick', (event) => {
      event.preventDefault();
      icon.dispatchEvent(new Event('click'));
    });
  });
}

function initializeTaskbar(swissknife: SwissKnifeBrowserCore) {
  const startButton = document.getElementById('start-button');
  
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Show start menu or application launcher
      showStartMenu(swissknife);
    });
  }
  
  // Update status indicators
  updateStatusIndicators(swissknife);
  setInterval(() => updateStatusIndicators(swissknife), 5000);
}

function initializeWindowManager() {
  // Window management functionality
  document.addEventListener('click', (event) => {
    // Close context menus when clicking elsewhere
    const contextMenus = document.querySelectorAll('.context-menu');
    contextMenus.forEach(menu => menu.remove());
  });
  
  // Handle window dragging, resizing, etc.
  setupWindowDragging();
}

function setupWindowDragging() {
  let draggedWindow: HTMLElement | null = null;
  let dragOffset = { x: 0, y: 0 };
  
  document.addEventListener('mousedown', (event) => {
    const target = event.target as HTMLElement;
    const windowHeader = target.closest('.window-header');
    
    if (windowHeader) {
      const window = windowHeader.closest('.window') as HTMLElement;
      if (window) {
        draggedWindow = window;
        const rect = window.getBoundingClientRect();
        dragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        window.style.zIndex = '1000';
      }
    }
  });
  
  document.addEventListener('mousemove', (event) => {
    if (draggedWindow) {
      draggedWindow.style.left = (event.clientX - dragOffset.x) + 'px';
      draggedWindow.style.top = (event.clientY - dragOffset.y) + 'px';
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (draggedWindow) {
      draggedWindow.style.zIndex = '100';
      draggedWindow = null;
    }
  });
}

async function openApplication(appName: string, swissknife: SwissKnifeBrowserCore) {
  console.log(`Opening application: ${appName}`);
  
  const applications = {
    'terminal': () => openTerminal(swissknife),
    'ai-chat': () => openAIChat(swissknife),
    'file-manager': () => openFileManager(swissknife),
    'settings': () => openSettings(swissknife),
    'code-editor': () => openCodeEditor(swissknife),
    'task-manager': () => openTaskManager(swissknife),
    'model-browser': () => openModelBrowser(swissknife),
    'ipfs-explorer': () => openIPFSExplorer(swissknife),
  };
  
  const openApp = applications[appName as keyof typeof applications];
  if (openApp) {
    await openApp();
  } else {
    throw new Error(`Unknown application: ${appName}`);
  }
}

async function openTerminal(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('terminal', 'SwissKnife Terminal', 600, 400);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div id="terminal-container" style="
      font-family: 'Courier New', monospace;
      background: #1e1e1e;
      color: #ffffff;
      padding: 10px;
      height: 100%;
      overflow-y: auto;
    ">
      <div id="terminal-output"></div>
      <div style="display: flex; align-items: center;">
        <span style="color: #00ff00;">swissknife:$ </span>
        <input type="text" id="terminal-input" style="
          background: transparent;
          border: none;
          color: white;
          outline: none;
          flex: 1;
          font-family: inherit;
        " autocomplete="off">
      </div>
    </div>
  `;
  
  const input = content.querySelector('#terminal-input') as HTMLInputElement;
  const output = content.querySelector('#terminal-output') as HTMLElement;
  
  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const command = input.value.trim();
      if (command) {
        output.innerHTML += `<div style="margin: 5px 0;"><span style="color: #00ff00;">swissknife:$ </span>${command}</div>`;
        
        try {
          const result = await swissknife.executeCommand(command);
          if (result.output) {
            output.innerHTML += `<div style="margin: 5px 0; white-space: pre-wrap;">${result.output}</div>`;
          }
          if (result.error) {
            output.innerHTML += `<div style="margin: 5px 0; color: #ff6b6b;">${result.error}</div>`;
          }
        } catch (error) {
          output.innerHTML += `<div style="margin: 5px 0; color: #ff6b6b;">Error: ${error.message}</div>`;
        }
        
        input.value = '';
        output.scrollTop = output.scrollHeight;
      }
    }
  });
  
  input.focus();
}

async function openAIChat(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('ai-chat', 'AI Chat Assistant', 500, 600);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div id="chat-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 8px;
        margin-bottom: 10px;
      "></div>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="chat-input" placeholder="Ask me anything..." style="
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          outline: none;
        ">
        <button id="send-button" style="
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Send</button>
      </div>
    </div>
  `;
  
  const messages = content.querySelector('#chat-messages') as HTMLElement;
  const input = content.querySelector('#chat-input') as HTMLInputElement;
  const sendButton = content.querySelector('#send-button') as HTMLElement;
  
  const sendMessage = async () => {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    messages.innerHTML += `
      <div style="margin: 10px 0; text-align: right;">
        <div style="
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 8px 12px;
          border-radius: 12px;
          max-width: 70%;
        ">${message}</div>
      </div>
    `;
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    try {
      const response = await swissknife.generateAIResponse(message);
      
      // Add AI response
      messages.innerHTML += `
        <div style="margin: 10px 0;">
          <div style="
            display: inline-block;
            background: white;
            color: #333;
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 70%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">${response.content}</div>
        </div>
      `;
    } catch (error) {
      messages.innerHTML += `
        <div style="margin: 10px 0;">
          <div style="
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 70%;
          ">Error: ${error.message}</div>
        </div>
      `;
    }
    
    messages.scrollTop = messages.scrollHeight;
  };
  
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
  
  input.focus();
}

async function openFileManager(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('file-manager', 'File Manager', 700, 500);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div style="margin-bottom: 10px;">
        <input type="text" id="current-path" value="/" readonly style="
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f9f9f9;
        ">
      </div>
      <div id="file-list" style="
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow-y: auto;
        background: white;
      "></div>
    </div>
  `;
  
  await refreshFileList(swissknife, content);
}

async function refreshFileList(swissknife: SwissKnifeBrowserCore, container: HTMLElement) {
  const pathInput = container.querySelector('#current-path') as HTMLInputElement;
  const fileList = container.querySelector('#file-list') as HTMLElement;
  const currentPath = pathInput.value;
  
  try {
    const result = await swissknife.executeCommand(`ls ${currentPath}`);
    const files = result.output ? result.output.split('\n').filter(f => f.trim()) : [];
    
    fileList.innerHTML = files.map(file => `
      <div style="
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.2s;
      " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='white'">
        📁 ${file}
      </div>
    `).join('');
  } catch (error) {
    fileList.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Error loading directory</div>`;
  }
}

async function openSettings(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('settings', 'Settings', 600, 500);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <h3>SwissKnife Settings</h3>
      
      <div>
        <h4>Storage Settings</h4>
        <p>Storage Type: IndexedDB</p>
        <p>Available Models: ${swissknife.getAvailableModels().join(', ') || 'None configured'}</p>
      </div>
      
      <div>
        <h4>AI Settings</h4>
        <label style="display: block; margin: 10px 0;">
          <input type="checkbox" id="enable-local-models"> Enable Local Models
        </label>
        <label style="display: block; margin: 10px 0;">
          <input type="checkbox" id="enable-web-workers" checked> Use Web Workers
        </label>
      </div>
      
      <div>
        <h4>About</h4>
        <p>SwissKnife Browser Edition</p>
        <p>Version: 0.0.53</p>
        <p>Build: Webpack + TypeScript</p>
      </div>
    </div>
  `;
}

async function openCodeEditor(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('code-editor', 'VibeCode Editor', 800, 600);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div style="border-bottom: 1px solid #ddd; padding: 10px;">
        <input type="text" placeholder="Enter filename..." style="padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
        <button style="padding: 5px 10px; margin-left: 10px; background: #667eea; color: white; border: none; border-radius: 3px;">Open</button>
        <button style="padding: 5px 10px; margin-left: 5px; background: #28a745; color: white; border: none; border-radius: 3px;">Save</button>
      </div>
      <textarea style="
        flex: 1;
        border: none;
        padding: 10px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        resize: none;
        outline: none;
      " placeholder="// Start coding..."></textarea>
    </div>
  `;
}

async function openTaskManager(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('task-manager', 'Task Manager', 600, 400);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div>
      <h3>Active Tasks</h3>
      <p>No active tasks</p>
      
      <h3 style="margin-top: 20px;">System Status</h3>
      <div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
        Memory Usage: ~${Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB<br>
        Storage: IndexedDB<br>
        AI Status: ${swissknife.getAvailableModels().length > 0 ? 'Ready' : 'No models configured'}<br>
        Uptime: ${Math.floor((Date.now() - (window as any).startTime || Date.now()) / 1000)}s
      </div>
    </div>
  `;
}

async function openModelBrowser(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('model-browser', 'Model Browser', 700, 500);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  const models = swissknife.getAvailableModels();
  
  content.innerHTML = `
    <div>
      <h3>Available AI Models</h3>
      ${models.length > 0 ? 
        models.map(model => `
          <div style="
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            background: white;
          ">
            <h4>${model}</h4>
            <p>Status: Ready</p>
            <button style="
              background: #667eea;
              color: white;
              border: none;
              padding: 5px 15px;
              border-radius: 4px;
              cursor: pointer;
            ">Test Model</button>
          </div>
        `).join('') :
        '<p>No models configured. Please add AI API keys in Settings.</p>'
      }
    </div>
  `;
}

async function openIPFSExplorer(swissknife: SwissKnifeBrowserCore) {
  const window = createWindow('ipfs-explorer', 'IPFS Explorer', 700, 500);
  const content = window.querySelector('.window-content') as HTMLElement;
  
  content.innerHTML = `
    <div>
      <h3>IPFS Explorer</h3>
      <div style="margin: 20px 0;">
        <input type="text" placeholder="Enter IPFS CID..." style="
          width: 70%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        ">
        <button style="
          padding: 8px 15px;
          margin-left: 10px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
        ">Fetch</button>
      </div>
      <div style="
        border: 1px solid #ddd;
        border-radius: 4px;
        height: 300px;
        padding: 15px;
        background: #f9f9f9;
        overflow-y: auto;
      ">
        <p>IPFS functionality coming soon...</p>
      </div>
    </div>
  `;
}

function createWindow(id: string, title: string, width: number, height: number): HTMLElement {
  const window = document.createElement('div');
  window.className = 'window';
  window.id = `window-${id}`;
  window.style.cssText = `
    left: ${50 + Math.random() * 100}px;
    top: ${50 + Math.random() * 100}px;
    width: ${width}px;
    height: ${height}px;
  `;
  
  window.innerHTML = `
    <div class="window-header">
      <div class="window-title">${title}</div>
      <div class="window-controls">
        <div class="window-control minimize"></div>
        <div class="window-control maximize"></div>
        <div class="window-control close"></div>
      </div>
    </div>
    <div class="window-content"></div>
  `;
  
  // Add window controls
  const closeBtn = window.querySelector('.window-control.close');
  closeBtn?.addEventListener('click', () => {
    window.remove();
    updateTaskbar();
  });
  
  document.getElementById('desktop')?.appendChild(window);
  updateTaskbar();
  
  return window;
}

function updateTaskbar() {
  const taskbarApps = document.getElementById('taskbar-apps');
  const windows = document.querySelectorAll('.window');
  
  if (taskbarApps) {
    taskbarApps.innerHTML = Array.from(windows).map(window => {
      const title = window.querySelector('.window-title')?.textContent || 'Window';
      return `
        <div class="taskbar-app active" title="${title}">
          ${title.charAt(0)}
        </div>
      `;
    }).join('');
  }
}

function showStartMenu(swissknife: SwissKnifeBrowserCore) {
  // Simple start menu implementation
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.cssText = `
    left: 20px;
    bottom: 60px;
    width: 200px;
  `;
  
  menu.innerHTML = `
    <div class="context-menu-item">📁 File Manager</div>
    <div class="context-menu-item">💻 Terminal</div>
    <div class="context-menu-item">🤖 AI Chat</div>
    <div class="context-menu-item">⚙️ Settings</div>
  `;
  
  document.body.appendChild(menu);
  
  // Auto-close after 3 seconds
  setTimeout(() => menu.remove(), 3000);
}

function updateStatusIndicators(swissknife: SwissKnifeBrowserCore) {
  const aiStatus = document.getElementById('ai-status');
  const storageStatus = document.getElementById('storage-status');
  const networkStatus = document.getElementById('network-status');
  
  if (aiStatus) {
    aiStatus.className = `status-indicator ${swissknife.getAvailableModels().length > 0 ? 'online' : 'offline'}`;
  }
  
  if (storageStatus) {
    storageStatus.className = 'status-indicator online'; // Storage is always available
  }
  
  if (networkStatus) {
    networkStatus.className = `status-indicator ${navigator.onLine ? 'online' : 'offline'}`;
  }
}

function hideLoadingOverlay() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      loading.style.display = 'none';
    }, 500);
  }
}

function showError(message: string) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
}

// Track start time
(window as any).startTime = Date.now();
