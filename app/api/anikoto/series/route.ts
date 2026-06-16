// app/api/anikoto/series/route.ts
// Proxies requests to anikotoapi.site to avoid CORS

import { NextRequest, NextResponse } from 'next/server'

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id param' }, { status: 400 })

  try {
    const res = await fetch(
      `https://anikotoapi.site/series/${encodeURIComponent(id)}`,
      { next: { revalidate: 1800 } },
    )
    const data = await safeJson(res)
    if (!res.ok || data === null) return NextResponse.json({ episodes: [] }, { status: 200 })
    return NextResponse.json(data)
  } catch (err) {
    // Covers DNS failures (ENOTFOUND), network blocks, timeouts, etc.
    // anikotoapi.site may be blocked by some ISPs since it continues to serve
    // the former HiAnime library — this is outside our app's control.
    console.error('Anikoto series proxy error:', err)
    return NextResponse.json({ episodes: [] }, { status: 200 })
  }
}