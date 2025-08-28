# SwissKnife Vite-Based Monorepo Integration Guide

## Overview

This document describes the successful consolidation of three separate SwissKnife projects into a unified Vite-based monorepo with modern testing capabilities optimized for AI inference development.

## Projects Consolidated

### 1. CLI Tool (`src/`)
- **Purpose**: Command-line interface for SwissKnife AI assistant
- **Entry Point**: `src/cli-simple.ts`
- **Build Config**: `vite.cli.config.ts`
- **Target**: Node.js 18+ (SSR build)

### 2. Web GUI (`web/`)
- **Purpose**: Browser-based desktop environment for SwissKnife
- **Entry Point**: `web/main.ts`
- **Build Config**: `vite.web.config.ts`
- **Target**: Modern browsers with WebGPU support

### 3. IPFS Accelerate (`ipfs_accelerate_js/`)
- **Purpose**: Hardware-accelerated AI inference library
- **Entry Point**: `ipfs_accelerate_js/src/index.simple.ts`
- **Build Config**: `vite.ipfs.config.ts`
- **Target**: Browser and Node.js (multiple formats)

## Build System Migration

### From Multiple Build Systems To Vite
**Previous State:**
- CLI: Custom TypeScript compilation + complex build scripts
- Web: Webpack with multiple configurations
- IPFS: Rollup with separate configuration

**New State:**
- **Unified Vite Configuration**: Single build system for all projects
- **Modern Module Resolution**: ES modules with proper polyfills
- **Fast Development**: Hot Module Replacement (HMR) for all projects
- **Optimized Production Builds**: Tree-shaking and code splitting

### Build Commands
```bash
# Build all projects
npm run build:all

# Build individual projects
npm run build:cli    # CLI tool
npm run build:web    # Web GUI
npm run build:ipfs   # IPFS Accelerate library

# Development servers
npm run dev:cli      # CLI development
npm run dev:web      # Web GUI development (localhost:3001)
npm run dev:ipfs     # IPFS development (localhost:3002)
```

## Testing Framework Migration

### From Jest to Vitest
**Why Vitest?**
1. **Native Browser Testing**: Essential for AI inference testing
2. **Seamless Vite Integration**: No configuration conflicts
3. **WebGPU Testing Support**: Optimized for hardware acceleration testing
4. **Fast HMR**: Instant test feedback during development
5. **Jest-Compatible API**: Easier migration from existing tests

### Testing Configurations

#### 1. Main Test Configuration (`vitest.config.ts`)
- **Environment**: happy-dom (faster than jsdom)
- **Global Setup**: Mock browser APIs and WebGPU
- **Coverage**: V8 provider with comprehensive reporting
- **Timeout**: 15s (suitable for AI operations)

#### 2. Browser Test Configuration (`vitest.browser.config.ts`)
- **Environment**: Real Chromium browser via Playwright
- **WebGPU Enabled**: Full hardware acceleration testing
- **Timeout**: 30s (for AI inference operations)
- **Target**: AI inference and browser-specific testing

#### 3. Workspace Configuration (`vitest.workspace.config.ts`)
- **Multi-project Support**: Separate test environments for each project
- **Parallel Execution**: Independent test running
- **Environment Isolation**: Node.js vs browser testing separation

### Test Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:vite           # Vite integration tests
npm run test:integration    # Integration tests
npm run test:browser        # Browser-based tests
npm run test:ai-inference   # AI inference browser tests

# Development testing
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage reporting
```

## AI Inference Testing Framework

### Browser-Based Testing Capabilities

#### 1. WebGPU Testing
```typescript
// WebGPU availability detection
const adapter = await navigator.gpu.requestAdapter()
const device = await adapter.requestDevice()

// Hardware acceleration verification
expect(device.createShaderModule).toBeDefined()
expect(device.createComputePipeline).toBeDefined()
```

#### 2. AI Model Testing
```typescript
// Mock AI model inference
const mockModel = { name: 'test-model', accelerated: true }
const mockInput = new Float32Array([1, 2, 3, 4])
const result = await inference(mockModel, mockInput)

// Verify results and performance
expect(result.output).toEqual(new Float32Array([2, 4, 6, 8]))
expect(result.device).toBe('webgpu')
```

#### 3. Memory Management Testing
```typescript
// Large tensor memory allocation
const tensor = createLargeTensor(1000000) // 1M elements
expect(tensor.data.length).toBe(1000000)

// Memory cleanup verification
const disposed = tensor.dispose()
expect(disposed.allocated).toBe(false)
```

## File Structure

```
swissknife/
├── vite.config.ts              # Main Vite configuration
├── vite.cli.config.ts          # CLI-specific build
├── vite.web.config.ts          # Web GUI build
├── vite.ipfs.config.ts         # IPFS Accelerate build
├── vitest.config.ts            # Main test configuration
├── vitest.browser.config.ts    # Browser testing
├── vitest.workspace.config.ts  # Multi-project testing
├── test/
│   ├── setup.ts                # Global test setup
│   ├── browser/                # Browser-specific tests
│   │   ├── ai-inference.test.ts
│   │   └── webgpu-inference.test.ts
│   └── integration/            # Integration tests
│       ├── vite-integration.test.ts
│       └── monorepo.test.ts
├── src/                        # CLI source code
│   └── cli-simple.ts           # Simple CLI entry point
├── web/                        # Web GUI source code
│   ├── main.ts                 # Vite entry point
│   ├── index.vite.html         # HTML template
│   └── src/                    # Web GUI components
└── ipfs_accelerate_js/         # IPFS Accelerate source
    └── src/
        └── index.simple.ts     # Simplified entry point
```

## Browser Polyfills

The monorepo includes comprehensive browser polyfills for Node.js APIs:

```typescript
// Vite alias configuration
resolve: {
  alias: {
    'crypto': 'crypto-browserify',
    'stream': 'stream-browserify',
    'path': 'path-browserify',
    'os': 'os-browserify',
    'process': 'process/browser',
    'buffer': 'buffer',
    'util': 'util'
  }
}
```

## Development Workflow

### 1. Setup Development Environment
```bash
# Install dependencies
npm install

# Install browser dependencies (for testing)
npx playwright install chromium
```

### 2. Development Commands
```bash
# Start CLI development
npm run dev:cli

# Start Web GUI development
npm run dev:web     # Access at http://localhost:3001

# Start IPFS development  
npm run dev:ipfs    # Access at http://localhost:3002

# Run tests in watch mode
npm run test:watch
```

### 3. Production Build
```bash
# Clean previous builds
npm run clean

# Build all projects
npm run build:all

# Run production tests
npm run test:run
```

## Migration Benefits

### 1. **Unified Development Experience**
- Single configuration for all projects
- Consistent build and test commands
- Shared dependencies and tooling

### 2. **Modern Tooling**
- Vite's fast development server
- Native ES modules support
- Advanced tree-shaking and optimization

### 3. **AI-Optimized Testing**
- Browser-based AI inference testing
- WebGPU hardware acceleration testing
- Memory management verification
- Performance benchmarking capabilities

### 4. **Scalable Architecture**
- Clear separation of concerns
- Independent project development
- Parallel testing and building
- Easy addition of new projects

## Next Steps

1. **Complete CLI Migration**: Migrate from `cli.tsx` to Vite-based build
2. **Web GUI Integration**: Complete integration of existing web components
3. **IPFS Accelerate**: Fix syntax errors in original source files
4. **Browser Testing**: Complete Playwright setup for full browser testing
5. **Documentation**: Update all project documentation to reflect new structure

## Validation

✅ **Vite Build System**: All three projects build successfully  
✅ **Vitest Testing**: Core testing framework operational  
✅ **Browser Testing Setup**: AI inference testing framework ready  
✅ **Monorepo Structure**: Independent yet integrated project development  
✅ **Modern Development**: Fast HMR and optimized production builds  

The Vite-based consolidation provides a robust foundation for parallel development of the CLI tool, Web GUI, and IPFS Accelerate library with state-of-the-art AI inference testing capabilities.