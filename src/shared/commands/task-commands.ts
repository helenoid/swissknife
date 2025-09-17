/**
 * Task Management Commands
 * 
 * Shared between CLI and virtual desktop environments
 */

import { BaseCommand, CommandContext, CommandResult, CommandOptions } from './base.js';
import { sharedCommandRegistry } from './base.js';

// Simple in-memory task store for demonstration
class TaskStore {
  private static instance: TaskStore;
  private tasks: Map<string, Task> = new Map();
  private nextId: number = 1;

  static getInstance(): TaskStore {
    if (!TaskStore.instance) {
      TaskStore.instance = new TaskStore();
    }
    return TaskStore.instance;
  }

  create(description: string, context: CommandContext): Task {
    const task: Task = {
      id: (this.nextId++).toString(),
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: context.user || 'unknown',
      environment: context.environment
    };
    
    this.tasks.set(task.id, task);
    return task;
  }

  list(context?: CommandContext): Task[] {
    const tasks = Array.from(this.tasks.values());
    
    if (context?.environment) {
      // Show tasks from all environments but mark the source
      return tasks;
    }
    
    return tasks;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates, id }; // Preserve ID
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  environment: 'cli' | 'web' | 'desktop';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

/**
 * Task command - unified task management
 */
export class TaskCommand extends BaseCommand {
  readonly name = 'task';
  readonly description = 'Manage tasks across CLI and virtual desktop';
  readonly usage = 'task <action> [options]';
  readonly aliases = ['t', 'todo'];
  readonly category = 'productivity';
  
  private taskStore = TaskStore.getInstance();

  async execute(args: string[], options: CommandOptions, context: CommandContext): Promise<CommandResult> {
    const action = args[0];
    
    if (!action) {
      return this.success(this.getHelpText());
    }

    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
      case 'new':
        return this.createTask(args.slice(1), options, context);
        
      case 'list':
      case 'ls':
      case 'show':
        return this.listTasks(args.slice(1), options, context);
        
      case 'complete':
      case 'done':
        return this.completeTask(args.slice(1), options, context);
        
      case 'delete':
      case 'remove':
      case 'rm':
        return this.deleteTask(args.slice(1), options, context);
        
      case 'status':
        return this.getStatus(args.slice(1), options, context);

      default:
        return this.error(`Unknown task action: ${action}. Use: create, list, complete, delete, status`);
    }
  }

  private createTask(args: string[], options: CommandOptions, context: CommandContext): CommandResult {
    const description = args.join(' ').trim();
    
    if (!description) {
      return this.error('Task description is required. Usage: task create <description>');
    }

    const task = this.taskStore.create(description, context);
    
    this.emit('created', { task, context });

    return this.success(
      `✅ Task created successfully!\n\n` +
      `📋 Task #${task.id}: ${task.description}\n` +
      `📍 Environment: ${task.environment}\n` +
      `👤 Created by: ${task.createdBy}\n` +
      `📅 Created: ${new Date(task.createdAt).toLocaleString()}\n\n` +
      `Use 'task list' to see all tasks or 'task complete ${task.id}' when done.`,
      { task }
    );
  }

  private listTasks(args: string[], options: CommandOptions, context: CommandContext): CommandResult {
    const tasks = this.taskStore.list(context);
    
    if (tasks.length === 0) {
      return this.success(
        `📋 No tasks found.\n\n` +
        `Create your first task with: task create "Your task description"\n` +
        `This works the same way in CLI and virtual desktop! 🚀`
      );
    }

    let output = `📋 Task List (${tasks.length} tasks)\n`;
    output += `${'='.repeat(50)}\n\n`;

    // Group by status
    const groupedTasks = tasks.reduce((groups, task) => {
      const status = task.status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(task);
      return groups;
    }, {} as Record<string, Task[]>);

    const statusEmojis = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'cancelled': '❌'
    };

    for (const [status, statusTasks] of Object.entries(groupedTasks)) {
      const emoji = statusEmojis[status as keyof typeof statusEmojis] || '📌';
      output += `${emoji} ${status.toUpperCase()} (${statusTasks.length})\n`;
      
      for (const task of statusTasks) {
        const envIcon = task.environment === 'cli' ? '💻' : 
                       task.environment === 'web' ? '🌐' : '🖥️';
        output += `  ${envIcon} #${task.id}: ${task.description}\n`;
        output += `     Created by ${task.createdBy} on ${new Date(task.createdAt).toLocaleString()}\n`;
      }
      output += '\n';
    }

    output += `💡 Commands:\n`;
    output += `   task complete <id>  - Mark task as completed\n`;
    output += `   task delete <id>    - Delete a task\n`;
    output += `   task create "..."   - Create new task\n\n`;
    output += `🌟 Works the same in CLI and virtual desktop!`;

    return this.success(output, { tasks });
  }

  private completeTask(args: string[], options: CommandOptions, context: CommandContext): CommandResult {
    const taskId = args[0];
    
    if (!taskId) {
      return this.error('Task ID is required. Usage: task complete <id>');
    }

    const task = this.taskStore.get(taskId);
    if (!task) {
      return this.error(`Task #${taskId} not found. Use 'task list' to see available tasks.`);
    }

    if (task.status === 'completed') {
      return this.success(`✅ Task #${taskId} is already completed!`);
    }

    const updatedTask = this.taskStore.update(taskId, { 
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: context.user
    });

    this.emit('completed', { task: updatedTask, context });

    return this.success(
      `🎉 Task completed!\n\n` +
      `✅ #${taskId}: ${task.description}\n` +
      `🏆 Completed by ${context.user} in ${context.environment}\n\n` +
      `Great job! 🌟`
    );
  }

  private deleteTask(args: string[], options: CommandOptions, context: CommandContext): CommandResult {
    const taskId = args[0];
    
    if (!taskId) {
      return this.error('Task ID is required. Usage: task delete <id>');
    }

    const task = this.taskStore.get(taskId);
    if (!task) {
      return this.error(`Task #${taskId} not found. Use 'task list' to see available tasks.`);
    }

    const deleted = this.taskStore.delete(taskId);
    if (!deleted) {
      return this.error(`Failed to delete task #${taskId}`);
    }

    this.emit('deleted', { task, context });

    return this.success(
      `🗑️ Task deleted successfully!\n\n` +
      `Deleted: #${taskId}: ${task.description}`
    );
  }

  private getStatus(args: string[], options: CommandOptions, context: CommandContext): CommandResult {
    const tasks = this.taskStore.list();
    
    const statusCounts = tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const envCounts = tasks.reduce((counts, task) => {
      counts[task.environment] = (counts[task.environment] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    let output = `📊 Task Management Status\n`;
    output += `${'='.repeat(30)}\n\n`;
    
    output += `📋 Total Tasks: ${tasks.length}\n\n`;
    
    output += `📈 By Status:\n`;
    output += `  ⏳ Pending: ${statusCounts.pending || 0}\n`;
    output += `  🔄 In Progress: ${statusCounts['in-progress'] || 0}\n`;
    output += `  ✅ Completed: ${statusCounts.completed || 0}\n`;
    output += `  ❌ Cancelled: ${statusCounts.cancelled || 0}\n\n`;
    
    output += `🌐 By Environment:\n`;
    output += `  💻 CLI: ${envCounts.cli || 0}\n`;
    output += `  🌐 Web: ${envCounts.web || 0}\n`;
    output += `  🖥️ Desktop: ${envCounts.desktop || 0}\n\n`;

    output += `🚀 Cross-Platform Integration:\n`;
    output += `  ✅ CLI and Virtual Desktop share the same task data\n`;
    output += `  ✅ Commands work identically in both environments\n`;
    output += `  ✅ Natural language support: "create a task for debugging"\n`;

    return this.success(output, { statusCounts, envCounts, total: tasks.length });
  }

  private getHelpText(): string {
    return `📋 Task Management - Unified CLI & Virtual Desktop

🚀 USAGE:
  task <action> [options]

📝 ACTIONS:
  create "description"  - Create a new task
  list                  - Show all tasks  
  complete <id>         - Mark task as completed
  delete <id>           - Delete a task
  status                - Show task statistics

🤖 NATURAL LANGUAGE EXAMPLES:
  "create a task for fixing the bug"
  "show me all tasks"
  "mark task 1 as completed"
  "what's my task status?"

🌟 CROSS-PLATFORM:
  Works identically in CLI and virtual desktop!
  Tasks created in CLI appear in desktop and vice versa.

💡 EXAMPLES:
  task create "Review SwissKnife documentation"
  task list
  task complete 1
  task status`;
  }

  // Override natural language parsing for better task understanding
  parseNaturalLanguage(input: string): { args: string[]; options: CommandOptions } {
    const lowerInput = input.toLowerCase();
    
    // Create task patterns
    if (lowerInput.includes('create') || lowerInput.includes('add') || lowerInput.includes('new')) {
      const match = input.match(/(?:create|add|new)\s+(?:a\s+)?(?:task\s+)?(?:for\s+)?(.+)/i);
      if (match) {
        return { args: ['create', match[1].trim()], options: {} };
      }
    }
    
    // List patterns
    if (lowerInput.includes('list') || lowerInput.includes('show') || lowerInput.includes('all')) {
      return { args: ['list'], options: {} };
    }
    
    // Complete patterns
    if (lowerInput.includes('complete') || lowerInput.includes('done') || lowerInput.includes('finish')) {
      const match = input.match(/(?:complete|done|finish)\s+(?:task\s+)?(\d+)/i);
      if (match) {
        return { args: ['complete', match[1]], options: {} };
      }
    }
    
    // Status patterns
    if (lowerInput.includes('status') || lowerInput.includes('stats') || lowerInput.includes('summary')) {
      return { args: ['status'], options: {} };
    }

    // Fall back to default parsing
    return super.parseNaturalLanguage(input);
  }
}

// Register the task command
export function registerTaskCommands(): void {
  sharedCommandRegistry.register(new TaskCommand());
}

// Auto-register when module is imported
registerTaskCommands();