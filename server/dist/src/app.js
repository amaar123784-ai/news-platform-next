/**
 * Express Application Setup
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
// Routes
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/article.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import commentRoutes from './routes/comment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import mediaRoutes from './routes/media.routes.js';
import settingsRoutes from './routes/settings.routes.js';
export function createApp() {
    const app = express();
    // Security middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: env.NODE_ENV === 'development' ? false : undefined,
    }));
    app.use(cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    }));
    app.use(rateLimiter);
    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    // Root route
    app.get('/', (req, res) => {
        res.json({
            message: 'Yemen News API Server',
            version: '1.0.0',
            endpoints: '/api/*',
            health: '/api/health'
        });
    });
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/articles', articleRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/media', mediaRoutes);
    app.use('/api/settings', settingsRoutes);
    // Error handler (must be last)
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map