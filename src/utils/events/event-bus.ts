export class EventBus {
  private static instance: EventBus;
  private listeners: { [event: string]: Function[] };
  private oneTimeListeners: { [event: string]: Function[] };

  private constructor() {
    this.listeners = {};
    this.oneTimeListeners = {};
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, handler: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
    return this; // For chaining
  }

  once(event: string, handler: Function) {
    if (!this.oneTimeListeners[event]) {
      this.oneTimeListeners[event] = [];
    }
    this.oneTimeListeners[event].push(handler);
    return this; // For chaining
  }

  emit(event: string, data?: any) {
    let errors: Error[] = [];
    
    // Process regular listeners
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          // Catch errors but continue processing other handlers
          if (error instanceof Error) {
            errors.push(error);
          } else {
            errors.push(new Error(String(error)));
          }
        }
      });
    }

    // Process one-time listeners
    if (this.oneTimeListeners[event]) {
      const handlers = [...this.oneTimeListeners[event]];
      // Clear one-time listeners for this event
      this.oneTimeListeners[event] = [];
      
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          // Catch errors but continue processing other handlers
          if (error instanceof Error) {
            errors.push(error);
          } else {
            errors.push(new Error(String(error)));
          }
        }
      });
    }
    
    // If we caught any errors, emit an error event with the list of errors
    if (errors.length > 0) {
      // Only emit error event if we're not already processing an error event
      // (to prevent infinite recursion)
      if (event !== 'error') {
        this.emit('error', { sourceEvent: event, errors });
      }
    }
  }

  off(event: string, handler: Function) {
    // Remove from regular listeners
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
    
    // Remove from one-time listeners
    if (this.oneTimeListeners[event]) {
      this.oneTimeListeners[event] = this.oneTimeListeners[event].filter(h => h !== handler);
    }
    
    return this; // For chaining
  }
  
  removeAll(event: string) {
    delete this.listeners[event];
    delete this.oneTimeListeners[event];
    return this; // For chaining
  }
  
  // Alias for compatibility
  removeAllListeners(event: string) {
    return this.removeAll(event);
  }
}
