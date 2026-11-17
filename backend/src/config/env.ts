import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import {z} from 'zod';

// npm workspace scripts run with backend/ as their working directory. Resolve
// the shared .env from the repository root instead of requiring a second copy.
const repositoryRootEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env');
dotenv.config({path: repositoryRootEnv});
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    BACKEND_URL: z.string().url().default('http://localhost:4000'),
    // The API can run for database-free OAuth development. Prisma commands still
    // require a real DATABASE_URL and a running PostgreSQL instance.
    DATABASE_URL: z.string().default('postgresql://findin:findin@localhost:5432/findin?schema=public'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
