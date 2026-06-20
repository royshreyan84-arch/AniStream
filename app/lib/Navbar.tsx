'use client'
import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { COLORS, SPACING, Z_INDEX, PROFILE_MENU_ITEMS } from '@/app/lib/constants'

const PINK = '#ff2475'
const DARK = '#0d0f1a'
const CARD = '#13152b'

const SIDEBAR_ITEMS = [
  { label: 'HOME', href: '/home' },
  { label: 'GENRE', href: '/search' },
  { label: 'TYPES', href: '/search' },
  { label: 'UPCOMING', href: '#' },
  { label: 'ONGOING', href: '#' },
  { label: 'COMPLETED', href: '#' },
  { label: 'DUBBED', href: '#' },
  { label: 'WATCH2GETHER', href: '#' },
  { label: 'ADVANCED SEARCH', href: '/search' },
]

export const Navbar = ({
  isLoggedIn = false,
  onSearchChange,
  onSearch,
  lang,
  onLangChange,
}: {
  isLoggedIn?: boolean
  onSearchChange?: (value: string) => void
  onSearch?: () => void
  lang?: 'en' | 'ja'
  onLangChange?: (lang: 'en' | 'ja') => void
}) => {
  const pathname = usePathname()
  const hideOnPaths = ['/profile', '/history', '/watchlist', '/notifications', '/settings', '/import', '/sync']
  const hideWidgets = hideOnPaths.includes(pathname || '')

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [activeLang, setActiveLang] = useState<'en' | 'ja'>(lang ?? 'en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('anistream_lang') as 'en' | 'ja' | null
      if (saved === 'en' || saved === 'ja') {
        setActiveLang(saved)
        onLangChange?.(saved)
      }
    } catch {}
  }, [])

  const handleLangChange = (l: 'en' | 'ja') => {
    setActiveLang(l)
    onLangChange?.(l)
    try { localStorage.setItem('anistream_lang', l) } catch {}
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchRef = useRef<HTMLDivElement | null>(null)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange?.(value)
    if (!value.trim()) { setSearchResults([]); setIsDropdownOpen(false) }
  }

  useEffect(() => {
    const query = search.trim()
    if (!query) { setSearchResults([]); setIsDropdownOpen(false); return }
    const controller = new AbortController()
    const fetchResults = async () => {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal })
        const data = await res.json()
        if (controller.signal.aborted) return
        const results = Array.isArray(data.data) ? data.data.slice(0, 5) : []
        setSearchResults(results)
        setIsDropdownOpen(results.length > 0)
      } catch (error: any) {
        if (error.name !== 'AbortError') { setSearchResults([]); setIsDropdownOpen(false) }
      }
    }
    fetchResults()
    return () => controller.abort()
  }, [search])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const outsideDesktop = searchContainerRef.current && !searchContainerRef.current.contains(target)
      const outsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(target)
      if (outsideDesktop && outsideMobile) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    window.location.href = '/'
  }

  // Centralized "close everything else" helpers so any button tap collapses
  // whatever else is currently open — search, bell, profile, menu.
  const openMobileSearch = () => {
    setShowMobileSearch(p => !p)
    setBellOpen(false)
    setProfileOpen(false)
    setMenuOpen(false)
  }
  const openBell = () => {
    setBellOpen(p => !p)
    setProfileOpen(false)
    setShowMobileSearch(false)
    setMenuOpen(false)
  }
  const openProfile = () => {
    setProfileOpen(p => !p)
    setBellOpen(false)
    setShowMobileSearch(false)
    setMenuOpen(false)
  }
  const openMenu = () => {
    setMenuOpen(p => !p)
    setBellOpen(false)
    setProfileOpen(false)
    setShowMobileSearch(false)
  }
  const closeMobileSearch = () => {
    setShowMobileSearch(false)
    setSearchResults([])
    setIsDropdownOpen(false)
  }

  const DropdownResults = () => (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#141416', zIndex: 99999, borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', border: '1px solid #333', borderTop: 'none', marginTop: '2px', overflow: 'hidden' }}>
      {searchResults.map((item: any) => {
        const releaseYear = item.year ?? (item.aired?.from ? new Date(item.aired.from).getFullYear() : undefined)
        return (
          <a key={item.mal_id} href={`/watch/${item.mal_id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #1a1a2e' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a2e')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <img src={item.images?.jpg?.image_url || ''} alt={item.title} style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {item.score && <span style={{ color: '#aaa', fontSize: '11px' }}>⭐ {item.score}</span>}
                {item.type && <span style={{ color: '#aaa', fontSize: '11px' }}>• {item.type}</span>}
                {releaseYear && <span style={{ color: '#aaa', fontSize: '11px' }}>• {releaseYear}</span>}
              </div>
            </div>
          </a>
        )
      })}
      <a href={`/search?q=${encodeURIComponent(search)}`}
        style={{ display: 'block', padding: '10px 14px', color: COLORS.primary, fontSize: '13px', textDecoration: 'none', textAlign: 'center' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a2e')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >View all results →</a>
    </div>
  )

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 20px', backgroundColor: DARK,
        borderBottom: `2px solid ${COLORS.primary}`,
        position: 'sticky', top: 0, zIndex: Z_INDEX.navbar,
      }}>

        {/* Left: menu toggle + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={openMenu}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <a href="/home" style={{ color: COLORS.primary, fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ⚔️ AniStream
          </a>
        </div>

        {/* Center: search (desktop only) + extra buttons */}
        {!hideWidgets && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            {/* Search — desktop only. Mobile uses the icon + expandable bar instead. */}
            {!isMobile && (
              <div ref={searchContainerRef} style={{ position: 'relative', display: 'flex', width: '340px' }}>
                <input
                  type="text" placeholder="Search anime..." value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch?.()}
                  onFocus={() => { setBellOpen(false); setProfileOpen(false); if (search.trim() && searchResults.length > 0) setIsDropdownOpen(true) }}
                  style={{ width: '100%', padding: '8px 16px', borderRadius: '20px 0 0 20px', border: `1px solid ${COLORS.primary}`, backgroundColor: CARD, color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={onSearch} style={{ padding: '8px 16px', backgroundColor: COLORS.primary, border: 'none', borderRadius: '0 20px 20px 0', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                  Search
                </button>
                {isDropdownOpen && searchResults.length > 0 && <DropdownResults />}
              </div>
            )}

            {/* Extra nav links — desktop only */}
            {!isMobile && (
              <>
                <a className="nav-desktop-only" href="/search" style={{ color: '#c0c0d0', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔀 Random
                </a>
                <a className="nav-desktop-only" href="/watch2gether" style={{ color: '#c0c0d0', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  👥 Watch2gether
                </a>
              </>
            )}

            {/* Mobile: just pushes remaining items to the right */}
            {isMobile && <div style={{ flex: 1 }} />}
          </div>
        )}

        {hideWidgets && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/home" style={{ color: COLORS.text, textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
          </div>
        )}

        {/* Right: search icon (mobile) + EN/JP + bell + profile */}
        {!hideWidgets && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* Mobile search icon */}
            {isMobile && (
              <button onClick={openMobileSearch} style={{ background: 'none', border: 'none', color: showMobileSearch ? PINK : 'white', fontSize: '20px', cursor: 'pointer' }}>🔍</button>
            )}

            {/* EN/JP toggle — desktop only */}
            {!isMobile && (
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333', flexShrink: 0 }}>
                {(['en', 'ja'] as const).map(l => (
                  <button key={l} onClick={() => handleLangChange(l)} style={{
                    padding: '5px 11px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 'bold',
                    backgroundColor: activeLang === l ? PINK : '#1a1a2e',
                    color: activeLang === l ? 'white' : '#aaa',
                    transition: 'all 0.15s',
                  }}>{l.toUpperCase()}</button>
                ))}
              </div>
            )}

            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={openBell} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>🔔</button>
              {bellOpen && (
                <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: CARD, border: `1px solid ${COLORS.primary}`, borderRadius: '10px', width: '290px', zIndex: Z_INDEX.dropdown, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    {['Anime', 'Community'].map(tab => (
                      <button key={tab} style={{ flex: 1, padding: '11px', border: 'none', backgroundColor: DARK, color: COLORS.primary, fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{tab} 0</button>
                    ))}
                  </div>
                  <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>No notifications</div>
                </div>
              )}
            </div>

            {/* Profile or Login */}
            {isLoggedIn ? (
              <div style={{ position: 'relative' }}>
                <button onClick={openProfile} style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: COLORS.primary, border: 'none', color: 'white', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</button>
                {profileOpen && (
                  <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: CARD, border: `1px solid ${COLORS.primary}`, borderRadius: '10px', width: '190px', zIndex: Z_INDEX.dropdown, overflow: 'hidden' }}>
                    {PROFILE_MENU_ITEMS.map((item: any) => (
                      <a key={item.label} href={item.href}
                        onClick={item.label === 'Logout' ? handleLogout : undefined}
                        style={{ display: 'block', padding: '11px 16px', color: item.label === 'Logout' ? '#ff4444' : 'white', textDecoration: 'none', fontSize: '13px', borderBottom: `1px solid ${DARK}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = DARK)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >{item.label}</a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" style={{ backgroundColor: PINK, color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>Login</a>
            )}
          </div>
        )}
      </nav>

      {/* Mobile expandable search bar — tap search icon to open, X or any other navbar button closes it */}
      {showMobileSearch && isMobile && (
        <div ref={mobileSearchRef} style={{ padding: '10px 16px', backgroundColor: DARK, position: 'relative', borderBottom: `1px solid ${COLORS.primary}` }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text" placeholder="Search anime..." value={search}
              autoFocus
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch?.()}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: `1px solid ${COLORS.primary}`, backgroundColor: CARD, color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minWidth: 0 }}
            />
            <button onClick={closeMobileSearch} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>✕</button>
            {isDropdownOpen && searchResults.length > 0 && <DropdownResults />}
          </div>
        </div>
      )}

      {/* Sidebar */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '240px', backgroundColor: DARK, zIndex: 10000, borderRight: `2px solid ${COLORS.primary}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid #1a1a2e` }}>
              <a href="/home" style={{ color: COLORS.primary, fontSize: '18px', fontWeight: 'bold', textDecoration: 'none' }}>⚔️ AniStream</a>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a2e' }}>
              <div style={{ position: 'relative', display: 'flex' }}>
                <input
                  type="text" placeholder="Search anime..." value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { onSearch?.(); setMenuOpen(false) } }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '20px 0 0 20px', border: `1px solid ${COLORS.primary}`, backgroundColor: CARD, color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={() => { onSearch?.(); setMenuOpen(false) }} style={{ padding: '8px 12px', backgroundColor: COLORS.primary, border: 'none', borderRadius: '0 20px 20px 0', color: 'white', cursor: 'pointer', fontSize: '13px' }}>🔍</button>
              </div>
            </div>

            {SIDEBAR_ITEMS.map(item => (
              <a key={item.label} href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{ padding: '14px 20px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', borderBottom: '1px solid #1a1a2e', display: 'block' }}
                onMouseEnter={e => { (e.currentTarget.style.backgroundColor = '#1a1a2e'); (e.currentTarget.style.color = PINK) }}
                onMouseLeave={e => { (e.currentTarget.style.backgroundColor = 'transparent'); (e.currentTarget.style.color = 'white') }}
              >{item.label}</a>
            ))}
          </div>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }} />
        </>
      )}
    </>
  )
}