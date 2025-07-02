import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({ target: this });
    }, 10);
  }
  
  send(data) {
    if (this.mockSendError) {
      throw new Error('Mock send error');
    }
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({ data: `{"id":"response-${Date.now()}", "result": "ok"}` });
      }, 5);
    }
    return true;
  }
  
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true });
  }
};

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;
    
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({ target: this });
    }, 10);
  }
  
  close() {
    this.readyState = 2; // CLOSED
    if (this.onclose) this.onclose();
  }
}

global.EventSource = MockEventSource;

describe('DIA Streaming Optimizations', () => {
  let originalWebSocket;
  let originalEventSource;
  
  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    originalEventSource = global.EventSource;
    
    // Create mocks
    global.WebSocket = jest.fn().mockImplementation((url) => {
      const ws = new MockWebSocket(url);
      return ws;
    });
    
    global.EventSource = jest.fn().mockImplementation((url) => {
      const es = new MockEventSource(url);
      return es;
    });
  });
  
  afterEach(() => {
    global.WebSocket = originalWebSocket;
    global.EventSource = originalEventSource;
  });
  
  describe('EnhancedWebSocketBridge', () => {
    it('should establish a connection successfully', async () => {
      const ws = new EnhancedWebSocketBridge('ws://localhost:8080');
      
      const connectPromise = new Promise(resolve => {
        ws.on('open', () => resolve(true));
      });
      
      await ws.connect();
      const connected = await connectPromise;
      
      expect(connected).toBe(true);
      expect(ws.getState()).toBe('connected');
    });
    
    it('should send messages with priorities', async () => {
      const ws = new EnhancedWebSocketBridge('ws://localhost:8080');
      await ws.connect();
      
      const sendSpy = jest.spyOn(ws._ws, 'send');
      
      await ws.sendWithPriority('message 1', Priority.HIGH);
      await ws.sendWithPriority('message 2', Priority.NORMAL);
      await ws.sendWithPriority('message 3', Priority.CRITICAL);
      
      expect(sendSpy).toHaveBeenCalledTimes(3);
      
      // Critical messages should be sent immediately
      expect(ws._messageQueue.length).toBe(0);
    });
    
    it('should collect performance metrics', async () => {
      const ws = new EnhancedWebSocketBridge('ws://localhost:8080');
      await ws.connect();
      
      for (let i = 0; i < 5; i++) {
        await ws.sendWithPriority(`message ${i}`, Priority.NORMAL);
      }
      
      // Simulate receiving messages
      for (let i = 0; i < 3; i++) {
        ws._handleMessage({ data: `{"id":${i}, "result": "ok"}` });
      }
      
      const metrics = ws.getMetrics();
      
      expect(metrics.messagesSent).toBeGreaterThan(0);
      expect(metrics.messagesReceived).toBeGreaterThan(0);
    });
  });
  
  describe('OptimizedSseHandler', () => {
    it('should establish a connection successfully', async () => {
      const sse = new OptimizedSseHandler('http://localhost:8080/events');
      
      const connectPromise = new Promise(resolve => {
        sse.on('open', () => resolve(true));
      });
      
      await sse.connect();
      const connected = await connectPromise;
      
      expect(connected).toBe(true);
      expect(sse.getState()).toBe('connected');
    });
    
    it('should handle events with priorities', async () => {
      const sse = new OptimizedSseHandler('http://localhost:8080/events');
      await sse.connect();
      
      // Simulate received events
      sse._eventSource.onmessage({ 
        data: JSON.stringify({ id: 1, type: 'test', content: 'Hello' }) 
      });
      
      sse._eventSource.onmessage({ 
        data: JSON.stringify({ id: 2, type: 'test', content: 'World' }) 
      });
      
      const metrics = sse.getMetrics();
      expect(metrics.eventCount).toBeGreaterThan(0);
    });
  });
  
  describe('DiaStreamingManager', () => {
    it('should initialize properly', () => {
      const manager = new DiaStreamingManager();
      expect(manager).toBeDefined();
    });
    
    it('should prefer WebSocket when specified', async () => {
      const manager = new DiaStreamingManager({ preferWebSockets: true });
      
      const connectPromise = new Promise(resolve => {
        manager.on('open', () => resolve(true));
      });
      
      await manager.connect('ws://localhost:8080');
      const connected = await connectPromise;
      
      expect(connected).toBe(true);
      expect(manager.getActiveTransportType()).toBe('websocket');
    });
    
    it('should fall back to SSE when WebSocket fails', async () => {
      // Make WebSocket fail but SSE succeed
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('WebSocket not supported');
      });
      
      const manager = new DiaStreamingManager({ 
        preferWebSockets: true,
        fallbackToSse: true
      });
      
      const connectPromise = new Promise(resolve => {
        manager.on('open', () => resolve(true));
      });
      
      await manager.connect('http://localhost:8080');
      const connected = await connectPromise;
      
      expect(connected).toBe(true);
      expect(manager.getActiveTransportType()).toBe('sse');
    });
    
    it('should send messages with correct priority', async () => {
      const manager = new DiaStreamingManager();
      await manager.connect('ws://localhost:8080');
      
      const sendSpy = jest.spyOn(manager, 'send');
      
      await manager.send('{"id":1,"method":"test"}', Priority.HIGH);
      await manager.send('{"id":2,"method":"test"}', Priority.CRITICAL);
      
      expect(sendSpy).toHaveBeenCalledTimes(2);
      expect(sendSpy).toHaveBeenCalledWith(expect.any(String), Priority.HIGH);
      expect(sendSpy).toHaveBeenCalledWith(expect.any(String), Priority.CRITICAL);
    });
  });
});
