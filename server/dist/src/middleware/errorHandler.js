/**
 * Global Error Handler Middleware
 */
import { ZodError } from 'zod';
import { env } from '../config/env.js';
export function errorHandler(err, req, res, next) {
    // Log error in development
    if (env.NODE_ENV === 'development') {
        console.error('Error:', err);
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
export function createError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
//# sourceMappingURL=errorHandler.js.map