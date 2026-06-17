'use client'
import {getAudioPref,saveAudioPref, getLastEpisode, saveLastEpisode, getUsername, refreshSessionActivity} from '@/app/lib/cookies'
import { supabase } from '@/app/lib/supabaseClient'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

const COLORS = {
  primary: '#6c63ff',
  pink: '#ff2475',
  dark: '#0d0f1a',
  card: '#13152a',
  cardHover: '#1a1d35',
  border: '#1e2140',
  text: '#ffffff',
  muted: '#8b8fa8',
}

interface Episode {
  id: string
  number: number
  title: string
  anikotoEmbedId?: string
  releasedAt?: number
}

interface Comment {
  id: number
  user: string
  text: string
  time: string
  likes: number
}

interface AnimeInfo {
  title: string
  title_english?: string
  synopsis: string
  score: number
  episodes: number
  status: string
  duration: string
  rating: string
  genres: Array<{ name: string }>
  images: { jpg: { large_image_url: string } }
}

// ── Anikoto helpers ────────────────────────────────────────────────────────────

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function searchAnikotoSlug(title: string, englishTitle?: string): Promise<string | null> {
  // Try with original title slug first, then english title
  const slugs = [titleToSlug(title)]
  if (englishTitle && englishTitle !== title) slugs.push(titleToSlug(englishTitle))
  for (const slug of slugs) {
    const id = await fetchAnikotoPageId(slug)
    if (id) return id
    // Also try first 3 words (handles long titles)
    const shortSlug = slug.split('-').slice(0, 3).join('-')
    if (shortSlug !== slug) {
      const shortId = await fetchAnikotoPageId(shortSlug)
      if (shortId) return shortId
    }
  }
  return null
}

// All Anikoto calls go through Next.js API routes to avoid CORS

async function fetchAnikotoPageId(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/anikoto/episodes?name=${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.id ? String(data.id) : null
  } catch { return null }
}

async function fetchAnikotoEpisodes(
  pageId: string,
): Promise<Array<{ number: number; title: string; releasedAt: number }>> {
  try {
    const res = await fetch(`/api/anikoto/episodes?id=${encodeURIComponent(pageId)}`)
    if (!res.ok) return []
    const data = await res.json()
    const eps: any[] = Array.isArray(data) ? data : data?.episodes ?? []
    return eps.map((ep: any, i: number) => ({
      number: ep.number ?? ep.ep ?? i + 1,
      title: ep.title ?? ep.name ?? `Episode ${i + 1}`,
      releasedAt: ep.timestamp ? ep.timestamp * 1000 : ep.releasedAt ?? ep.aired_at ?? 0,
    }))
  } catch { return [] }
}

async function fetchAnikotoSeries(
  id: string | number,
): Promise<Array<{ number: number; embedSub?: string; embedDub?: string }>> {
  try {
    const res = await fetch(`/api/anikoto/series?id=${id}`)
    if (!res.ok) return []
    const data = await res.json()
    const eps: any[] = Array.isArray(data?.episodes) ? data.episodes : []
    return eps.map((ep: any) => ({
      number: ep.number ?? ep.ep ?? 0,
      embedSub: ep.embed_url?.sub ?? undefined,
      embedDub: ep.embed_url?.dub ?? undefined,
    }))
  } catch { return [] }
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(targetMs: number | null) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !targetMs) { setTimeLeft(null); return }
    const tick = () => {
      const diff = targetMs - Date.now()
      if (diff <= 0) { setTimeLeft('Released'); return }
      const d = Math.floor(diff / 86_400_000)
      const h = Math.floor((diff % 86_400_000) / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [targetMs, mounted])
  return timeLeft
}

// Client-only now timestamp (avoids SSR/client mismatch)
function useNow() {
  const [now, setNow] = useState<number>(0)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const animeId = params?.id as string

  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [currentEp, setCurrentEp] = useState(1)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [episodeSearch, setEpisodeSearch] = useState('')
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [anikotoError, setAnikotoError] = useState(false)

  const [audioType, setAudioType] = useState<'sub' | 'dub'>(()=>typeof window!=='undefined'?getAudioPref():'sub')
  const [autoPlay, setAutoPlay] = useState(true)
  const [autoNext, setAutoNext] = useState(true)
  const [autoSkipIntro, setAutoSkipIntro] = useState(true)
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [vote, setVote] = useState<string | null>(null)

  const [comments, setComments] = useState<Comment[]>([
    { id: 1, user: 'SakuraMoon', text: 'This episode was incredible! The animation is top tier 🔥', time: '2h ago', likes: 24 },
    { id: 2, user: 'OtakuKing99', text: 'The fight scene gave me chills. Absolute masterpiece.', time: '5h ago', likes: 18 },
    { id: 3, user: 'AnimeDaily', text: "Can't wait for the next episode, the cliffhanger was brutal 😭", time: '1d ago', likes: 41 },
  ])
  const [newComment, setNewComment] = useState('')
  const [username, setUsername] = useState('Guest')

  // ── Derived ──────────────────────────────────────────────────────────────────
  const now = useNow()
  const currentEpObj = episodes.find(e => e.number === currentEp)
  const nextUnreleased = now > 0 ? (episodes.find(e => e.releasedAt && e.releasedAt > now) ?? null) : null
  const countdown = useCountdown(nextUnreleased?.releasedAt ?? null)

  // Player priority:
  // 1. Anikoto embed (megaplay.buzz) — best source
  // 2. 2embed.org — reliable MAL-based fallback
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const fallbackSources = [
    `https://vidsrc.to/embed/anime/${animeId}/${currentEp}`,
    `https://anime.autoembed.cc/embed/anime?mal=${animeId}-episode={currentEp}`,
    `https://vidsrc.xyz/embed/anime?mal=${animeId}&episode=${currentEp}`,
  ]
  const playerUrl = (() => {
    if (!anikotoError && currentEpObj?.anikotoEmbedId) {
      return `https://megaplay.buzz/stream/s-2/${currentEpObj.anikotoEmbedId}/${audioType}`
    }
    return fallbackSources[fallbackIndex] ?? fallbackSources[0]
  })()

  // ── Data fetching ─────────────────────────────────────────────────────────────

  const fetchAnimeInfo = useCallback(async () => {
    try {
      setLoadingInfo(true)
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
      const data = await res.json()
      setAnimeInfo(data.data)
      return data.data as AnimeInfo
    } catch (err) {
      console.error('Jikan fetch failed:', err)
      return null
    } finally {
      setLoadingInfo(false)
    }
  }, [animeId])

  const fetchEpisodes = useCallback(async (info: AnimeInfo) => {
    setLoadingEpisodes(true)
    try {
      // Use searchAnikotoSlug which tries multiple slug variants + english title
      const pageId = await searchAnikotoSlug(info.title, info.title_english)

      let timedEps: Array<{ number: number; title: string; releasedAt: number }> = []
      if (pageId) timedEps = await fetchAnikotoEpisodes(pageId)

      // Try MAL id as series id for anikotoapi.site
      const siteEps = await fetchAnikotoSeries(animeId)

      const totalEps = info.episodes || Math.max(timedEps.length, 12)
      const merged: Episode[] = Array.from({ length: totalEps }, (_, i) => {
        const n = i + 1
        const timed = timedEps.find(e => e.number === n)
        const site = siteEps.find(e => e.number === n)
        const rawEmbed = audioType === 'dub' ? site?.embedDub : site?.embedSub
        return {
          id: `ep-${n}`,
          number: n,
          title: timed?.title ?? `Episode ${n}`,
          anikotoEmbedId: rawEmbed ? rawEmbed.split('/').pop() : undefined,
          releasedAt: timed?.releasedAt ?? 0,
        }
      })
      setEpisodes(merged)
    } catch {
      const total = info.episodes || 12
      setEpisodes(Array.from({ length: Math.min(total, 200) }, (_, i) => ({
        id: `ep-${i + 1}`, number: i + 1, title: `Episode ${i + 1}`,
      })))
    } finally {
      setLoadingEpisodes(false)
    }
  }, [animeId, audioType])

  useEffect(() => {
    const storedUser = localStorage.getItem('username')
    if (storedUser) setUsername(storedUser)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetchAnimeInfo().then(info => { if (info) fetchEpisodes(info) })
    return () => window.removeEventListener('resize', checkMobile)
  }, [animeId])

  useEffect(() => {
    if (!animeId) return
    try {
      const raw = localStorage.getItem('watchlist')
      const list = raw ? JSON.parse(raw) : []
      const entry = Array.isArray(list) ? list.find((e: any) => String(e.id) === String(animeId)) : null
      setWatchlistStatus(entry?.status ?? null)
    } catch { setWatchlistStatus(null) }
  }, [animeId])

  // ── Watchlist ─────────────────────────────────────────────────────────────────

  const STATUS_OPTIONS = [
    { key: 'Watching', label: 'Watching', emoji: '👀' },
    { key: 'Planned', label: 'Plan to Watch', emoji: '📌' },
    { key: 'On-Hold', label: 'On Hold', emoji: '⏸️' },
    { key: 'Dropped', label: 'Dropped', emoji: '🗑️' },
  ]

  const setStatus = (status: string | null) => {
    try {
      const raw = localStorage.getItem('watchlist')
      const list: any[] = raw ? JSON.parse(raw) : []
      const filtered = Array.isArray(list) ? list.filter((e: any) => String(e.id) !== String(animeId)) : []
      if (status) {
        filtered.push({
          id: animeId, title: animeInfo?.title ?? '',
          image: animeInfo?.images?.jpg?.large_image_url ?? '',
          eps: animeInfo?.episodes ?? 0, status, addedAt: Date.now(),
        })
      }
      localStorage.setItem('watchlist', JSON.stringify(filtered))
      setWatchlistStatus(status)
    } catch (err) { console.error('Watchlist error:', err) }
    setShowStatusMenu(false)
  }

  // ── Watch party ───────────────────────────────────────────────────────────────

  const createRoom = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { alert('You need to be logged in to create a watch party.'); router.push('/login'); return }
    const { data, error } = await supabase
      .from('rooms')
      .insert({ anime_id: animeId, anime_title: animeInfo?.title ?? null, episode: currentEp, created_by: userData.user.id })
      .select().single()
    if (error || !data) { console.error('Room error:', error); alert('Failed to create room. Please try again.'); return }
    router.push(`/watch2gether/${data.id}`)
  }

  // ── Comments ──────────────────────────────────────────────────────────────────

  const handleComment = () => {
    if (!newComment.trim()) return
    setComments(prev => [{ id: Date.now(), user: username, text: newComment.trim(), time: 'Just now', likes: 0 }, ...prev])
    setNewComment('')
  }
  const handleLike = (id: number) =>
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c))

  const filteredEpisodes = episodes.filter(ep =>
    episodeSearch.trim() === '' || ep.number.toString().includes(episodeSearch.trim())
  )
  const switchEpisode = (epNum: number) => { setCurrentEp(epNum); setAnikotoError(false); saveLastEpisode(animeId, epNum); refreshSessionActivity() }

  // ── Loading ────────────────────────────────────────────────────────────────────

  if (loadingInfo) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: COLORS.text }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: COLORS.muted }}>Loading anime...</p>
        </div>
      </div>
    )
  }
  // ── Sub-components ─────────────────────────────────────────────────────────────

  const VideoPlayer = () => (
    <div style={{ backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', paddingTop: '56.25%', marginBottom: '10px' }}>
      <iframe
  key={playerUrl}
  src={playerUrl}
  allowFullScreen
  referrerPolicy="origin"
  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
  
/>
    </div>
  )

  const NextEpisodeCountdown = () => {
    if (!nextUnreleased || !countdown) return null
    const isReleased = countdown === 'Released'
    return (
      <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '28px' }}>🕐</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: COLORS.muted, fontSize: '12px', margin: '0 0 4px' }}>Next episode</p>
          <p style={{ color: COLORS.text, fontWeight: 700, fontSize: '15px', margin: '0 0 4px' }}>
            Episode {nextUnreleased.number}
            {nextUnreleased.title !== `Episode ${nextUnreleased.number}` ? ` — ${nextUnreleased.title}` : ''}
          </p>
          <p style={{ color: isReleased ? '#4ade80' : COLORS.pink, fontWeight: 800, fontSize: '18px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {isReleased ? '✅ Out now!' : countdown}
          </p>
        </div>
        {isReleased && (
          <button onClick={() => switchEpisode(nextUnreleased.number)} style={{ backgroundColor: COLORS.pink, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
            Watch ▶
          </button>
        )}
      </div>
    )
  }

  const EpisodeList = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
            Episodes{' '}
            {loadingEpisodes && <span style={{ color: COLORS.muted, fontWeight: 400, fontSize: '11px' }}>fetching...</span>}
          </h2>
        </div>
        <input
          value={episodeSearch}
          onChange={e => setEpisodeSearch(e.target.value)}
          placeholder="🔍 Search episode number"
          style={{ width: '100%', backgroundColor: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 12px', color: COLORS.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ maxHeight: isMobile ? '60vh' : '70vh', overflowY: 'auto' }}>
        {filteredEpisodes.map(ep => {
          const isActive = currentEp === ep.number
          const isUnreleased = now > 0 && ep.releasedAt ? ep.releasedAt > now : false
          return (
            <button
              key={ep.id}
              onClick={() => !isUnreleased && switchEpisode(ep.number)}
              disabled={isUnreleased}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', backgroundColor: isActive ? '#2a1530' : 'transparent',
                border: 'none', borderLeft: isActive ? `3px solid ${COLORS.pink}` : '3px solid transparent',
                color: isUnreleased ? COLORS.border : isActive ? COLORS.pink : COLORS.muted,
                cursor: isUnreleased ? 'default' : 'pointer', textAlign: 'left', opacity: isUnreleased ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: isActive ? 700 : 400, minWidth: '28px', color: isActive ? COLORS.pink : COLORS.muted }}>{ep.number}</span>
              <span style={{ fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</span>
              {isUnreleased && <span style={{ fontSize: '10px', color: COLORS.muted, flexShrink: 0 }}>🔒</span>}
              {isActive && !isUnreleased && (
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: COLORS.pink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>▶</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  const ToggleChip = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.muted, fontSize: '12px', padding: '4px 0', whiteSpace: 'nowrap' }}>
      <span>{label}</span>
      <span style={{ color: value ? COLORS.primary : COLORS.muted, fontWeight: 700 }}>{value ? 'On' : 'Off'}</span>
    </button>
  )

  const ControlsBar = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: '10px', padding: '10px 14px', marginBottom: '10px', border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <ToggleChip label="Auto Play" value={autoPlay} onToggle={() => setAutoPlay(p => !p)} />
        <ToggleChip label="Auto Next" value={autoNext} onToggle={() => setAutoNext(p => !p)} />
        <ToggleChip label="Auto Skip Intro" value={autoSkipIntro} onToggle={() => setAutoSkipIntro(p => !p)} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => switchEpisode(Math.max(1, currentEp - 1))} disabled={currentEp === 1} style={{ backgroundColor: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 14px', color: currentEp === 1 ? COLORS.muted : COLORS.text, cursor: currentEp === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px' }}>◀◀ Prev</button>
        <button onClick={() => switchEpisode(Math.min(episodes.length, currentEp + 1))} disabled={currentEp === episodes.length} style={{ backgroundColor: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 14px', color: currentEp === episodes.length ? COLORS.muted : COLORS.text, cursor: currentEp === episodes.length ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px' }}>Next ▶▶</button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowStatusMenu(p => !p)} style={{ backgroundColor: watchlistStatus ? COLORS.primary : COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {watchlistStatus ? `${STATUS_OPTIONS.find(o => o.key === watchlistStatus)?.emoji ?? ''} ${watchlistStatus}` : '+ List'}
          </button>
          {showStatusMenu && (
            <>
              <div onClick={() => setShowStatusMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 100, backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '10px', overflow: 'hidden', minWidth: '170px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setStatus(opt.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: 'none', textAlign: 'left', backgroundColor: watchlistStatus === opt.key ? COLORS.cardHover : 'transparent', color: watchlistStatus === opt.key ? COLORS.primary : COLORS.text, fontSize: '13px', fontWeight: watchlistStatus === opt.key ? 700 : 400, cursor: 'pointer' }}>
                    <span>{opt.emoji}</span><span>{opt.label}</span>
                  </button>
                ))}
                {watchlistStatus && (
                  <button onClick={() => setStatus(null)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: 'none', borderTop: `1px solid ${COLORS.border}`, textAlign: 'left', backgroundColor: 'transparent', color: '#ff4444', fontSize: '13px', cursor: 'pointer' }}>
                    <span>✕</span><span>Remove from list</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <button onClick={createRoom} style={{ background: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Watch2gether</button>
      </div>
    </div>
  )

  const ServerSelector = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '10px', padding: '14px', marginBottom: '10px', border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: COLORS.muted }}>
          {!anikotoError && currentEpObj?.anikotoEmbedId ? '🟢 Streaming via Anikoto' : '🟡 Streaming via fallback source'}
        </span>
        {anikotoError && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setAnikotoError(false)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '2px 8px', color: COLORS.primary, fontSize: '11px', cursor: 'pointer' }}>Retry Anikoto</button>
            <button onClick={() => setFallbackIndex(i => (i + 1) % fallbackSources.length)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '2px 8px', color: COLORS.muted, fontSize: '11px', cursor: 'pointer' }}>Try next source ({fallbackIndex + 1}/{fallbackSources.length})</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ color: COLORS.muted, fontSize: '13px', fontWeight: 700 }}>Audio:</span>
        {(['sub', 'dub'] as const).map(type => (
          <button key={type} onClick={() => {setAudioType(type); saveAudioPref(type)}} style={{ padding: '8px 20px', borderRadius: '8px', border: `1px solid ${audioType === type ? COLORS.pink : COLORS.border}`, backgroundColor: audioType === type ? '#3a1530' : COLORS.cardHover, color: audioType === type ? COLORS.pink : COLORS.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>{type}</button>
        ))}
      </div>
      <p style={{ color: '#fbbf24', fontSize: '12px', margin: '10px 0 0' }}>
        ⚠️ If video doesn't load, try switching Sub/Dub or a different episode.{' '}
        <a href={`https://myanimelist.net/anime/${animeId}`} target="_blank" rel="noreferrer" style={{ color: COLORS.primary }}>View on MAL</a>
      </p>
    </div>
  )

  const AnimeInfoCard = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      {animeInfo?.images?.jpg?.large_image_url && (
        <img src={animeInfo.images.jpg.large_image_url} alt={animeInfo.title} style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 10px' }}>{animeInfo?.title}</h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ backgroundColor: COLORS.border, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{animeInfo?.rating?.split(' ')[0] || 'PG'}</span>
          <span style={{ backgroundColor: COLORS.primary, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>HD</span>
          <span style={{ backgroundColor: COLORS.border, borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>📺 {animeInfo?.episodes ?? '?'}</span>
          <span style={{ backgroundColor: COLORS.border, borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>{animeInfo?.status}</span>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6, margin: '0 0 8px' }}>
          {synopsisExpanded || !animeInfo?.synopsis || animeInfo.synopsis.length <= 250
            ? animeInfo?.synopsis
            : `${animeInfo.synopsis.slice(0, 250)}...`}
          {animeInfo?.synopsis && animeInfo.synopsis.length > 250 && (
            <button onClick={() => setSynopsisExpanded(p => !p)} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, marginLeft: '4px' }}>
              {synopsisExpanded ? 'Show less' : '+ More'}
            </button>
          )}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {animeInfo?.genres?.slice(0, 5).map(g => (
            <span key={g.name} style={{ backgroundColor: '#1e1b4b', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: COLORS.primary }}>{g.name}</span>
          ))}
        </div>
        <div style={{ backgroundColor: COLORS.cardHover, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffd700', marginBottom: '4px' }}>⭐ {animeInfo?.score ?? 'N/A'}</div>
          <p style={{ color: COLORS.muted, fontSize: '12px', margin: '0 0 10px' }}>What do you think about this anime?</p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[{ key: 'boring', emoji: '😴', label: 'Boring' }, { key: 'great', emoji: '🤩', label: 'Great' }, { key: 'amazing', emoji: '🤯', label: 'Amazing' }].map(opt => (
              <button key={opt.key} onClick={() => setVote(opt.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: vote && vote !== opt.key ? 0.4 : 1, transform: vote === opt.key ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '22px' }}>{opt.emoji}</span>
                <span style={{ fontSize: '11px', color: COLORS.muted }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const CommentsSection = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.border}` }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>💬 Comments ({comments.length})</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
          {username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} placeholder="Add a comment..." style={{ flex: 1, backgroundColor: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 12px', color: COLORS.text, fontSize: '14px', outline: 'none', minWidth: 0 }} />
          <button onClick={handleComment} style={{ backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Post</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2d2f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{c.user[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{c.user}</span>
                <span style={{ color: COLORS.muted, fontSize: '11px' }}>{c.time}</span>
              </div>
              <p style={{ color: '#d1d5db', fontSize: '13px', margin: '0 0 6px', lineHeight: 1.5, wordBreak: 'break-word' }}>{c.text}</p>
              <button onClick={() => handleLike(c.id)} style={{ background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer', fontSize: '13px', padding: 0 }}>👍 {c.likes}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, color: COLORS.text, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ backgroundColor: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '18px', fontWeight: 600, flexShrink: 0 }}>← Back</button>
        <span style={{ color: COLORS.muted, flexShrink: 0 }}>|</span>
        <span style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {animeInfo?.title} — Episode {currentEp}
        </span>
      </nav>

      {isMobile ? (
        <div style={{ padding: '12px' }}>
          <VideoPlayer />
          <ControlsBar mobile />
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <p style={{ color: COLORS.muted, fontSize: '13px', margin: '0 0 4px' }}>You are watching</p>
            <p style={{ color: COLORS.pink, fontWeight: 700, fontSize: '16px', margin: 0 }}>Episode {currentEp}</p>
          </div>
          <ServerSelector />
          <NextEpisodeCountdown />
          <div style={{ marginBottom: '16px' }}><EpisodeList /></div>
          <div style={{ marginBottom: '16px' }}><AnimeInfoCard /></div>
          <CommentsSection />
        </div>
      ) : (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '16px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: '70px' }}><EpisodeList /></div>
          <div>
            <VideoPlayer />
            <ControlsBar />
            <ServerSelector />
            <NextEpisodeCountdown />
            <CommentsSection />
          </div>
          <div style={{ position: 'sticky', top: '70px' }}><AnimeInfoCard /></div>
        </div>
      )}
    </div>
  )
}