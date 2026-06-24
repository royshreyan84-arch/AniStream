import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const malId = new URL(req.url).searchParams.get('malId')
  if (!malId) return NextResponse.json({ error: 'Missing malId' }, { status: 400 })

  const query = `
    query ($malId: Int) {
      Media(idMal: $malId, type: ANIME) {
        id
      }
    }
  `
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { malId: Number(malId) } }),
      next: { revalidate: 86400 },
    })
    const data = await res.json()
    const anilistId = data?.data?.Media?.id ?? null
    return NextResponse.json({ anilistId })
  } catch {
    return NextResponse.json({ anilistId: null })
  }
}