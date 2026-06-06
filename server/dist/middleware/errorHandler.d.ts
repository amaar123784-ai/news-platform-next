/**
 * Global Error Handler Middleware
 */
import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, string[]>;
}
export declare function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function createError(statusCode: number, message: string, code?: string): AppError;
//# sourceMappingURL=errorHandler.d.ts.map