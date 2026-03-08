import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * Returns the uploads directory path.
 * Uses a persistent `uploads/` folder at project root
 * so files survive rebuilds and are accessible in both dev and production.
 * 
 * Resolution order:
 * 1. APP_DIR env variable (set by PM2 ecosystem config)
 * 2. process.cwd()
 */
export function getUploadsDir(): string {
  const baseDir = process.env.APP_DIR || process.cwd()
  const uploadsDir = join(baseDir, 'uploads')

  // Auto-create uploads directory if it doesn't exist
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }

  return uploadsDir
}
