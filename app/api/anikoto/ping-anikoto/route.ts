export async function GET() {
  try {
    const res = await fetch('https://anikoto-api.onrender.com', {
      signal: AbortSignal.timeout(15000),
    })
    return Response.json({ ok: true, status: res.status })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}