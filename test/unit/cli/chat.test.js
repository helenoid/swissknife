import sinon from 'sinon';
// Describes tests for the chat command
describe('Chat Command', () => {
    let aiServiceStub;
    let configStub;
    let consoleLogStub;
    let processStdoutStub;
    beforeEach(() => {
        // Stub AIService
        aiServiceStub = {
            getInstance: sinon.stub().returns({
                initialize: sinon.stub().resolves(),
                initSession: sinon.stub(),
                processMessage: sinon.stub().resolves({
                    content: 'Test response',
                    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
                }),
                setModel: sinon.stub().resolves(),
                setTemperature: sinon.stub()
            })
        };
        // Stub ConfigurationManager
        configStub = {
            getInstance: sinon.stub().returns({
                get: sinon.stub().callsFake((key) => {
                    if (key === 'agent.defaultModel')
                        return 'test-model';
                    if (key === 'agent.systemPrompt')
                        return 'You are a test assistant';
                    if (key === 'agent.temperature')
                        return 0.7;
                    if (key === 'agent.chatHistory')
                        return [];
                    return null;
                }),
                set: sinon.stub()
            })
        };
        // Stub console.log
        consoleLogStub = sinon.stub(console, 'log');
        // Stub process.stdout.write
        processStdoutStub = sinon.stub(process.stdout, 'write');
        // Replace the original dependencies with stubs
        global.AIService = aiServiceStub;
        global.ConfigurationManager = configStub;
    });
    afterEach(() => {
        // Restore the stubs
        consoleLogStub.restore();
        processStdoutStub.restore();
        sinon.restore();
        delete global.AIService;
        delete global.ConfigurationManager;
    });
    it('should initialize with the correct configuration', async () => {
        // This test is a placeholder as we can't fully test the chat command without mocking the readline interface
        expect(chatCommand.name()).toBe('chat');
        expect(chatCommand.description()).toContain('interactive chat session');
    });
    it('should have the correct options', () => {
        const options = chatCommand.options;
        const optionNames = options.map((option) => option.name());
        expect(optionNames).toContain('model');
        expect(optionNames).toContain('system');
        expect(optionNames).toContain('temp');
        expect(optionNames).toContain('no-history');
        expect(optionNames).toContain('debug');
    });
    // Additional tests that would be useful but require more complex mocking:
    // - Test that commands like /clear, /help, /info work correctly
    // - Test error handling scenarios
    // - Test the auto-save functionality
    // - Test keyboard shortcut handling
});
//# sourceMappingURL=chat.test.js.map