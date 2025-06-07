"use strict";
const mockConfig = {
  getInstance: jest.fn(),
  initialize: jest.fn().mockResolvedValue(undefined),
  set: jest.fn(),
  get: jest.fn()
};
mockConfig.getInstance.mockReturnValue(mockConfig);

module.exports = {
  ConfigurationManager: mockConfig
};
