import { cache } from '../services/cache.service.js';
export const requireIdempotency = async (req, res, next) => {
    const key = req.headers['idempotency-key'];
    if (!key || typeof key !== 'string') {
        return res.status(400).json({ success: false, message: 'Idempotency-Key header is required' });
    }
    const cacheKey = `idemp:${key}`;
    const existingResponse = await cache.get(cacheKey);
    if (existingResponse) {
        return res.status(200).json(existingResponse);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        cache.set(cacheKey, body, 86400); // 24 hours
        return originalJson(body);
    };
    next();
};
//# sourceMappingURL=idempotency.js.map