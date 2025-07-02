// Mock logger module
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  log: jest.fn(),
  child: jest.fn(() => logger),
  level: 'info',
  setLevel: jest.fn(),
  addTransport: jest.fn(),
  removeTransport: jest.fn()
};

module.exports = logger;
