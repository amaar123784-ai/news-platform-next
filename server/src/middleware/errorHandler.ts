/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, string[]>;
}

export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log error in development
    if (env.NODE_ENV === 'development') {
        console.error('Error:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
    }

    // Zod validation error
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'خطأ في البيانات المدخلة',
            code: 'VALIDATION_ERROR',
            details: err.flatten().fieldErrors,
        });
    }

    // Custom app error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'حدث خطأ في الخادم';
    const code = err.code || 'INTERNAL_ERROR';

    res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(err.details && { details: err.details }),
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

// Helper to create custom errors
export function createError(statusCode: number, message: string, code?: string): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
