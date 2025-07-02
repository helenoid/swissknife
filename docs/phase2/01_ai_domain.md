# Phase 2: AI Domain Implementation

**Timeline:** Week 1 of Phase 2

This document details the implementation plan for the AI domain during Phase 2, focusing on establishing the core agent capabilities, tool system, model integration, and thinking patterns.

## Goals

-   Implement the core `Agent` class with message processing and memory management.
-   Develop a robust `Tool` system, including definition, registration, execution, and validation.
-   Build the `Model` system with a registry for managing different AI models and provider integrations.
-   Implement the initial `ThinkingManager` and `ThoughtGraph` for Graph-of-Thought processing.

## Implementation Details

### 1. Agent System (Day 1-2)

-   **`Agent` Class (`src/ai/agent/agent.ts`):**
    -   Manages interaction with the selected `Model`.
    -   Integrates with `ToolExecutor` and `ThinkingManager`.
    -   Maintains conversation `memory` (history).
    -   Handles `AgentOptions` for configuration (e.g., `maxTokens`, `temperature`).
    -   Provides methods for `registerTool`, `processMessage`, `getTools`, `getMemory`, `clearMemory`.
-   **Memory Management:**
    -   Track conversation history using `AgentMessage` objects.
    -   Implement mechanisms for context persistence, retrieval, and filtering.

### 2. Tool System (Day 3-4)

-   **`Tool` Interface (`src/ai/tools/tool.ts`):**
    -   Defines the structure for tools (`name`, `description`, `parameters`, `execute` method).
    -   Specifies `ToolParameter` structure (`name`, `type`, `description`, `required`, `default`).
-   **`ToolExecutor` Class (`src/ai/tools/executor.ts`):**
    -   Registers available tools.
    -   Handles tool execution based on name and arguments.
    -   Includes parameter validation logic.
-   **Built-in Tools:**
    -   Implement essential tools like shell command execution, file system operations, search, etc. (Example: `src/ai/tools/implementations/shell-tool.ts`, `storage-tool.ts`).

### 3. Model System (Day 5-6)

-   **`Model` Class (`src/ai/models/model.ts`):**
    -   Represents an AI model with properties like `id`, `name`, `provider`, `parameters`, `metadata`.
    -   Provides methods for accessing model information and managing parameters.
-   **`ModelRegistry` Class (`src/ai/models/registry.ts`):**
    -   Singleton pattern for managing all registered `Model` instances.
    -   Methods for `registerModel`, `getModel` (including 'default'), `setDefaultModel`, `getAllModels`.
-   **Model Providers:**
    -   Implement interfaces and classes for integrating with different model providers (e.g., OpenAI, Anthropic).
    -   Define a standard interface for custom/local model providers.

### 4. Thinking System (Day 7)

-   **`ThoughtGraph` Class (`src/ai/thinking/graph.ts`):**
    -   Represents the graph structure for reasoning (`ThoughtNode`, `NodeType`).
    -   Manages nodes (`addNode`, `getNode`, `getRoot`), relationships (`addChild`), and state (`setNodeResult`).
    -   Provides traversal capabilities (`traverse`).
-   **`ThinkingManager` Class (`src/ai/thinking/manager.ts`):**
    -   Orchestrates the Graph-of-Thought process.
    -   `createThinkingGraph`: Initializes a graph based on the input message.
    -   `processGraph`: Processes the graph, potentially using the model to expand nodes.
    -   `identifyTools`: Analyzes the graph to determine necessary tool calls.
    -   `generateResponse`: Synthesizes the final response based on the processed graph and tool results.

## Key Interface

```typescript
// src/types/ai.ts or relevant domain files
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp: string;
  toolCalls?: Array<{ name: string; args: any }>; // If model suggests tool calls
  toolResults?: Array<{ tool: string; result?: any; error?: string }>; // Results after execution
}

export interface AgentOptions {
  model: Model;
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
  // Other model/agent specific options
}

export interface ModelOptions {
  id: string;
  name: string;
  provider: string; // e.g., 'openai', 'anthropic', 'local'
  parameters?: Record<string, any>; // Default parameters like temperature, max_tokens
  metadata?: Record<string, any>; // Other info like context window size
}

// Tool interfaces defined in src/ai/tools/tool.ts
// Model class defined in src/ai/models/model.ts
// Thinking types defined in src/ai/thinking/graph.ts
```

## Deliverables

-   Functional `Agent` class capable of basic message processing and tool registration.
-   Working `ToolExecutor` with parameter validation.
-   Implemented `ModelRegistry` and `Model` class structure.
-   Initial `ThinkingManager` and `ThoughtGraph` implementation.
-   Unit tests for core components (Agent, ToolExecutor, ModelRegistry).
