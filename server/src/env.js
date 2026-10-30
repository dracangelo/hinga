/*
 * Loads the repository root .env file (if present) before any other module
 * reads process.env. Import this module first in server/src/index.js so that
 * PORT, JWT_SECRET, DB_PATH and CORS_ORIGIN pick up the file's values.
 *
 * See .env.example for the supported keys.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(join(here, '..', '..', '.env'));
} catch {
  /* No .env file — the ambient environment is used as-is. */
}
