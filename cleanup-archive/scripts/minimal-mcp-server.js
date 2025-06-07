#!/usr/bin/env node
/**
 * Minimal MCP Server Implementation
 * 
 * This is the simplest possible MCP server implementation that
 * correctly follows the protocol. It does nothing but return
 * valid responses to keep-alive.
 */

/**
 * Process a single line of JSON input
 */
function processLine(line) {
  try {
    const message = JSON.parse(line);
    
    console.error(`[MINIMAL-MCP] Received message: ${message.method}`);
    
    // Only respond to requests
    if (message.type !== 'request') {
      console.error(`[MINIMAL-MCP] Ignoring non-request message`);
      return;
    }
    
    const response = {
      type: 'response',
      id: message.id
    };
    
    // Handle different methods
    switch (message.method) {
      case 'getCapabilities':
        response.result = { 
          tools: {}
        };
        break;
        
      case 'tools/list':
        response.result = { 
          tools: []
        };
        break;
        
      default:
        response.error = {
          code: -32001,
          message: `Method not implemented: ${message.method}`
        };
        break;
    }
    
    // Send the response
    console.log(JSON.stringify(response));
  } catch (err) {
    console.error(`[MINIMAL-MCP] Error processing message: ${err.message}`);
  }
}

/**
 * Start the server
 */
function start() {
  console.error('[MINIMAL-MCP] Starting minimal MCP server');
  
  // Set up stdin processing
  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  // Process input line by line
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.substring(0, newlineIndex);
      buffer = buffer.substring(newlineIndex + 1);
      
      if (line.trim()) {
        processLine(line);
      }
    }
  });
  
  // Handle signals
  process.on('SIGINT', () => {
    console.error('[MINIMAL-MCP] Received SIGINT, shutting down');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.error('[MINIMAL-MCP] Received SIGTERM, shutting down');
    process.exit(0);
  });
  
  console.error('[MINIMAL-MCP] Server started successfully');
}

// Start the server if run directly
if (require.main === module) {
  start();
}
