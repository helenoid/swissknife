import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventBus } from '../src/utils/events/event-bus.js';

describe('EventBus Isolated Test', () => {
  let eventBus: any;
  
  beforeEach(() => {
    // Reset singleton
    (EventBus as any).instance = null;
    eventBus = EventBus.getInstance();
  });
  
  it('should emit and receive events', () => {
    const handler = jest.fn();
    eventBus.on('test-event', handler);
    
    const eventData = { key: 'value' };
    eventBus.emit('test-event', eventData);
    
    expect(handler).toHaveBeenCalledWith(eventData);
  });
  
  it('should remove all listeners', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    eventBus.on('test-event', handler1);
    eventBus.on('test-event', handler2);
    
    eventBus.removeAll('test-event');
    eventBus.emit('test-event', 'data');
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});
