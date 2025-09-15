# SwissKnife - Complete Developer Guide

## Overview

SwissKnife is the world's first browser-based collaborative virtual desktop with comprehensive AI integration. This guide provides developers with everything needed to understand, contribute to, and extend the platform.

## Architecture Overview

SwissKnife features a sophisticated multi-layered architecture:

### Core Components
- **🖥️ Virtual Desktop**: Browser-based desktop with 27+ professional applications
- **🤖 AI Integration**: Hugging Face (100k+ models) + OpenRouter (100+ premium models)
- **🤝 P2P Collaboration**: Real-time task sharing and file collaboration
- **⚡ Distributed Computing**: Web workers, audio workers, and edge computing
- **☁️ CloudFlare Integration**: Hybrid P2P + cloud computing
- **🌐 IPFS Network**: Distributed storage and content sharing

### Technology Stack
- **Frontend**: TypeScript, React, Vite, Monaco Editor
- **Styling**: Modern CSS with gradient glass morphism design
- **Networking**: WebRTC, libp2p, IPFS
- **AI**: Hugging Face Transformers, OpenRouter API, WebGPU
- **Workers**: Web Workers, Audio Workers, CloudFlare Workers
- **Build**: Vite with multiple configurations for different deployment modes

## Project Structure

```
swissknife/
├── src/                       # CLI and shared components
├── web/                       # Virtual desktop applications
│   ├── apps/                 # 27+ desktop applications
│   │   ├── huggingface/      # Hugging Face Hub app
│   │   ├── openrouter/       # OpenRouter Hub app
│   │   ├── vibecode/         # Professional AI IDE
│   │   ├── neural-designer/  # Neural network designer
│   │   └── ...               # 23+ additional apps
│   ├── components/           # Shared UI components
│   ├── styles/              # Global styling and themes
│   └── types/               # TypeScript type definitions
├── ipfs_accelerate_js/       # IPFS and P2P infrastructure
├── collaboration/            # Real-time collaboration engine
├── workers/                  # Background worker infrastructure
├── cloudflare/              # CloudFlare integration
├── docs/                    # Complete documentation
└── vite.*.config.ts         # Build configurations
```

## Development Environment Setup

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm**: Latest version
- **Modern Browser**: Chrome/Chromium with WebGPU support preferred
- **Git**: For version control

### Quick Setup
```bash
# Clone repository
git clone https://github.com/hallucinate-llc/swissknife.git
cd swissknife

# Install dependencies
npm install --legacy-peer-deps

# Launch development environment
npm run dev:collaborative

# Open browser
open http://localhost:3001
```

### Environment Configuration
```bash
# AI Provider Configuration
export HUGGINGFACE_API_TOKEN=your_hf_token
export OPENROUTER_API_KEY=your_openrouter_key

# CloudFlare Configuration (Optional)
export CLOUDFLARE_API_TOKEN=your_cf_token
export CLOUDFLARE_ACCOUNT_ID=your_account_id

# Development Settings
export SWISSKNIFE_DEBUG_MODE=true
export SWISSKNIFE_P2P_ENABLED=true
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/amazing-new-feature

# Make changes and test
npm run test
npm run test:collaborative

# Build and validate
npm run build:all
npm run test:production
```

### 2. Application Development
For creating new desktop applications:

```typescript
// web/apps/my-app/MyApp.js
class MyApp {
    constructor() {
        this.name = 'My App';
        this.icon = '🚀';
        this.version = '1.0.0';
    }

    async initialize() {
        // Initialize app resources
        this.setupEventListeners();
        this.loadConfiguration();
    }

    render() {
        return `
            <div class="app-container">
                <div class="app-header">
                    <h1>${this.name}</h1>
                </div>
                <div class="app-content">
                    <!-- Your app content -->
                </div>
            </div>
        `;
    }

    // Required methods for desktop integration
    onFocus() { /* Handle focus */ }
    onBlur() { /* Handle blur */ }
    onClose() { /* Handle close */ }
    onMinimize() { /* Handle minimize */ }
    onRestore() { /* Handle restore */ }
}
```

### 3. AI Integration Development
For integrating AI capabilities:

```typescript
// AI Service Integration
class MyAIService {
    constructor() {
        this.hf = new HuggingFaceIntegration();
        this.openrouter = new OpenRouterIntegration();
    }

    async intelligentInference(prompt, options = {}) {
        // Multi-provider intelligence
        const provider = this.selectOptimalProvider(prompt, options);
        
        try {
            return await provider.inference(prompt, options);
        } catch (error) {
            // Automatic fallback
            return await this.fallbackInference(prompt, options);
        }
    }

    selectOptimalProvider(prompt, options) {
        // Intelligent provider selection logic
        if (options.speed === 'fast') return this.openrouter;
        if (options.cost === 'low') return this.hf;
        return this.hf; // Default to HF
    }
}
```

### 4. Collaboration Features
For adding collaborative features:

```typescript
// P2P Collaboration Integration
class CollaborativeFeature {
    constructor() {
        this.p2p = new CollaborativeP2PManager();
        this.sync = new RealTimeSyncEngine();
    }

    async enableCollaboration(featureName) {
        // Setup collaborative state
        await this.p2p.createSharedState(featureName);
        
        // Subscribe to changes
        this.p2p.onStateChange(featureName, (change) => {
            this.handleRemoteChange(change);
        });

        // Enable real-time sync
        this.sync.enable(featureName);
    }

    async shareData(key, data) {
        await this.p2p.updateSharedState(key, data);
    }
}
```

## Testing Strategy

### Test Hierarchy
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Cross-component interaction testing
3. **Collaboration Tests**: P2P and real-time feature testing
4. **AI Tests**: Model integration and inference testing
5. **E2E Tests**: Complete workflow testing with Playwright

### Running Tests
```bash
# All tests
npm run test

# Specific test suites
npm run test:collaborative      # P2P collaboration
npm run test:huggingface       # HF integration
npm run test:openrouter        # OpenRouter integration
npm run test:edge-deployment   # CloudFlare edge
npm run test:workers           # Worker infrastructure
npm run test:browser           # Browser compatibility
npm run test:e2e:playwright    # End-to-end testing

# Development testing
npm run test:vite              # Vite integration (16 tests)
npm run test:production        # Production readiness
```

### Writing Tests
```typescript
// Example test for AI integration
describe('HuggingFace Integration', () => {
    let hf: HuggingFaceIntegration;

    beforeEach(() => {
        hf = new HuggingFaceIntegration();
    });

    test('should search models successfully', async () => {
        const models = await hf.searchModels('text-generation');
        expect(models.length).toBeGreaterThan(0);
        expect(models[0]).toHaveProperty('modelId');
    });

    test('should perform inference', async () => {
        const result = await hf.inference('gpt2', 'Hello world');
        expect(result).toHaveProperty('generated_text');
    });

    test('should deploy to edge', async () => {
        const deployment = await hf.deployToEdge('gpt2');
        expect(deployment.url).toContain('workers.dev');
    });
});
```

## Build System

### Vite Configurations
- **vite.web.config.ts**: Main virtual desktop build
- **vite.cli.config.ts**: CLI tool build
- **vite.workers.config.ts**: Worker scripts build
- **vite.ipfs.config.ts**: IPFS acceleration build

### Build Commands
```bash
# Development builds
npm run dev                    # Standard development
npm run dev:collaborative      # Collaborative development
npm run dev:cli               # CLI development

# Production builds
npm run build:all             # Build all components
npm run build:collaborative   # Collaborative build
npm run build:workers         # Worker infrastructure
npm run build:docker          # Docker containerization

# Specialized builds
npm run build:ai              # AI integration components
npm run build:edge            # Edge deployment preparation
```

### Build Optimization
```typescript
// vite.config.ts optimization example
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'ai-vendors': ['@huggingface/transformers', 'openrouter-sdk'],
                    'collaboration': ['libp2p', 'ipfs-http-client'],
                    'ui-framework': ['react', 'react-dom'],
                    'editor': ['monaco-editor', '@monaco-editor/react']
                }
            }
        },
        target: 'esnext',
        minify: 'terser',
        sourcemap: true
    },
    optimizeDeps: {
        include: ['ai-providers', 'p2p-libraries'],
        exclude: ['large-binaries']
    }
});
```

## Deployment

### Local Development
```bash
# Standard deployment
npm run desktop

# Collaborative deployment
npm run desktop:collaborative

# Advanced deployment modes
npm run desktop:distributed    # Distributed computing
npm run desktop:cloudflare     # CloudFlare integration
npm run desktop:hybrid         # Complete hybrid mode
```

### Production Deployment
```bash
# Build for production
npm run build:all

# Create Docker container
npm run build:docker
docker run -p 3001:3001 swissknife:latest

# Deploy to CloudFlare
npm run deploy:cloudflare

# Deploy to edge
npm run deploy:edge
```

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --production
COPY . .
RUN npm run build:all
EXPOSE 3001
CMD ["npm", "run", "desktop:collaborative"]
```

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Automatic chunking by Vite
- **Lazy Loading**: Applications load on demand
- **Worker Offloading**: Heavy computations in background workers
- **Caching**: Intelligent caching of AI models and results

### AI Optimization
- **Provider Selection**: Intelligent routing to optimal AI provider
- **Edge Deployment**: Sub-100ms inference via CloudFlare
- **Caching**: Model and result caching for repeated queries
- **Batching**: Batch multiple AI requests for efficiency

### P2P Optimization
- **Connection Pooling**: Efficient peer connection management
- **Data Compression**: Compressed data transfer between peers
- **Selective Sync**: Only sync changed data portions
- **Bandwidth Management**: Adaptive quality based on connection

## Security Guidelines

### API Key Management
```typescript
// Secure API key handling
class SecureAPIManager {
    private keys: Map<string, string> = new Map();

    setKey(provider: string, key: string) {
        // Encrypt key before storage
        const encrypted = this.encrypt(key);
        this.keys.set(provider, encrypted);
    }

    getKey(provider: string): string {
        const encrypted = this.keys.get(provider);
        return encrypted ? this.decrypt(encrypted) : '';
    }

    private encrypt(data: string): string {
        // Implementation with proper encryption
    }

    private decrypt(data: string): string {
        // Implementation with proper decryption
    }
}
```

### P2P Security
- **Encrypted Communication**: All P2P traffic encrypted
- **Peer Authentication**: Cryptographic peer verification
- **Permission System**: Fine-grained access control
- **Data Validation**: Comprehensive input validation

### Content Security Policy
```html
<!-- Strict CSP for production -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval'; 
               connect-src 'self' https://*.huggingface.co https://openrouter.ai;
               worker-src 'self' blob:;">
```

## Contribution Guidelines

### Code Style
- **TypeScript**: Strict mode enabled, full type safety
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with collaborative development rules
- **Naming**: Descriptive names, camelCase for variables, PascalCase for classes

### Commit Guidelines
```bash
# Good commit messages
feat(ai): add Hugging Face model deployment to CloudFlare edge
fix(p2p): resolve connection stability in distributed mode
docs(api): update AI integration documentation
test(collab): add comprehensive P2P collaboration tests
```

### Pull Request Process
1. **Create Feature Branch**: `feature/your-feature-name`
2. **Develop and Test**: Ensure all tests pass
3. **Update Documentation**: Update relevant docs
4. **Create PR**: Provide clear description and testing instructions
5. **Code Review**: Address feedback promptly
6. **Merge**: Squash commits for clean history

## Troubleshooting

### Common Development Issues

#### Port Conflicts
```bash
# Check port usage
lsof -i :3001

# Use alternative port
SWISSKNIFE_PORT=3002 npm run dev:collaborative
```

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install --legacy-peer-deps
npm run build:all
```

#### AI Integration Issues
```bash
# Verify API keys
echo $HUGGINGFACE_API_TOKEN
echo $OPENROUTER_API_KEY

# Test connectivity
curl -H "Authorization: Bearer $HUGGINGFACE_API_TOKEN" \
  https://api-inference.huggingface.co/models/gpt2
```

#### P2P Connection Problems
```bash
# Debug P2P connections
DEBUG=swissknife:p2p npm run dev:collaborative

# Test local network only
SWISSKNIFE_P2P_LOCAL_ONLY=true npm run dev:collaborative
```

### Performance Issues
```bash
# Enable performance monitoring
npm run dev:collaborative -- --profile

# Check memory usage
node --inspect-brk node_modules/.bin/vite dev

# Reduce worker count
SWISSKNIFE_WORKER_COUNT=2 npm run dev:collaborative
```

## Advanced Topics

### Custom AI Provider Integration
```typescript
// Custom AI provider implementation
class CustomAIProvider implements AIProvider {
    id = 'custom-ai';
    name = 'Custom AI Provider';

    async inference(model: string, prompt: string): Promise<AIResult> {
        // Implementation
    }

    async deployToEdge(model: string): Promise<EdgeDeployment> {
        // Implementation
    }
}
```

### Worker Development
```typescript
// Custom worker implementation
// workers/custom-worker.ts
self.onmessage = async (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'process':
            const result = await processData(data);
            self.postMessage({ type: 'result', data: result });
            break;
    }
};
```

### CloudFlare Integration
```typescript
// CloudFlare Worker deployment
export default {
    async fetch(request: Request): Promise<Response> {
        // AI inference at the edge
        const prompt = await request.text();
        const result = await runAIInference(prompt);
        return new Response(JSON.stringify(result));
    }
};
```

## Future Development

### Roadmap Items
- **Phase 7**: Advanced Real-time Collaboration (Voice/Video)
- **Phase 8**: AI-Powered Intelligence (Smart task distribution)
- **Phase 9**: Enterprise Features (SSO, Team management)
- **Phase 10**: Performance & Scalability (Global P2P network)

### Contribution Opportunities
- **New AI Providers**: Integrate additional AI services
- **Enhanced Applications**: Improve existing desktop apps
- **Performance Optimization**: Optimize P2P and AI performance
- **Documentation**: Expand guides and tutorials
- **Testing**: Improve test coverage and automation

## Resources

### Documentation
- **[README.md](../README.md)** - Project overview
- **[AI_INTEGRATION_COMPLETE.md](./AI_INTEGRATION_COMPLETE.md)** - AI features
- **[COLLABORATION_IMPLEMENTATION_PLAN.md](applications/README.md)** - Collaboration architecture
- **[ENTRY_POINTS.md](./ENTRY_POINTS.md)** - Launch modes and configuration

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Development discussions and help
- **Discord**: Real-time developer community (coming soon)
- **Wiki**: Community-contributed documentation

### Learning Resources
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **React**: [React Documentation](https://react.dev/)
- **Vite**: [Vite Guide](https://vitejs.dev/guide/)
- **WebRTC**: [WebRTC Documentation](https://webrtc.org/)
- **IPFS**: [IPFS Documentation](https://docs.ipfs.io/)

---

**Happy developing with SwissKnife! 🚀**

# Type check
npm run typecheck

# Run tests
npm run test # Runs all tests (unit, integration, e2e)

# Build (Requires Bun)
bun run build

# Verify build
npm run test:verify-build
```

### 4. Creating a Pull Request

When your changes are ready:

1. Push your branch:
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. Create a pull request on GitHub:
   - Use a clear title describing your changes
   - Fill out the PR template with details of your changes
   - Link to any related issues

### 5. CI Checks and Code Review

After creating a PR:

1. CI checks will run automatically
2. Address any CI failures by pushing fixes to your branch
3. Request reviews from team members
4. Address feedback from reviewers with additional commits

### 6. Merging and Deployment

When your PR is approved:

1. Merge your PR via GitHub (select "Squash and merge" if many small commits)
2. CI will automatically build and deploy to staging
3. Verify your changes work correctly in staging
4. For production deployment, follow the [release process](#release-process)

## Working with Tests

The project uses **Jest** as the test runner.

### Test Structure

Tests are organized mirroring the `src/` structure within the `test/` directory:

- **`test/unit/`**: Tests for individual modules/classes in isolation. Dependencies should be mocked using `jest.mock()`.
- **`test/integration/`**: Tests interactions between multiple internal components/services. External dependencies (APIs, network) should be mocked.
- **`test/e2e/`**: Tests complete user workflows by running the built CLI application (`dist/cli.mjs`) as a child process. Assert on stdout, stderr, exit codes, and file system side effects.
- **`test/helpers/`**: Reusable test utilities (e.g., creating temp dirs, mocking env vars, capturing console output).
- **`test/mocks/`**: Reusable mock implementations for complex dependencies.
- **`test/fixtures/`**: Static data or functions to generate data for tests.
- **`test/plans/`**: Detailed test plans (like [Phase 3 Test Plan](TESTING_BEST_PRACTICES.md)).

### Running Tests

Use npm or pnpm scripts:

```bash
# Run all tests (unit, integration, e2e) defined in package.json "test" script
npm test
pnpm test

# Run tests in watch mode during development
npm run test:watch
pnpm test:watch

# Run specific test file(s)
npx jest test/unit/ai/agent.test.ts
pnpm test test/unit/ai/agent.test.ts

# Run tests with coverage report
npm run test:coverage
pnpm test:coverage
```
*(Note: Specific scripts like `test:unit`, `test:integration`, `test:e2e` might exist or can be added to `package.json`)*

### Writing Tests

- Use TypeScript (`.test.ts`, `.test.tsx`).
- Use `describe`, `it` (or `test`), `beforeEach`, `afterEach`, `beforeAll`, `afterAll` blocks.
- Use Jest's assertion library (`expect`).
- Use `jest.mock()` for mocking dependencies.
- Follow Arrange-Act-Assert structure within tests.
- Use helpers and fixtures from `test/helpers/` and `test/fixtures/` to keep tests clean.

Example Unit Test Structure:

```typescript
// test/unit/utils/some-util.test.ts
import { someUtilFunction } from '@/utils/some-util.js'; // Use .js extension

// Mock dependencies if needed
jest.mock('@/config/manager.js', () => ({ /* ... mock ... */ }));

describe('someUtilFunction', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should handle valid input correctly', () => {
    // Arrange
    const input = 'test';
    const expectedOutput = 'TEST';

    // Act
    const result = someUtilFunction(input);

    // Assert
    expect(result).toBe(expectedOutput);
  });

  it('should throw an error for invalid input', () => {
    // Arrange
    const invalidInput = null;

    // Act & Assert
    expect(() => someUtilFunction(invalidInput as any)).toThrow('Invalid input');
  });
});
```

## Running CI/CD Locally

You can simulate CI/CD jobs locally:

### Running CI Checks

```bash
# Validation
npm run format:check
npm run lint
npm run typecheck

# Testing
npm run test:unit
npm run test:integration
npm run test:e2e

# Building
npm run build
npm run test:verify-build

# Benchmarking (if configured)
npm run benchmark
pnpm benchmark
```

### Testing Deployments Locally

```bash
# Configure for staging
npm run config:staging

# Test staging deployment (won't actually deploy)
NODE_ENV=staging STAGING_DEPLOY_TOKEN=test-token node scripts/deploy.js staging --dry-run

# Configure for production
npm run config:production

# Test production deployment (won't actually deploy)
NODE_ENV=production PRODUCTION_DEPLOY_TOKEN=test-token node scripts/deploy.js production --dry-run
```

## Release Process

### Creating a Release

1. Ensure all changes for the release are merged to `main`
2. Verify the code works correctly in staging
3. Create a new release via GitHub:
   - Go to "Releases" and click "Draft a new release"
   - Create a new tag with the version (e.g., `v1.2.3`)
   - Use semantic versioning format (`vMAJOR.MINOR.PATCH`)
   - Write release notes detailing the changes
   - Publish release

4. The CD workflow will automatically:
   - Deploy to production
   - Publish to npm

### Hotfix Process

For urgent fixes to production:

1. Create a hotfix branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/issue-description
   ```

2. Make minimal changes to fix the issue
3. Run tests to ensure nothing is broken
4. Create a PR and mark it as a hotfix
5. After approval and merge, create a new release with patch version increase

## Troubleshooting CI/CD Issues

### Common CI Failures

1. **Linting/Formatting Errors**:
   - Run `pnpm run format:check` and `pnpm run lint` locally.
   - Fix automatically with `pnpm run format`.
2. **Type Errors**:
   - Run `pnpm run typecheck` locally.
   - Resolve TypeScript errors in the code.
3. **Test Failures**:
   - Check the CI logs for details on failing tests.
   - Run the specific failing test file locally using Jest (e.g., `npx jest test/unit/some.test.ts`).
   - Debug the test or the code being tested.
4. **Build Failures**:
   - Check for TypeScript errors (`pnpm run typecheck`).
   - Ensure all dependencies are installed correctly (`pnpm install`).
   - Try a clean build: `pnpm run clean && bun run build`.
5. **Module Resolution Errors (in Tests)**:
   - As noted during refactoring, persistent errors like "Cannot find module" in `.ts` test files likely indicate a project configuration issue (`tsconfig.json` or `jest.config.cjs`) related to ES Module resolution or path aliases.
   - **Solution**: This requires a developer to investigate and correct the Jest/TypeScript configuration to properly handle `.js` extensions in imports and path mappings. Ensure `moduleResolution` in `tsconfig.json` and Jest's `moduleNameMapper` and `transform` settings are correctly configured for ESM.

### Getting Help

If you're stuck with CI/CD issues:

1. Check the detailed CI/CD documentation in `/docs/CICD.md`
2. Look through previous similar issues in GitHub
3. Ask for help in the team's development channel

## Best Practices

### Commit Messages

Follow this format for consistent commit messages:

```
type(scope): brief description

longer description if needed
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or improving tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): add password reset functionality

- Adds API endpoint for requesting password reset
- Sends email with reset token
- Adds form for creating new password
```

### Pull Request Best Practices

1. **Keep PRs Small**: Aim for focused PRs that do one thing well
2. **Descriptive Title**: Clear title that describes the change
3. **Link Issues**: Reference related issues with `#issue-number`
4. **Screenshots/Videos**: Include for UI changes
5. **Self-Review**: Review your own code before requesting reviews
6. **Tests**: Include tests for new functionality or bug fixes
7. **Documentation**: Update docs for API or behavior changes

### Handling Flaky Tests

If you encounter intermittently failing tests:

1. Mark the test as flaky with a comment explaining why
2. Create an issue to fix the flaky test
3. Don't disable tests without a tracking issue

Example:
```javascript
// TODO(username): This test is flaky due to timing issues - Issue #123
test.retry(3)('should handle concurrent operations', () => {
  // Test code
});
```

## Advanced Topics

### Adding a New Environment

To add a new environment (e.g., "develop"):

1. Create a new environment configuration:
   ```javascript
   // config/develop.json
   {
     "apiUrl": "https://api.develop.example.com",
     "debug": true,
     "featureFlags": {
       // Environment-specific flags
     }
   }
   ```

2. Update the configuration script to handle the new environment
3. Add a new deployment job in the CD workflow

### Modifying CI/CD Workflows

If you need to modify the CI/CD workflows:

1. Make changes to workflow files in `.github/workflows/`
2. Test the changes locally first
3. Create a separate PR for workflow changes
4. Thoroughly document changes in the PR description
5. Be cautious about modifying production deployment steps
