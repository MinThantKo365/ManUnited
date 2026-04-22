const API_BASE_URL = 'https://api.football-data.org/v4'

export default async function handler(req, res) {
  const token =
    process.env.FOOTBALL_API_KEY ||
    process.env.VITE_FOOTBALL_API_KEY ||
    process.env.VITE_X_AUTH_TOKEN

  if (!token) {
    return res.status(500).json({
      message: 'Missing FOOTBALL_API_KEY on the server.',
    })
  }

  const rawPath = req.query.path
  const pathValue = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || ''
  const endpointPath = pathValue
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  if (!endpointPath) {
    return res.status(400).json({
      message: 'Missing API path. Expected /api/football/{endpoint}.',
    })
  }

  const incomingUrl = new URL(req.url || '', 'http://localhost')
  const upstreamUrl = new URL(`${API_BASE_URL}/${endpointPath}`)

  // Keep all original query params except internal "path".
  for (const [key, value] of incomingUrl.searchParams.entries()) {
    if (key !== 'path') {
      upstreamUrl.searchParams.append(key, value)
    }
  }

  let requestBody
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        'X-Auth-Token': token,
        Accept: 'application/json',
        ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: requestBody,
    })

    const body = await upstreamResponse.text()
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json'

    if (req.method === 'GET' || req.method === 'HEAD') {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    }

    res.setHeader('Content-Type', contentType)
    return res.status(upstreamResponse.status).send(body)
  } catch (error) {
    console.error('Football API proxy error:', error)
    return res.status(502).json({
      message: 'Unable to reach the upstream football API.',
    })
  }
}
