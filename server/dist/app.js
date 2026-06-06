"use strict";
/**
 * Express Application Setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_js_1 = require("./config/env.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
// Routes
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const article_routes_js_1 = __importDefault(require("./routes/article.routes.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const category_routes_js_1 = __importDefault(require("./routes/category.routes.js"));
const comment_routes_js_1 = __importDefault(require("./routes/comment.routes.js"));
const analytics_routes_js_1 = __importDefault(require("./routes/analytics.routes.js"));
const media_routes_js_1 = __importDefault(require("./routes/media.routes.js"));
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_js_1.env.FRONTEND_URL,
        credentials: true,
    }));
    app.use(rateLimiter_js_1.rateLimiter);
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // API Routes
    app.use('/api/auth', auth_routes_js_1.default);
    app.use('/api/articles', article_routes_js_1.default);
    app.use('/api/users', user_routes_js_1.default);
    app.use('/api/categories', category_routes_js_1.default);
    app.use('/api/comments', comment_routes_js_1.default);
    app.use('/api/analytics', analytics_routes_js_1.default);
    app.use('/api/media', media_routes_js_1.default);
    // Error handler (must be last)
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map