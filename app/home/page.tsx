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

export default function Home() {
  const router = useRouter()
  const [animeList, setAnimeList] = useState<any[]>([])
  const [trendingList, setTrendingList] = useState<any[]>([])
  const [latestEpisodes, setLatestEpisodes] = useState<any[]>([])
  const [featured, setFeatured] = useState<any>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellTab, setBellTab] = useState('Anime')
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [showComments, setShowComments] = useState(true)
  const [top10Tab, setTop10Tab] = useState('Today')
  const [isMobile, setIsMobile] = useState(false)
  const trendingRef = useRef<HTMLDivElement | null>(null)
  const [lang, setLang] = useState<'en' | 'ja'>('en')
  const [recentComments, setRecentComments] = useState<RecentComment[]>([
    { id: 1, user: 'animeFan', content: 'Loved the latest episode', time: '2023-10-01 12:00:00', animeId: 1, animeTitle: 'Some Anime' }
  ])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleMenu = () => { setMenuOpen(p => !p); setBellOpen(false); setProfileOpen(false); setShowSearch(false) }
  const toggleBell = () => { setBellOpen(p => !p); setMenuOpen(false); setProfileOpen(false); setShowSearch(false) }
  const toggleProfile = () => { setProfileOpen(p => !p); setBellOpen(false); setMenuOpen(false); setShowSearch(false) }
  const toggleSearch = () => { setShowSearch(p => !p); setMenuOpen(false); setBellOpen(false); setProfileOpen(false) }

  useEffect(() => { setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true') }, [])

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    router.push('/login')
  }

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
    const close = () => { setShowDropdown(false); setSearchResults([]) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    clearTimeout((window as any).searchTimeout)
    if (!value.trim()) { setSearchResults([]); setShowDropdown(false); return }
    ;(window as any).searchTimeout = setTimeout(() => {
      setSearching(true)
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(value)}&limit=6`)
        .then(r => r.json())
        .then(data => { setSearchResults(Array.isArray(data.data) ? data.data : []); setShowDropdown(true); setSearching(false) })
        .catch(() => { setSearchResults([]); setSearching(false) })
    }, 500)
  }

  const handleSearch = () => { if (search.trim()) window.location.href = `/search?q=${encodeURIComponent(search)}` }

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

  const SearchDropdown = () => (
    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: CARD, border: `1px solid ${PURPLE}`, borderRadius: '10px', zIndex: 99999, marginTop: '4px', maxHeight: '350px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 10px' }}>
        <button onClick={() => { setShowDropdown(false); setSearchResults([]) }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      {searchResults.map((anime: any, i: number) => (
        <div key={`${anime.mal_id}-${i}`} onClick={() => router.push(`/watch/${anime.mal_id}`)}
          style={{ display: 'flex', gap: '12px', padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${BG}`, alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = BG)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{anime.title}</p>
            <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: '11px' }}>⭐ {anime.score} • {anime.type} • {anime.year}</p>
          </div>
        </div>
      ))}
      <div style={{ padding: '10px 16px', textAlign: 'center', position: 'sticky', bottom: 0, backgroundColor: CARD, borderTop: `1px solid ${PURPLE}` }}>
        <span onClick={() => window.location.href = `/search?q=${encodeURIComponent(search)}`} style={{ color: PURPLE, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>View all results →</span>
      </div>
    </div>
  )

  // HiAnime-style pink section title with left border
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
            {anime.title?.slice(0, 18)}{(anime.title?.length ?? 0) > 18 ? '...' : ''}
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

  // HiAnime-style card: big poster, title + type below
  const PosterCard = ({ anime }: { anime: any }) => (
    <div onClick={() => router.push(`/watch/${anime.mal_id}`)}
      style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', backgroundColor: CARD }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 20px rgba(0,0,0,0.4)` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ position: 'relative' }}>
        <img src={anime.images?.jpg?.image_url} alt={anime.title}
          style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#1cd37a', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontWeight: 'bold', color: '#000' }}>
            CC {anime.episodes ?? '?'}
          </span>
          {anime.score && (
            <span style={{ backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', color: '#ffd700' }}>
              ⭐{anime.score}
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: '8px 8px 10px' }}>
        <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anime.title}</p>
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
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anime.title}</p>
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

      {/* NAVBAR */}
      <Navbar lang={lang} onLangChange={setLang}/> 
       <nav style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: '#0a0b14', borderBottom: `2px solid ${PURPLE}`, position: 'sticky', top: 0, zIndex: 9999 }}>
        <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer', flexShrink: 0 }}>☰</button>
        <a href="/home" style={{ color: PURPLE, fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>⚔️ AniStream</a>

        {!isMobile && (
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, maxWidth: '380px', position: 'relative', display: 'flex' }}>
            <input type="text" placeholder="Search anime..." value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ width: '100%', padding: '8px 16px', borderRadius: '20px 0 0 20px', border: `1px solid ${PURPLE}`, backgroundColor: '#1a1a2e', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={handleSearch} style={{ padding: '8px 16px', backgroundColor: PURPLE, border: 'none', borderRadius: '0 20px 20px 0', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {searching ? '...' : 'Search'}
            </button>
            {showDropdown && searchResults.length > 0 && <SearchDropdown />}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && <button onClick={toggleSearch} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>🔍</button>}
          {isLoggedIn ? (
            <>
              <div style={{ position: 'relative' }}>
                <button onClick={toggleBell} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>🔔</button>
                {bellOpen && (
                  <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: CARD, border: `1px solid ${PURPLE}`, borderRadius: '10px', width: '290px', zIndex: 10001, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                      {['Anime', 'Community'].map(tab => (
                        <button key={tab} onClick={() => setBellTab(tab)} style={{ flex: 1, padding: '11px', border: 'none', backgroundColor: bellTab === tab ? BG : 'transparent', color: bellTab === tab ? PURPLE : '#aaa', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{tab} 0</button>
                      ))}
                    </div>
                    <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>No notifications</div>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={toggleProfile} style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: PURPLE, border: 'none', color: 'white', cursor: 'pointer', fontSize: '15px' }}>👤</button>
                {profileOpen && (
                  <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: CARD, border: `1px solid ${PURPLE}`, borderRadius: '10px', width: '190px', zIndex: 10001, overflow: 'hidden' }}>
                    {[{ label: 'Profile', href: '/profile' }, { label: 'History', href: '/history' }, { label: 'Watchlist', href: '/watchlist' }, { label: 'Notifications', href: '/notifications' }, { label: 'Settings', href: '/settings' }, { label: 'Logout', href: '/logout' }].map(item => (
                      <a key={item.label} href={item.href} onClick={item.label === 'Logout' ? handleLogout : undefined}
                        style={{ display: 'block', padding: '11px 16px', color: item.label === 'Logout' ? '#ff4444' : 'white', textDecoration: 'none', fontSize: '13px', borderBottom: `1px solid ${BG}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = BG)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >{item.label}</a>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <a href="/login" style={{ backgroundColor: PINK, color: 'white', textDecoration: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>Login</a>
          )}
        </div>
      </nav>

      {/* Mobile search */}
      {showSearch && isMobile && (
        <div onClick={e => e.stopPropagation()} style={{ padding: '10px 16px', backgroundColor: '#0a0b14', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Search anime..." value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: `1px solid ${PURPLE}`, backgroundColor: '#1a1a2e', color: 'white', fontSize: '14px', outline: 'none' }}
            />
            <button onClick={handleSearch} style={{ padding: '10px 16px', backgroundColor: PURPLE, border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer' }}>Search</button>
          </div>
          {showDropdown && searchResults.length > 0 && <SearchDropdown />}
        </div>
      )}

      {/* Sidebar */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '250px', backgroundColor: '#0a0b14', zIndex: 10000, borderRight: `2px solid ${PURPLE}`, padding: '24px 0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 20px' }}>
            <h2 style={{ color: PURPLE, margin: 0, fontSize: '18px' }}>⚔️ AniStream</h2>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>✕</button>
          </div>
          {[{ label: 'Home', href: '/home' }, { label: 'Upcoming', href: '#' }, { label: 'Ongoing', href: '#' }, { label: 'Dubbed', href: '#' }, { label: 'Completed', href: '#' }, { label: 'Watch2Gether', href: '#' }, { label: 'Advanced Search', href: '/search' }].map(item => (
            <a key={item.label} href={item.href} style={{ padding: '13px 20px', color: 'white', textDecoration: 'none', fontSize: '15px', borderBottom: '1px solid #1a1a2e' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a2e')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >{item.label}</a>
          ))}
        </div>
      )}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }} />}

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
              <h2 style={{ fontSize: isMobile ? '24px' : '38px', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>{featured.title}</h2>
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
          {/* Spotlight dots */}
          <div style={{ position: 'absolute', right: isMobile ? '12px' : '40px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {animeList.slice(0, 5).map((_, i) => (
              <div key={i} onClick={() => { setFeaturedIndex(i); setFeatured(animeList[i]) }}
                style={{ width: '7px', height: i === featuredIndex ? '22px' : '7px', borderRadius: '4px', backgroundColor: i === featuredIndex ? PINK : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      )}
      {/* Recent Comments */}
<div style={{ marginBottom: '16px' }}>
  <SectionTitle title="💬 Recent Comments" />
  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
    {recentComments.map(c => (
      <div key={c.id} style={{ minWidth: isMobile ? '230px' : '280px', backgroundColor: '#13152b', borderRadius: '10px', padding: '14px', flexShrink: 0, border: '1px solid #1e2140' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
            {c.user[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{c.user}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#8b8fa8' }}>{c.time}</p>
          </div>
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#c0c0d0', fontStyle: 'italic', lineHeight: 1.5 }}>"{c.content}"</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#6c63ff' }}>📺 {c.animeTitle}</p>
      </div>
    ))}
  </div>
</div>

      {/* MAIN LAYOUT */}
      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '1fr 290px', gap: 0, maxWidth: '1400px', margin: '0 auto' }}>

        {/* LEFT COLUMN */}
        <div style={{ padding: isMobile ? '16px' : '24px 20px 24px 28px', minWidth: 0 }}>

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
                        <button onClick={() => { const u = continueWatching.filter(a => a.id !== item.id); setContinueWatching(u); try { localStorage.setItem('watchHistory', JSON.stringify(u)) } catch {} }}
                          style={{ padding: '5px 8px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest Episodes — 2-col grid like HiAnime */}
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
                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{anime.title}</p>
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

          {/* Mobile Top 10 */}
          {isMobile && (
            <div style={{ marginBottom: '24px' }}>
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
          )}</div>
        
       

      </div>
    </main>
  )
}
