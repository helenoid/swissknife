# API Specifications

This document defines the core Application Programming Interfaces (APIs) for key components within the SwissKnife CLI architecture. These TypeScript interfaces serve as contracts for implementation, ensuring consistency and interoperability between different parts of the system. The focus is on APIs relevant to the CLI-first, Node.js environment.

## 1. Command System API

The Command System API defines how CLI commands are structured, registered, parsed, and executed. It forms the primary entry point for user interaction.

### 1.1 Command & Options Interfaces

```typescript
/**
 * Represents the definition of a single CLI command or subcommand.
 */
export interface Command {
  /** The primary name used to invoke the command (e.g., 'agent', 'config'). */
  readonly name: string;
  /** A brief description displayed in help messages. */
  readonly description: string;
  /** Optional alternative names for the command. */
  readonly aliases?: string[];
  /** Definition of options (flags) and arguments accepted by the command. */
  readonly options?: CommandOption[];
  /** Nested subcommands, if any. */
  readonly subcommands?: Command[];
  /** The asynchronous function that executes the command's logic. */
  readonly handler: (context: ExecutionContext) => Promise<number>; // Returns exit code
  /** Optional usage examples for help text. */
  readonly examples?: string[];
  /** Optional flag to hide the command from general help listings. */
  readonly isHidden?: boolean;
  /** Optional flag to disable the command. */
  readonly isEnabled?: boolean; // Default: true
}

/**
 * Defines a command-line option (flag) or positional argument.
 */
export interface CommandOption {
  /** The primary name of the option (e.g., '--file') or argument placeholder (e.g., '<input-path>'). */
  readonly name: string;
  /** A brief description for help text. */
  readonly description: string;
  /** Optional short alias (e.g., '-f'). */
  readonly alias?: string;
  /** Expected data type for validation and parsing. */
  readonly type: 'string' | 'number' | 'boolean' | 'array';
  /** Whether the option/argument is mandatory. */
  readonly required?: boolean;
  /** Default value if the option is not provided. */
  readonly defaultValue?: any;
  /** Optional list of allowed values. */
  readonly choices?: any[];
}

/**
 * Represents the parsed and validated arguments passed to a command handler.
 * Structure depends on the parsing library used (e.g., yargs, commander).
 */
export type ParsedArgs = Record<string, any> & {
  /** Positional arguments. */
  _?: (string | number)[];
};

/**
 * Provides execution context and dependencies to command handlers.
 */
export interface ExecutionContext {
  /** Parsed and validated arguments and options for the current command. */
  readonly args: ParsedArgs;
  /** Access to the application's configuration manager. */
  readonly config: ConfigurationManager; // Assumes ConfigurationManager interface/class exists
  /** Method to lazily get instances of core services (Agent, Storage, etc.). */
  getService<T>(serviceName: string): T;
  /** Instance of the logger for outputting messages. */
  readonly logger: Logger; // Assumes Logger interface/class exists
  /** Instance of the output formatter for presenting results to the user. */
  readonly formatter: OutputFormatter; // Defined later in this document
  /** The current working directory from where the CLI was invoked. */
  readonly cwd: string;
  /** Process environment variables. */
  readonly env: NodeJS.ProcessEnv;
  /** Raw command line arguments array. */
  readonly argv: string[];
}
```
*Note: The distinction between `LocalCommand`, `RemoteCommand`, `PromptCommand` is removed in favor of a single `Command` interface. The command's `handler` implementation determines its behavior (local execution, API call, AI interaction).*

### 1.2 Command Management APIs

```typescript
/**
 * Manages the registration and lookup of command definitions.
 */
export interface CommandRegistry {
  /** Registers a top-level command (including its subcommands). */
  register(command: Command): void;
  /** Retrieves a command definition based on a path of names (e.g., ['agent', 'config', 'set']). */
  findCommand(commandPath: string[]): Command | null;
  /** Gets all registered top-level commands. */
  getAllCommands(): Command[];
}

/**
 * Responsible for parsing input, resolving commands, and executing them.
 */
export interface CommandExecutor {
  /** Parses argv, finds the command, validates args, and executes the handler. */
  execute(argv: string[]): Promise<number>; // Returns exit code
}

/**
 * Generates help text based on command definitions.
 */
export interface HelpGenerator {
  /** Generates help text for a specific command or the root application. */
  generate(command?: Command): string;
}
```

### 1.3 Command Middleware/Hooks (Optional)

```typescript
/**
 * Optional: Interface for middleware that can run before or after command execution.
 */
export interface CommandMiddleware {
  /** Runs before the command handler. Can modify context or prevent execution by returning false. */
  preExecute?(context: ExecutionContext): Promise<boolean | void>;

  /** Runs after the command handler successfully completes. */
  postExecute?(context: ExecutionContext, exitCode: number): Promise<void>;

  /** Runs if the command handler throws an error. */
  onError?(context: ExecutionContext, error: Error): Promise<void>;
}
```

## 2. Tool System API

Defines how tools (capabilities invokable by the AI Agent or directly via CLI) are structured and executed.

### 2.1 Tool Interface

```typescript
/**
 * Defines the structure and execution logic for a tool.
 * @template InputT Type of the validated input parameters object.
 * @template OutputT Type of the successful execution result data.
 */
export interface Tool<InputT = Record<string, any>, OutputT = any> {
  /** Unique name used to identify and call the tool. */
  readonly name: string;

  /** Description of the tool's purpose and functionality for AI and user understanding. */
  readonly description: string;
  /** Schema defining the input parameters the tool accepts. Used for validation and generation. */
  readonly parameters: ToolParameter[]; // Using CommandOption structure for consistency? Or specific ToolParameter?
  // Let's define ToolParameter for clarity, similar to CommandOption
  // readonly parameters: CommandOption[];

  /** Optional: Indicates if the tool modifies state or has side effects. Defaults to false (read-only). */
  readonly isMutating?: boolean;

  /**
   * The core asynchronous function that executes the tool's logic.
   * @param params Validated input parameters matching the schema.
   * @param context Provides access to execution context (services, config, logger).
   * @returns A promise resolving to the tool's output data.
   * @throws {ToolError} or other specific errors on failure.
   */
  execute(params: InputT, context: ExecutionContext): Promise<OutputT>;
}

/**
 * Defines a parameter accepted by a Tool.
 */
export interface ToolParameter {
  /** Name of the parameter. */
  readonly name: string;
  /** Data type (subset of JSON Schema types). */
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Description for AI and user understanding. */
  readonly description: string;
  /** Whether the parameter is required. */
  readonly required?: boolean;
  /** Optional: JSON Schema definition for complex types ('array', 'object'). */
  readonly schema?: Record<string, any>;
  /** Optional: Enum of allowed values. */
  readonly enum?: any[];
}

// --- Tool Execution Specific Types (Potentially simplified) ---
// The original ToolMessage/ToolOutput seem complex for Phase 1.
// Let's assume execute returns OutputT on success and throws ToolError on failure.
// The Agent layer handles formatting results for the model.

/** Example Error class for tool execution failures. */
export class ToolError extends Error {
  constructor(message: string, public toolName: string, public details?: any) {
    super(message);
    this.name = 'ToolError';
  }
}
```
*Note: The original `Tool` interface included rendering methods and complex message types. These are simplified here, assuming rendering is handled by the CLI/Agent layer and execution returns data or throws.*

### 2.2 Tool Management APIs

```typescript
/**
 * Manages the registration and lookup of available tools.
 */
export interface ToolRegistry {
  /** Registers a tool instance. */
  register(tool: Tool): void;
  /** Retrieves a tool instance by its unique name. */
  getTool(name: string): Tool | undefined;
  /** Gets all registered tools. */
  getAllTools(): Tool[];
}

/**
 * Responsible for validating input and executing tools.
 */
export interface ToolExecutor {
  /**
   * Validates input against a tool's parameter schema and executes the tool.
   * @param toolName The name of the tool to execute.
   * @param rawInput The raw input parameters object.
   * @param context The execution context.
   * @returns A promise resolving to the tool's output.
   * @throws {ToolError} or {ValidationError} on failure.
   */
  execute(toolName: string, rawInput: Record<string, any>, context: ExecutionContext): Promise<any>;
}
```

## 3. Model System API

Defines interfaces for interacting with AI models, abstracting different providers and capabilities.

### 3.1 Model Information & Capabilities

```typescript
/**
 * Represents the metadata and characteristics of a specific AI model.
 * Aligned with the definition in model_system_analysis.md.
 */
export interface ModelInfo {
  /** Unique identifier for the model (e.g., 'gpt-4-turbo'). */
  readonly id: string;
  /** Human-readable name (e.g., 'GPT-4 Turbo'). */
  readonly name: string;
  /** Identifier of the provider (e.g., 'openai', 'anthropic', 'local'). */
  readonly provider: string;
  /** Declared capabilities of the model. */
  readonly capabilities: ModelCapabilities;
  /** Maximum context window size in tokens. */
  readonly contextWindow: number;
  /** Optional: Date when the model's training data cuts off (ISO 8601). */
  readonly trainingCutoff?: string;
  /** Optional: Maximum number of tokens the model can generate in one response. */
  readonly maxOutputTokens?: number;
  /** Cost per 1000 input tokens (e.g., in USD). */
  readonly inputCostPer1000Tokens: number;
  /** Cost per 1000 output tokens (e.g., in USD). */
  readonly outputCostPer1000Tokens: number;
  /** Optional: Estimated base latency per request in milliseconds. */
  readonly requestOverheadMs?: number;
  /** Optional: Estimated generation speed in tokens per second. */
  readonly tokensPerSecond?: number;
  /** Optional: Any other relevant metadata. */
  readonly metadata?: Record<string, any>;
}

/** Defines the functional capabilities of a model. */
export interface ModelCapabilities {
  /** Supports chat-based interaction (e.g., using message arrays). */
  readonly chat: boolean;
  /** Supports simple text completion. */
  readonly completion: boolean;
  /** Can generate text embeddings. */
  readonly embedding: boolean;
  /** Can process image inputs. */
  readonly vision: boolean;
  /** Supports function/tool calling via specific API mechanisms. */
  readonly functionCalling: boolean;
  /** Supports streaming responses chunk by chunk. */
  readonly streaming: boolean;
  // Removed structuredOutput, functionCalling is more specific
  // Removed images (generation), focus is on text/vision input for now
}

/** Represents a message in a chat conversation. */
export interface ChatMessage {
  /** Role of the message author. */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** Text content of the message. */
  content: string; // Simplified for now, could support multimodal content later
  /** Optional: Name of the tool if role is 'tool'. */
  name?: string;
  /** Optional: ID of the tool call if role is 'tool'. */
  tool_call_id?: string;
  /** Optional: Tool calls requested by the assistant. */
  tool_calls?: RequestedToolCall[];
}

/** Represents a tool call requested by the assistant. */
export interface RequestedToolCall {
  /** ID associated with the tool call. */
  id: string;
  /** Type, typically 'function'. */
  type: 'function';
  /** Details of the function to call. */
  function: {
    /** Name of the tool/function to call. */
    name: string;
    /** Arguments as a JSON string. */
    arguments: string;
  };
}
```

### 3.2 Model Provider & Execution APIs

```typescript
/**
 * Interface for interacting with a specific model provider (API or local engine).
 * Adapts provider-specific APIs to a common interface used by ModelExecutor.
 */
export interface ModelProvider {
  /** Unique identifier for the provider (e.g., 'openai'). */
  readonly id: string;
  /** Human-readable name (e.g., 'OpenAI'). */
  readonly name: string;

  /** Optional: Fetches available models supported by this provider. */
  getModels?(): Promise<ModelInfo[]>;
  /** Optional: Fetches detailed info for a specific model ID from this provider. */
  getModel?(modelId: string): Promise<ModelInfo | undefined>;

  /** Generates a completion (typically chat-based). */
  generateCompletion(
    modelId: string,
    messages: ChatMessage[],
    options: ResolvedRequestOptions // Includes resolved settings like temperature, maxTokens, tools
  ): Promise<CompletionResult>; // Contains the response message, usage, cost, etc.

  /** Generates a completion as an asynchronous stream of chunks. */
  generateCompletionStream(
    modelId: string,
    messages: ChatMessage[],
    options: ResolvedRequestOptions
  ): AsyncGenerator<CompletionChunk>; // Stream yields chunks (delta content, usage updates)

  /** Optional: Generates embeddings for input text(s). */
  generateEmbedding?(
    modelId: string,
    text: string | string[]
  ): Promise<EmbeddingResult>; // Contains the embedding vectors

  /** Counts the number of tokens for given text/messages using the model's specific tokenizer. */
  countTokens(modelId: string, text: string | ChatMessage[]): Promise<number>;
}

/** Options passed to the provider for a generation request. */
export interface ResolvedRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  tools?: Tool[]; // Tools available for function calling
  toolChoice?: 'auto' | 'required' | { type: 'function'; function: { name: string } };
  // ... other common options
}

/** Result of a non-streaming completion request. */
export interface CompletionResult {
  /** The primary response message from the assistant. */
  message: ChatMessage;
  /** Token usage statistics. */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Estimated cost in USD. */
  cost: number;
  /** Optional: Raw provider response for debugging. */
  rawResponse?: any;
  /** Optional: ID of the response. */
  responseId?: string;
}

/** Represents a chunk received during streaming. */
export interface CompletionChunk {
  /** Delta (change) in the response message content or tool calls. */
  delta: Partial<ChatMessage>;
  /** Optional: Updated token usage statistics. */
  usage?: Partial<CompletionResult['usage']>;
  /** Optional: Index of the choice if multiple completions generated (usually 0). */
  choiceIndex?: number;
  /** Optional: Reason the stream finished (e.g., 'stop', 'length', 'tool_calls'). */
  finishReason?: string;
  /** Optional: Raw chunk data from the provider. */
  rawChunk?: any;
}

// --- Other related types (EmbeddingResult, ModelRegistry, ModelSelector, ModelExecutor) ---
// Assume these exist, aligning with definitions in model_system_analysis.md
// and cli_architecture.md. ModelExecutor would use ModelProvider.
```

## 4. Task & Worker System API (Phase 1 Focus: Local Workers)

Defines interfaces for managing tasks and executing them, initially focusing on local execution using Node.js `worker_threads` as planned for early phases, distinct from the more complex distributed TaskNet of Phase 3.

### 4.1 Task Definition

```typescript
/**
 * Represents a unit of work to be executed.
 * Generic types for input and expected result.
 */
export interface Task<InputT = any, ResultT = any> {
  /** Unique identifier for the task instance. */
  readonly id: string;
  /** Identifier for the type of task (maps to executable function/module). */
  readonly type: string;
  /** Input data for the task. */
  readonly input: InputT;
  /** Optional: Priority for scheduling (lower value = higher priority). */
  readonly priority?: number;
  /** Optional: Dependencies (IDs of other tasks that must complete first). */
  readonly dependencies?: string[];
  /** Optional: Timeout in milliseconds. */
  readonly timeout?: number;
  /** Optional: Additional metadata. */
  readonly metadata?: Record<string, any>;
}

/** Represents the result of a task execution. */
export interface TaskResult<ResultT = any> {
  /** ID of the task this result belongs to. */
  readonly taskId: string;
  /** Execution status. */
  readonly status: 'succeeded' | 'failed' | 'cancelled';
  /** Result data if execution succeeded. */
  readonly data?: ResultT;
  /** Error details if execution failed. */
  readonly error?: { message: string; stack?: string; code?: string };
  /** Execution time in milliseconds. */
  readonly executionTimeMs: number;
  /** Timestamp when the result was generated. */
  readonly timestamp: number; // e.g., Date.now()
}
```

### 4.2 Local Worker Pool API

```typescript
/**
 * Manages a pool of Node.js worker threads for local parallel execution.
 */
export interface WorkerPool {
  /** Submits a task for execution by an available worker thread. */
  submitTask<InputT, ResultT>(task: Task<InputT, ResultT>): Promise<TaskResult<ResultT>>;

  /** Gets statistics about the worker pool (e.g., active workers, queue size). */
  getStats(): Promise<WorkerPoolStats>; // Assumes WorkerPoolStats type

  /** Starts the worker pool (initializes threads). */
  start(): Promise<void>;

  /** Stops the worker pool gracefully. */
  stop(): Promise<void>;
}

/** Interface for the code running within a worker thread. */
export interface WorkerThreadHandler {
  /** Executes a task based on its type and input. */
  execute<InputT, ResultT>(taskType: string, input: InputT): Promise<ResultT>;
}
```
*Note: This simplifies the original Worker API, focusing on the pool concept for local execution relevant to Phase 1/2, deferring complex status/capabilities/distribution to Phase 3 TaskNet.*

## 5. Storage System API (Virtual Filesystem)

Defines the unified interface for interacting with different storage backends (local filesystem, IPFS).

### 5.1 Storage Backend Interface

```typescript
/**
 * Common interface for all storage backend implementations.
 * Aligned with storage_system_analysis.md.
 */
export interface StorageBackend {
  /** Unique identifier for the backend type (e.g., 'filesystem', 'ipfs'). */
  readonly id: string;
  /** Human-readable name (e.g., 'Local Filesystem'). */
  readonly name: string;
  /** Flag indicating if the backend is read-only. */
  readonly isReadOnly: boolean;

  // --- Core Methods (Relative Paths) ---
  readFile(relativePath: string): Promise<Buffer>;
  writeFile(relativePath: string, data: Buffer | string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<FileStat>; // Defined in storage_system_analysis.md
  readdir(relativePath: string): Promise<DirEntry[]>; // Defined in storage_system_analysis.md
  mkdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
  unlink(relativePath: string): Promise<void>;
  rmdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;

  // --- Optional Methods (Relative Paths) ---
  rename?(oldRelativePath: string, newRelativePath: string): Promise<void>;
  copyFile?(srcRelativePath: string, destRelativePath: string): Promise<void>;
  createReadStream?(relativePath: string, options?: any): Promise<NodeJS.ReadableStream>;
  createWriteStream?(relativePath: string, options?: any): Promise<NodeJS.WritableStream>;
  getAvailableSpace?(): Promise<SpaceInfo>; // Defined in storage_system_analysis.md
}
```

### 5.2 Storage Operations API (High-Level VFS)

```typescript
/**
 * Provides a high-level, unified API for storage operations using virtual paths.
 * Uses PathResolver and StorageRegistry internally.
 */
export interface StorageOperations {
  // --- Core Methods (Virtual Paths) ---
  readFile(virtualPath: string): Promise<Buffer>;
  writeFile(virtualPath: string, data: Buffer | string): Promise<void>;
  exists(virtualPath: string): Promise<boolean>;
  stat(virtualPath: string): Promise<FileStat>;
  readdir(virtualPath: string): Promise<DirEntry[]>;
  mkdir(virtualPath: string, options?: { recursive?: boolean }): Promise<void>;
  unlink(virtualPath: string): Promise<void>;
  rmdir(virtualPath: string, options?: { recursive?: boolean }): Promise<void>;
  rename(oldVirtualPath: string, newVirtualPath: string): Promise<void>;
  copy(sourceVirtualPath: string, destVirtualPath: string, options?: { recursive?: boolean }): Promise<void>; // Enhanced copy

  // --- Streaming Methods (Virtual Paths) ---
  createReadStream(virtualPath: string, options?: any): Promise<NodeJS.ReadableStream>;
  createWriteStream(virtualPath: string, options?: any): Promise<NodeJS.WritableStream>;

  // --- Utility Methods ---
  /** Resolves a virtual path to its backend and relative path. */
  resolve(virtualPath: string): { backend: StorageBackend; relativePath: string; mountPoint: string };
}

/** Manages storage backends and mount points. */
export interface StorageRegistry {
  registerBackend(backend: StorageBackend): void;
  getBackend(backendId: string): StorageBackend | undefined;
  mount(mountPoint: string, backendId: string): void;
  unmount(mountPoint: string): void;
  getMounts(): Map<string, string>; // Map<mountPoint, backendId>
  getBackendForPath(absoluteVirtualPath: string): { backend: StorageBackend; relativePath: string; mountPoint: string };
}
```
*Note: Simplified by combining `VirtualFilesystem` concepts into `StorageOperations` and `StorageRegistry`.*

### 5.3 IPFS Backend Specifics (Conceptual)

*   The `IPFSBackend` implementation needs a `MappingStore` dependency (defined in `storage_system_analysis.md`) to manage the path-to-CID relationship.
*   `writeFile` in `IPFSBackend` involves `ipfsClient.addContent` and then updating the `mappingStore`.
*   `readFile` involves looking up the CID in `mappingStore` and then calling `ipfsClient.getContent`.
*   Directory operations (`readdir`, `mkdir`, `rmdir`) require careful implementation using the `mappingStore` and potentially IPFS DAG operations to represent directory structures.

## 6. Authentication System API

Defines interfaces for managing user identity, cryptographic keys, and authorization (potentially using UCANs).

### 6.1 Key Management API

```typescript
/** Options for key generation. */
export interface KeyGenOptions {
  type?: 'ed25519' | 'secp256k1'; // Supported key types
}

/** Represents a cryptographic key pair. */
export interface KeyPair {
  id: string; // Unique identifier for the key (e.g., public key DID)
  type: string; // Key type
  publicKey: Uint8Array; // Public key bytes
  // Private key bytes should NOT be directly exposed by the KeyManager interface
}

/** Information about a stored key. */
export interface KeyInfo {
  id: string;
  type: string;
  // Other metadata (e.g., creation date)
}

/**
 * Manages cryptographic keys securely.
 */
export interface KeyManager {
  /** Generates and securely stores a new key pair. */
  generateKeyPair(options?: KeyGenOptions): Promise<KeyInfo>;
  /** Imports an existing key pair securely. */
  importKeyPair(privateKeyBytes: Uint8Array, type: string): Promise<KeyInfo>;
  /** Exports a private key securely (requires user confirmation, potentially password). */
  exportKeyPair(keyId: string): Promise<Uint8Array>; // Returns private key bytes
  /** Lists IDs of all managed keys. */
  listKeyIds(): Promise<string[]>;
  /** Retrieves public information about a key. */
  getKeyInfo(keyId: string): Promise<KeyInfo | null>;
  /** Signs data using the private key associated with keyId. */
  sign(keyId: string, data: Uint8Array): Promise<Uint8Array>; // Use Uint8Array for binary data
  /** Removes a key pair securely. */
  removeKeyPair(keyId: string): Promise<void>;
}
```
*Note: Verification typically uses the public key directly, often handled by libraries like `ucans`.*

### 6.2 Identity Management API (Conceptual)

```typescript
/**
 * Represents a user identity, typically linked to a key pair.
 */
export interface Identity {
  /** Decentralized Identifier (e.g., 'did:key:zabc...'). */
  did: string;
  /** Optional: Associated key ID managed by KeyManager. */
  keyId?: string;
  /** Optional: Other metadata associated with the identity. */
  metadata?: Record<string, any>;
}

/**
 * Manages user identities.
 */
export interface IdentityManager {
  /** Gets the currently active identity. */
  getCurrentIdentity(): Promise<Identity | null>;
  /** Sets the active identity. */
  setCurrentIdentity(did: string): Promise<void>;
  /** Creates a new identity (usually involves generating a key pair). */
  createIdentity(options?: KeyGenOptions): Promise<Identity>;
  /** Lists all managed identities. */
  listIdentities(): Promise<Identity[]>;
  /** Resolves a DID (potentially using external resolvers). */
  resolveDid(did: string): Promise<any>; // DID Document structure
}
```

### 6.3 UCAN Authorization API

```typescript
/** Represents a capability in UCAN format. */
export interface UcanCapability {
  with: { scheme: string; hierPart: string }; // Resource identifier
  can: string; // Ability (e.g., 'storage/add', 'task/run')
}

/** Options for issuing a UCAN. */
export interface UcanOptions {
  /** DID of the issuer (if not the current identity). */
  issuer?: string;
  /** Lifetime in seconds from now. */
  lifetimeInSeconds?: number;
  /** Nonce to prevent replay attacks. */
  nonce?: string;
  /** Optional proofs (parent UCANs) to delegate from. */
  proofs?: string[];
  /** Optional facts associated with the UCAN. */
  facts?: Record<string, any>[];
}

/** Result of UCAN verification. */
export interface UcanVerificationResult {
  /** Indicates if the signature and structure are valid. */
  isValid: boolean;
  /** Decoded UCAN payload if valid. */
  payload?: any; // Specific UCAN payload type
  /** Error details if invalid. */
  error?: Error;
}

/**
 * Service for issuing, verifying, and managing UCAN tokens.
 */
export interface UcanService {
  /** Issues a new UCAN signed by the current identity's key. */
  issue(
    audienceDid: string, // DID of the recipient
    capabilities: UcanCapability[],
    options?: UcanOptions
  ): Promise<string>; // Returns the encoded UCAN token

  /** Verifies the signature, structure, and time validity of a UCAN token. */
  verify(token: string): Promise<UcanVerificationResult>;

  /** Checks if a given capability is authorized by a valid UCAN chain (including proofs). */
  isAuthorized(
    requiredCapability: UcanCapability,
    proofs: string[] // Chain of UCANs presented by the requester
  ): Promise<boolean>;

  /** Extracts capabilities granted directly by a specific UCAN token. */
  getCapabilities(token: string): Promise<UcanCapability[]>;

  /** Decodes a UCAN token without performing verification (useful for inspection). */
  decode(token: string): any; // Specific UCAN type
}
```

## 7. MCP Integration API

Defines interfaces for interacting with the Model Context Protocol, likely leveraging the official SDK.

### 7.1 MCP Server Management API (Conceptual)

```typescript
/** Options for starting a local MCP server process. */
export interface McpServerOptions {
  /** Path to the server executable or script. */
  command: string;
  /** Arguments for the server command. */
  args?: string[];
  /** Environment variables for the server process. */
  env?: Record<string, string>;
  /** Port for the server (if applicable, often uses stdio). */
  port?: number;
}

/** Status of a managed MCP server process. */
export interface McpServerStatus {
  id: string; // Identifier from config
  isRunning: boolean;
  pid?: number;
  // Other relevant status info
}

/**
 * Service for managing local MCP server processes defined in configuration.
 */
export interface McpServerManager {
  /** Starts a configured MCP server by its ID. */
  startServer(serverId: string): Promise<void>;
  /** Stops a running MCP server by its ID. */
  stopServer(serverId: string): Promise<void>;
  /** Gets the status of a specific server. */
  getServerStatus(serverId: string): Promise<McpServerStatus>;
  /** Lists the status of all configured servers. */
  listServers(): Promise<McpServerStatus[]>;
}
```
*Note: This focuses on managing local server processes. Direct interaction uses the SDK.*

### 7.2 MCP Client API (Using SDK Types)

```typescript
import { Client, ClientOptions, CallToolResponse, ReadResourceResponse } from '@modelcontextprotocol/sdk/client'; // Example import

/**
 * Wrapper or direct usage of the MCP SDK Client.
 */
export interface McpClient extends Client {
  // The SDK Client likely provides methods like:
  // connect(options: ClientOptions): Promise<void>;
  // disconnect(): Promise<void>;
  // callTool(toolName: string, args: any): Promise<CallToolResponse>;
  // readResource(uri: string): Promise<ReadResourceResponse>;
  // listTools(): Promise<ListToolsResponse>;
  // listResources(): Promise<ListResourcesResponse>;
  // ... and potentially event handling for subscriptions.
}
```
*Recommendation: Use the types and client implementation directly from `@modelcontextprotocol/sdk` where possible.*

## 8. Error Handling API

Defines a base error class and potentially specific subclasses for different system areas.

### 8.1 Error Types

```typescript
/**
 * Base error class for all application-specific errors.
 */
export class SwissKnifeError extends Error {
  /** A machine-readable error code (e.g., 'CONFIG_NOT_FOUND', 'NETWORK_TIMEOUT'). */
  public readonly code: string;
  /** Optional: Additional context or details about the error. */
  public readonly context?: Record<string, any>;
  /** Optional: The original error that caused this one. */
  public readonly cause?: Error;

  constructor(message: string, code: string, options?: { context?: Record<string, any>, cause?: Error }) {
    super(message);
    this.name = this.constructor.name; // Ensure correct error name
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;
  }
}

/** Error related to command parsing or execution. */
export class CommandError extends SwissKnifeError {
  constructor(message: string, code: string = 'COMMAND_ERROR', options?: { context?: Record<string, any>, cause?: Error }) {
    super(message, code, options);
  }
}

/** Error related to tool execution. */
export class ToolError extends SwissKnifeError {
   constructor(message: string, public toolName?: string, code: string = 'TOOL_ERROR', options?: { context?: Record<string, any>, cause?: Error }) {
     super(message, code, options);
   }
}

/** Error related to model interaction. */
export class ModelError extends SwissKnifeError {
   constructor(message: string, public modelId?: string, code: string = 'MODEL_ERROR', options?: { context?: Record<string, any>, cause?: Error }) {
     super(message, code, options);
   }
}

/** Error related to storage operations. */
export class StorageError extends SwissKnifeError {
   constructor(message: string, public path?: string, code: string = 'STORAGE_ERROR', options?: { context?: Record<string, any>, cause?: Error }) {
     super(message, code, options);
   }
}

// ... other specific error types (ValidationError, NetworkError, AuthError, etc.)
```

### 8.2 Error Handling Service (Conceptual)

*   The `CommandExecutor` should catch errors from handlers.
*   It should then use the `OutputFormatter` to display user-friendly error messages based on the error type (`SwissKnifeError` code or standard `Error` name).
*   Verbose mode (`--verbose`) should trigger display of stack traces and potentially `cause` and `context`.

## 9. CLI Output Formatting API

Defines how command results and messages are presented to the user in the terminal.

```typescript
/**
 * Service responsible for formatting and printing output to the console.
 * Handles different output formats (text, JSON, YAML) and styles (colors, tables, progress).
 */
export interface OutputFormatter {
  /** Logs a standard informational message. */
  info(message: string): void;
  /** Logs a success message (e.g., green text). */
  success(message: string): void;
  /** Logs a warning message (e.g., yellow text). */
  warn(message: string): void;
  /** Logs and formats an error, potentially exiting. Includes user-friendly formatting. */
  error(error: Error | string, exitCode?: number): void;
  /** Logs raw data, respecting output format flags (e.g., --output json). */
  data(data: any): void;
  /** Displays data in a formatted table. */
  table(data: Record<string, any>[], columns?: { key: string; label: string }[]): void;
  /** Creates and manages a progress spinner. */
  spinner(text?: string): Spinner; // Assumes Spinner interface { start(), stop(), succeed(), fail(), text }
  /** Creates and manages a progress bar. */
  progressBar(total: number, initialValue?: number): ProgressBar; // Assumes ProgressBar interface { start(), update(), stop() }
  // Potentially methods for raw output, JSON, YAML specific formatting
}
```

## 10. Documentation Generation API (Conceptual)

Defines how documentation (like CLI command references) could be generated from definitions.

```typescript
/** Represents structured documentation for a command. */
export interface CommandDocumentation {
  name: string;
  description: string;
  usage: string;
  options: CommandOption[];
  subcommands?: CommandDocumentation[];
  examples?: string[];
}

/** Represents structured documentation for a tool. */
export interface ToolDocumentation {
  name: string;
  description: string;
  parameters: ToolParameter[];
  // Input/Output examples?
}

/**
 * Service or utility for generating documentation from definitions.
 */
export interface DocumentationGenerator {
  /** Generates documentation structure for a command. */
  generateForCommand(command: Command): CommandDocumentation;
  /** Generates documentation structure for a tool. */
  generateForTool(tool: Tool): ToolDocumentation;
  /** Formats documentation structure into Markdown. */
  formatAsMarkdown(docs: CommandDocumentation | ToolDocumentation): string;
  /** Formats documentation structure into JSON. */
  formatAsJson(docs: CommandDocumentation | ToolDocumentation): string;
  // formatAsManPage(...) // Optional
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
