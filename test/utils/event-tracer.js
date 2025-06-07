/**
 * Trace-based testing utility for TaskNet components
 *
 * This module provides a framework for recording and validating complex event sequences
 * in TaskNet components, enabling sophisticated tracing and verification of
 * asynchronous event flows.
 */
import EventEmitter from 'events';
/**
 * Event trace class for recording and validating event sequences
 */
export class EventTracer {
    events;
    emitter;
    isRecording;
    constructor() {
        this.events = [];
        this.emitter = new EventEmitter();
        this.isRecording = false;
    }
    /**
     * Start recording events
     */
    startRecording() {
        this.events = [];
        this.isRecording = true;
    }
    /**
     * Stop recording events
     */
    stopRecording() {
        this.isRecording = false;
    }
    /**
     * Record an event
     * @param name - Event name
     * @param data - Event data
     */
    recordEvent(name, data = {}) {
        if (!this.isRecording)
            return;
        this.events.push({
            name,
            timestamp: Date.now(),
            data
        });
        // Emit the event for real-time observers
        this.emitter.emit('event', { name, data });
        this.emitter.emit(name, data);
    }
    /**
     * Get all recorded events
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Get events by name
     * @param name - Event name to filter by
     */
    getEventsByName(name) {
        return this.events.filter(event => event.name === name);
    }
    /**
     * Check if a specific sequence of events has occurred in order
     * @param sequence - Array of event names to check for in sequence
     */
    hasSequence(sequence) {
        if (this.events.length < sequence.length)
            return false;
        let sequenceIndex = 0;
        for (const event of this.events) {
            if (event.name === sequence[sequenceIndex]) {
                sequenceIndex++;
                if (sequenceIndex === sequence.length) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Clear all recorded events
     */
    clearEvents() {
        this.events = [];
    }
    /**
     * Register a listener for events as they occur
     * @param eventName - Name of the event to listen for, or 'event' for all events
     * @param listener - Callback function when the event occurs
     */
    on(eventName, listener) {
        this.emitter.on(eventName, listener);
    }
    /**
     * Remove a listener
     * @param eventName - Name of the event
     * @param listener - Listener to remove
     */
    off(eventName, listener) {
        this.emitter.off(eventName, listener);
    }
}
/**
 * TaskNet-specific trace collector that builds on EventTracer
 * but provides specialized methods for TaskNet operations
 */
export class TaskNetTracer extends EventTracer {
    /**
     * Special method to record task creation
     * @param taskId - ID of the created task
     * @param taskData - Task data
     */
    recordTaskCreation(taskId, taskData) {
        this.recordEvent('task:created', {
            taskId,
            ...taskData
        });
    }
    /**
     * Record task status change
     * @param taskId - ID of the task
     * @param status - New status
     * @param previousStatus - Previous status
     */
    recordTaskStatusChange(taskId, status, previousStatus) {
        this.recordEvent('task:status-changed', {
            taskId,
            status,
            previousStatus
        });
    }
    /**
     * Record task assignment
     * @param taskId - ID of the task
     * @param agentId - ID of the agent
     */
    recordTaskAssignment(taskId, agentId) {
        this.recordEvent('task:assigned', {
            taskId,
            agentId
        });
    }
    /**
     * Record task completion
     * @param taskId - ID of the task
     * @param result - Result data
     */
    recordTaskCompletion(taskId, result) {
        this.recordEvent('task:completed', {
            taskId,
            result
        });
    }
    /**
     * Record task failure
     * @param taskId - ID of the task
     * @param error - Error information
     */
    recordTaskFailure(taskId, error) {
        this.recordEvent('task:failed', {
            taskId,
            error
        });
    }
    /**
     * Record agent registration
     * @param agentId - ID of the agent
     * @param capabilities - Agent capabilities
     */
    recordAgentRegistration(agentId, capabilities) {
        this.recordEvent('agent:registered', {
            agentId,
            capabilities
        });
    }
    /**
     * Record agent status change
     * @param agentId - ID of the agent
     * @param status - New status
     */
    recordAgentStatusChange(agentId, status) {
        this.recordEvent('agent:status-changed', {
            agentId,
            status
        });
    }
    /**
     * Validate a complex task workflow
     * @param taskId - ID of the task to check
     */
    validateTaskWorkflow(taskId) {
        const requiredEvents = [
            'task:created',
            'task:assigned',
            'task:completed'
        ];
        const taskEvents = this.getEvents()
            .filter(event => event.data && event.data.taskId === taskId)
            .map(event => event.name);
        const missing = requiredEvents.filter(req => !taskEvents.includes(req));
        return {
            valid: missing.length === 0,
            missing
        };
    }
}
/**
 * Create a traceable version of a TaskNet component
 * @param component - Component to make traceable
 * @param tracer - Tracer to use
 */
export function makeTraceable(component, tracer) {
    const handler = {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
                return function (...args) {
                    // Record the method call
                    tracer.recordEvent(`${target.constructor.name}:${String(prop)}:called`, { args });
                    try {
                        const result = value.apply(this === handler ? target : this, args);
                        // Handle promises
                        if (result instanceof Promise) {
                            return result.then((resolvedValue) => {
                                tracer.recordEvent(`${target.constructor.name}:${String(prop)}:resolved`, {
                                    args,
                                    result: resolvedValue
                                });
                                return resolvedValue;
                            }).catch((error) => {
                                tracer.recordEvent(`${target.constructor.name}:${String(prop)}:rejected`, {
                                    args,
                                    error: error?.message || error
                                });
                                throw error;
                            });
                        }
                        // Handle synchronous returns
                        tracer.recordEvent(`${target.constructor.name}:${String(prop)}:returned`, {
                            args,
                            result
                        });
                        return result;
                    }
                    catch (error) {
                        // Handle synchronous errors
                        tracer.recordEvent(`${target.constructor.name}:${String(prop)}:error`, {
                            args,
                            error: error?.message || error
                        });
                        throw error;
                    }
                };
            }
            return value;
        }
    };
    return new Proxy(component, handler);
}
//# sourceMappingURL=event-tracer.js.map