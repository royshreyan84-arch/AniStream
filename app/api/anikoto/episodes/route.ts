// app/api/anikoto/episodes/route.ts
// Proxies requests to anikoto-api.onrender.com to avoid CORS

import { NextRequest, NextResponse } from 'next/server'
export const maxDuration=30

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
  const name = searchParams.get('name')
  const id = searchParams.get('id')

  try {
    if (name) {
      // Step 1: get page id by slug
      const res = await fetch(
        `https://anikoto-api.onrender.com/page?name=${encodeURIComponent(name)}`,
        { next: { revalidate: 3600 } },
      )
      const data = await safeJson(res)
      if (!res.ok || data === null) return NextResponse.json({ id: null }, { status: 200 })
      return NextResponse.json(data)
    }

    if (id) {
      // Step 2: get episodes by page id
      const res = await fetch(
        `https://anikoto-api.onrender.com/episodes?id=${encodeURIComponent(id)}`,
        { next: { revalidate: 1800 } },
      )
      const data = await safeJson(res)
      if (!res.ok || data === null) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Missing name or id param' }, { status: 400 })
  } catch (err) {
    console.error('Anikoto proxy error:', err)
    // Always return a shape the frontend can safely consume, even on total failure
    return NextResponse.json(name ? { id: null } : [], { status: 200 })
  }
}