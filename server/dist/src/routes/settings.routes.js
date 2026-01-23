/**
 * Settings Routes
 */
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, '../../data/settings.json');
const router = Router();
// Helper to read settings
async function readSettings() {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        // Return default if file doesn't exist
        return {};
    }
}
// Helper to write settings
async function writeSettings(settings) {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 4), 'utf-8');
}
/**
 * GET /api/settings - Get all settings
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const settings = await readSettings();
        res.json({ success: true, data: settings });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/settings - Update settings
 */
router.patch('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const current = await readSettings();
        const updated = { ...current, ...req.body };
        await writeSettings(updated);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=settings.routes.js.map