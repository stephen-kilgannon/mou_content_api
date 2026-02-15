"use strict";
// test/e2e/setup.ts
// E2E test setup - runs before E2E tests
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../src/utils/database"));
// Set test database environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'contentdb_test';
// Clean up database before all tests
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.connect();
        yield database_1.default.initializeTables();
        // Clean existing test data
        yield database_1.default.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
        yield database_1.default.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
    }
    catch (error) {
        console.error('E2E Setup Error:', error);
        throw error;
    }
}));
// Clean up after all tests
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
        yield database_1.default.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
        yield database_1.default.close();
    }
    catch (error) {
        console.error('E2E Teardown Error:', error);
    }
}));
// Clean between test suites if needed
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    // Optional: Clean up after each test for isolation
    // await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    // await database.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
}));
