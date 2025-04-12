# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- Run JavaScript tests: `node test/test_skills.js` or any specific test file
- Run Python tests: `python worker/skillset/test/test_llama_cpp_kit.py` or any specific test file
- Run a specific test: Find the test file in `test/skills/` or `worker/skillset/test/` and run directly
- Execute with Node.js: Most JavaScript files use ES modules (`type: "module"` in package.json)

## Code Style Guidelines
- Imports: ES modules for JS (`import * from`), standard imports for Python
- Error handling: Use try/catch/finally blocks with explicit error logging
- Naming: snake_case for Python files/functions, camelCase for JavaScript 
- Test structure: Export a `main()` function that returns a test configuration object
- Type conventions: Basic type checks via `typeof` in JS, docstrings for Python
- Asynchronous code: Prefer synchronous operations with explicit callbacks
- File organization: Group by functionality (models, skills, tests)
- No trailing semicolons in JavaScript
- Use JSON for configuration