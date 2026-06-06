/**
 * Auth Middleware Unit Tests
 *
 * Tests for JWT authentication and role-based access control
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
// Mock dependencies before imports
vi.mock('jsonwebtoken');
vi.mock('../index.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));
vi.mock('../config/env.js', () => ({
    env: {
        JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
        NODE_ENV: 'test',
    },
}));
// Import after mocking
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { prisma } from '../index.js';
describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        mockNext = vi.fn();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.resetAllMocks();
    });
    // ============= authenticate() Tests =============
    describe('authenticate()', () => {
        it('should reject request without Authorization header', async () => {
            mockReq.headers = {};
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'UNAUTHORIZED',
            }));
        });
        it('should reject request with invalid Authorization format', async () => {
            mockReq.headers = { authorization: 'InvalidFormat token123' };
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'UNAUTHORIZED',
            }));
        });
        it('should reject request with empty Bearer token', async () => {
            mockReq.headers = { authorization: 'Bearer ' };
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
            }));
        });
        it('should reject expired or invalid token', async () => {
            mockReq.headers = { authorization: 'Bearer expired-token' };
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('jwt expired');
            });
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'TOKEN_EXPIRED',
            }));
        });
        it('should reject if user no longer exists', async () => {
            const mockPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'EDITOR',
            };
            mockReq.headers = { authorization: 'Bearer valid-token' };
            vi.mocked(jwt.verify).mockReturnValue(mockPayload);
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'USER_INACTIVE',
            }));
        });
        it('should reject if user account is disabled', async () => {
            const mockPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'EDITOR',
            };
            mockReq.headers = { authorization: 'Bearer valid-token' };
            vi.mocked(jwt.verify).mockReturnValue(mockPayload);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-123',
                isActive: false,
            });
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'USER_INACTIVE',
            }));
        });
        it('should attach user to request on valid token', async () => {
            const mockPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'EDITOR',
            };
            mockReq.headers = { authorization: 'Bearer valid-token' };
            vi.mocked(jwt.verify).mockReturnValue(mockPayload);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: 'user-123',
                isActive: true,
            });
            await authenticate(mockReq, mockRes, mockNext);
            expect(mockReq.user).toEqual(mockPayload);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    // ============= requireRole() Tests =============
    describe('requireRole()', () => {
        it('should reject if no user on request', () => {
            mockReq.user = undefined;
            const middleware = requireRole('ADMIN');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 401,
                code: 'UNAUTHORIZED',
            }));
        });
        it('should reject if user role not in allowed roles', () => {
            mockReq.user = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'READER',
            };
            const middleware = requireRole('ADMIN', 'EDITOR');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 403,
                code: 'FORBIDDEN',
            }));
        });
        it('should allow if user role in allowed roles', () => {
            mockReq.user = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
            };
            const middleware = requireRole('ADMIN', 'EDITOR');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should allow multiple roles', () => {
            mockReq.user = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'JOURNALIST',
            };
            const middleware = requireRole('ADMIN', 'EDITOR', 'JOURNALIST');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    // ============= optionalAuth() Tests =============
    describe('optionalAuth()', () => {
        it('should continue without user if no token', async () => {
            mockReq.headers = {};
            await optionalAuth(mockReq, mockRes, mockNext);
            expect(mockReq.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
        it('should continue without user if token invalid', async () => {
            mockReq.headers = { authorization: 'Bearer invalid-token' };
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('invalid token');
            });
            await optionalAuth(mockReq, mockRes, mockNext);
            expect(mockReq.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
        it('should attach user if token valid', async () => {
            const mockPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'READER',
            };
            mockReq.headers = { authorization: 'Bearer valid-token' };
            vi.mocked(jwt.verify).mockReturnValue(mockPayload);
            await optionalAuth(mockReq, mockRes, mockNext);
            expect(mockReq.user).toEqual(mockPayload);
            expect(mockNext).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.middleware.test.js.map