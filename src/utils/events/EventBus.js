/**
 * Event-driven communication system
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.maxListeners = 10;
    this.enabled = true;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Add an event listener
   */
  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event);
    
    // Check max listeners
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) exceeded for event: ${event}`);
    }

    listeners.push(listener);
    return this;
  }

  /**
   * Add a one-time event listener
   */
  once(event, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }

    this.onceListeners.get(event).push(listener);
    return this;
  }

  /**
   * Remove an event listener
   */
  off(event, listener) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.listeners.delete(event);
        }
      }
    }

    if (this.onceListeners.has(event)) {
      const listeners = this.onceListeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.onceListeners.delete(event);
        }
      }
    }

    return this;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
    return this;
  }

  /**
   * Emit an event
   */
  emit(event, ...args) {
    if (!this.enabled) {
      return false;
    }

    let hasListeners = false;

    // Handle regular listeners
    if (this.listeners.has(event)) {
      const listeners = [...this.listeners.get(event)]; // Copy to avoid mutation issues
      hasListeners = true;
      
      for (const listener of listeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      }
    }

    // Handle once listeners
    if (this.onceListeners.has(event)) {
      const listeners = [...this.onceListeners.get(event)]; // Copy to avoid mutation issues
      this.onceListeners.delete(event); // Remove all once listeners
      hasListeners = true;
      
      for (const listener of listeners) {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in once event listener for '${event}':`, error);
        }
      }
    }

    return hasListeners;
  }

  /**
   * Emit an event asynchronously
   */
  async emitAsync(event, ...args) {
    if (!this.enabled) {
      return false;
    }

    let hasListeners = false;

    // Handle regular listeners
    if (this.listeners.has(event)) {
      const listeners = [...this.listeners.get(event)];
      hasListeners = true;
      
      for (const listener of listeners) {
        try {
          await listener(...args);
        } catch (error) {
          console.error(`Error in async event listener for '${event}':`, error);
        }
      }
    }

    // Handle once listeners
    if (this.onceListeners.has(event)) {
      const listeners = [...this.onceListeners.get(event)];
      this.onceListeners.delete(event);
      hasListeners = true;
      
      for (const listener of listeners) {
        try {
          await listener(...args);
        } catch (error) {
          console.error(`Error in async once event listener for '${event}':`, error);
        }
      }
    }

    return hasListeners;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    const regularCount = this.listeners.has(event) ? this.listeners.get(event).length : 0;
    const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
    return regularCount + onceCount;
  }

  /**
   * Get all events that have listeners
   */
  eventNames() {
    const events = new Set();
    for (const event of this.listeners.keys()) {
      events.add(event);
    }
    for (const event of this.onceListeners.keys()) {
      events.add(event);
    }
    return Array.from(events);
  }

  /**
   * Get listeners for an event
   */
  listeners(event) {
    const regular = this.listeners.get(event) || [];
    const once = this.onceListeners.get(event) || [];
    return [...regular, ...once];
  }

  /**
   * Set maximum number of listeners per event
   */
  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0) {
      throw new Error('Max listeners must be a non-negative number');
    }
    this.maxListeners = n;
    return this;
  }

  /**
   * Get maximum number of listeners per event
   */
  getMaxListeners() {
    return this.maxListeners;
  }

  /**
   * Enable or disable the event bus
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    return this;
  }

  /**
   * Check if event bus is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Wait for an event to be emitted
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      const listener = (...args) => {
        clearTimeout(timer);
        resolve(args);
      };

      this.once(event, listener);
    });
  }

  /**
   * Create a namespaced event bus
   */
  namespace(prefix) {
    return {
      on: (event, listener) => this.on(`${prefix}:${event}`, listener),
      once: (event, listener) => this.once(`${prefix}:${event}`, listener),
      off: (event, listener) => this.off(`${prefix}:${event}`, listener),
      emit: (event, ...args) => this.emit(`${prefix}:${event}`, ...args),
      emitAsync: (event, ...args) => this.emitAsync(`${prefix}:${event}`, ...args),
      listenerCount: (event) => this.listenerCount(`${prefix}:${event}`),
      removeAllListeners: (event) => this.removeAllListeners(event ? `${prefix}:${event}` : undefined)
    };
  }
}

export { EventBus };
export default EventBus;
