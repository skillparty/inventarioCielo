/**
 * Setup file for Jest tests
 * Configures testing environment and global utilities
 */

// Import jest-dom for additional matchers
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'inventario_test_db';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'test';
process.env.BACKEND_PORT = '5001';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup for cleaning up after each test
afterEach(() => {
  jest.clearAllMocks();
});
