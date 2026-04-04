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
export interface ImageVariant {
    /** Variant name (e.g., 'thumbnail', 'medium', 'large') */
    name: string;
    /** Maximum width in pixels */
    width: number;
    /** Maximum height in pixels (optional, maintains aspect ratio if omitted) */
    height?: number;
    /** Quality (1-100) */
    quality?: number;
}
export interface ProcessedImage {
    /** Original filename */
    originalName: string;
    /** Generated unique filename */
    filename: string;
    /** Full path to the original optimized image */
    path: string;
    /** Public URL path */
    url: string;
    /** File size in bytes */
    size: number;
    /** Image width */
    width: number;
    /** Image height */
    height: number;
    /** MIME type */
    mimeType: string;
    /** Processing variants */
    variants: ProcessedVariant[];
}
export interface ProcessedVariant {
    name: string;
    filename: string;
    path: string;
    url: string;
    width: number;
    height: number;
    size: number;
}
export interface ImageProcessorOptions {
    /** Output directory for processed images */
    outputDir?: string;
    /** Base URL for generated image URLs */
    baseUrl?: string;
    /** Default WebP quality (1-100) */
    quality?: number;
    /** Maximum file size allowed (in bytes) */
    maxFileSize?: number;
    /** Allowed MIME types */
    allowedTypes?: string[];
    /** Generate variants */
    generateVariants?: boolean;
    /** Custom variants configuration */
    variants?: ImageVariant[];
    /** Strip EXIF metadata */
    stripMetadata?: boolean;
}
export declare class ImageProcessor {
    private outputDir;
    private baseUrl;
    private quality;
    private maxFileSize;
    private allowedTypes;
    private generateVariants;
    private variants;
    private stripMetadata;
    constructor(options?: ImageProcessorOptions);
    /**
     * Process an uploaded image buffer
     *
     * @param buffer - Image buffer from upload
     * @param originalName - Original filename
     * @returns Processed image information
     */
    process(buffer: Buffer, originalName: string): Promise<ProcessedImage>;
    /**
     * Create a size variant of the image
     */
    private createVariant;
    /**
     * Get image metadata
     */
    private getMetadata;
    /**
     * Validate MIME type
     */
    validateMimeType(mimeType: string): boolean;
    /**
     * Delete image and all its variants
     */
    deleteImage(filename: string): Promise<void>;
    /**
     * Optimize existing image (for batch processing)
     */
    optimizeExisting(imagePath: string): Promise<ProcessedImage>;
}
export declare class ImageProcessingError extends Error {
    code: string;
    constructor(message: string, code: string);
}
import { Request, Response, NextFunction } from 'express';
import type { FileFilterCallback } from 'multer';
/**
 * Multer file filter for image validation
 */
export declare function imageFileFilter(allowedTypes?: string[]): (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
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
export declare function processUploadedImage(options?: ImageProcessorOptions): (req: Request & {
    file?: Express.Multer.File;
    processedImage?: ProcessedImage;
}, res: Response, next: NextFunction) => Promise<void>;
export declare const imageProcessor: ImageProcessor;
export default ImageProcessor;
//# sourceMappingURL=imageProcessor.d.ts.map