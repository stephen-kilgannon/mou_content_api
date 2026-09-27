/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  // Transform ESM modules
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
  // Different projects for unit and e2e tests
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/test/unit/**/*.test.ts"],
      preset: "ts-jest",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
      transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
      moduleNameMapper: {
        "^uuid$": "<rootDir>/test/mocks/uuid.mock.ts",
      },
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/test/e2e/**/*.test.ts"],
      preset: "ts-jest",
      testEnvironment: "node",
      setupFilesAfterEnv: [
        "<rootDir>/test/setup.ts",
        "<rootDir>/test/e2e/setup.ts",
      ],
      transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],
      moduleNameMapper: {
        "^uuid$": "<rootDir>/test/mocks/uuid.mock.ts",
      },
    },
  ],
};
