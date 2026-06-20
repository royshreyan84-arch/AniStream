"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RecentComment } from '@/app/lib/types'
import { Navbar } from '../lib/Navbar'

const PINK = '#ff2475'
const PURPLE = '#6c63ff'
const BG = '#0d0f1a'
const CARD = '#13152b'
const BORDER = '#1e2140'

const getTitle = (anime: any, lang: 'en' | 'ja') =>
  lang === 'ja' ? anime.title : (anime.title_english || anime.title)

export default function Home() {
  const router = useRouter()
  const [animeList, setAnimeList] = useState<any[]>([])
  const [trendingList, setTrendingList] = useState<any[]>([])
  const [latestEpisodes, setLatestEpisodes] = useState<any[]>([])
  const [featured, setFeatured] = useState<any>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [showComments, setShowComments] = useState(true)
  const [top10Tab, setTop10Tab] = useState('Today')
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lang, setLang] = useState<'en' | 'ja'>('en')
  const trendingRef = useRef<HTMLDivElement | null>(null)
  const [recentComments, setRecentComments] = useState<RecentComment[]>([
    { id: 1, user: 'animeFan', content: 'Loved the latest episode', time: '2023-10-01 12:00:00', animeId: 1, animeTitle: 'Some Anime' }
  ])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true')
    try {
      const saved = localStorage.getItem('anistream_lang') as 'en' | 'ja' | null
      if (saved === 'en' || saved === 'ja') setLang(saved)
    } catch {}
  }, [])

  useEffect(() => {
    fetch('https://api.jikan.moe/v4/top/anime?limit=20')
      .then(r => r.json())
      .then(data => { setAnimeList(data.data ?? []); setFeatured(data.data?.[0] ?? null) })
      .catch(() => { setAnimeList([]); setFeatured(null) })

    fetch('https://api.jikan.moe/v4/top/anime?limit=10')
      .then(r => r.json())
      .then(data => setTrendingList(data.data ?? []))
      .catch(() => setTrendingList([]))

    fetch('https://api.jikan.moe/v4/seasons/now?limit=12')
      .then(r => r.json())
      .then(data => setLatestEpisodes(data.data ?? []))
      .catch(() => setLatestEpisodes([]))
  }, [])

  useEffect(() => {
    if (animeList.length === 0) return
    const id = setInterval(() => {
      setFeaturedIndex(prev => {
        const next = (prev + 1) % Math.min(5, animeList.length)
        setFeatured(animeList[next])
        return next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [animeList])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchHistory')
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) { setContinueWatching(p); return } }
    } catch {}
    setContinueWatching([
      { id: 52991, title: 'Sousou no Frieren', ep: 6, watched: '22:13', total: '23:52', image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg' },
      { id: 16494, title: 'Demon Slayer', ep: 12, watched: '23:33', total: '23:46', image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' },
    ])
  }, [])

  const handleSearch = () => { if (search.trim()) window.location.href = `/search?q=${encodeURIComponent(search)}` }
  const handleSearchChange = (value: string) => setSearch(value)

  const SectionTitle = ({ title, href }: { title: string; href?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <h3 style={{ fontSize: isMobile ? '16px' : '19px', margin: 0, fontWeight: 700, color: PINK, borderLeft: `3px solid ${PINK}`, paddingLeft: '10px' }}>{title}</h3>
      {href && <a href={href} style={{ color: '#aaa', fontSize: '12px', textDecoration: 'none' }}>View More ›</a>}
    </div>
  )

  const TrendingCard = ({ anime, index }: { anime: any; index: number }) => (
    <div onClick={() => router.push(`/watch/${anime.mal_id}`)}
      style={{ minWidth: isMobile ? '105px' : '140px', cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        <img src={anime.images?.jpg?.image_url} alt={anime.title}
          style={{ width: '100%', height: isMobile ? '148px' : '195px', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.95))' }} />
        <div style={{ position: 'absolute', bottom: '6px', left: '8px', right: '8px' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', lineHeight: 1.3, color: 'white' }}>
            {getTitle(anime, lang)?.slice(0, 18)}{(getTitle(anime, lang)?.length ?? 0) > 18 ? '...' : ''}
          </p>
        </div>
        <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: PINK, borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: 'bold' }}>
          {String(index + 1).padStart(2, '0')}
        </div>
        {anime.score && (
          <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px', color: '#ffd700' }}>
            ⭐{anime.score}
          </div>
        )}
      </div>
    </div>
  )

  const PosterCard = ({ anime }: { anime: any }) => (
    <div onClick={() => router.push(`/watch/${anime.mal_id}`)}
      style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', backgroundColor: CARD, transition: 'transform 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      <div style={{ position: 'relative' }}>
        <img src={anime.images?.jpg?.image_url} alt={anime.title}
          style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', gap: '4px' }}>
          <span style={{ backgroundColor: '#1cd37a', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontWeight: 'bold', color: '#000' }}>
            CC {anime.episodes ?? '?'}
          </span>
        </div>
      </div>
      <div style={{ padding: '8px 8px 10px' }}>
        <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getTitle(anime, lang)}
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: '#8b8fa8' }}>{anime.type || 'TV'} • {anime.duration?.replace(' per ep', '') ?? '24 min'}</p>
      </div>
    </div>
  )

  const Top10List = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {animeList.slice(0, 10).map((anime: any, i: number) => (
        <div key={anime.mal_id} onClick={() => router.push(`/watch/${anime.mal_id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', backgroundColor: CARD, borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = PINK }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent' }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: i < 3 ? PINK : '#444', minWidth: '28px', textAlign: 'center', fontStyle: 'italic' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: '44px', height: '58px', objectFit: 'cover', borderRadius: '5px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getTitle(anime, lang)}
            </p>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ backgroundColor: '#1cd37a', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontWeight: 'bold', color: '#000' }}>SUB {anime.episodes ?? '?'}</span>
              <span style={{ color: '#ffd700', fontSize: '10px' }}>⭐ {anime.score ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <main style={{ backgroundColor: BG, minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      <Navbar
        isLoggedIn={isLoggedIn}
        lang={lang}
        onLangChange={(l) => {
          setLang(l)
          try { localStorage.setItem('anistream_lang', l) } catch {}
        }}
        onSearch={handleSearch}
        onSearchChange={handleSearchChange}
      />

      {/* HERO SPOTLIGHT */}
      {featured && (
        <div style={{ position: 'relative', height: isMobile ? '300px' : '460px', overflow: 'hidden' }}>
          <img src={featured.images.jpg.large_image_url} alt={featured.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,15,26,0.99) 40%, rgba(13,15,26,0.2) 80%, transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,15,26,1) 0%, transparent 55%)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: isMobile ? '0 16px' : '0 48px', maxWidth: '560px' }}>
            <div>
              <p style={{ color: PINK, fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>#{featuredIndex + 1} Spotlight</p>
              <h2 style={{ fontSize: isMobile ? '24px' : '38px', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
                {getTitle(featured, lang)}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#1cd37a', borderRadius: '4px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>HD</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>📺 {featured.type}</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>⭐ {featured.score}</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>{featured.episodes ?? '?'} eps</span>
              </div>
              <p style={{ color: '#c0c0d0', fontSize: isMobile ? '12px' : '13px', marginBottom: '20px', lineHeight: 1.6, maxWidth: '460px' }}>
                {featured.synopsis?.slice(0, isMobile ? 90 : 170)}{(featured.synopsis?.length ?? 0) > (isMobile ? 90 : 170) ? '...' : ''}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => router.push(`/watch/${featured.mal_id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: PINK, color: 'white', border: 'none', padding: isMobile ? '10px 20px' : '11px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ▶ Watch Now
                </button>
                <button style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: isMobile ? '10px 20px' : '11px 24px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  Detail
                </button>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', right: isMobile ? '12px' : '40px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {animeList.slice(0, 5).map((_, i) => (
              <div key={i} onClick={() => { setFeaturedIndex(i); setFeatured(animeList[i]) }}
                style={{ width: '7px', height: i === featuredIndex ? '22px' : '7px', borderRadius: '4px', backgroundColor: i === featuredIndex ? PINK : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Comments */}
      <div style={{ padding: isMobile ? '16px 16px 0' : '16px 28px 0', maxWidth: '1400px', margin: '0 auto' }}>
        <SectionTitle title="💬 Recent Comments" />
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', marginBottom: '8px' }}>
          {recentComments.map(c => (
            <div key={c.id} style={{ minWidth: isMobile ? '230px' : '280px', backgroundColor: CARD, borderRadius: '10px', padding: '14px', flexShrink: 0, border: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                  {c.user[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{c.user}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#8b8fa8' }}>{c.time}</p>
                </div>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#c0c0d0', fontStyle: 'italic', lineHeight: 1.5 }}>"{c.content}"</p>
              <p style={{ margin: 0, fontSize: '11px', color: PURPLE }}>📺 {c.animeTitle}</p>
            </div>
          ))}
        </div>
      </div>
      {/* MAIN LAYOUT — CSS-driven grid, no JS isMobile dependency for the structure itself */}
      <div className="home-main-grid">

        {/* LEFT COLUMN */}
        <div className="home-left-col">

          {/* Trending */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: isMobile ? '16px' : '19px', margin: 0, fontWeight: 700, color: PINK, borderLeft: `3px solid ${PINK}`, paddingLeft: '10px' }}>Trending</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => trendingRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1a1a2e', border: `1px solid ${BORDER}`, color: 'white', cursor: 'pointer', fontSize: '14px' }}>‹</button>
                <button onClick={() => trendingRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1a1a2e', border: `1px solid ${BORDER}`, color: 'white', cursor: 'pointer', fontSize: '14px' }}>›</button>
              </div>
            </div>
            <div ref={trendingRef} style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
              {trendingList.map((anime: any, i: number) => (
                <TrendingCard key={`t-${anime.mal_id}`} anime={anime} index={i} />
              ))}
            </div>
          </div>
          {/* Continue Watching */}
          {continueWatching.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle title="Continue Watching" href="/history" />
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                {continueWatching.slice(0, 6).map(item => (
                  <div key={item.id} style={{ minWidth: isMobile ? '148px' : '192px', backgroundColor: CARD, borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '105px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span style={{ color: PINK, fontWeight: 'bold' }}>EP {item.ep}</span>
                          <span>{item.watched}/{item.total}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 'bold' }}>{item.title.slice(0, 18)}{item.title.length > 18 ? '...' : ''}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => router.push(`/watch/${item.id}`)} style={{ flex: 1, padding: '5px', backgroundColor: PINK, border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Resume</button>
                        <button onClick={() => { const u = continueWatching.filter((a: any) => a.id !== item.id); setContinueWatching(u); try { localStorage.setItem('watchHistory', JSON.stringify(u)) } catch {} }}
                          style={{ padding: '5px 8px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest Episodes */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle title="Latest Episodes" href="/search" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {latestEpisodes.slice(0, 12).map((anime: any, i: number) => (
                <div key={`le-${anime.mal_id}-${i}`} onClick={() => router.push(`/watch/${anime.mal_id}`)}
                  style={{ cursor: 'pointer', display: 'flex', gap: '10px', backgroundColor: CARD, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = PINK)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={anime.images?.jpg?.image_url} alt={anime.title}
                      style={{ width: '80px', height: '100px', objectFit: 'cover', display: 'block' }} />
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: '#1cd37a', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 'bold', color: '#000' }}>
                      CC {anime.episodes ?? '?'}
                    </span>
                  </div>
                  <div style={{ padding: '8px 8px 8px 0', flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {getTitle(anime, lang)}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#8b8fa8' }}>{anime.type || 'TV'} • {anime.duration?.replace(' per ep', '') ?? 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Popular */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle title="Most Popular" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {animeList.map((anime: any, i: number) => (
                <PosterCard key={`p-${anime.mal_id}-${i}`} anime={anime} />
              ))}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: isMobile ? '16px' : '19px', margin: 0, fontWeight: 700, color: PINK, borderLeft: `3px solid ${PINK}`, paddingLeft: '10px' }}>Comments</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#aaa', fontSize: '12px' }}>Hide</span>
                <div onClick={() => setShowComments(p => !p)} style={{ width: '38px', height: '20px', borderRadius: '10px', backgroundColor: showComments ? PINK : '#333', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '3px', left: showComments ? '20px' : '3px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
            {showComments && (
              <div style={{ backgroundColor: CARD, borderRadius: '10px', padding: '16px', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', borderBottom: `1px solid ${BORDER}`, paddingBottom: '12px' }}>
                  {['Newest Comments', 'Top Comments'].map(t => (
                    <span key={t} style={{ fontSize: '13px', color: t === 'Newest Comments' ? PINK : '#aaa', fontWeight: t === 'Newest Comments' ? 'bold' : 'normal', cursor: 'pointer', borderBottom: t === 'Newest Comments' ? `2px solid ${PINK}` : 'none', paddingBottom: '4px' }}>{t}</span>
                  ))}
                </div>
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0, textAlign: 'center' }}>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Mobile Top 10 — shown only under 768px via CSS class below */}
          <div className="home-top10-mobile" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontWeight: 700, color: PINK, borderLeft: `3px solid ${PINK}`, paddingLeft: '10px' }}>Top 10</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['Today', 'Weekly', 'Monthly'].map(t => (
                  <button key={t} onClick={() => setTop10Tab(t)} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', fontSize: '11px', cursor: 'pointer', backgroundColor: top10Tab === t ? PINK : '#1a1a2e', color: top10Tab === t ? 'white' : '#aaa', fontWeight: top10Tab === t ? 'bold' : 'normal' }}>{t}</button>
                ))}
              </div>
            </div>
            <Top10List />
          </div>
        </div>

        {/* RIGHT COLUMN — desktop Top 10, shown only at 768px+ via CSS class below */}
        <div className="home-top10-desktop" style={{ padding: '24px 20px', borderLeft: `1px solid ${BORDER}` }}>
          <div style={{ position: 'sticky', top: '70px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: PINK, borderLeft: `3px solid ${PINK}`, paddingLeft: '10px' }}>Top 10</h3>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['Today', 'Week', 'Month'].map(t => (
                  <button key={t} onClick={() => setTop10Tab(t)} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', fontSize: '11px', cursor: 'pointer', backgroundColor: top10Tab === t ? PINK : '#1a1a2e', color: top10Tab === t ? 'white' : '#aaa', fontWeight: top10Tab === t ? 'bold' : 'normal' }}>{t}</button>
                ))}
              </div>
            </div>
            <Top10List />
          </div>
        </div>
      </div>

      {/* CSS-driven responsive layout — no JS timing issues, applied instantly by the browser */}
      <style jsx>{`
        .home-main-grid {
          display: block;
          max-width: 1400px;
          margin: 0 auto;
        }
        .home-left-col {
          padding: 16px;
          min-width: 0;
        }
        .home-top10-mobile {
          display: block;
        }
        .home-top10-desktop {
          display: none;
        }

        @media (min-width: 768px) {
          .home-main-grid {
            display: grid;
            grid-template-columns: 1fr 290px;
            gap: 0;
          }
          .home-left-col {
            padding: 24px 20px 24px 28px;
          }
          .home-top10-mobile {
            display: none;
          }
          .home-top10-desktop {
            display: block;
          }
        }
      `}</style>
    </main>
  )
}