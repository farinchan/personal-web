import { join } from 'path'

/**
 * Returns the uploads directory path.
 * Uses a persistent `uploads/` folder at project root
 * so files survive rebuilds and are accessible in both dev and production.
 */
export function getUploadsDir(): string {
  return join(process.cwd(), 'uploads')
}
