"use strict";
const mockCommandRegistry = {
  register: jest.fn(),
  getCommand: jest.fn(),
  listCommandNames: jest.fn(),
  listCommands: jest.fn()
};

module.exports = {
  CommandRegistry: mockCommandRegistry
};
