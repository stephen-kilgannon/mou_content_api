"use strict";
// test/e2e/app.ts
// Express app for E2E testing (without starting server)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const content_routes_1 = __importDefault(require("../../src/routes/content.routes"));
const object_routes_1 = __importDefault(require("../../src/routes/object.routes"));
const createTestApp = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'content-api',
            version: '1.0.0'
        });
    });
    // Routes
    app.use('/api/content', content_routes_1.default);
    app.use('/api/objects', object_routes_1.default);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });
    // Error handler
    app.use((err, req, res, next) => {
        console.error('Test App Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
    return app;
};
exports.default = createTestApp;
