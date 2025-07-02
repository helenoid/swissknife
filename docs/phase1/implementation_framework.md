# Phase 1 Implementation Details

This document provides comprehensive implementation details for Phase 1 of the SwissKnife integration project, focusing on the core architecture and implementation approach.

## Table of Contents
1. [Integration Overview](#integration-overview)
2. [Architectural Principles](#architectural-principles)
3. [Phase 1 Core Components](#phase-1-core-components)
   - [Command System Architecture](#command-system-architecture)
   - [Configuration System](#configuration-system)
   - [Integration Framework](#integration-framework)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Testing Strategy](#testing-strategy)
6. [Dependency Management](#dependency-management)

## Integration Overview

Phase 1 establishes the foundational architecture for integrating these components:

1. **SwissKnife Core**: TypeScript/React CLI interface for AI models
2. **Clean Room TypeScript Implementations**: Independent TypeScript implementations of AI capabilities following clean room methodology
3. **IPFS Accelerate JS**: JavaScript SDK for hardware-accelerated ML and IPFS optimization
4. **SwissKnife Legacy**: Previous implementation with TaskNet functionality

The goal is to create a unified architecture while maintaining separation of concerns and ensuring extensibility.

## Architectural Principles

The integration follows these key architectural principles:

### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│               UI Layer                  │
│  (React/Ink Components, Terminal UI)    │
├─────────────────────────────────────────┤
│             Command Layer               │
│      (Command Definitions & Handlers)   │
├─────────────────────────────────────────┤
│             Service Layer               │
│  (Model Providers, Storage, Tasks, etc) │
├──────────────┬────────────┬─────────────┤
│ Integration  │ Integration │Integration │
│   Bridge     │   Bridge    │  Bridge    │
│  (Current)   │  (Clean TS) │  (IPFS)    │
├──────────────┼────────────┼─────────────┤
│   Current    │   Clean    │    IPFS     │
│  SwissKnife  │TypeScript  │ Accelerate  │
└──────────────┴────────────┴─────────────┘
```

### 2. Integration Bridges

Each component system will be connected through integration bridges that provide:
- Consistent interfaces for cross-component communication
- Initialization and lifecycle management
- Error handling and fallback mechanisms
- Status reporting and monitoring

### 3. Command-Centric Design

All functionality will be exposed through a consistent command-line interface:
- Command registry for centralized registration
- Hierarchical command structure with subcommands
- Consistent option parsing and validation
- Comprehensive help documentation

### 4. Configuration Unification

Configuration will be unified across components:
- JSON-based configuration with schema validation
- Migration paths from legacy TOML configurations
- Hierarchical configuration with inheritance
- Per-component configuration sections

## Phase 1 Core Components

### Command System Architecture

The command system forms the backbone of the CLI interface, providing a robust mechanism for registering, discovering, and executing commands.

#### Key Components

1. **Command Registry**
   - Centralized registration of commands
   - Command validation and discovery
   - Subcommand organization

2. **Command Parser**
   - Command-line argument parsing
   - Option validation
   - Command path resolution

3. **Command Execution Context**
   - Shared execution environment
   - Resource access (config, logging, etc.)
   - State management during execution

4. **Help Generator**
   - Consistent help text formatting
   - Command and option documentation
   - Example generation

#### Implementation Approach

The command system will be implemented using a registry pattern with a singleton instance:

```typescript
// Command interface
export interface Command {
  id: string;            // Unique identifier
  name: string;          // Display name
  description: string;   // Short description
  subcommands?: Command[]; // Nested commands
  options?: CommandOption[]; // Command options
  handler: (args: any, context: ExecutionContext) => Promise<number>;
}

// Command registry
export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, Command> = new Map();
  
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }
  
  registerCommand(command: Command): void {
    // Validate and register command
  }
  
  getCommand(id: string): Command | undefined {
    // Retrieve command by ID
  }
  
  executeCommand(id: string, args: any, context: ExecutionContext): Promise<number> {
    // Execute command handler
  }
}
```

#### Core Commands Implementation

Phase 1 will implement these essential commands:

1. **Help Command**: Display help information for commands
2. **Version Command**: Display version information
3. **Config Command**: Manage configuration
4. **Integration Command**: Manage integration bridges
5. **Model Command**: List and interact with AI models (skeleton for Phase 2)

### Configuration System

The configuration system provides unified management of settings across all integrated components.

#### Key Components

1. **Configuration Manager**
   - Load and save configuration
   - Access configuration values
   - Schema validation

2. **Schema Registry**
   - Register JSON schemas for validation
   - Validate configuration sections

3. **Migration Utilities**
   - Convert TOML to JSON
   - Map legacy structure to new structure

4. **Configuration Commands**
   - Get and set configuration values
   - Import and export configuration
   - Reset configuration to defaults

#### Implementation Approach

The configuration system will use a hierarchical structure with dot notation for accessing values:

```typescript
// Configuration manager
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Record<string, any> = {};
  private schemas: Map<string, JSONSchema7> = new Map();
  
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }
  
  async initialize(): Promise<void> {
    // Load configuration from file
  }
  
  get<T>(key: string, defaultValue?: T): T {
    // Get configuration value using dot notation
  }
  
  set<T>(key: string, value: T): void {
    // Set configuration value using dot notation
  }
  
  async save(): Promise<void> {
    // Save configuration to file
  }
  
  // Schema validation and migration methods...
}
```

#### Schema Definitions

Each component will define its own configuration schema:

```typescript
// Core configuration schema
export const coreConfigSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    apiKeys: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    models: {
      type: 'object',
      properties: {
        default: { type: 'string' },
        history: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    // More properties...
  }
};
```

### Integration Framework

The integration framework provides bridges between different component systems, allowing for consistent communication.

#### Key Components

1. **Integration Registry**
   - Manage bridge registration
   - Bridge initialization and shutdown
   - Status monitoring

2. **Bridge Interfaces**
   - Consistent interface for all bridges
   - Method calling convention
   - Error handling

3. **Clean Implementation Module Loading**
   - Load clean TypeScript implementations
   - Environment-specific handling
   - Fallback mechanisms

4. **Component-Specific Bridges**
   - AI Capabilities Bridge (TypeScript)
   - IPFS Storage Bridge
   - TaskNet Bridge

#### Implementation Approach

The integration framework will use a registry pattern with bridge instances:

```typescript
// Bridge interface
export interface IntegrationBridge {
  id: string;
  name: string;
  source: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  target: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  
  initialize(): Promise<boolean>;
  isInitialized(): boolean;
  call<T>(method: string, args: any): Promise<T>;
  getStatus(): BridgeStatus;
}

// Integration registry
export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private bridges: Map<string, IntegrationBridge> = new Map();
  
  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }
  
  registerBridge(bridge: IntegrationBridge): void {
    // Register bridge
  }
  
  async initializeBridge(id: string): Promise<boolean> {
    // Initialize bridge
  }
  
  async callBridge<T>(bridgeId: string, method: string, args: any): Promise<T> {
    // Call bridge method
  }
}
```

#### Bridge Implementation

Each bridge will implement the IntegrationBridge interface:

```typescript
// Example: AI Capabilities Bridge using clean room TypeScript implementation
export class AICapabilitiesBridge implements IntegrationBridge {
  id: string = 'ai-capabilities';
  name: string = 'AI Capabilities Bridge';
  source: 'clean-typescript' = 'clean-typescript';
  target: 'current' = 'current';
  
  private implementation: any = null;
  private initialized: boolean = false;
  
  async initialize(): Promise<boolean> {
    // Load clean TypeScript implementation module
    try {
      this.implementation = await import('../../clean-implementations/ai-capabilities');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to load AI capabilities implementation:', error);
      return false;
    }
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  async call<T>(method: string, args: any): Promise<T> {
    // Call method on TypeScript implementation
    if (!this.isInitialized()) {
      throw new Error('AI capabilities bridge not initialized');
    }
    
    if (!this.implementation[method]) {
      throw new Error(`Method not found in AI capabilities implementation: ${method}`);
    }
    
    return await this.implementation[method](args);
  }
  
  getStatus(): BridgeStatus {
    // Return bridge status
    return {
      id: this.id,
      name: this.name,
      initialized: this.initialized,
      status: this.initialized ? 'connected' : 'disconnected'
    };
  }
}
```

## Implementation Roadmap

Phase 1 implementation will follow this sequence:

### Sprint 1: Foundation (Week 1)
- Command system framework
- Basic configuration management
- Project structure setup
- Core command implementations (help, version)

### Sprint 2: Integration Framework (Week 2)
- Integration registry design
- Clean implementation module loading
- Basic bridge interfaces
- Mock implementations

### Sprint 3: Configuration Enhancement (Week 3)
- Schema validation
- Configuration migration
- Configuration commands
- Persistence mechanisms

### Sprint 4: Bridge Implementation (Week 4)
- AI Capabilities bridge implementation (clean room TypeScript)
- IPFS Storage bridge implementation
- TaskNet bridge implementation
- Integration commands

## Testing Strategy

Phase 1 testing will focus on:

### 1. Unit Testing
- Command registry and execution
- Configuration management
- Integration registry and bridges
- Migration utilities

### 2. Integration Testing
- Cross-component communication
- Configuration persistence
- Command execution flow
- Error handling and recovery

### 3. Mock Testing
- Testing with mock bridges
- Fallback behavior testing
- Error scenario simulation

### 4. CLI Testing
- End-to-end command execution
- Output formatting
- Error reporting

Example test structure:

```typescript
// Unit test for command registry
describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  
  beforeEach(() => {
    // Reset singleton for testing
    (CommandRegistry as any).instance = null;
    registry = CommandRegistry.getInstance();
  });
  
  it('should register and retrieve commands', () => {
    const command: Command = {
      id: 'test',
      name: 'test',
      description: 'Test command',
      handler: async () => 0
    };
    
    registry.registerCommand(command);
    const retrievedCommand = registry.getCommand('test');
    
    expect(retrievedCommand).to.deep.equal(command);
  });
  
  // More tests...
});
```

## Dependency Management

Phase 1 will establish these core dependencies:

### Required Dependencies
- TypeScript and Node.js core
- React and Ink for terminal UI
- Minimist for argument parsing
- Ajv for JSON schema validation
- TOML for configuration parsing

### Optional Dependencies
- IPFS HTTP Client for IPFS integration
- chalk for terminal coloring
- ora for spinners
- table for tabular data

### Clean Implementation Dependencies
- TypeScript implementation modules
- Any required utility libraries for clean implementations

Dependencies will be managed through package.json with explicit version pinning to ensure reproducibility.