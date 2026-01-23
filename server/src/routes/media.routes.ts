/**
 * Media Routes
 * 
 * Handles file uploads with automatic image optimization.
 * - Converts images to WebP format
 * - Generates multiple size variants
 * - Strips EXIF metadata for security
 */

import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { paginationSchema } from '../validators/schemas.js';
import {
    ImageProcessor,
    imageFileFilter,
    ImageProcessingError,
    ProcessedImage
} from '../services/imageProcessor.js';

const router = Router();

// Initialize image processor
const imageProcessor = new ImageProcessor({
    outputDir: path.join(process.cwd(), 'uploads'),
    baseUrl: '/uploads',
    quality: 80,
    generateVariants: true,
    stripMetadata: true,
});

// Configure multer for memory storage (for Sharp processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: imageFileFilter(),
});

// Extend Request type for processed image
interface MediaRequest extends Request {
    processedImage?: ProcessedImage;
}

/**
 * GET /api/media - List media files
 */
router.get('/', authenticate, requireRole('ADMIN', 'EDITOR', 'JOURNALIST'), async (req, res, next) => {
    try {
        const { page, perPage } = paginationSchema.parse(req.query);
        const { type } = req.query;

        const where: any = {};
        if (type) where.type = { startsWith: type as string };

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
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/media/upload - Upload and optimize image
 * 
 * Automatically:
 * - Converts to WebP format
 * - Generates thumbnail, small, medium, large variants
 * - Strips EXIF metadata for privacy
 */
router.post(
    '/upload',
    authenticate,
    requireRole('ADMIN', 'EDITOR', 'JOURNALIST'),
    upload.single('file'),
    async (req: MediaRequest, res, next) => {
        try {
            if (!req.file) {
                throw createError(400, 'لم يتم رفع أي ملف', 'NO_FILE');
            }

            // Validate file type
            if (!imageProcessor.validateMimeType(req.file.mimetype)) {
                throw createError(
                    400,
                    'نوع الملف غير مدعوم. يُسمح فقط بـ JPEG, PNG, GIF, WEBP',
                    'INVALID_FILE_TYPE'
                );
            }

            // Process and optimize image
            const processed = await imageProcessor.process(
                req.file.buffer,
                req.file.originalname
            );

            // Store in database
            const media = await prisma.media.create({
                data: {
                    filename: processed.filename,
                    url: processed.url,
                    type: 'image/webp',
                    size: processed.size,
                    alt: req.body.alt || req.file.originalname.replace(/\.[^.]+$/, ''),
                    uploaderId: req.user!.userId,
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    ...media,
                    originalName: processed.originalName,
                    width: processed.width,
                    height: processed.height,
                    variants: processed.variants.map(v => ({
                        name: v.name,
                        url: v.url,
                        width: v.width,
                        height: v.height,
                    })),
                },
            });
        } catch (error) {
            if (error instanceof ImageProcessingError) {
                return next(createError(400, error.message, error.code));
            }
            next(error);
        }
    }
);

/**
 * GET /api/media/:id - Get single media file
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id }
        });

        if (!media) {
            throw createError(404, 'الملف غير موجود', 'MEDIA_NOT_FOUND');
        }

        res.json({ success: true, data: media });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/media/:id - Update media metadata
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const { alt } = req.body;

        const media = await prisma.media.update({
            where: { id: req.params.id },
            data: { alt },
        });

        res.json({ success: true, data: media });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/media/:id - Delete media file
 */
router.delete('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const media = await prisma.media.findUnique({ where: { id: req.params.id } });
        if (!media) {
            throw createError(404, 'الملف غير موجود', 'MEDIA_NOT_FOUND');
        }

        // Delete file and all variants from disk
        try {
            await imageProcessor.deleteImage(media.filename);
        } catch (fsError) {
            console.warn('Failed to delete file from disk:', fsError);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        await prisma.media.delete({ where: { id: req.params.id } });

        res.json({ success: true, message: 'تم حذف الملف' });
    } catch (error) {
        next(error);
    }
});

export default router;

