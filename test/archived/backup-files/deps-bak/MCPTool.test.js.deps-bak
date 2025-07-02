/**
 * Unit tests for the MCPTool component
 */
import { render } from 'ink-testing-library.js';
describe('MCPTool', () => {
    it('should have the correct name', () => {
        expect(MCPTool.name).toBe('mcp');
    });
    it('should be enabled', async () => {
        const enabled = await MCPTool.isEnabled();
        expect(enabled).toBe(true);
    });
    it('should need permissions', () => {
        expect(MCPTool.needsPermissions()).toBe(true);
    });
    it('should not be read-only', () => {
        expect(MCPTool.isReadOnly()).toBe(false);
    });
    it('should render tool use message correctly', () => {
        const input = {
            param1: 'value1',
            param2: 42
        };
        const message = MCPTool.renderToolUseMessage(input);
        expect(message).toBe('param1: "value1", param2: 42');
    });
    it('should render tool use rejected message correctly', () => {
        const { lastFrame } = render(MCPTool.renderToolUseRejectedMessage());
        expect(lastFrame()).toContain('permission');
    });
    it('should render tool result message for text output', () => {
        const output = 'Sample output text';
        const { lastFrame } = render(MCPTool.renderToolResultMessage(output, { verbose: false }));
        expect(lastFrame()).toContain('Sample output text');
    });
    it('should render tool result message for array output', () => {
        const output = [
            { type: 'text', text: 'Line 1' },
            { type: 'text', text: 'Line 2' }
        ];
        const { lastFrame } = render(MCPTool.renderToolResultMessage(output, { verbose: false }));
        expect(lastFrame()).toContain('Line 1');
        expect(lastFrame()).toContain('Line 2');
    });
    it('should handle empty output', () => {
        const output = '';
        const { lastFrame } = render(MCPTool.renderToolResultMessage(output, { verbose: false }));
        expect(lastFrame()).toContain('⎿');
    });
    it('should handle null/undefined output', () => {
        const { lastFrame } = render(MCPTool.renderToolResultMessage(null, { verbose: false }));
        expect(lastFrame()).toContain('(No content)');
    });
});
//# sourceMappingURL=MCPTool.test.js.map