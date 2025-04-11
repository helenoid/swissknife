# Swiss Knife


https://github.com/user-attachments/assets/7a9253a7-8bb0-40d5-a3f3-5e6096d7c789


Terminal-based AI coding tool that can use any model that supports the OpenAI-style API.

- Fixes your spaghetti code
- Explains wtf that function does
- Runs tests, shell commands and stuff
- Whatever else claude-code can do, depending on the model you use

## HOW TO USE

### Option 1: Install from NPM (stable release)

```bash
npm install -g swissknife
cd your-project
kode
```

### Option 2: Install from source (latest development version)

```bash
# Clone the repository
git clone https://github.com/endomorphosis/swissknife.git
cd swissknife

# Run the installer script (this will install dependencies, build, and install globally)
./install.sh
# OR
npm run install-global

# Use the tool
cd swissknife
```

The installer script will:
- Check your Node.js version (requires Node.js 18+)
- Install Bun if not already installed
- Install dependencies with appropriate flags
- Build the project
- Install the tool globally
- Create `swissknife` commands

For more information, run `./install.sh --help`

You can use the onboarding to set up the model, or `/model`.
If you don't see the models you want on the list, you can manually set them in `/config`
As long as you have an openai-like endpoint, it should work.

## USE AS MCP SERVER

Find the full path to `swissknife` with `which swissknife` then add the config to Claude Desktop:
```
{
  "mcpServers": {
    "claude-code": {
      "command": "/path/to/swissknife",
      "args": ["mcp", "serve"]
    }
  }
}
```

## HOW TO DEV

```bash
# Install dependencies
pnpm i  # or npm install --legacy-peer-deps

# Make sure Bun is installed (required for build)
# If not installed: npm install -g bun

# Development (run in development mode)
pnpm run dev  # or npm run dev

# Build (creates the executable)
bun run build

# Install globally for testing
npm run install-global  # or ./install.sh
```

Get some more logs while debugging:
```bash
NODE_ENV=development pnpm run dev --verbose --debug
# or
NODE_ENV=development npm run dev -- --verbose --debug
```

### Development Workflow

1. Make changes to the code
2. Test locally with `pnpm run dev` or `npm run dev`
3. Build with `bun run build`
4. Install globally with `npm run install-global`
5. Test the global installation with `swissknife`

## BUGS

You can submit a bug from within the app with `/bug`, it will open a browser to github issue create with stuff filed out.

## Warning

Use at own risk.


## YOUR DATA

- There's no telemetry or backend servers other than the AI providers you choose

## UNINSTALLATION

To uninstall the tool:

```bash
# Uninstall the global package
npm uninstall -g swissknife

# If you installed Bun just for this project and don't need it anymore
npm uninstall -g bun
```
