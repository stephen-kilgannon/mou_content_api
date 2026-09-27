// test/setup.ts
// Global test setup

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.LOG_LEVEL = 'error';

// Suppress console during tests (optional - comment out to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Increase timeout for CI environments
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Allow time for any async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
