// test/e2e/setup.ts
// E2E test setup - runs before E2E tests

import database from '../../src/utils/database';

// Set test database environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'contentdb_test';

// Clean up database before all tests
beforeAll(async () => {
  try {
    await database.connect();
    await database.initializeTables();
    // Clean existing test data
    await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
  } catch (error) {
    console.error('E2E Setup Error:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
    await database.close();
  } catch (error) {
    console.error('E2E Teardown Error:', error);
  }
});

// Clean between test suites if needed
afterEach(async () => {
  // Optional: Clean up after each test for isolation
  // await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
  // await database.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
});
