'use client'
import {getAudioPref,saveAudioPref, getLastEpisode, saveLastEpisode, getUsername, refreshSessionActivity} from '@/app/lib/cookies'
import { supabase } from '@/app/lib/supabaseClient'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Footer from '@/app/lib/components/Footer'
import { saveWatchHistory, getWatchHistory } from '@/app/lib/watchHistory'

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

interface RecommendedAnime {
  mal_id: number
  title: string
  image: string
  score?: number
  episodes?: number
  genres?: string[]
}

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

async function searchAnikotoSlug(title: string, englishTitle?: string): Promise<string | null> {
  const slugs = [titleToSlug(title)]
  if (englishTitle && englishTitle !== title) slugs.push(titleToSlug(englishTitle))
  for (const slug of slugs) {
    const id = await fetchAnikotoPageId(slug)
    if (id) return id
    const shortSlug = slug.split('-').slice(0, 3).join('-')
    if (shortSlug !== slug) {
      const shortId = await fetchAnikotoPageId(shortSlug)
      if (shortId) return shortId
    }
  }
  return null
}

async function fetchAnikotoPageId(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/anikoto/episodes?name=${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.id ? String(data.id) : null
  } catch { return null }
}

async function fetchAnikotoEpisodes(pageId: string): Promise<Array<{ number: number; title: string; releasedAt: number }>> {
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

async function fetchAnikotoSeries(id: string | number): Promise<Array<{ number: number; embedSub?: string; embedDub?: string }>> {
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

function useCountdown(targetMs: number | null) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !targetMs) {
      setTimeLeft(null)
      return
    }

    const tick = () => {
      const diff = targetMs - Date.now()

      if (diff <= 0) {
        setTimeLeft('Released')
        return
      }

      const d = Math.floor(diff / 86_400_000)
      const h = Math.floor((diff % 86_400_000) / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)

      setTimeLeft(
        d > 0
          ? `${d}d ${h}h ${m}m`
          : `${h}h ${m}m ${s}s`
      )
    }

    tick()

    const id = setInterval(() => {
      const diff = targetMs - Date.now()

      if (diff <= 0) {
        clearInterval(id)
        setTimeLeft('Released')
        return
      }

      tick()
    }, 1000)

    return () => clearInterval(id)
  }, [targetMs, mounted])

  return timeLeft
}
  


function useNow() {
  const [now, setNow] = useState<number>(0)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [])
  return now
}

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
  const [watchSearch, setWatchSearch] = useState('')
  const [showWatchSearch, setShowWatchSearch] = useState(false)
  const [showWatchBell, setShowWatchBell] = useState(false)
  const [showWatchProfile, setShowWatchProfile] = useState(false)
  const [isWatchloggedIn, setIsWatchLoggedIn] = useState(false)
  

  // Recommendations + Top10
  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([])
  const [top10List, setTop10List] = useState<any[]>([])
  const [top10Tab, setTop10Tab] = useState('Today')
  const [loadingRec, setLoadingRec] = useState(false)

  const [audioType, setAudioType] = useState<'sub' | 'dub'>(
  () => (typeof window !== 'undefined' ? getAudioPref() : 'sub')
)
  const [autoPlay, setAutoPlay] = useState(true)
  const [autoNext, setAutoNext] = useState(true)
  const [autoSkipIntro, setAutoSkipIntro] = useState(true)
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [vote, setVote] = useState<string | null>(null)
  useEffect(() => {
    saveAudioPref(audioType)
  }, [audioType])
  
  // Fix comment scroll jump — use ref for comment input
  const commentInputRef = useRef<HTMLInputElement>(null)
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, user: 'SakuraMoon', text: 'This episode was incredible! The animation is top tier 🔥', time: '2h ago', likes: 24 },
    { id: 2, user: 'OtakuKing99', text: 'The fight scene gave me chills. Absolute masterpiece.', time: '5h ago', likes: 18 },
    { id: 3, user: 'AnimeDaily', text: "Can't wait for the next episode, the cliffhanger was brutal 😭", time: '1d ago', likes: 41 },
  ])
  const [newComment, setNewComment] = useState('')
  const [username, setUsername] = useState('Guest')

  const now = useNow()
  const currentEpObj = episodes.find(e => e.number === currentEp)
  const nextUnreleased = now > 0 ? (episodes.find(e => e.releasedAt && e.releasedAt > now) ?? null) : null
  const countdown = useCountdown(nextUnreleased?.releasedAt ?? null)

  const [fallbackIndex, setFallbackIndex] = useState(0)
  const fallbackSources = [
    `https://vidsrc-embed.su/embed/anime/${animeId}/${currentEp}`,
    `https://vidsrcme.ru/embed/anime?mal=${animeId}&episode=${currentEp}`,
    `https://vidsrc.su/embed/anime?mal=${animeId}&episode=${currentEp}`,
  ]
  const playerUrl = (() => {
    if (!anikotoError && currentEpObj?.anikotoEmbedId) {
      return `https://megaplay.buzz/stream/s-2/${currentEpObj.anikotoEmbedId}/${audioType}`
    }
    return fallbackSources[fallbackIndex] ?? fallbackSources[0]
  })()
  useEffect(() => {
    const name =getUsername()
    if (name) setUsername(name)
  }, [])

  useEffect(() =>{
    setFallbackIndex(0)
    setAnikotoError(false)
  }, [currentEp, animeId])

  

  useEffect(() => {
  if (!anikotoError) return

  const timer = setTimeout(() => {
    setFallbackIndex(prev =>
      prev + 1 < fallbackSources.length ? prev + 1 : prev
    )
  }, 6000)

  return () => clearTimeout(timer)
}, [anikotoError])


  const fetchAnimeInfo = useCallback(async () => {
    try {
      setLoadingInfo(true)
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`,
         {next:{ revalidate:3600}}
      )
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
      const pageId = await searchAnikotoSlug(info.title, info.title_english)
      let timedEps: Array<{ number: number; title: string; releasedAt: number }> = []
      if (pageId) timedEps = await fetchAnikotoEpisodes(pageId)
      const siteEps = await fetchAnikotoSeries(animeId)
      const totalEps = info.episodes || Math.max(timedEps.length, 12)
      const merged: Episode[] = Array.from({ length: totalEps }, (_, i) => {
  const n = i + 1

  const timed = timedEps.find(e => e.number === n)
  const site = siteEps.find(e => e.number === n)

  const rawEmbed =
    audioType === 'dub'
      ? site?.embedDub
      : site?.embedSub
      console.log('episode', n, 'rawEmbed', rawEmbed)
  return {
  id: `ep-${n}`,
  number: n,
  title: timed?.title ?? `Episode ${n}`,
  anikotoEmbedId: rawEmbed
    ? rawEmbed
        .split('/')
        .filter(Boolean)
        .pop()
    : undefined,
  releasedAt: timed?.releasedAt ?? 0,
}
})

setEpisodes(merged)

const hasAnyEmbed = merged.some(ep => ep.anikotoEmbedId)
setAnikotoError(!hasAnyEmbed)
      
    } catch {
      const total = info.episodes || 12
      setEpisodes(Array.from({ length: Math.min(total, 200) }, (_, i) => ({
        id: `ep-${i + 1}`, number: i + 1, title: `Episode ${i + 1}`,
      })))
    } finally {
      setLoadingEpisodes(false)
    }
  }, [animeId, audioType])

  // Fetch recommendations based on genres + watch history
  const fetchRecommendations = useCallback(async (info: AnimeInfo) => {
    setLoadingRec(true)
    try {
      const genres = info.genres?.map(g => g.name) ?? []
     const history = await getWatchHistory()
      const watchedIds = new Set([animeId, ...history.map((h: any) => String(h.id))])

      // Use first genre to find similar anime
      const genre = genres[0]
      let recs: RecommendedAnime[] = []

      if (genre) {
        // Search Jikan for anime by genre
        const genreMap: Record<string, number> = {
          'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8, 'Fantasy': 10,
          'Horror': 14, 'Mystery': 7, 'Romance': 22, 'Sci-Fi': 24, 'Slice of Life': 36,
          'Sports': 30, 'Supernatural': 37, 'Thriller': 41,
        }
        const genreId = genreMap[genre]
        if (genreId) {
          const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=12`,
             {next:{ revalidate:3600}}
          )
          const data = await res.json()
          recs = (data.data ?? [])
            .filter((a: any) => !watchedIds.has(String(a.mal_id)))
            .slice(0, 8)
            .map((a: any) => ({
              mal_id: a.mal_id,
              title: a.title,
              image: a.images?.jpg?.image_url ?? '',
              score: a.score,
              episodes: a.episodes,
              genres: a.genres?.map((g: any) => g.name) ?? [],
            }))
        }
      }

      // Fallback: use Jikan recommendations endpoint
      if (recs.length < 4) {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`,
           {next:{ revalidate:3600}}
        )
        const data = await res.json()
        const extra = (data.data ?? []).slice(0, 8).map((r: any) => ({
          mal_id: r.entry.mal_id,
          title: r.entry.title,
          image: r.entry.images?.jpg?.image_url ?? '',
        }))
        recs = [...recs, ...extra.filter((a: any) => !watchedIds.has(String(a.mal_id)))].slice(0, 8)
      }

      setRecommendations(recs)
    } catch (err) {
      console.error('Recommendations failed:', err)
    } finally {
      setLoadingRec(false)
    }
  }, [animeId])

  // Fetch Top 10
  const fetchTop10 = useCallback(async (tab: string) => {
    try {
      const periodMap: Record<string, string> = { 'Today': 'day', 'Week': 'week', 'Month': 'month' }
      const period = periodMap[tab] ?? 'day'
      const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=airing&limit=10`, 
        {next:{ revalidate:3600}}
      )
      const data = await res.json()
      setTop10List(data.data ?? [])
    } catch (err) {
      console.error('Top10 failed:', err)
    }
  }, [])

  useEffect(() => {
    const username = getUsername()
    setIsWatchLoggedIn(!!username)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetchAnimeInfo().then(info => {
      if (info) {
        fetchEpisodes(info)
        saveWatchHistory(animeId)
        fetchRecommendations(info)
      }
    })
    fetchTop10(top10Tab)
    return () => window.removeEventListener('resize', checkMobile)
  }, [animeId])

  useEffect(() => {
    if (animeInfo) {
      fetchEpisodes(animeInfo)
     
    }
  }, [audioType])

  useEffect(() => { fetchTop10(top10Tab) }, [top10Tab])

  useEffect(() => {
    if (!animeId) return
    try {
      const raw = localStorage.getItem('watchlist')
      const list = raw ? JSON.parse(raw) : []
      const entry = Array.isArray(list) ? list.find((e: any) => String(e.id) === String(animeId)) : null
      setWatchlistStatus(entry?.status ?? null)
    } catch { setWatchlistStatus(null) }
  }, [animeId])

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

  // Fix: use functional update to avoid re-render scroll jump
  const handleComment = useCallback(() => {
    const text = commentInputRef.current?.value?.trim()
    if (!text) return
    setComments(prev => [{ id: Date.now(), user: username, text, time: 'Just now', likes: 0 }, ...prev])
    setNewComment('')
    if (commentInputRef.current) commentInputRef.current.value = ''
  }, [username])

  const handleLike = (id: number) =>
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c))

  const filteredEpisodes = episodes.filter(ep =>
    episodeSearch.trim() === '' || ep.number.toString().includes(episodeSearch.trim())
  )
  const switchEpisode = (epNum: number) => {
    setCurrentEp(epNum)
    setAnikotoError(false)
    saveLastEpisode(animeId, epNum)
    saveWatchHistory(animeId)
    refreshSessionActivity()
  }

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

  const VideoPlayer = () => (
    <div style={{ backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', paddingTop: '56.25%', marginBottom: '10px' }}>
      <iframe
        key={playerUrl}
        src={playerUrl}
        onLoad={() =>{
          console.log("iframe loaded")
        }}
        allowFullScreen
        referrerPolicy="no-referrer"
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
            Episode {nextUnreleased.number}{nextUnreleased.title !== `Episode ${nextUnreleased.number}` ? ` — ${nextUnreleased.title}` : ''}
          </p>
          <p style={{ color: isReleased ? '#4ade80' : COLORS.pink, fontWeight: 800, fontSize: '18px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {isReleased ? '✅ Out now!' : countdown}
          </p>
        </div>
        {isReleased && (
          <button
           onClick={() => switchEpisode(nextUnreleased.number)} style={{ backgroundColor: COLORS.pink, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>Watch ▶</button>
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
            <button key={ep.id} onClick={() => !isUnreleased && switchEpisode(ep.number)} disabled={isUnreleased}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: isActive ? '#2a1530' : 'transparent', border: 'none', borderLeft: isActive ? `3px solid ${COLORS.pink}` : '3px solid transparent', color: isUnreleased ? COLORS.border : isActive ? COLORS.pink : COLORS.muted, cursor: isUnreleased ? 'default' : 'pointer', textAlign: 'left', opacity: isUnreleased ? 0.5 : 1 }}>
              <span style={{ fontSize: '14px', fontWeight: isActive ? 700 : 400, minWidth: '28px', color: isActive ? COLORS.pink : COLORS.muted }}>{ep.number}</span>
              <span style={{ fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</span>
              {isUnreleased && <span style={{ fontSize: '10px', color: COLORS.muted, flexShrink: 0 }}>🔒</span>}
              {isActive && !isUnreleased && <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: COLORS.pink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>▶</span>}
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
            <button
  onClick={() => setFallbackIndex(i => (i + 1) % fallbackSources.length)}
  style={{
    background: 'none', border: `1px solid ${COLORS.border}`,
    borderRadius: '6px', padding: '4px 10px', color: COLORS.primary,
    fontSize: '11px', cursor: 'pointer',
  }}
>
  Try next source ({fallbackIndex + 1}/{fallbackSources.length})
</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ color: COLORS.muted, fontSize: '13px', fontWeight: 700 }}>Audio:</span>
        {(['sub', 'dub'] as const).map(type => (
          <button key={type} onClick={() => { setAudioType(type); saveAudioPref(type) }} style={{ padding: '8px 20px', borderRadius: '8px', border: `1px solid ${audioType === type ? COLORS.pink : COLORS.border}`, backgroundColor: audioType === type ? '#3a1530' : COLORS.cardHover, color: audioType === type ? COLORS.pink : COLORS.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>{type}</button>
        ))}
      </div>
      <p style={{ color: '#fbbf24', fontSize: '12px', margin: '10px 0 0' }}>
        ⚠️ If video doesn't load, try switching Sub/Dub or a different episode.{' '}
        <a href={`https://myanimelist.net/anime/${animeId}`} target="_blank" rel="noreferrer" style={{ color: COLORS.primary }}>View on MAL</a>
      </p>
    </div>
  )

  const AnimeInfoCard = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden', marginBottom: '16px' }}>
      {animeInfo?.images?.jpg?.large_image_url && (
        <img src={animeInfo.images.jpg.large_image_url} alt={animeInfo.title} style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }} />
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
          {synopsisExpanded || !animeInfo?.synopsis || animeInfo.synopsis.length <= 200 ? animeInfo?.synopsis : `${animeInfo.synopsis.slice(0, 200)}...`}
          {animeInfo?.synopsis && animeInfo.synopsis.length > 200 && (
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
          <p style={{ color: COLORS.muted, fontSize: '12px', margin: '0 0 10px' }}>What do you think?</p>
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

  // ── Recommendations Component ──────────────────────────────────────────────
  const RecommendationsSection = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: COLORS.pink, borderLeft: `3px solid ${COLORS.pink}`, paddingLeft: '10px' }}>
        🎯 Recommended For You
      </h3>
      {loadingRec ? (
        <p style={{ color: COLORS.muted, fontSize: '13px', textAlign: 'center' }}>Loading recommendations...</p>
      ) : recommendations.length === 0 ? (
        <p style={{ color: COLORS.muted, fontSize: '13px', textAlign: 'center' }}>No recommendations found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recommendations.map(anime => (
            <div key={anime.mal_id} onClick={() => router.push(`/watch/${anime.mal_id}`)}
              style={{ display: 'flex', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '8px', border: `1px solid transparent`, transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.pink)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <img src={anime.image} alt={anime.title} style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anime.title}</p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {anime.score && <span style={{ color: '#ffd700', fontSize: '11px' }}>⭐ {anime.score}</span>}
                  {anime.episodes && <span style={{ color: COLORS.muted, fontSize: '11px' }}>📺 {anime.episodes} eps</span>}
                </div>
                {anime.genres && anime.genres.length > 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: COLORS.primary }}>{anime.genres.slice(0, 2).join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Top 10 Component ───────────────────────────────────────────────────────
  const Top10Section = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: COLORS.pink, borderLeft: `3px solid ${COLORS.pink}`, paddingLeft: '10px' }}>🏆 Top 10</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['Today', 'Week', 'Month'].map(t => (
            <button key={t} onClick={() => setTop10Tab(t)} style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', fontSize: '10px', cursor: 'pointer', backgroundColor: top10Tab === t ? COLORS.pink : COLORS.cardHover, color: top10Tab === t ? 'white' : COLORS.muted, fontWeight: top10Tab === t ? 700 : 400 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {top10List.slice(0, 10).map((anime: any, i: number) => (
          <div key={anime.mal_id} onClick={() => router.push(`/watch/${anime.mal_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.pink)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <span style={{ fontSize: '16px', fontWeight: 900, color: i < 3 ? COLORS.pink : COLORS.muted, minWidth: '24px', textAlign: 'center', fontStyle: 'italic' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <img src={anime.images?.jpg?.image_url} alt={anime.title} style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anime.title}</p>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#1cd37a', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 700, color: '#000' }}>SUB</span>
                <span style={{ color: '#ffd700', fontSize: '10px' }}>⭐ {anime.score ?? 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Fix comment scroll: CommentsSection uses uncontrolled input via ref
  const CommentsSection = () => (
    <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.border}` }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>💬 Comments ({comments.length})</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
          {username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
          {/* Uncontrolled input with ref — prevents scroll jump on typing */}
          <input
            ref={commentInputRef}
            defaultValue=""
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="Add a comment..."
            style={{ flex: 1, backgroundColor: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 12px', color: COLORS.text, fontSize: '14px', outline: 'none', minWidth: 0 }}
          />
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, color: COLORS.text, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ backgroundColor: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '18px', fontWeight: 600, flexShrink: 0 }}>← Back</button>
        <span style={{ color: COLORS.muted, flexShrink: 0 }}>|</span>
        <span style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {animeInfo?.title} — Episode {currentEp}
        </span>
        {/* Bell */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => { setShowWatchBell(p => !p); setShowWatchProfile(false) }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🔔</button>
          {showWatchBell && (
            <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '10px', width: '260px', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}` }}>
                {['Anime', 'Community'].map(tab => (
                  <button key={tab} style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: COLORS.dark, color: COLORS.primary, fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{tab} 0</button>
                ))}
              </div>
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>No notifications</div>
            </div>
          )}
        </div>
        {/* Profile or Login */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isWatchloggedIn ? (
            <>
              <button onClick={() => { setShowWatchProfile(p => !p); setShowWatchBell(false) }} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: COLORS.primary, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</button>
              {showWatchProfile && (
                <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '10px', width: '180px', zIndex: 200, overflow: 'hidden' }}>
                  {[{ label: 'Profile', href: '/profile' }, { label: 'History', href: '/history' }, { label: 'Watchlist', href: '/watchlist' }, { label: 'Settings', href: '/settings' }, { label: 'Logout', href: '#' }].map(item => (
                    <a key={item.label} href={item.href}
                      onClick={item.label === 'Logout' ? (e) => { e.preventDefault(); localStorage.removeItem('isLoggedIn'); localStorage.removeItem('username'); router.push('/login') } : undefined}
                      style={{ display: 'block', padding: '10px 14px', color: item.label === 'Logout' ? '#ff4444' : 'white', textDecoration: 'none', fontSize: '13px', borderBottom: `1px solid ${COLORS.dark}` }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = COLORS.dark)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >{item.label}</a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <a href="/login" style={{ backgroundColor: '#ff2475', color: 'white', textDecoration: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>Login</a>
          )}
        </div>
      </nav>

      {isMobile ? (
        // ── MOBILE LAYOUT ──────────────────────────────────────────────────────
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
          <div style={{ marginBottom: '16px' }}><CommentsSection /></div>
          <div style={{ marginBottom: '16px' }}><RecommendationsSection /></div>
          <div style={{ marginBottom: '16px' }}><Top10Section /></div>
        </div>
      ) : (
        // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────
        <div style={{ maxWidth: '1700px', margin: '0 auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '16px', alignItems: 'start' }}>
          {/* Left: Episodes */}
          <div style={{ position: 'sticky', top: '70px' }}><EpisodeList /></div>

          {/* Center: Player + Controls + Comments */}
          <div>
            <VideoPlayer />
            <ControlsBar />
            <ServerSelector />
            <NextEpisodeCountdown />
            <CommentsSection />
          </div>

          {/* Right: AnimeInfo + Recommendations + Top10 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <AnimeInfoCard />
            <RecommendationsSection />
            <Top10Section />
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}