# API Specifications

This document defines the API specifications for CLI-compatible components integrated from source repositories (`swissknife_old`, `ipfs_accelerate_js`, and `ipfs_accelerate_py`) into the SwissKnife CLI architecture. It provides detailed interface definitions, data models, and integration points to ensure consistent implementation and interoperability.

## 1. Command System API

### 1.1 Command Interface

```typescript
/**
 * Base interface for all commands in the system
 */
export interface Command {
  type: 'local' | 'remote' | 'prompt'; // Command type
  name: string;                        // Unique command identifier
  description: string;                 // Human-readable description
  options: CommandOption[];            // Command options definition
  isEnabled: boolean;                  // Whether the command is currently enabled
  isHidden: boolean;                   // Whether the command should be hidden from help
  userFacingName(): string;            // User-friendly name for display
}

/**
 * Interface for local commands executed directly in the CLI
 */
export interface LocalCommand extends Command {
  type: 'local';
  handler(args: string[], context: CommandContext): Promise<string | null>;
}

/**
 * Interface for remote commands executed via API
 */
export interface RemoteCommand extends Command {
  type: 'remote';
  endpoint: string;  // URL endpoint for remote execution
  handler(args: string[], context: CommandContext): Promise<string | null>;
}

/**
 * Interface for prompt-based commands that invoke AI models
 */
export interface PromptCommand extends Command {
  type: 'prompt';
  argNames: string[];              // Arguments expected by the command
  progressMessage: string;         // Progress message during execution
  getPromptForCommand(args: string): Promise<Array<{role: string, content: string}>>;
}

/**
 * Command option definition
 */
export interface CommandOption {
  name: string;                     // Option name/flag
  alias?: string;                   // Short alias (e.g., '-v' for '--verbose')
  description: string;              // Option description
  type: 'boolean' | 'string' | 'number' | 'array';  // Option type
  required?: boolean;               // Whether the option is required
  default?: any;                    // Default value if not specified
}

/**
 * Command execution context
 */
export interface CommandContext {
  cwd: string;           // Current working directory
  config: CommandConfig; // Command system configuration
  tools: Tool[];         // Available tools
  models: ModelInfo[];   // Available models
  logger: Logger;        // Logger instance
}
```

### 1.2 Command Registry API

```typescript
/**
 * Command registry service interface
 */
export interface CommandRegistry {
  register(command: Command): void;  // Register a command
  getCommand(name: string): Command | undefined;  // Get a command by name
  getCommands(): Command[];  // Get all registered commands
  getFilteredCommands(filter: (command: Command) => boolean): Command[];  // Get filtered commands
  executeCommand(name: string, args: string[], context: CommandContext): Promise<string | null>;  // Execute a command
}
```

### 1.3 Command Lifecycle Hooks

```typescript
/**
 * Command lifecycle hook points
 */
export interface CommandLifecycleHooks {
  // Called before a command executes
  preExecute?(command: Command, args: string[], context: CommandContext): Promise<boolean>;
  
  // Called after a command executes
  postExecute?(command: Command, args: string[], result: string | null, context: CommandContext): Promise<void>;
  
  // Called when a command fails
  onError?(command: Command, args: string[], error: Error, context: CommandContext): Promise<void>;
}
```

## 2. Tool System API

### 2.1 Tool Interface

```typescript
/**
 * Base interface for all tools
 */
export interface Tool<InputT = any, OutputT = any> {
  name: string;  // Unique name of the tool
  
  isEnabled(): Promise<boolean>;  // Check if the tool is currently enabled
  isReadOnly(): boolean;  // Check if the tool is read-only (non-modifying)
  description(requestSchema: any): Promise<string>;  // Get the tool description
  prompt(): Promise<string>;  // Get the tool prompt (how the LLM should use it)
  
  inputSchema: any;  // Input schema validation
  inputJSONSchema?: any;  // JSON schema for input validation
  
  // Call the tool with input
  call(
    input: InputT,
    context: ToolContext,
    permissionCheck?: PermissionCheck
  ): AsyncGenerator<ToolMessage, ToolOutput<OutputT>, unknown>;
  
  // Optional method to validate input
  validateInput?(input: InputT, context: ToolContext): Promise<ValidationResult>;
  
  userFacingName(): string;  // Get user-facing name
  needsPermissions?(): boolean;  // Check if the tool needs explicit permission
  
  // Rendering methods for UI
  renderToolUseMessage(input: InputT): React.ReactNode;
  renderToolResultMessage(output: OutputT, options: RenderOptions): React.ReactNode;
  renderToolUseRejectedMessage(): React.ReactNode;
  renderResultForAssistant(content: OutputT): string;
}

/**
 * Tool message types
 */
export type ToolMessage =
  | { type: 'result'; data: any; resultForAssistant: string }
  | { type: 'thinking'; data: string }
  | { type: 'error'; error: Error };

/**
 * Tool output type
 */
export type ToolOutput<T> = { type: 'result'; data: T; resultForAssistant: string };
```

### 2.2 Tool Registry API

```typescript
/**
 * Tool registry service interface
 */
export interface ToolRegistry {
  register(tool: Tool): void;  // Register a tool
  getTool(name: string): Tool | undefined;  // Get a tool by name
  getTools(): Tool[];  // Get all registered tools
  getFilteredTools(filter: (tool: Tool) => boolean): Tool[];  // Get filtered tools
}
```

## 3. Model System API

### 3.1 Model Interface

```typescript
/**
 * Model information
 */
export interface ModelInfo {
  id: string;                // Unique identifier for the model
  name: string;              // Human-readable name
  provider: string;          // Model provider (e.g., "openai", "anthropic")
  capabilities: ModelCapabilities;  // Model capabilities
  contextWindow: number;     // Context window size in tokens
  available: boolean;        // Whether the model is currently available
  inputCostPer1000Tokens: number;   // Cost per input token in USD
  outputCostPer1000Tokens: number;  // Cost per output token in USD
}

/**
 * Model capabilities
 */
export interface ModelCapabilities {
  images: boolean;           // Whether the model can generate images
  visionInput: boolean;      // Whether the model understands images
  functionCalling: boolean;  // Whether the model supports function calling
  structuredOutput: boolean; // Whether the model can perform structured output
}

/**
 * Message for model requests
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';  // Message role
  content: string | ContentBlock[];                // Message content
  name?: string;                                   // Name for the message (optional)
  toolCalls?: ToolCall[];                          // Tool calls included in the message
}

/**
 * Model response
 */
export interface ModelResponse {
  id: string;        // Response ID
  message: Message;  // Response message
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;      // Cost in USD
}
```

### 3.2 Model Provider Interface

```typescript
/**
 * Model provider interface
 */
export interface ModelProvider {
  id: string;    // Provider ID
  name: string;  // Provider name
  
  getModels(): Promise<ModelInfo[]>;  // Get available models
  getModel(modelId: string): Promise<ModelInfo | undefined>;  // Get a specific model by ID
  
  // Generate a completion
  generateCompletion(
    modelId: string,
    messages: Message[],
    options?: ModelRequestOptions
  ): Promise<ModelResponse>;
  
  // Generate a streaming completion
  generateCompletionStream(
    modelId: string,
    messages: Message[],
    options?: ModelRequestOptions
  ): AsyncGenerator<ModelResponseChunk>;
  
  // Count tokens for a prompt
  countTokens(modelId: string, messages: Message[]): Promise<number>;
}
```

## 4. Worker System API

### 4.1 Worker Interface

```typescript
/**
 * Worker interface
 */
export interface Worker {
  id: string;                      // Unique worker ID
  status: WorkerStatus;            // Worker status
  capabilities: WorkerCapabilities; // Worker capabilities
  
  start(): Promise<void>;          // Start the worker
  stop(): Promise<void>;           // Stop the worker
  
  // Execute a task
  executeTask<T, R>(task: Task<T, R>): Promise<TaskResult<R>>;
  
  getStats(): WorkerStats;         // Get worker stats
  setOptions(options: WorkerOptions): void;  // Set worker options
}

/**
 * Worker status
 */
export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  STARTING = 'starting',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}
```

### 4.2 Task Interface

```typescript
/**
 * Task interface
 */
export interface Task<T, R> {
  id: string;           // Unique task ID
  type: string;         // Task type
  priority: number;     // Task priority (higher number = higher priority)
  input: T;             // Task input data
  
  // Function to execute
  execute(input: T, context: TaskContext): Promise<R>;
  
  createdAt: number;    // Task created timestamp
  dependencies?: string[];  // Task dependencies
  timeout?: number;     // Task timeout in milliseconds
  metadata?: Record<string, any>;  // Task metadata
}

/**
 * Task result
 */
export interface TaskResult<R> {
  taskId: string;              // Task ID
  status: TaskStatus;          // Execution status
  data?: R;                    // Result data (if successful)
  error?: {                    // Error information (if failed)
    message: string;
    stack?: string;
    code?: string;
  };
  executionTime: number;       // Execution time in milliseconds
  timestamp: number;           // Result timestamp
}
```

### 4.3 Worker Pool Interface

```typescript
/**
 * Worker pool interface
 */
export interface WorkerPool {
  addWorker(worker: Worker): void;  // Add a worker to the pool
  removeWorker(workerId: string): void;  // Remove a worker from the pool
  getWorker(workerId: string): Worker | undefined;  // Get a worker by ID
  getWorkers(): Worker[];  // Get all workers
  
  // Submit a task to the pool
  submitTask<T, R>(task: Task<T, R>): Promise<TaskResult<R>>;
  
  // Submit multiple tasks
  submitTasks<T, R>(tasks: Task<T, R>[]): Promise<TaskResult<R>[]>;
  
  getStats(): WorkerPoolStats;  // Get pool statistics
  start(): Promise<void>;  // Start all workers
  stop(): Promise<void>;  // Stop all workers
}
```

## 5. Virtual Filesystem API

### 5.1 Storage Backend Interface

```typescript
/**
 * Storage backend interface
 */
export interface StorageBackend {
  id: string;      // Backend ID
  name: string;    // Backend name
  readonly: boolean;  // Whether backend is read-only
  
  // File operations
  readFile(path: string): Promise<Buffer>;  // Read a file
  writeFile(path: string, data: Buffer | string): Promise<void>;  // Write a file
  exists(path: string): Promise<boolean>;  // Check if file exists
  stat(path: string): Promise<FileStat>;  // Get file metadata
  readdir(path: string): Promise<DirEntry[]>;  // Read directory contents
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;  // Make directory
  unlink(path: string): Promise<void>;  // Delete file
  rmdir(path: string, options?: { recursive?: boolean }): Promise<void>;  // Remove directory
  rename(oldPath: string, newPath: string): Promise<void>;  // Rename file or directory
  copyFile(src: string, dest: string): Promise<void>;  // Copy file
  getAvailableSpace(): Promise<SpaceInfo>;  // Get available space
}
```

### 5.2 Virtual Filesystem Interface

```typescript
/**
 * Virtual filesystem interface
 */
export interface VirtualFilesystem {
  // Mount operations
  mount(mountPoint: string, backend: StorageBackend, options?: MountOptions): Promise<void>;
  unmount(mountPoint: string): Promise<void>;
  getMounts(): Map<string, StorageBackend>;
  
  // Standard filesystem operations
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: Buffer | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FileStat>;
  readdir(path: string): Promise<DirEntry[]>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  unlink(path: string): Promise<void>;
  rmdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(src: string, dest: string): Promise<void>;
  
  // Enhanced operations
  glob(pattern: string, options?: GlobOptions): Promise<string[]>;
  resolvePath(path: string): string;
  getBackendForPath(path: string): StorageBackend;
}
```

### 5.3 IPFS Storage Backend Interface

```typescript
/**
 * IPFS storage backend interface
 */
export interface IPFSStorageBackend extends StorageBackend {
  id: 'ipfs';  // ID is 'ipfs'
  
  // IPFS-specific operations
  add(data: Buffer | string): Promise<string>;  // Add content to IPFS
  get(cid: string): Promise<Buffer>;  // Get content from IPFS
  pin(cid: string): Promise<void>;  // Pin content in IPFS
  unpin(cid: string): Promise<void>;  // Unpin content from IPFS
  listPins(): Promise<string[]>;  // List pinned content
  pathToCid(path: string): Promise<string>;  // Map path to CID
  cidToPath(cid: string): Promise<string>;  // Map CID to path
}
```

## 6. Authentication System API

### 6.1 Key Management Interface

```typescript
/**
 * Key management service interface
 */
export interface KeyManager {
  generateKeyPair(options?: KeyGenOptions): Promise<KeyPair>;  // Generate a new key pair
  importKeyPair(keyData: KeyImportData): Promise<KeyPair>;  // Import a key pair
  exportKeyPair(keyId: string, format: KeyExportFormat): Promise<string>;  // Export a key pair
  sign(keyId: string, data: Buffer | string): Promise<string>;  // Sign data with a private key
  verify(publicKey: string, data: Buffer | string, signature: string): Promise<boolean>;  // Verify a signature
  getKeyIds(): Promise<string[]>;  // Get key IDs
  getKeyInfo(keyId: string): Promise<KeyInfo>;  // Get key information
}
```

### 6.2 Identity Interface

```typescript
/**
 * Identity interface
 */
export interface Identity {
  did: string;  // DID (Decentralized Identifier)
  keyId: string;  // Identity keypair ID
  metadata: Record<string, any>;  // Identity metadata
  
  sign(data: Buffer | string): Promise<string>;  // Sign data with identity key
  verify(data: Buffer | string, signature: string): Promise<boolean>;  // Verify data with identity key
  createJWT(payload: Record<string, any>, options?: JWTOptions): Promise<string>;  // Create a DID-signed JWT
  verifyJWT(jwt: string): Promise<JWTVerificationResult>;  // Verify a DID-signed JWT
}
```

### 6.3 UCAN Interface

```typescript
/**
 * UCAN service interface
 */
export interface UCANService {
  // Issue a new UCAN
  issue(
    audience: string,
    capabilities: Capability[],
    options?: UCANOptions
  ): Promise<string>;
  
  verify(token: string): Promise<UCANVerificationResult>;  // Verify a UCAN token
  isAuthorized(token: string, capability: Capability): Promise<boolean>;  // Check if a capability is authorized
  getCapabilities(token: string): Promise<Capability[]>;  // Get capabilities from a token
  decode(token: string): UCAN;  // Decode a UCAN token without verification
}
```

## 7. MCP Integration API

### 7.1 MCP Server Interface

```typescript
/**
 * MCP Server interface
 */
export interface MCPServer {
  start(options: MCPServerOptions): Promise<void>;  // Start the server
  stop(): Promise<void>;  // Stop the server
  status: MCPServerStatus;  // Server status
  
  registerTool(toolName: string, handler: MCPToolHandler): void;  // Register a tool handler
  registerMessageHandler(messageType: string, handler: MCPMessageHandler): void;  // Register a message handler
  setCapabilities(capabilities: MCPServerCapabilities): void;  // Set capabilities
  getInfo(): MCPServerInfo;  // Get server information
}
```

### 7.2 MCP Client Interface

```typescript
/**
 * MCP Client interface
 */
export interface MCPClient {
  connect(options: MCPClientOptions): Promise<void>;  // Connect to an MCP server
  disconnect(): Promise<void>;  // Disconnect from the server
  status: MCPClientStatus;  // Client connection status
  
  callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResponse>;  // Call a tool
  sendMessage(type: string, payload: any): Promise<MCPMessage | null>;  // Send a message
  getServerCapabilities(): Promise<MCPServerCapabilities>;  // Get server capabilities
  getServerInfo(): Promise<MCPServerInfo>;  // Get server information
  
  subscribe(event: string, handler: MCPEventHandler): void;  // Subscribe to server events
  unsubscribe(event: string, handler: MCPEventHandler): void;  // Unsubscribe from server events
}
```

## 8. Error Handling

### 8.1 Error Types

```typescript
/**
 * Base error class for SwissKnife
 */
export class SwissKnifeError extends Error {
  code: string;  // Error code
  context?: Record<string, any>;  // Error context
}

/**
 * Command error
 */
export class CommandError extends SwissKnifeError {
  command: string;  // Command that caused the error
}

/**
 * Tool error
 */
export class ToolError extends SwissKnifeError {
  tool: string;  // Tool that caused the error
}

/**
 * Model error
 */
export class ModelError extends SwissKnifeError {
  model: string;  // Model that caused the error
}
```

### 8.2 Error Handling in CLI

```typescript
/**
 * Error handler for CLI
 */
export interface ErrorHandler {
  handle(error: Error, options?: ErrorHandlerOptions): void;  // Handle an error
  getFormatter(): ErrorFormatter;  // Get an error formatter
  setTypeFormatter(errorType: Function, formatter: ErrorFormatter): void;  // Set custom formatters
  registerReporter(reporter: ErrorReporter): void;  // Register an error reporter
}
```

## 9. CLI Output Formatting

```typescript
/**
 * Output formatter interface
 */
export interface OutputFormatter {
  formatString(value: string, options?: FormatOptions): string;  // Format a string value
  formatObject(value: any, options?: FormatOptions): string;  // Format an object value
  formatArray(value: any[], options?: FormatOptions): string;  // Format an array value
  formatTable(data: any[], options?: TableFormatOptions): string;  // Format a table
  
  formatSuccess(message: string): string;  // Format a success message
  formatError(message: string): string;  // Format an error message
  formatWarning(message: string): string;  // Format a warning message
  formatInfo(message: string): string;  // Format an info message
}
```

## 10. Documentation Standards

```typescript
/**
 * Documentation generator
 */
export interface DocumentationGenerator {
  generateCommandDocs(command: Command): CommandDocumentation;  // Generate command documentation
  generateToolDocs(tool: Tool): ToolDocumentation;  // Generate tool documentation
  formatAsMarkdown(docs: CommandDocumentation | ToolDocumentation): string;  // Format as Markdown
  formatAsJSON(docs: CommandDocumentation | ToolDocumentation): string;  // Format as JSON
  formatAsManPage(docs: CommandDocumentation | ToolDocumentation): string;  // Format as man page
}
```

## Conclusion

This API specification document defines the interfaces and data models for CLI-compatible components integrated from source repositories into the SwissKnife architecture. It provides a comprehensive reference for developers implementing and integrating these components.

The specifications cover all major subsystems including command system, tools, models, workers, virtual filesystem, authentication, and MCP integration. Type definitions, function signatures, and data schemas are provided to ensure consistent implementation and interoperability.

These API specifications will be used as the foundation for implementation work in subsequent phases of the integration project.

## Next Steps

1. Create implementation templates based on these API specifications
2. Begin implementing high-priority components based on the implementation timeline
3. Develop test suites aligned with these interfaces
4. Create CLI command implementations that leverage these APIs
5. Document usage examples for each major API