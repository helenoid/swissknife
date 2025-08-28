/**
 * Terminal App for SwissKnife Web Desktop
 * Enhanced with shared system integration
 */

import { sharedCLI } from '../../src/shared/cli/index.js';
import { eventBus } from '../../src/shared/events/index.js';
import { configManager } from '../../src/shared/config/index.js';

export class TerminalApp {
  constructor(windowElement, swissknife) {
    this.window = windowElement;
    this.swissknife = swissknife;
    this.commandHistory = [];
    this.historyIndex = 0;
    this.currentDirectory = '/';
    
    // Use the shared CLI adapter for unified command execution
    this.cliAdapter = sharedCLI;
    
    this.init();
    this.setupSharedSystemIntegration();
  }

  init() {
    this.createTerminalUI();
    this.setupEventListeners();
    this.showWelcome();
  }

  setupSharedSystemIntegration() {
    // Listen for CLI responses from the shared system
    eventBus.on('cli:response', (response) => {
      if (response.output) {
        const type = response.exitCode === 0 ? 'normal' : 'error';
        this.addOutput(response.output, type);
      }
    });

    // Listen for configuration updates
    eventBus.on('config:update', (data) => {
      this.addOutput(`Configuration updated: ${data.component}`, 'info');
    });

    // Listen for system status updates
    eventBus.on('system:status', (data) => {
      this.addOutput(`System ${data.component}: ${data.status}`, 'info');
    });

    // Listen for desktop app events
    eventBus.on('web:app-launch', (data) => {
      this.addOutput(`Launched desktop app: ${data.appId}`, 'success');
    });

    eventBus.on('web:app-close', (data) => {
      this.addOutput(`Closed desktop app: ${data.appId}`, 'info');
    });
  }

  createTerminalUI() {
    this.window.innerHTML = `
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="terminal-title">SwissKnife Terminal</div>
          <div class="terminal-controls">
            <button class="btn-minimize">-</button>
            <button class="btn-maximize">□</button>
            <button class="btn-close">×</button>
          </div>
        </div>
        <div class="terminal-body">
          <div class="terminal-output" id="terminal-output"></div>
          <div class="terminal-input-line">
            <span class="terminal-prompt">swissknife@web:${this.currentDirectory}$ </span>
            <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false">
          </div>
        </div>
      </div>
    `;

    this.output = this.window.querySelector('#terminal-output');
    this.input = this.window.querySelector('#terminal-input');
    this.input.focus();
  }

  setupEventListeners() {
    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Window controls
    this.window.querySelector('.btn-close').addEventListener('click', () => {
      this.window.remove();
    });
    
    this.window.querySelector('.btn-minimize').addEventListener('click', () => {
      this.window.style.display = 'none';
    });
  }

  handleKeyDown(event) {
    if (event.key === 'Enter') {
      this.executeCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.handleTabCompletion();
    }
  }

  async executeCommand() {
    const command = this.input.value.trim();
    if (!command) return;

    // Add to history
    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;

    // Show command in output
    this.addOutput(`swissknife@web:${this.currentDirectory}$ ${command}`, 'command');

    // Clear input
    this.input.value = '';

    // Execute command
    await this.processCommand(command);
  }

  async processCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      // First try the shared CLI adapter for all SwissKnife commands
      if (cmd.startsWith('sk-') || ['sk', 'ai', 'chat', 'task', 'config', 'models', 'storage', 'mcp', 'ipfs'].includes(cmd)) {
        const result = await this.cliAdapter.executeCommand(command);
        if (result.success) {
          this.addOutput(result.output, 'normal');
          if (result.data) {
            console.log('Command data:', result.data);
          }
        } else {
          this.addOutput(result.output, 'error');
        }
        return;
      }

      // Process built-in terminal commands
      switch (cmd) {
        case 'help':
          this.showHelp();
          break;
          
        case 'clear':
          this.clearTerminal();
          break;
          
        case 'echo':
          this.addOutput(args.join(' '));
          break;
          
        case 'pwd':
          this.addOutput(this.currentDirectory);
          break;
          
        case 'ls':
          await this.listFiles(args);
          break;
          
        case 'cd':
          this.changeDirectory(args[0] || '/');
          break;
          
        case 'mkdir':
          await this.makeDirectory(args[0]);
          break;
          
        case 'touch':
          await this.createFile(args[0]);
          break;
          
        case 'cat':
          await this.displayFile(args[0]);
          break;
          
        case 'date':
          this.addOutput(new Date().toString());
          break;
          
        case 'whoami':
          this.addOutput('swissknife-user');
          break;
          
        case 'uname':
          this.addOutput('SwissKnife Web Desktop v1.0');
          break;
          
        case 'ps':
          this.showProcesses();
          break;
          
        case 'env':
          this.showEnvironment();
          break;
          
        case 'history':
          this.showCommandHistory();
          break;
          
        case 'code':
          this.openVibeCode(args[0]);
          break;
          
        case 'status':
          this.showStatus();
          break;
          
        default:
          this.addOutput(`Command not found: ${cmd}. Type 'help' for available commands.`, 'error');
      }
    } catch (error) {
      this.addOutput(`Error: ${error.message}`, 'error');
    }
  }

  // Enhanced file system operations
  async listFiles(args) {
    const flags = args.filter(a => a.startsWith('-'));
    const path = args.find(a => !a.startsWith('-')) || this.currentDirectory;
    
    // Simulate file listing
    const files = [
      { name: 'config.json', type: 'file', size: '1.2K', modified: '2025-06-27' },
      { name: 'projects', type: 'directory', size: '-', modified: '2025-06-26' },
      { name: 'README.md', type: 'file', size: '3.4K', modified: '2025-06-25' },
      { name: 'scripts', type: 'directory', size: '-', modified: '2025-06-24' },
      { name: 'data.json', type: 'file', size: '856B', modified: '2025-06-23' }
    ];
    
    if (flags.includes('-l')) {
      this.addOutput('total 5');
      files.forEach(file => {
        const perms = file.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
        const icon = file.type === 'directory' ? '📁' : '📄';
        this.addOutput(`${perms} 1 user user ${file.size.padStart(6)} ${file.modified} ${icon} ${file.name}`);
      });
    } else {
      const output = files.map(f => {
        const icon = f.type === 'directory' ? '📁' : '📄';
        return `${icon} ${f.name}`;
      }).join('  ');
      this.addOutput(output);
    }
  }

  changeDirectory(path) {
    if (!path || path === '~') {
      this.currentDirectory = '/home/swissknife';
    } else if (path === '/') {
      this.currentDirectory = '/';
    } else if (path === '..') {
      const parts = this.currentDirectory.split('/').filter(p => p);
      parts.pop();
      this.currentDirectory = '/' + parts.join('/');
    } else if (path.startsWith('/')) {
      this.currentDirectory = path;
    } else {
      this.currentDirectory = this.currentDirectory === '/' ? 
        '/' + path : this.currentDirectory + '/' + path;
    }
    
    // Update prompt
    const prompt = this.window.querySelector('.terminal-input-line .terminal-prompt');
    if (prompt) {
      prompt.textContent = `swissknife@web:${this.currentDirectory}$ `;
    }
    
    this.addOutput(`Changed directory to: ${this.currentDirectory}`);
  }

  async makeDirectory(name) {
    if (!name) {
      this.addOutput('mkdir: missing operand', 'error');
      return;
    }
    
    // Simulate directory creation
    this.addOutput(`Created directory: ${name}`);
  }

  async createFile(name) {
    if (!name) {
      this.addOutput('touch: missing file operand', 'error');
      return;
    }
    
    // Simulate file creation
    this.addOutput(`Created file: ${name}`);
  }

  async displayFile(name) {
    if (!name) {
      this.addOutput('cat: missing file operand', 'error');
      return;
    }
    
    // Simulate file content display
    const sampleContent = {
      'config.json': '{\n  "theme": "dark",\n  "language": "en",\n  "ai_provider": "openai"\n}',
      'README.md': '# SwissKnife Web Desktop\n\nA browser-based development environment.\n\n## Features\n- AI Chat\n- File Management\n- Terminal Access',
      'data.json': '{\n  "version": "1.0.0",\n  "timestamp": "2025-06-27T10:30:00Z"\n}'
    };
    
    const content = sampleContent[name] || `Content of ${name}:\nThis is a sample file in the SwissKnife Web Desktop.`;
    this.addOutput(content);
  }

  showProcesses() {
    this.addOutput('PID   COMMAND');
    this.addOutput('1     SwissKnife Desktop Manager');
    this.addOutput('2     Window Manager');
    this.addOutput('3     AI Engine');
    this.addOutput('4     Storage Engine');
    this.addOutput('5     Terminal App');
    if (window.desktop && window.desktop.windows) {
      Object.keys(window.desktop.windows).forEach((id, index) => {
        const window = window.desktop.windows[id];
        this.addOutput(`${6 + index}     ${window.title || 'Unknown App'}`);
      });
    }
  }

  showEnvironment() {
    const env = {
      'USER': 'swissknife-user',
      'HOME': '/home/swissknife',
      'PATH': '/usr/local/bin:/usr/bin:/bin',
      'PWD': this.currentDirectory,
      'SHELL': '/bin/swissknife-shell',
      'LANG': 'en_US.UTF-8',
      'SWISSKNIFE_VERSION': '1.0.0',
      'WEBGL_VERSION': this.getWebGLVersion(),
      'BROWSER': navigator.userAgent.split(' ')[0]
    };
    
    Object.entries(env).forEach(([key, value]) => {
      this.addOutput(`${key}=${value}`);
    });
  }

  getWebGLVersion() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl ? (canvas.getContext('webgl2') ? 'WebGL 2.0' : 'WebGL 1.0') : 'Not supported';
  }

  showCommandHistory() {
    this.commandHistory.forEach((cmd, index) => {
      this.addOutput(`${index + 1}  ${cmd}`);
    });
  }

  openVibeCode(file) {
    if (window.desktop && window.desktop.openApp) {
      window.desktop.openApp('vibecode', file ? { file } : {});
      this.addOutput(`Opening ${file || 'VibeCode'}...`);
    } else {
      this.addOutput('VibeCode integration not available', 'error');
    }
  }

  checkWebNN() {
    return 'ml' in navigator || 'webnn' in window;
  }

  showWelcome() {
    this.addOutput('🔧 SwissKnife Web Terminal v1.0 - Enhanced with Shared System', 'welcome');
    this.addOutput('Type "help" for available commands or use the new unified SwissKnife CLI:', 'info');
    this.addOutput('', '');
    this.addOutput('✨ New Unified Commands:', 'category');
    this.addOutput('  sk-ai inference "Hello World"    - AI inference with shared providers');
    this.addOutput('  sk-config get ai.defaultModel    - Get configuration values');
    this.addOutput('  sk-events list                   - List active cross-component events');
    this.addOutput('  sk-desktop launch ai-chat        - Launch desktop applications');
    this.addOutput('  sk-ipfs status                   - Check IPFS acceleration status');
    this.addOutput('  sk-status                        - Unified system status');
    this.addOutput('', '');
  }

  showHelp() {
    this.addOutput('Available commands:', 'help');
    this.addOutput('', '');
    this.addOutput('System Commands:', 'category');
    this.addOutput('  help           - Show this help message');
    this.addOutput('  clear          - Clear the terminal');
    this.addOutput('  echo <text>    - Display text');
    this.addOutput('  pwd            - Show current directory');
    this.addOutput('  ls [flags]     - List files and directories');
    this.addOutput('  cd <dir>       - Change directory');
    this.addOutput('  mkdir <name>   - Create directory');
    this.addOutput('  touch <name>   - Create file');
    this.addOutput('  cat <file>     - Display file contents');
    this.addOutput('  date           - Show current date');
    this.addOutput('  whoami         - Show current user');
    this.addOutput('  uname          - Show system information');
    this.addOutput('  ps             - Show running processes');
    this.addOutput('  env            - Show environment variables');
    this.addOutput('  history        - Show command history');
    this.addOutput('', '');
    this.addOutput('Unified SwissKnife Commands (Shared System):', 'category');
    this.addOutput('  sk-ai inference <prompt>    - AI inference with shared providers');
    this.addOutput('  sk-ai models               - List all available AI models');
    this.addOutput('  sk-ai providers            - List AI providers');
    this.addOutput('  sk-config get [key]        - Get configuration (try: sk-config get ai.defaultModel)');
    this.addOutput('  sk-config set <key> <val>  - Set configuration value');
    this.addOutput('  sk-config reset            - Reset to default configuration');
    this.addOutput('  sk-events emit <event>     - Emit cross-component events');
    this.addOutput('  sk-events list             - List active event listeners');
    this.addOutput('  sk-desktop launch <app>    - Launch desktop applications');
    this.addOutput('  sk-desktop close <app>     - Close desktop applications');
    this.addOutput('  sk-desktop list            - List available desktop apps');
    this.addOutput('  sk-ipfs status             - Check IPFS system status');
    this.addOutput('  sk-ipfs add <file>         - Add file to IPFS');
    this.addOutput('  sk-status [component]      - Unified system status');
    this.addOutput('', '');
    this.addOutput('Try these examples:', 'info');
    this.addOutput('  sk-ai inference "What is SwissKnife?"');
    this.addOutput('  sk-desktop launch ai-chat');
    this.addOutput('  sk-config get');
    this.addOutput('  sk-events list');
  }

  clearTerminal() {
    this.output.innerHTML = '';
  }

  addOutput(text, type = 'normal') {
    const line = document.createElement('div');
    line.className = `terminal-line terminal-${type}`;
    
    // Handle different output types with appropriate styling
    switch (type) {
      case 'command':
        line.innerHTML = `<span class="terminal-prompt-echo">${text}</span>`;
        break;
      case 'error':
        line.innerHTML = `<span class="terminal-error">❌ ${text}</span>`;
        break;
      case 'warning':
        line.innerHTML = `<span class="terminal-warning">⚠️ ${text}</span>`;
        break;
      case 'success':
        line.innerHTML = `<span class="terminal-success">✅ ${text}</span>`;
        break;
      case 'info':
        line.innerHTML = `<span class="terminal-info">ℹ️ ${text}</span>`;
        break;
      case 'welcome':
        line.innerHTML = `<span class="terminal-welcome">${text}</span>`;
        break;
      case 'help':
        line.innerHTML = `<span class="terminal-help">${text}</span>`;
        break;
      case 'category':
        line.innerHTML = `<span class="terminal-category">📁 ${text}</span>`;
        break;
      case 'ai-response':
        line.innerHTML = `<span class="terminal-ai">🤖 ${text}</span>`;
        break;
      default:
        line.textContent = text;
    }
    
    this.output.appendChild(line);
    
    // Auto-scroll to bottom
    requestAnimationFrame(() => {
      this.output.scrollTop = this.output.scrollHeight;
    });
  }

  showStatus() {
    this.addOutput('SwissKnife System Status:', 'info');
    this.addOutput('', '');
    this.addOutput(`🖥️ Platform: ${navigator.platform}`);
    this.addOutput(`🌐 Browser: ${navigator.userAgent.split(' ')[0]}`);
    this.addOutput(`🔧 SwissKnife: ${this.swissknife.isSwissKnifeReady ? 'Ready' : 'Initializing'}`);
    this.addOutput(`📁 Directory: ${this.currentDirectory}`);
    this.addOutput(`🕒 Uptime: ${this.getUptime()}`);
    this.addOutput(`💾 Memory: ${this.getMemoryUsage()}`);
    this.addOutput(`🎯 WebGL: ${this.getWebGLVersion()}`);
    this.addOutput(`🤖 AI: ${this.swissknife.isSwissKnifeReady ? 'Available' : 'Loading'}`);
  }

  getUptime() {
    const startTime = window.desktopStartTime || Date.now();
    const uptime = Date.now() - startTime;
    const minutes = Math.floor(uptime / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  getMemoryUsage() {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      return `${used}MB / ${total}MB`;
    }
    return 'Not available';
  }

  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex = Math.max(0, Math.min(this.commandHistory.length, this.historyIndex + direction));
    
    if (this.historyIndex === this.commandHistory.length) {
      this.input.value = '';
    } else {
      this.input.value = this.commandHistory[this.historyIndex];
    }
  }

  handleTabCompletion() {
    const currentInput = this.input.value;
    const parts = currentInput.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Enhanced command completion with SwissKnife commands
    const commands = [
      'help', 'clear', 'echo', 'pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat',
      'date', 'whoami', 'uname', 'ps', 'env', 'history', 'code', 'status',
      // SwissKnife commands
      'sk', 'sk-ai', 'sk-task', 'sk-config', 'sk-models', 'sk-storage', 'sk-mcp', 'sk-ipfs',
      // Legacy commands  
      'ai', 'chat', 'task', 'config', 'models', 'storage', 'mcp', 'ipfs'
    ];
    
    if (parts.length === 1) {
      const matches = commands.filter(cmd => cmd.startsWith(lastPart));
      if (matches.length === 1) {
        this.input.value = matches[0];
      } else if (matches.length > 1) {
        this.addOutput(`Possible completions: ${matches.join(', ')}`);
      }
    }
  }
}
