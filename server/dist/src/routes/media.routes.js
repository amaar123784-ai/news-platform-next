/**
 * Media Routes
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { paginationSchema } from '../validators/schemas.js';
const router = Router();
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({
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
router.get('/', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const { page, perPage } = paginationSchema.parse(req.query);
        const { type } = req.query;
        const where = {};
        if (type)
            where.type = { startsWith: type };
        const [files, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.media.count({ where }),
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
router.post('/upload', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw createError(400, 'لم يتم رفع أي ملف', 'NO_FILE');
        }
        const file = req.file;
        // In production, upload to cloud storage (S3/Cloudinary) and get URL
        // For now, use local path
        const url = `/uploads/${file.filename}`;
        const media = await prisma.media.create({
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
router.delete('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const media = await prisma.media.findUnique({ where: { id: req.params.id } });
        if (!media) {
            throw createError(404, 'الملف غير موجود', 'MEDIA_NOT_FOUND');
        }
        // In production, also delete from cloud storage
        await prisma.media.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'تم حذف الملف' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=media.routes.js.map