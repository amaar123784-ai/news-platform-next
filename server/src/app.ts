/**
 * Express Application Setup
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/article.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import commentRoutes from './routes/comment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import mediaRoutes from './routes/media.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import rssRoutes from './routes/rss.routes.js';
import automationRoutes from './routes/automation.routes.js';
import notificationRoutes from './routes/notification.routes.js';

export function createApp(): Express {
    const app = express();

    // Enable trust proxy for rate limiting behind load balancers/proxies
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: env.NODE_ENV === 'development' ? false : undefined,
    }));
    app.use(cors({
        origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4000', 'http://localhost:5173'],
        credentials: true,
    }));
    app.use(rateLimiter);

    // Body parsing
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Serve uploaded files statically
    // Files are accessible at /uploads/filename.png
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsPath));
    app.use('/api/uploads', express.static(uploadsPath)); // Fix for proxy setups passing full path

    // Log uploads path for debugging
    console.log('📂 Serving uploads from:', uploadsPath);

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
    app.use('/api/rss', rssRoutes);
    app.use('/api/automation', automationRoutes);
    app.use('/api/notifications', notificationRoutes);

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
}
