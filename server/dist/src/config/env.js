/**
 * Environment Configuration
 */
import { config } from 'dotenv';
import { z } from 'zod';
config();
const envSchema = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('1d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    OLLAMA_MODEL: z.string().default('gemma2'),
    OLLAMA_HOST: z.string().default('http://127.0.0.1:11434'),
    GEMINI_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map