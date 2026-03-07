import { createHash } from 'crypto'
import type { H3Event } from 'h3'

export function hashIP(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ua = getRequestHeader(event, 'user-agent') || ''
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex')
}
