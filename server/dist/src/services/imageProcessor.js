/**
 * Image Processing Service
 *
 * Production-ready image optimization using Sharp.
 * Automatically converts images to WebP with quality optimization.
 *
 * Features:
 * - WebP conversion with quality control
 * - Multiple size variants generation
 * - EXIF data stripping for security
 * - Size limits and validation
 * - Graceful error handling
 *
 * @module services/imageProcessor
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
// ============= CONSTANTS =============
const DEFAULT_QUALITY = 80;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const DEFAULT_VARIANTS = [
    { name: 'thumbnail', width: 150, height: 150, quality: 75 },
    { name: 'small', width: 320, quality: 75 },
    { name: 'medium', width: 640, quality: 80 },
    { name: 'large', width: 1200, quality: 85 },
];
// ============= IMAGE PROCESSOR CLASS =============
export class ImageProcessor {
    outputDir;
    baseUrl;
    quality;
    maxFileSize;
    allowedTypes;
    generateVariants;
    variants;
    stripMetadata;
    constructor(options = {}) {
        this.outputDir = options.outputDir || path.join(process.cwd(), 'uploads');
        this.baseUrl = options.baseUrl || '/uploads';
        this.quality = options.quality || DEFAULT_QUALITY;
        this.maxFileSize = options.maxFileSize || MAX_FILE_SIZE;
        this.allowedTypes = options.allowedTypes || ALLOWED_TYPES;
        this.generateVariants = options.generateVariants ?? true;
        this.variants = options.variants || DEFAULT_VARIANTS;
        this.stripMetadata = options.stripMetadata ?? true;
    }
    /**
     * Process an uploaded image buffer
     *
     * @param buffer - Image buffer from upload
     * @param originalName - Original filename
     * @returns Processed image information
     */
    async process(buffer, originalName) {
        // Validate file size
        if (buffer.length > this.maxFileSize) {
            throw new ImageProcessingError(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`, 'FILE_TOO_LARGE');
        }
        // Get image metadata and validate
        const metadata = await this.getMetadata(buffer);
        if (!metadata.format) {
            throw new ImageProcessingError('Invalid image format', 'INVALID_FORMAT');
        }
        // Generate unique filename
        const uniqueId = crypto.randomBytes(16).toString('hex');
        const baseFilename = `${uniqueId}`;
        const filename = `${baseFilename}.webp`;
        const outputPath = path.join(this.outputDir, filename);
        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
        // Create Sharp pipeline
        let pipeline = sharp(buffer);
        // Strip EXIF metadata for security
        if (this.stripMetadata) {
            pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
        }
        // Convert to WebP with optimization
        const webpOptions = {
            quality: this.quality,
            effort: 4, // Balance between speed and compression (0-6)
            lossless: false,
            nearLossless: false,
        };
        pipeline = pipeline.webp(webpOptions);
        // Save optimized image
        const outputInfo = await pipeline.toFile(outputPath);
        // Generate variants if enabled
        const processedVariants = [];
        if (this.generateVariants) {
            for (const variant of this.variants) {
                const variantResult = await this.createVariant(buffer, baseFilename, variant);
                processedVariants.push(variantResult);
            }
        }
        return {
            originalName,
            filename,
            path: outputPath,
            url: `${this.baseUrl}/${filename}`,
            size: outputInfo.size,
            width: outputInfo.width,
            height: outputInfo.height,
            mimeType: 'image/webp',
            variants: processedVariants,
        };
    }
    /**
     * Create a size variant of the image
     */
    async createVariant(buffer, baseFilename, variant) {
        const filename = `${baseFilename}-${variant.name}.webp`;
        const outputPath = path.join(this.outputDir, filename);
        const resizeOptions = {
            width: variant.width,
            height: variant.height,
            fit: 'inside',
            withoutEnlargement: true, // Don't upscale small images
        };
        const webpOptions = {
            quality: variant.quality || this.quality,
            effort: 4,
        };
        let pipeline = sharp(buffer);
        if (this.stripMetadata) {
            pipeline = pipeline.rotate();
        }
        const outputInfo = await pipeline
            .resize(resizeOptions)
            .webp(webpOptions)
            .toFile(outputPath);
        return {
            name: variant.name,
            filename,
            path: outputPath,
            url: `${this.baseUrl}/${filename}`,
            width: outputInfo.width,
            height: outputInfo.height,
            size: outputInfo.size,
        };
    }
    /**
     * Get image metadata
     */
    async getMetadata(buffer) {
        try {
            return await sharp(buffer).metadata();
        }
        catch (error) {
            throw new ImageProcessingError('Failed to read image metadata. File may be corrupted.', 'INVALID_IMAGE');
        }
    }
    /**
     * Validate MIME type
     */
    validateMimeType(mimeType) {
        return this.allowedTypes.includes(mimeType);
    }
    /**
     * Delete image and all its variants
     */
    async deleteImage(filename) {
        const baseName = path.basename(filename, '.webp');
        const files = await fs.readdir(this.outputDir);
        const filesToDelete = files.filter(f => f === filename || f.startsWith(`${baseName}-`));
        await Promise.all(filesToDelete.map(f => fs.unlink(path.join(this.outputDir, f)).catch(() => { })));
    }
    /**
     * Optimize existing image (for batch processing)
     */
    async optimizeExisting(imagePath) {
        const buffer = await fs.readFile(imagePath);
        const originalName = path.basename(imagePath);
        return this.process(buffer, originalName);
    }
}
// ============= ERROR CLASS =============
export class ImageProcessingError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.name = 'ImageProcessingError';
        this.code = code;
    }
}
/**
 * Multer file filter for image validation
 */
export function imageFileFilter(allowedTypes = ALLOWED_TYPES) {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new ImageProcessingError(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`, 'INVALID_FILE_TYPE'));
        }
    };
}
// ============= EXPRESS MIDDLEWARE =============
/**
 * Express middleware for processing uploaded images
 *
 * @example
 * import multer from 'multer';
 * import { processUploadedImage, imageFileFilter } from './imageProcessor';
 *
 * const upload = multer({
 *   storage: multer.memoryStorage(),
 *   fileFilter: imageFileFilter(),
 *   limits: { fileSize: 10 * 1024 * 1024 }
 * });
 *
 * router.post('/upload',
 *   upload.single('image'),
 *   processUploadedImage({ generateVariants: true }),
 *   (req, res) => {
 *     res.json({ data: req.processedImage });
 *   }
 * );
 */
export function processUploadedImage(options = {}) {
    const processor = new ImageProcessor(options);
    return async (req, res, next) => {
        if (!req.file) {
            return next();
        }
        try {
            // Validate MIME type
            if (!processor.validateMimeType(req.file.mimetype)) {
                throw new ImageProcessingError(`Invalid file type: ${req.file.mimetype}`, 'INVALID_FILE_TYPE');
            }
            // Process the image
            const result = await processor.process(req.file.buffer, req.file.originalname);
            // Attach to request for downstream handlers
            req.processedImage = result;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
// ============= SINGLETON EXPORT =============
export const imageProcessor = new ImageProcessor();
export default ImageProcessor;
//# sourceMappingURL=imageProcessor.js.map