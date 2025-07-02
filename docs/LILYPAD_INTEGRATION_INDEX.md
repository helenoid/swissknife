# Lilypad Integration in SwissKnife Unified Architecture

This document serves as an index for all documentation related to the Lilypad provider integration within the SwissKnife unified architecture.

## Integration Overview

Lilypad is integrated as a model provider within our domain-driven unified architecture. This integration provides access to Lilypad's Anura API through a clean room TypeScript implementation that follows our domain-based organization principles.

## Documentation Structure

| Document | Purpose | Target Audience |
|----------|---------|----------------|
| [Lilypad Integration Details](LILYPAD_INTEGRATION.md) | Primary integration documentation with implementation details | Developers |
| [Unified Architecture](UNIFIED_ARCHITECTURE.md) | Overall architecture and integration approach | Architects, Lead Developers |
| [Project Structure](PROJECT_STRUCTURE.md) | Domain-based organization including Lilypad components | Developers |
| [API Key Management](API_KEY_MANAGEMENT.md) | How Lilypad API keys are managed (via `ApiKeyManager`) | Developers |
| [Developer Guide](DEVELOPER_GUIDE.md) | General development workflow and testing | Developers |
| [Migration Guide](MIGRATION_GUIDE.md) | (If relevant for Lilypad-specific aspects) | Developers |

## Integration in Domain Structure

Lilypad is integrated within our unified domain structure as follows:

### AI Domain (`src/ai/`)
- **Provider**: `src/ai/models/providers/lilypad.ts` (or similar) - Implements the `ModelProvider` interface for Lilypad's Anura API.
- **Registry**: `src/ai/models/registry.ts` - Registers the `LilypadProvider` and its models.

### Auth/Config Domain (`src/auth/`, `src/config/`)
- **API Keys**: `src/auth/api-key-manager.ts` - Handles retrieval of `LILYPAD_API_KEY` or `ANURA_API_KEY` from environment or secure config.
- **Configuration**: `src/config/manager.ts` - Stores configuration related to the Lilypad provider (e.g., API endpoint, default models).

### CLI Domain (`src/commands/`)
- **Model Commands**: `src/commands/model.ts` (or similar) - Commands like `model list` will show Lilypad models. `model set-default` can select a Lilypad model.
- **Agent Commands**: `src/commands/agent.ts` - Commands like `agent chat` or `agent execute` can use Lilypad models via the `--model` flag.

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
  - **Unit Tests**: `test/unit/ai/models/providers/lilypad.test.ts` (or similar) - Tests the `LilypadProvider` class in isolation, mocking API calls.
- **Integration Tests**: `test/integration/ai/lilypad.test.ts` (or similar) - Tests the interaction of the `LilypadProvider` with the `ModelRegistry`, `ApiKeyManager`, and potentially makes live (but controlled) API calls in specific test environments.
- **End-to-End Tests**: `test/e2e/workflows/lilypad.test.ts` (or similar) - Tests CLI commands like `agent chat --model lilypad/...` or `image create --model lilypad/...` to ensure the full workflow functions correctly.

## User Commands

Users interact with Lilypad models via standard SwissKnife commands:

```bash
# List available models, including Lilypad's
swissknife model list --provider lilypad

# Chat using a specific Lilypad model
swissknife agent chat --model lilypad/llama3.1:8b

# Execute a prompt using a Lilypad model
swissknife agent execute "Translate to French: Hello" --model lilypad/mistral:7b

# Generate an image using SDXL Turbo on Lilypad (Conceptual command)
# swissknife image generate "A futuristic cityscape" --model lilypad/sdxl-turbo

# Configure the Lilypad API key (using the general config command)
swissknife config set apiKeys.lilypad <your-lilypad-api-key>
# Or set environment variable: export LILYPAD_API_KEY=<your-lilypad-api-key>
```

## Developer Guidelines

When contributing to the Lilypad integration:

1.  Adhere to the project's domain-driven structure and coding standards ([CONTRIBUTING.md](./CONTRIBUTING.md)).
2.  Implement changes within the `LilypadProvider` class (`src/ai/models/providers/lilypad.ts`).
3.  Use the `ApiKeyManager` (`src/auth/api-key-manager.ts`) to retrieve API keys securely.
4.  Handle potential errors from the Anura API gracefully (network errors, rate limits, invalid requests).
5.  Add corresponding unit and integration tests for any new functionality or bug fixes.
6.  Update relevant documentation, including this index and potentially the provider's TSDoc comments.

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
- [SwissKnife Project Structure](./PROJECT_STRUCTURE.md)
