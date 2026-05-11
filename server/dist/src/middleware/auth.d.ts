import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
/**
 * Verify JWT token and attach user to request
 * Optimized with Redis caching to prevent per-request DB hits
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Check if user has required role
 */
export declare function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional auth - attach user if token exists (cookie or header), continue otherwise
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Manual Cache Invalidation Helper
 * Call this from controllers whenever user status, role, or credentials change.
 */
export declare function invalidateUserCache(userId: string): Promise<void>;
//# sourceMappingURL=auth.d.ts.map