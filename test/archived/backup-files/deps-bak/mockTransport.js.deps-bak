/**
 * Mock implementation of MCP Transport for testing
 */
/**
 * A mock implementation of MCPTransport for testing
 */
export class MockTransport {
    options;
    connected = false;
    messageListeners = [];
    disconnectListeners = [];
    latency = 0;
    mockResponses = new Map();
    messageLog = [];
    shouldFailConnect = false;
    shouldFailSend = false;
    shouldFailReceive = false;
    constructor(options) {
        this.options = options;
    }
    /**
     * Set whether connect() should fail
     */
    setShouldFailConnect(shouldFail) {
        this.shouldFailConnect = shouldFail;
    }
    /**
     * Set whether send() should fail
     */
    setShouldFailSend(shouldFail) {
        this.shouldFailSend = shouldFail;
    }
    /**
     * Set whether receive() should fail
     */
    setShouldFailReceive(shouldFail) {
        this.shouldFailReceive = shouldFail;
    }
    /**
     * Set a mock response for a specific request
     */
    setMockResponse(requestId, response) {
        this.mockResponses.set(requestId, response);
    }
    /**
     * Get the log of messages that have been sent
     */
    getMessageLog() {
        return [...this.messageLog];
    }
    /**
     * Set the mock latency
     */
    setLatency(latencyMs) {
        this.latency = latencyMs;
    }
    /**
     * Simulate receiving a message
     */
    simulateReceiveMessage(message) {
        this.messageListeners.forEach(listener => listener(message));
    }
    /**
     * Simulate disconnect
     */
    simulateDisconnect() {
        this.connected = false;
        this.disconnectListeners.forEach(listener => listener());
    }
    /**
     * Connect the transport
     */
    async connect() {
        if (this.shouldFailConnect) {
            throw new Error('Mock connection failure');
        }
        await this.delay(this.latency);
        this.connected = true;
        return true;
    }
    /**
     * Disconnect the transport
     */
    async disconnect() {
        await this.delay(this.latency);
        this.connected = false;
        this.disconnectListeners.forEach(listener => listener());
    }
    /**
     * Send a message
     */
    async send(message) {
        if (!this.connected) {
            throw new Error('Transport not connected');
        }
        if (this.shouldFailSend) {
            throw new Error('Mock send failure');
        }
        await this.delay(this.latency);
        this.messageLog.push(message);
        // Auto-respond if we have a mock response for this message
        if (message.correlationId && this.mockResponses.has(message.correlationId)) {
            const response = this.mockResponses.get(message.correlationId);
            setTimeout(() => {
                this.simulateReceiveMessage({
                    ...response,
                    correlationId: message.correlationId
                });
            }, this.latency);
        }
    }
    /**
     * Receive a message
     */
    async receive() {
        if (!this.connected) {
            throw new Error('Transport not connected');
        }
        if (this.shouldFailReceive) {
            throw new Error('Mock receive failure');
        }
        await this.delay(this.latency);
        return null; // This implementation uses events instead
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get the transport type
     */
    getType() {
        return this.options.type;
    }
    /**
     * Get the latency
     */
    getLatency() {
        return this.latency;
    }
    /**
     * Add an event listener
     */
    on(event, listener) {
        if (event === 'message') {
            this.messageListeners.push(listener);
        }
        else if (event === 'disconnect') {
            this.disconnectListeners.push(listener);
        }
    }
    /**
     * Remove an event listener
     */
    off(event, listener) {
        if (event === 'message') {
            this.messageListeners = this.messageListeners.filter(l => l !== listener);
        }
        else if (event === 'disconnect') {
            this.disconnectListeners = this.disconnectListeners.filter(l => l !== listener);
        }
    }
    /**
     * Helper method to simulate delay
     */
    delay(ms) {
        if (ms <= 0)
            return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=mockTransport.js.map