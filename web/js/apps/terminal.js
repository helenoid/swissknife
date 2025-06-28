/**
 * Terminal App for SwissKnife Web Desktop
 * Provides a browser-based terminal interface to the SwissKnife toolkit
 */

export class TerminalApp {
  constructor(windowElement, swissknife) {
    this.window = windowElement;
    this.swissknife = swissknife;
    this.commandHistory = [];
    this.historyIndex = 0;
    this.currentDirectory = '/';
    
    this.init();
  }

  init() {
    this.createTerminalUI();
    this.setupEventListeners();
    this.showWelcome();
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
        <div class="terminal-content">
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
          
        case 'agent':
          await this.handleAgentCommand(args);
          break;
          
        case 'chat':
          await this.handleChatCommand(args);
          break;
          
        case 'task':
          await this.handleTaskCommand(args);
          break;
          
        case 'config':
          await this.handleConfigCommand(args);
          break;
          
        case 'models':
          await this.handleModelsCommand(args);
          break;
          
        case 'storage':
          await this.handleStorageCommand(args);
          break;
          
        case 'mcp':
          await this.handleMCPCommand(args);
          break;
          
        case 'ipfs':
          await this.handleIPFSCommand(args);
          break;
          
        case 'ai':
          await this.handleAICommand(args);
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

  async handleAgentCommand(args) {
    if (!this.swissknife.isSwissKnifeReady) {
      this.addOutput('SwissKnife core not initialized. Some features may be limited.', 'warning');
      return;
    }

    if (args.length === 0) {
      this.addOutput('Usage: agent <chat|execute> [message]');
      return;
    }

    const subcommand = args[0];
    const message = args.slice(1).join(' ');

    switch (subcommand) {
      case 'chat':
        if (!message) {
          this.addOutput('Usage: agent chat <message>');
          return;
        }
        this.addOutput('Processing...', 'info');
        const chatResult = await this.swissknife.swissknife.chat(message);
        if (chatResult.success) {
          this.addOutput(`AI: ${chatResult.response.content || chatResult.response}`, 'ai-response');
        } else {
          this.addOutput(`Error: ${chatResult.error}`, 'error');
        }
        break;
        
      case 'execute':
        if (!message) {
          this.addOutput('Usage: agent execute <task description>');
          return;
        }
        this.addOutput('Executing task...', 'info');
        const taskResult = await this.swissknife.swissknife.executeTask(message);
        if (taskResult.success) {
          this.addOutput(`Task completed: ${taskResult.result?.content || 'Done'}`, 'success');
        } else {
          this.addOutput(`Error: ${taskResult.error}`, 'error');
        }
        break;
        
      default:
        this.addOutput(`Unknown agent command: ${subcommand}`, 'error');
    }
  }

  async handleChatCommand(args) {
    const message = args.join(' ');
    if (!message) {
      this.addOutput('Usage: chat <message>');
      return;
    }
    
    await this.handleAgentCommand(['chat', ...args]);
  }

  async handleTaskCommand(args) {
    if (!this.swissknife.isSwissKnifeReady) {
      this.addOutput('SwissKnife core not initialized.', 'warning');
      return;
    }

    if (args.length === 0) {
      this.addOutput('Usage: task <list|status|create> [args]');
      return;
    }

    const subcommand = args[0];

    switch (subcommand) {
      case 'list':
        const tasks = await this.swissknife.swissknife.listTasks();
        if (tasks.length === 0) {
          this.addOutput('No tasks found.');
        } else {
          this.addOutput('Active tasks:');
          tasks.forEach(task => {
            this.addOutput(`  ${task.id}: ${task.description} (${task.status})`);
          });
        }
        break;
        
      case 'create':
        const description = args.slice(1).join(' ');
        if (!description) {
          this.addOutput('Usage: task create <description>');
          return;
        }
        const result = await this.swissknife.swissknife.executeTask(description);
        if (result.success) {
          this.addOutput(`Task created: ${result.task.id}`, 'success');
        } else {
          this.addOutput(`Error: ${result.error}`, 'error');
        }
        break;
        
      default:
        this.addOutput(`Unknown task command: ${subcommand}`, 'error');
    }
  }

  async handleConfigCommand(args) {
    if (args.length === 0) {
      const config = this.swissknife.swissknife.getConfig();
      this.addOutput('Current configuration:');
      this.addOutput(JSON.stringify(config, null, 2));
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'get':
        const key = args[1];
        if (!key) {
          this.addOutput('Usage: config get <key>');
          return;
        }
        const config = this.swissknife.swissknife.getConfig();
        const value = config[key];
        this.addOutput(`${key}: ${JSON.stringify(value)}`);
        break;
        
      case 'set':
        const setKey = args[1];
        const setValue = args.slice(2).join(' ');
        if (!setKey || setValue === undefined) {
          this.addOutput('Usage: config set <key> <value>');
          return;
        }
        await this.swissknife.swissknife.updateConfig({ [setKey]: setValue });
        this.addOutput(`Set ${setKey} = ${setValue}`, 'success');
        break;
        
      default:
        this.addOutput(`Unknown config command: ${subcommand}`, 'error');
    }
  }

  async handleModelsCommand(args) {
    const models = this.swissknife.swissknife.getAvailableModels();
    if (models.length === 0) {
      this.addOutput('No models available.');
    } else {
      this.addOutput('Available models:');
      models.forEach(model => {
        this.addOutput(`  ${model.id}: ${model.name} (${model.provider})`);
      });
    }
  }

  async handleStorageCommand(args) {
    if (args.length === 0) {
      this.addOutput('Usage: storage <store|retrieve> [args]');
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'store':
        const content = args.slice(1).join(' ');
        if (!content) {
          this.addOutput('Usage: storage store <content>');
          return;
        }
        const storeResult = await this.swissknife.swissknife.storeContent(content);
        if (storeResult.success) {
          this.addOutput(`Content stored with hash: ${storeResult.hash}`, 'success');
        } else {
          this.addOutput(`Error: ${storeResult.error}`, 'error');
        }
        break;
        
      case 'retrieve':
        const hash = args[1];
        if (!hash) {
          this.addOutput('Usage: storage retrieve <hash>');
          return;
        }
        const retrieveResult = await this.swissknife.swissknife.retrieveContent(hash);
        if (retrieveResult.success) {
          this.addOutput(`Content: ${retrieveResult.content}`);
        } else {
          this.addOutput(`Error: ${retrieveResult.error}`, 'error');
        }
        break;
        
      default:
        this.addOutput(`Unknown storage command: ${subcommand}`, 'error');
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

  async handleAICommand(args) {
    if (args.length === 0) {
      this.addOutput('AI commands:');
      this.addOutput('  ai models          - List available models');
      this.addOutput('  ai chat <message>  - Start AI chat');
      this.addOutput('  ai status          - Show AI engine status');
      return;
    }

    const subcommand = args[0];
    const params = args.slice(1);

    switch (subcommand) {
      case 'models':
        this.addOutput('Available AI models:');
        this.addOutput('  🤖 GPT-4 (OpenAI)');
        this.addOutput('  🤖 Claude-3 (Anthropic)');
        this.addOutput('  🤖 Gemini (Google)');
        this.addOutput('  🤖 Local Models (WebNN)');
        break;
      
      case 'chat':
        if (params.length === 0) {
          this.addOutput('Usage: ai chat <message>', 'error');
          return;
        }
        const message = params.join(' ');
        this.addOutput(`You: ${message}`);
        this.addOutput('AI: I\'m a simulated AI response. In the full implementation, this would connect to actual AI services.');
        break;
      
      case 'status':
        this.addOutput('AI Engine Status:');
        this.addOutput('  Status: Ready');
        this.addOutput('  Active Model: GPT-4');
        this.addOutput('  API Keys: Configured');
        this.addOutput('  WebNN: ' + (this.checkWebNN() ? 'Available' : 'Not available'));
        break;
      
      default:
        this.addOutput(`Unknown AI command: ${subcommand}`, 'error');
    }
  }

  async handleMCPCommand(args) {
    if (args.length === 0) {
      this.addOutput('MCP commands:');
      this.addOutput('  mcp list           - List MCP servers');
      this.addOutput('  mcp start <name>   - Start MCP server');
      this.addOutput('  mcp stop <name>    - Stop MCP server');
      this.addOutput('  mcp status         - Show MCP status');
      return;
    }

    const subcommand = args[0];
    const params = args.slice(1);

    switch (subcommand) {
      case 'list':
        this.addOutput('MCP Servers:');
        this.addOutput('  🔌 my-mcp-server (running)');
        this.addOutput('  🔌 my-mcp-server4 (stopped)');
        break;
      
      case 'start':
        if (params.length === 0) {
          this.addOutput('Usage: mcp start <server-name>', 'error');
          return;
        }
        this.addOutput(`Starting MCP server: ${params[0]}...`);
        setTimeout(() => {
          this.addOutput(`✅ MCP server ${params[0]} started successfully`);
        }, 1000);
        break;
      
      case 'stop':
        if (params.length === 0) {
          this.addOutput('Usage: mcp stop <server-name>', 'error');
          return;
        }
        this.addOutput(`Stopping MCP server: ${params[0]}...`);
        setTimeout(() => {
          this.addOutput(`⏹️ MCP server ${params[0]} stopped`);
        }, 500);
        break;
      
      case 'status':
        this.addOutput('MCP Status:');
        this.addOutput('  Active Servers: 1');
        this.addOutput('  Total Servers: 2');
        this.addOutput('  Health: Good');
        break;
      
      default:
        this.addOutput(`Unknown MCP command: ${subcommand}`, 'error');
    }
  }

  async handleIPFSCommand(args) {
    if (args.length === 0) {
      this.addOutput('IPFS commands:');
      this.addOutput('  ipfs add <file>    - Add file to IPFS');
      this.addOutput('  ipfs get <hash>    - Get file from IPFS');
      this.addOutput('  ipfs status        - Show IPFS status');
      this.addOutput('  ipfs peers         - List connected peers');
      return;
    }

    const subcommand = args[0];
    const params = args.slice(1);

    switch (subcommand) {
      case 'status':
        this.addOutput('IPFS Status:');
        this.addOutput('  Node ID: QmX... (simulated)');
        this.addOutput('  Peers: 42');
        this.addOutput('  Repo Size: 1.2 GB');
        this.addOutput('  Gateway: http://localhost:8080');
        break;
      
      case 'peers':
        this.addOutput('Connected IPFS peers:');
        this.addOutput('  QmY... (peer 1)');
        this.addOutput('  QmZ... (peer 2)');
        this.addOutput('  QmA... (peer 3)');
        break;
      
      case 'add':
        if (params.length === 0) {
          this.addOutput('Usage: ipfs add <file>', 'error');
          return;
        }
        this.addOutput(`Adding ${params[0]} to IPFS...`);
        setTimeout(() => {
          this.addOutput(`Added ${params[0]}: QmSimulatedHash123...`);
        }, 1000);
        break;
      
      case 'get':
        if (params.length === 0) {
          this.addOutput('Usage: ipfs get <hash>', 'error');
          return;
        }
        this.addOutput(`Retrieving ${params[0]} from IPFS...`);
        setTimeout(() => {
          this.addOutput(`✅ Retrieved and saved as ${params[0]}.data`);
        }, 1500);
        break;
      
      default:
        this.addOutput(`Unknown IPFS command: ${subcommand}`, 'error');
    }
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
}
