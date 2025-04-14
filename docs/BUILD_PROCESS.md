# SwissKnife Build Process

This document outlines the build process for the SwissKnife CLI, which involves compiling TypeScript code and bundling dependencies to create an executable Node.js application. It also covers common issues and solutions related to this process.

## Overview

SwissKnife uses TypeScript for development and relies on tools like `tsx` (for development) and potentially `bun` or `esbuild` (via `build.js`) for creating production builds. The goal is to produce a performant, executable CLI application (`cli.mjs`) that includes all necessary code while correctly handling Node.js built-ins and external dependencies, especially those related to terminal UI. Understanding this process is crucial for contributing and troubleshooting.

```mermaid
graph TD
    A[src/**/*.ts] --> B{TypeScript Compiler (tsc)};
    B -- Type Checking --> B;
    A --> C{Build Script (build.js)};
    C -- Uses --> D[Bun Build / tsx / esbuild];
    D -- Bundling & Minification --> E[dist/cli.mjs];
    E -- Add Shebang & Executable Perms --> F(Executable CLI);

    style F fill:#ccf,stroke:#333
```

## Build Scripts

SwissKnife offers multiple build approaches, each with different characteristics:

### `npm run dev` / `pnpm run dev`

```bash
tsx ./src/entrypoints/cli.tsx --verbose # Example command
```

- **Purpose**: Runs the CLI directly from TypeScript source using `tsx` for fast development iterations.
- **Advantages**:
    - No separate build step required.
    - Easier debugging with source maps.
    - Avoids potential bundling issues related to dynamic imports or dependencies.
- **Use When**: Actively developing features, running local tests quickly.

### `npm run build` / `pnpm run build`

```bash
node --no-warnings=ExperimentalWarning ./build.js # Example command
```

- **Purpose**: Creates an optimized production build, typically bundled into `dist/cli.mjs`.
- **Process**:
    - Executes the `build.js` script.
    - This script likely orchestrates a build using `bun build` (if available and configured) or potentially `esbuild` or `tsx` as fallbacks.
    - Bundles necessary code, applies minification.
    - Adds the Node.js shebang (`#!/usr/bin/env node`).
    - Sets executable permissions on the output file.
- **Use When**: Creating distributable versions, testing production-like behavior, before running E2E tests against the build output.

### `npm run build:tsx` / `pnpm run build:tsx` (If exists)

```bash
# Example command if build.tsx exists
mkdir -p temp && tsx ./src/build/build.tsx
```

- **Purpose**: Alternative build method potentially using `tsx` and custom build logic defined in `src/build/build.tsx`.
- **Advantages**: May offer more control or handle specific dependency issues differently than the default build script.
- **Use When**: Troubleshooting issues with the default `npm run build`, or if this script implements specific build requirements.

### `npm run build:bun` / `pnpm run build:bun` (If exists)

```bash
# Example command
bun build src/entrypoints/cli.tsx --minify --outfile dist/cli.mjs --target=node
```

- **Purpose**: Builds the project specifically using Bun's fast, integrated bundler.
- **Advantages**: Potentially very fast build times and good optimization.
- **Use When**: Bun is installed and preferred; dependencies are known to be compatible with Bun's bundling.

### `npm run build:legacy` / `pnpm run build:legacy` (If exists)

```bash
# Example command
mkdir -p temp && node --no-warnings=ExperimentalWarning ./build-wrapper.js
```

- **Purpose**: Executes an older or alternative build process defined in `build-wrapper.js`.
- **Use When**: Required for specific backward compatibility reasons or if the main build scripts fail. Its exact behavior depends on the content of `build-wrapper.js`.

## Common Build Challenges

### 1. Color Formatting Issues

Problem: Errors like `v$.default.color.ansi is not a function` occur during bundling because terminal color libraries (chalk, kleur) are transformed in ways that break their APIs.

#### Solution Approaches:

1. **Mark as External**: Configure the bundler (esbuild, Bun) to treat these libraries as external dependencies. This prevents the bundler from trying to rewrite their internal logic, assuming they will be available via `require` in the final Node.js environment.
   ```javascript
   // Example for esbuild config within build.js
   build({
     // ... other options
     external: ['chalk', 'kleur', 'ink', /* other TUI libs */],
   });
   ```
2. **Use Safe Wrappers**: If marking as external isn't feasible or causes other issues, create a utility module that imports the library and re-exports only the needed functions in a way the bundler can understand statically.
   ```typescript
   // src/utils/safe-chalk.ts
   import chalk from 'chalk';

   // Re-export specific functions statically
   export const red = chalk.red;
   export const green = chalk.green;
   export const bold = chalk.bold;
   // ... etc.

   // Then import from './safe-chalk' instead of 'chalk'
   ```

### 2. Dynamic Requires

Problem: Errors like `Dynamic require of "stream" is not supported` occur when the bundler encounters dynamic requires of Node.js built-in modules.

#### Solution Approaches:

1. **Use Static Imports**: Prefer standard ES Module `import` statements, which bundlers handle well.
   ```typescript
   // Preferred
   import * as fs from 'fs/promises';
   import path from 'path';
   ```
2. **Mark Node Built-ins as External**: Ensure the bundler configuration explicitly marks all Node.js built-in modules (`fs`, `path`, `os`, `crypto`, `stream`, `util`, `events`, etc.) as external. Bundlers like esbuild and Bun often do this by default for the `node` target, but verifying it is crucial.
   ```javascript
   // Example for esbuild config within build.js
   build({
     // ... other options
     platform: 'node', // Ensures built-ins are treated correctly
     external: ['fs', 'path', /* ... other built-ins if needed ... */],
   });
   ```
3. **Avoid Dynamic `require()`**: Refactor code to avoid dynamic `require(variable)` calls. If unavoidable (e.g., optional dependencies), wrap them carefully or use techniques like `eval('require')(...)` which some bundlers might ignore (use with caution).

## Dependency Management

For reliable builds, follow these principles for dependencies:

1. **Direct Dependencies**: 
   - Keep direct dependencies to a minimum
   - Prefer dependencies with ESM support
   - Avoid dependencies with complex dynamic loading patterns

2. **Terminal UI Libraries**:
   - Be cautious with terminal UI libraries (ink, chalk, kleur)
   - Consider marking them as external in the bundler
   - Test build output thoroughly after adding new terminal UI libraries

3. **Node.js Built-in Modules**:
   - Always use static imports for Node.js built-in modules when possible
   - Mark Node.js built-in modules as external in bundler configuration

## Recommended Build Configuration (Conceptual Example for `build.js` using esbuild)

While the specific `build.js` might use Bun or tsx, a configuration using `esbuild` (a common choice for such scripts) would look something like this:

```javascript
// build.js (Simplified Example using esbuild API)
import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

async function runBuild() {
  try {
    const outfile = path.resolve(__dirname, '../dist/cli.mjs'); // Ensure output path is correct

    await build({
      entryPoints: [path.resolve(__dirname, '../src/entrypoints/cli.ts')], // Entry point TS file
      bundle: true,
      outfile: outfile,
      platform: 'node', // Target Node.js environment
      target: 'node18', // Target specific Node.js version
      format: 'esm',    // Output ES Module format
      minify: true,     // Minify for production
      sourcemap: true,  // Generate source maps for debugging
      external: [       // List dependencies NOT to bundle
        // Node.js built-ins are usually external by default with platform: 'node'
        // Add problematic TUI/other libs if needed:
        // 'chalk',
        // 'ink',
        // 'yoga-layout-prebuilt', // Often needed for Ink
        // ... other externals based on build errors ...
      ],
      banner: {
        js: '#!/usr/bin/env node', // Add shebang
      },
      // Add loaders if needed (e.g., for JSON, binary files)
      // loader: { '.node': 'file' },
      // Add plugins if needed (e.g., for path aliases)
      // plugins: [ /* ... */ ],
    });

    // Make the output file executable
    await fs.chmod(outfile, 0o755);

    console.log(`Build successful: ${outfile}`);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
```
*Note: The actual `build.js` might be more complex, potentially detecting Bun and using its API instead.*

## Testing Builds

Always test builds thoroughly:

1. **Basic Execution & Help**: Run the built executable (`dist/cli.mjs`) with common flags.
   ```bash
   node dist/cli.mjs --help
   node dist/cli.mjs --version
   ```
2. **Command Functionality**: Test core commands that interact with different systems.
   ```bash
   node dist/cli.mjs config list
   node dist/cli.mjs agent execute "Simple prompt" --output json
   # Add tests for storage, task commands etc.
   ```
3. **Color/Formatting Output**: Run commands known to produce styled output (tables, colors) and verify rendering in a compatible terminal.
   ```bash
   node dist/cli.mjs model list
   ```
4. **Interactive Features**: If possible, manually test interactive commands like `agent chat` using the built executable. Automated E2E tests might cover some aspects.
5. **Error Handling**: Trigger expected errors and verify the output formatting.
   ```bash
   node dist/cli.mjs unknown-command
   node dist/cli.mjs config get non-existent-key
   ```
6. **Verify Build Script**: The `npm run test:verify-build` script should perform some of these checks automatically.

## Continuous Integration (CI)

The CI pipeline (defined in `.github/workflows/`) typically performs these steps on each push/PR:

1. **Setup**: Check out code, set up Node.js, pnpm, Bun.
2. **Install Dependencies**: `pnpm install`.
3. **Lint & Format Check**: `pnpm run format:check`, `pnpm run lint`.
4. **Type Check**: `pnpm run typecheck`.
5. **Run Tests**: `pnpm test` (or run unit/integration/e2e separately).
6. **Build**: `bun run build`.
7. **Verify Build**: `pnpm run test:verify-build` (runs basic checks on the built artifact).
8. **(Optional) Publish**: On tagged releases, publish the package to npm.

## Further Reading

- [esbuild Documentation](https://esbuild.github.io/)
- [Bun Bundler Documentation](https://bun.sh/docs/bundler)
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
