# Lilypad Integration in SwissKnife Unified Architecture

This document serves as an index for all documentation related to the Lilypad provider integration within the SwissKnife unified architecture.

## Integration Overview

Lilypad is integrated as a model provider within our domain-driven unified architecture. This integration provides access to Lilypad's Anura API through a clean room TypeScript implementation that follows our domain-based organization principles.

## Documentation Structure

| Document | Purpose | Target Audience |
|----------|---------|----------------|
| [Lilypad Integration](LILYPAD_INTEGRATION.md) | Primary integration documentation with implementation details | Developers |
| [Unified Integration Plan](unified_integration_plan.md) | Overall architecture and integration approach | Architects, Lead Developers |
| [Project Structure](PROJECT_STRUCTURE.md) | Domain-based organization with Lilypad components | Developers |
| [API Key Management](API_KEY_MANAGEMENT.md) | How Lilypad API keys are managed in the unified architecture | Developers |
| [Migration Guide](MIGRATION_GUIDE.md) | Guidelines for migrating to the unified architecture | Developers |

## Integration in Domain Structure

Lilypad is integrated within our unified domain structure as follows:

### AI Domain
- `src/ai/models/providers/lilypad-provider.ts` - Primary provider implementation
- `src/ai/models/registry.ts` - Registration with ModelRegistry

### Configuration Domain
- `src/config/api-key-manager.ts` - API key management for Lilypad
- `src/config/schema.ts` - Configuration schema with Lilypad settings

### CLI Domain
- `src/cli/commands/model-commands.ts` - Lilypad-specific commands

## Key Features

The Lilypad integration provides:

1. **Access to 8 Models**:
   - 7 text generation models (llama3.1:8b, qwen2.5:7b, qwen2.5-coder:7b, phi4-mini:3.8b, mistral:7b, llama2:7b, deepseek-r1:7b)
   - 1 image generation model (sdxl-turbo)

2. **OpenAI-Compatible Interface**:
   - Chat completions API
   - Function calling for compatible models
   - Tool choice for compatible models

3. **Integrated API Key Management**:
   - Support for LILYPAD_API_KEY and ANURA_API_KEY environment variables
   - Storage in the unified configuration system
   - Key rotation and failure handling

## Testing Structure

Testing follows our domain-based testing approach:

- **Unit Tests**: Testing Lilypad provider in isolation
  - `test/unit/ai/models/providers/lilypad-provider.test.ts`

- **Integration Tests**: Testing cross-domain functionality
  - `test/integration/ai/lilypad-integration.test.ts`
  - `test/integration/cli/lilypad-commands.test.ts`

- **End-to-End Tests**: Testing full workflows
  - `test/e2e/lilypad-workflow.test.ts`

## User Commands

Users can interact with Lilypad models through these commands:

```
# Select Lilypad provider and configure
/model provider lilypad

# Chat with a Lilypad model
/agent chat --model=lilypad/llama3.1:8b

# Generate an image
/image create --model=lilypad/sdxl-turbo --prompt="A beautiful sunset"

# Configure API key
/config set ai.lilypad.apiKey your-api-key-here
```

## Developer Guidelines

When working with the Lilypad integration:

1. Follow the domain-driven structure
2. Use the ModelProvider interface for implementation
3. Leverage the APIKeyManager for key handling
4. Implement appropriate error handling for API responses
5. Add unit and integration tests for new functionality

## Future Enhancements

Planned improvements to the Lilypad integration:

1. Support for streaming responses
2. Web search integration
3. Job monitoring interface
4. Advanced parameter configuration
5. Batch request optimization

## References

- [Lilypad API Documentation](https://docs.lilypad.tech/lilypad/developer-resources/inference-api)
- [Anura API Dashboard](https://anura.lilypad.tech/)
- [SwissKnife Unified Architecture](./UNIFIED_ARCHITECTURE.md)
- [SwissKnife Domain Organization](./PROJECT_STRUCTURE.md)