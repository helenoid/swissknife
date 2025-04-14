/**
 * Factory for creating transports
 */

import { Transport } from './client';
import { WebSocketTransport, WebSocketTransportOptions } from './transports/websocket';

/**
 * Transport type
 */
export enum TransportType {
  WebSocket = 'websocket',
  Http = 'http',
  Stdio = 'stdio',
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  type: TransportType;
  options: any;
}

/**
 * Create a new transport
 */
export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case TransportType.WebSocket:
      return new WebSocketTransport(config.options as WebSocketTransportOptions);
    
    // Additional transports would be implemented here
    
    default:
      throw new Error(`Unsupported transport type: ${config.type}`);
  }
}
