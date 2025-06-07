// setup-jest-typescript.js
// Setup file specifically for TypeScript tests

// Import the base setup
require('./setup-jest-master');

// TypeScript-specific mocking
jest.mock('typescript', () => ({
  transpileModule: jest.fn().mockImplementation((input) => ({ 
    outputText: input 
  })),
  ScriptTarget: { 
    ES2020: 'ES2020', 
    ESNext: 'ESNext',
    Latest: 'Latest' 
  },
  ModuleKind: { 
    ESNext: 'ESNext', 
    CommonJS: 'CommonJS', 
    NodeNext: 'NodeNext' 
  },
  JsxEmit: {
    React: 'React',
    ReactJSX: 'ReactJSX'
  },
  ModuleResolutionKind: {
    NodeJs: 'NodeJs',
    NodeNext: 'NodeNext'
  },
  createProgram: jest.fn(),
  createCompilerHost: jest.fn(),
}));

// TS-Node mock
jest.mock('ts-node', () => ({
  register: jest.fn(),
  create: jest.fn().mockReturnValue({
    compile: jest.fn(code => code),
    compileFile: jest.fn(filePath => `// Compiled ${filePath}`),
  })
}));

// Additional TypeScript-specific setup
if (!global.globalThis.structuredClone) {
  global.globalThis.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// Type-level support for unit tests
const originalCreate = jest.fn;
jest.fn = function mockedFn(...args) {
  const mockFn = originalCreate(...args);
  mockFn.mockImplementation = (impl) => {
    return originalCreate.mockImplementation.call(mockFn, impl);
  };
  return mockFn;
};

// Enhance console for TypeScript tests
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Add prefixes to identify test outputs
  return originalConsoleLog.apply(console, [`[TS-TEST]`, ...args]);
};
