/**
 * Trace-based testing utility for TaskNet components
 *
 * This module provides a framework for recording and validating complex event sequences
 * in TaskNet components, enabling sophisticated tracing and verification of
 * asynchronous event flows.
 */
/**
 * Event trace class for recording and validating event sequences
 */
export declare class EventTracer {
    private events;
    private emitter;
    private isRecording;
    constructor();
    /**
     * Start recording events
     */
    startRecording(): void;
    /**
     * Stop recording events
     */
    stopRecording(): void;
    /**
     * Record an event
     * @param name - Event name
     * @param data - Event data
     */
    recordEvent(name: string, data?: any): void;
    /**
     * Get all recorded events
     */
    getEvents(): Array<{
        name: string;
        timestamp: number;
        data: any;
    }>;
    /**
     * Get events by name
     * @param name - Event name to filter by
     */
    getEventsByName(name: string): Array<{
        name: string;
        timestamp: number;
        data: any;
    }>;
    /**
     * Check if a specific sequence of events has occurred in order
     * @param sequence - Array of event names to check for in sequence
     */
    hasSequence(sequence: string[]): boolean;
    /**
     * Clear all recorded events
     */
    clearEvents(): void;
    /**
     * Register a listener for events as they occur
     * @param eventName - Name of the event to listen for, or 'event' for all events
     * @param listener - Callback function when the event occurs
     */
    on(eventName: string, listener: (...args: any[]) => void): void;
    /**
     * Remove a listener
     * @param eventName - Name of the event
     * @param listener - Listener to remove
     */
    off(eventName: string, listener: (...args: any[]) => void): void;
}
/**
 * TaskNet-specific trace collector that builds on EventTracer
 * but provides specialized methods for TaskNet operations
 */
export declare class TaskNetTracer extends EventTracer {
    /**
     * Special method to record task creation
     * @param taskId - ID of the created task
     * @param taskData - Task data
     */
    recordTaskCreation(taskId: string, taskData: any): void;
    /**
     * Record task status change
     * @param taskId - ID of the task
     * @param status - New status
     * @param previousStatus - Previous status
     */
    recordTaskStatusChange(taskId: string, status: string, previousStatus: string): void;
    /**
     * Record task assignment
     * @param taskId - ID of the task
     * @param agentId - ID of the agent
     */
    recordTaskAssignment(taskId: string, agentId: string): void;
    /**
     * Record task completion
     * @param taskId - ID of the task
     * @param result - Result data
     */
    recordTaskCompletion(taskId: string, result: any): void;
    /**
     * Record task failure
     * @param taskId - ID of the task
     * @param error - Error information
     */
    recordTaskFailure(taskId: string, error: any): void;
    /**
     * Record agent registration
     * @param agentId - ID of the agent
     * @param capabilities - Agent capabilities
     */
    recordAgentRegistration(agentId: string, capabilities: string[]): void;
    /**
     * Record agent status change
     * @param agentId - ID of the agent
     * @param status - New status
     */
    recordAgentStatusChange(agentId: string, status: string): void;
    /**
     * Validate a complex task workflow
     * @param taskId - ID of the task to check
     */
    validateTaskWorkflow(taskId: string): {
        valid: boolean;
        missing: string[];
    };
}
/**
 * Create a traceable version of a TaskNet component
 * @param component - Component to make traceable
 * @param tracer - Tracer to use
 */
export declare function makeTraceable<T extends object>(component: T, tracer: EventTracer): T;
