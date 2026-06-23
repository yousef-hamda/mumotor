import { mkdirSync } from 'node:fs';
import path from 'node:path';

/** Local uploads directory (served at /uploads). In production, prefer S3/R2. */
export const uploadsDir = path.resolve(process.cwd(), 'uploads');
mkdirSync(uploadsDir, { recursive: true });
