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
  const pathSegments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : []
  const endpointPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/')

  const incomingUrl = new URL(req.url || '', 'http://localhost')
  const upstreamUrl = new URL(`${API_BASE_URL}/${endpointPath}`)
  upstreamUrl.search = incomingUrl.search

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        'X-Auth-Token': token,
        Accept: 'application/json',
      },
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
