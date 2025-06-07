# DIA Model Streaming Optimizations - Server-side Components

This implementation focuses on reducing Time to First Byte (TTFB) and jitter in WebSocket and SSE connections to enhance streaming performance of the DIA model.

## Table of Contents

1. [Overview](#overview)
2. [Server-side Components](#server-side-components)
3. [Performance Optimizations](#performance-optimizations)
4. [Usage Instructions](#usage-instructions)
5. [Benchmarking](#benchmarking)
6. [Integration with Existing Services](#integration-with-existing-services)

## Overview

The optimized streaming implementation includes several server-side components written in Rust for the MCP (Model Context Protocol) server, focusing on reducing latency and jitter in streaming connections. These components complement the client-side optimizations we've already implemented.

## Server-side Components

### Enhanced MCP Server

- **Location**: `/goose/crates/mcp-server/src/enhanced_server.rs`
- **Purpose**: Provides an enhanced server implementation with support for WebSocket and SSE transports optimized for streaming performance.
- **Features**: 
  - Multi-transport support (WebSocket, SSE, standard byte streams)
  - HTTP server for web client connections
  - Comprehensive metrics collection
  - Priority-based message handling

### Optimized WebSocket Transport

- **Location**: `/goose/crates/mcp-server/src/transport/websocket.rs`
- **Purpose**: Implements a WebSocket transport optimized for low-latency streaming.
- **Features**:
  - Prioritized message queuing
  - Adaptive message batching
  - Performance metrics collection
  - Backpressure detection and handling

### Optimized SSE Transport

- **Location**: `/goose/crates/mcp-server/src/transport/sse.rs`
- **Purpose**: Implements a Server-Sent Events (SSE) transport optimized for low-latency streaming.
- **Features**:
  - Event prioritization
  - Adaptive backpressure handling
  - Performance metrics collection
  - Connection pre-warming

### Transport Module

- **Location**: `/goose/crates/mcp-server/src/transport/mod.rs`
- **Purpose**: Provides common interfaces and utilities for transports.
- **Features**:
  - Priority mapping for JSON-RPC messages
  - Common configuration options
  - Metrics tracking

## Performance Optimizations

The server-side components implement several key optimizations:

### 1. Message Prioritization

Messages are prioritized based on their importance:
- **Critical**: Initialization, authentication, shutdowns
- **High**: User-visible streaming content (model outputs)
- **Normal**: Regular messages
- **Low**: Background or non-urgent messages

### 2. Adaptive Batching

The transport layers can adaptively batch messages based on:
- Message arrival rates
- Priority levels
- Current server load

### 3. Backpressure Handling

The transports detect and handle backpressure using strategies including:
- Dropping low-priority messages
- Throttling message sending
- Combining compatible messages

### 4. Connection Pre-warming

Connections can be pre-established to reduce connection establishment time when messages need to be sent.

### 5. Performance Metrics Collection

Comprehensive metrics are collected including:
- Time to First Byte (TTFB)
- Message latency
- Inter-message jitter
- Throughput rates
- Error counts

## Usage Instructions

### Starting the Enhanced MCP Server

The enhanced server can be started with the following command-line options:

```bash
cargo run --bin mcp-server -- --enhanced --http --port 8080
```

Options:
- `--enhanced` or `-e`: Use the enhanced server with optimized streaming
- `--http` or `-h`: Enable the HTTP server for WebSocket and SSE connections
- `--port PORT` or `-p PORT`: Specify the HTTP server port (default: 8080)

### Connecting with JavaScript Client

The optimized JavaScript client can connect to the server using:

```javascript
import { McpStreamingClient } from './src/utils/mcp-streaming-client.js';

const client = new McpStreamingClient({
  serverUrl: 'http://localhost:8080',
  preferWs: true,
  enableCompression: true,
  collectMetrics: true
});

await client.connect();
await client.initialize();

// Send a request with high priority
const result = await client.callTool('generate_text', { prompt: 'Hello world' }, 
  (token, value) => {
    console.log('Progress:', token, value);
  }
);

console.log('Result:', result);

// Get performance metrics
const metrics = client.getMetrics();
console.log('TTFB:', metrics.ttfb, 'ms');
console.log('Avg Jitter:', metrics.avgJitter, 'ms');
```

## Benchmarking

You can benchmark the optimized implementations against the original ones using:

```bash
node benchmarks/dia-streaming-benchmark.js
```

The benchmark tests different message sizes and rates, comparing:
- Original WebSocket vs. Enhanced WebSocket
- Original SSE vs. Optimized SSE
- TTFB (Time to First Byte)
- Message latency
- Inter-message jitter
- Throughput

## Integration with Existing Services

### Integration with DIA Model Server

To integrate with the existing DIA model server:

1. Update the server to use the optimized transport:

```rust
use mcp_server::{
    enhanced_server::{EnhancedServer, EnhancedServerConfig},
    transport::Priority
};

// Create server config
let config = EnhancedServerConfig {
    transport: TransportConfig {
        batch_window_ms: 10,
        batch_size: 10,
        enable_compression: true,
        prewarming: true,
    },
    http_server_addr: Some("127.0.0.1:8080".to_string()),
    ..Default::default()
};

// Create and run the enhanced server
let server = EnhancedServer::new(router_service, config);
server.run().await?;
```

2. Update clients to use the optimized client:

```javascript
import { McpStreamingClient } from './mcp-streaming-client.js';

const client = new McpStreamingClient({
  serverUrl: 'http://localhost:8080'
});

await client.connect();
await client.initialize();

// Use the client for DIA model interactions
```

## License

Copyright © 2025 SwissKnife Team
