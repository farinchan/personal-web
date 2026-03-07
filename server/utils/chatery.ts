import type { H3Event } from 'h3'

/**
 * Helper to proxy requests to Chatery WhatsApp API
 */
export async function chateryFetch<T = any>(
  event: H3Event,
  endpoint: string,
  options: { method?: string; body?: any } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const baseUrl = config.chapiUrl as string
  const apiKey = config.chapiKey as string

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['X-Api-Key'] = apiKey
  }

  const fetchOptions: any = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const res = await fetch(`${baseUrl}/api/whatsapp${endpoint}`, fetchOptions)
  const data = await res.json()

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      statusMessage: data?.message || 'Chatery API error',
    })
  }

  return data
}
