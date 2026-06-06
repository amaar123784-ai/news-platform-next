"use strict";
/**
 * Media Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const auth_js_1 = require("../middleware/auth.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPEG, PNG, GIF, WEBP'));
        }
    },
});
/**
 * GET /api/media - List media files
 */
router.get('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const { page, perPage } = schemas_js_1.paginationSchema.parse(req.query);
        const { type } = req.query;
        const where = {};
        if (type)
            where.type = { startsWith: type };
        const [files, total] = await Promise.all([
            index_js_1.prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            index_js_1.prisma.media.count({ where }),
        ]);
        res.json({
            data: files,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/media/upload - Upload file
 */
router.post('/upload', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR', 'JOURNALIST'), upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw (0, errorHandler_js_1.createError)(400, 'لم يتم رفع أي ملف', 'NO_FILE');
        }
        const file = req.file;
        // In production, upload to cloud storage (S3/Cloudinary) and get URL
        // For now, use local path
        const url = `/uploads/${file.filename}`;
        const media = await index_js_1.prisma.media.create({
            data: {
                filename: file.originalname,
                url,
                type: file.mimetype,
                size: file.size,
                alt: req.body.alt || file.originalname,
                uploaderId: req.user.userId,
            },
        });
        res.status(201).json({ success: true, data: media });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/media/:id
 */
router.delete('/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const media = await index_js_1.prisma.media.findUnique({ where: { id: req.params.id } });
        if (!media) {
            throw (0, errorHandler_js_1.createError)(404, 'الملف غير موجود', 'MEDIA_NOT_FOUND');
        }
        // In production, also delete from cloud storage
        await index_js_1.prisma.media.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'تم حذف الملف' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=media.routes.js.map