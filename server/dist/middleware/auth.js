"use strict";
/**
 * Authentication Middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("./errorHandler.js");
const index_js_1 = require("../index.js");
/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw (0, errorHandler_js_1.createError)(401, 'غير مصرح بالوصول. يرجى تسجيل الدخول.', 'UNAUTHORIZED');
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
            // Verify user still exists and is active
            const user = await index_js_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, isActive: true },
            });
            if (!user || !user.isActive) {
                throw (0, errorHandler_js_1.createError)(401, 'المستخدم غير موجود أو تم تعطيل الحساب.', 'USER_INACTIVE');
            }
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            throw (0, errorHandler_js_1.createError)(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.', 'TOKEN_EXPIRED');
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * Check if user has required role
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_js_1.createError)(401, 'غير مصرح بالوصول.', 'UNAUTHORIZED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next((0, errorHandler_js_1.createError)(403, 'ليس لديك صلاحية لهذا الإجراء.', 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Optional auth - attach user if token exists, continue otherwise
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
            req.user = decoded;
        }
        catch {
            // Token invalid, continue without user
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map