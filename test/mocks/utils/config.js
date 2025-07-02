// Mock global config functions
const getGlobalConfig = jest.fn().mockReturnValue({});
const saveGlobalConfig = jest.fn().mockImplementation(() => Promise.resolve());
const addApiKey = jest.fn().mockImplementation(() => Promise.resolve());
// Mock config.js
export const getGlobalConfig = jest.fn();
export const saveGlobalConfig = jest.fn();
export const addApiKey = jest.fn();
export const ProviderType = { 
  OPENAI: 'openai', 
  ANTHROPIC: 'anthropic', 
  LILYPAD: 'lilypad' 
};
