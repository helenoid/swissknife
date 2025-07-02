/**
 * Browser Command Adapter
 * 
 * Adapts SwissKnife command system for browser environments
 * with fallbacks and browser-specific implementations
 */

export interface BrowserCommandOptions {
  enableWebWorkers?: boolean;
  maxWorkers?: number;
  allowedCommands?: string[];
  virtualFilesystem?: boolean;
  simulateShell?: boolean;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
}

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  input?: string;
  shell?: string;
}

export class BrowserCommandAdapter {
  private options: BrowserCommandOptions;
  private workers: Worker[] = [];
  private virtualFs: Map<string, any> = new Map();
  private currentDir = '/';
  private env: Record<string, string> = {
    HOME: '/home/user',
    PATH: '/bin:/usr/bin',
    PWD: '/',
    USER: 'user'
  };

  constructor(options: BrowserCommandOptions = {}) {
    this.options = {
      enableWebWorkers: true,
      maxWorkers: 4,
      virtualFilesystem: true,
      simulateShell: true,
      allowedCommands: [
        'ls', 'cat', 'echo', 'pwd', 'cd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
        'grep', 'find', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut',
        'node', 'npm', 'git', 'curl', 'wget', 'ping'
      ],
      ...options
    };
    
    this.initializeVirtualFilesystem();
  }

  private initializeVirtualFilesystem(): void {
    if (!this.options.virtualFilesystem) return;

    // Create basic directory structure
    this.virtualFs.set('/', { type: 'directory', children: ['home', 'tmp', 'bin', 'usr'] });
    this.virtualFs.set('/home', { type: 'directory', children: ['user'] });
    this.virtualFs.set('/home/user', { type: 'directory', children: [] });
    this.virtualFs.set('/tmp', { type: 'directory', children: [] });
    this.virtualFs.set('/bin', { type: 'directory', children: [] });
    this.virtualFs.set('/usr', { type: 'directory', children: ['bin'] });
    this.virtualFs.set('/usr/bin', { type: 'directory', children: [] });

    // Add some basic files
    this.virtualFs.set('/home/user/.bashrc', {
      type: 'file',
      content: '# SwissKnife Browser Shell\nexport PS1="swissknife:$ "\n'
    });
  }

  async execute(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    const startTime = Date.now();
    const cwd = options.cwd || this.currentDir;
    const env = { ...this.env, ...options.env };

    try {
      // Parse command
      const parts = this.parseCommand(command);
      const cmd = parts[0];
      const args = parts.slice(1);

      // Check if command is allowed
      if (this.options.allowedCommands && !this.options.allowedCommands.includes(cmd)) {
        return {
          success: false,
          output: '',
          error: `Command '${cmd}' not allowed in browser environment`,
          exitCode: 127,
          duration: Date.now() - startTime
        };
      }

      // Execute command
      let result: CommandResult;

      if (this.isBuiltinCommand(cmd)) {
        result = await this.executeBuiltin(cmd, args, { ...options, cwd, env });
      } else if (this.options.enableWebWorkers) {
        result = await this.executeInWorker(command, { ...options, cwd, env });
      } else {
        result = await this.simulateCommand(cmd, args, { ...options, cwd, env });
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        duration: Date.now() - startTime
      };
    }
  }

  private parseCommand(command: string): string[] {
    // Simple command parsing - in reality, this would be more sophisticated
    return command.trim().split(/\s+/);
  }

  private isBuiltinCommand(cmd: string): boolean {
    const builtins = ['cd', 'pwd', 'echo', 'ls', 'cat', 'mkdir', 'touch', 'rm', 'cp', 'mv'];
    return builtins.includes(cmd);
  }

  private async executeBuiltin(
    cmd: string, 
    args: string[], 
    options: CommandOptions & { cwd: string; env: Record<string, string> }
  ): Promise<CommandResult> {
    switch (cmd) {
      case 'pwd':
        return this.executePwd();
      
      case 'cd':
        return this.executeCd(args[0] || '/');
      
      case 'ls':
        return this.executeLs(args, options.cwd);
      
      case 'echo':
        return this.executeEcho(args);
      
      case 'cat':
        return this.executeCat(args, options.cwd);
      
      case 'mkdir':
        return this.executeMkdir(args, options.cwd);
      
      case 'touch':
        return this.executeTouch(args, options.cwd);
      
      case 'rm':
        return this.executeRm(args, options.cwd);
      
      case 'cp':
        return this.executeCp(args, options.cwd);
      
      case 'mv':
        return this.executeMv(args, options.cwd);
      
      default:
        return {
          success: false,
          output: '',
          error: `Builtin command '${cmd}' not implemented`,
          exitCode: 127,
          duration: 0
        };
    }
  }

  private executePwd(): CommandResult {
    return {
      success: true,
      output: this.currentDir,
      exitCode: 0,
      duration: 0
    };
  }

  private executeCd(path: string): CommandResult {
    const resolvedPath = this.resolvePath(path);
    
    if (!this.virtualFs.has(resolvedPath)) {
      return {
        success: false,
        output: '',
        error: `cd: ${path}: No such file or directory`,
        exitCode: 1,
        duration: 0
      };
    }

    const entry = this.virtualFs.get(resolvedPath);
    if (entry?.type !== 'directory') {
      return {
        success: false,
        output: '',
        error: `cd: ${path}: Not a directory`,
        exitCode: 1,
        duration: 0
      };
    }

    this.currentDir = resolvedPath;
    this.env.PWD = resolvedPath;
    
    return {
      success: true,
      output: '',
      exitCode: 0,
      duration: 0
    };
  }

  private executeLs(args: string[], cwd: string): CommandResult {
    const path = args[0] ? this.resolvePath(args[0], cwd) : cwd;
    
    if (!this.virtualFs.has(path)) {
      return {
        success: false,
        output: '',
        error: `ls: ${args[0] || '.'}: No such file or directory`,
        exitCode: 1,
        duration: 0
      };
    }

    const entry = this.virtualFs.get(path);
    if (entry?.type === 'file') {
      return {
        success: true,
        output: path.split('/').pop() || '',
        exitCode: 0,
        duration: 0
      };
    }

    if (entry?.type === 'directory') {
      const children = entry.children || [];
      return {
        success: true,
        output: children.join('\n'),
        exitCode: 0,
        duration: 0
      };
    }

    return {
      success: false,
      output: '',
      error: `ls: ${path}: Invalid file type`,
      exitCode: 1,
      duration: 0
    };
  }

  private executeEcho(args: string[]): CommandResult {
    return {
      success: true,
      output: args.join(' '),
      exitCode: 0,
      duration: 0
    };
  }

  private executeCat(args: string[], cwd: string): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'cat: missing file operand',
        exitCode: 1,
        duration: 0
      };
    }

    const results: string[] = [];
    for (const arg of args) {
      const path = this.resolvePath(arg, cwd);
      
      if (!this.virtualFs.has(path)) {
        return {
          success: false,
          output: '',
          error: `cat: ${arg}: No such file or directory`,
          exitCode: 1,
          duration: 0
        };
      }

      const entry = this.virtualFs.get(path);
      if (entry?.type !== 'file') {
        return {
          success: false,
          output: '',
          error: `cat: ${arg}: Is a directory`,
          exitCode: 1,
          duration: 0
        };
      }

      results.push(entry.content || '');
    }

    return {
      success: true,
      output: results.join(''),
      exitCode: 0,
      duration: 0
    };
  }

  private executeMkdir(args: string[], cwd: string): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'mkdir: missing operand',
        exitCode: 1,
        duration: 0
      };
    }

    for (const arg of args) {
      const path = this.resolvePath(arg, cwd);
      
      if (this.virtualFs.has(path)) {
        return {
          success: false,
          output: '',
          error: `mkdir: cannot create directory '${arg}': File exists`,
          exitCode: 1,
          duration: 0
        };
      }

      // Create directory
      this.virtualFs.set(path, { type: 'directory', children: [] });
      
      // Update parent directory
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const dirName = path.split('/').pop();
      const parent = this.virtualFs.get(parentPath);
      
      if (parent && parent.type === 'directory' && dirName) {
        parent.children = parent.children || [];
        if (!parent.children.includes(dirName)) {
          parent.children.push(dirName);
        }
      }
    }

    return {
      success: true,
      output: '',
      exitCode: 0,
      duration: 0
    };
  }

  private executeTouch(args: string[], cwd: string): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'touch: missing file operand',
        exitCode: 1,
        duration: 0
      };
    }

    for (const arg of args) {
      const path = this.resolvePath(arg, cwd);
      
      if (!this.virtualFs.has(path)) {
        // Create file
        this.virtualFs.set(path, { type: 'file', content: '' });
        
        // Update parent directory
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const fileName = path.split('/').pop();
        const parent = this.virtualFs.get(parentPath);
        
        if (parent && parent.type === 'directory' && fileName) {
          parent.children = parent.children || [];
          if (!parent.children.includes(fileName)) {
            parent.children.push(fileName);
          }
        }
      }
      // If file exists, we would update timestamp, but we'll skip that for simplicity
    }

    return {
      success: true,
      output: '',
      exitCode: 0,
      duration: 0
    };
  }

  private executeRm(args: string[], cwd: string): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        output: '',
        error: 'rm: missing operand',
        exitCode: 1,
        duration: 0
      };
    }

    for (const arg of args) {
      const path = this.resolvePath(arg, cwd);
      
      if (!this.virtualFs.has(path)) {
        return {
          success: false,
          output: '',
          error: `rm: cannot remove '${arg}': No such file or directory`,
          exitCode: 1,
          duration: 0
        };
      }

      // Remove from filesystem
      this.virtualFs.delete(path);
      
      // Update parent directory
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const itemName = path.split('/').pop();
      const parent = this.virtualFs.get(parentPath);
      
      if (parent && parent.type === 'directory' && itemName) {
        parent.children = (parent.children || []).filter(child => child !== itemName);
      }
    }

    return {
      success: true,
      output: '',
      exitCode: 0,
      duration: 0
    };
  }

  private executeCp(args: string[], cwd: string): CommandResult {
    if (args.length < 2) {
      return {
        success: false,
        output: '',
        error: 'cp: missing destination file operand',
        exitCode: 1,
        duration: 0
      };
    }

    const sourcePath = this.resolvePath(args[0], cwd);
    const destPath = this.resolvePath(args[1], cwd);
    
    if (!this.virtualFs.has(sourcePath)) {
      return {
        success: false,
        output: '',
        error: `cp: cannot stat '${args[0]}': No such file or directory`,
        exitCode: 1,
        duration: 0
      };
    }

    const sourceEntry = this.virtualFs.get(sourcePath);
    if (sourceEntry) {
      this.virtualFs.set(destPath, { ...sourceEntry });
      
      // Update parent directory for destination
      const parentPath = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
      const fileName = destPath.split('/').pop();
      const parent = this.virtualFs.get(parentPath);
      
      if (parent && parent.type === 'directory' && fileName) {
        parent.children = parent.children || [];
        if (!parent.children.includes(fileName)) {
          parent.children.push(fileName);
        }
      }
    }

    return {
      success: true,
      output: '',
      exitCode: 0,
      duration: 0
    };
  }

  private executeMv(args: string[], cwd: string): CommandResult {
    if (args.length < 2) {
      return {
        success: false,
        output: '',
        error: 'mv: missing destination file operand',
        exitCode: 1,
        duration: 0
      };
    }

    // Copy then remove
    const cpResult = this.executeCp(args, cwd);
    if (!cpResult.success) {
      return cpResult;
    }

    const rmResult = this.executeRm([args[0]], cwd);
    return rmResult;
  }

  private async executeInWorker(
    command: string, 
    options: CommandOptions & { cwd: string; env: Record<string, string> }
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
          const { command, options } = e.data;
          
          // Simulate command execution in worker
          setTimeout(() => {
            self.postMessage({
              success: true,
              output: "Simulated output from worker for: " + command,
              exitCode: 0,
              duration: 0
            });
          }, 100 + Math.random() * 500);
        };
      `], { type: 'application/javascript' })));

      worker.onmessage = (e) => {
        worker.terminate();
        resolve(e.data);
      };

      worker.onerror = () => {
        worker.terminate();
        resolve({
          success: false,
          output: '',
          error: 'Worker execution failed',
          exitCode: 1,
          duration: 0
        });
      };

      worker.postMessage({ command, options });
    });
  }

  private async simulateCommand(
    cmd: string, 
    args: string[], 
    options: CommandOptions & { cwd: string; env: Record<string, string> }
  ): Promise<CommandResult> {
    // Simulate common commands
    switch (cmd) {
      case 'node':
        return {
          success: true,
          output: 'v18.0.0 (simulated)',
          exitCode: 0,
          duration: 0
        };
      
      case 'npm':
        if (args[0] === 'version') {
          return {
            success: true,
            output: '9.0.0 (simulated)',
            exitCode: 0,
            duration: 0
          };
        }
        return {
          success: true,
          output: `npm ${args.join(' ')} - simulated`,
          exitCode: 0,
          duration: 0
        };
      
      case 'git':
        return {
          success: true,
          output: `git ${args.join(' ')} - simulated`,
          exitCode: 0,
          duration: 0
        };
      
      default:
        return {
          success: false,
          output: '',
          error: `${cmd}: command not found`,
          exitCode: 127,
          duration: 0
        };
    }
  }

  private resolvePath(path: string, cwd?: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    
    const base = cwd || this.currentDir;
    if (path === '.') {
      return base;
    }
    
    if (path === '..') {
      return base.substring(0, base.lastIndexOf('/')) || '/';
    }
    
    return `${base}/${path}`.replace(/\/+/g, '/');
  }

  getCurrentDirectory(): string {
    return this.currentDir;
  }

  getEnvironment(): Record<string, string> {
    return { ...this.env };
  }

  setEnvironmentVariable(key: string, value: string): void {
    this.env[key] = value;
  }

  getVirtualFilesystem(): Map<string, any> {
    return new Map(this.virtualFs);
  }

  async dispose(): Promise<void> {
    // Terminate any active workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.virtualFs.clear();
  }
}
