"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/app/lib/Navbar'
import { NavigationTabs } from '@/app/lib/NavigationTabs'

interface WatchlistEntry {
  id: string | number
  title: string
  image: string
  eps: number
  status: string
  addedAt?: number
}

const statusColors: any = {
  'Watching': '#00c853',
  'Watched': '#6c63ff',
  'Planned': '#ff9800',
  'On-Hold': '#2196f3',
  'Dropped': '#ff4444',
}

export default function Watchlist() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [watchlistData, setWatchlistData] = useState<WatchlistEntry[]>([])

  const tabs = ['All', 'Watching', 'On-Hold', 'Planned', 'Dropped', 'Watched']

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchlist')
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) setWatchlistData(list)
    } catch {
      setWatchlistData([])
    }
  }, [])

  const removeEntry = (id: string | number) => {
    const updated = watchlistData.filter(a => String(a.id) !== String(id))
    setWatchlistData(updated)
    try {
      localStorage.setItem('watchlist', JSON.stringify(updated))
    } catch {}
  }

  let filtered = watchlistData.filter(anime => {
    const matchesTab = activeTab === 'All' || anime.status === activeTab
    const matchesSearch = anime.title.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  if (sortBy === 'title') {
    filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
  } else if (sortBy === 'episodes') {
    filtered = [...filtered].sort((a, b) => (b.eps ?? 0) - (a.eps ?? 0))
  }

  return (
    <main style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      <Navbar isLoggedIn={true} />
      <NavigationTabs currentTab="Watchlist" />

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Info text */}
        <div style={{ color: '#666', fontSize: '13px', marginBottom: '16px', lineHeight: '1.8' }}>
          <p style={{ margin: 0 }}>- Anime are added here from the "+" button on the watch page.</p>
          <p style={{ margin: 0 }}>- Click the ✕ to remove an anime from your list.</p>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none',
              color: activeTab === tab ? '#6c63ff' : '#aaa',
              fontSize: '14px', cursor: 'pointer', padding: '4px 0',
              borderBottom: activeTab === tab ? '2px solid #6c63ff' : '2px solid transparent',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}>{tab}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input type="text" placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px', backgroundColor: '#1a1a2e',
              border: '1px solid #333', borderRadius: '8px',
              color: 'white', fontSize: '14px', outline: 'none'
            }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px', backgroundColor: '#1a1a2e',
              border: '1px solid #333', borderRadius: '8px',
              color: sortBy ? 'white' : '#666', fontSize: '14px', outline: 'none'
            }}>
            <option value="">Sort by</option>
            <option value="title">Title</option>
            <option value="episodes">Episodes</option>
          </select>
        </div>

        {/* Anime List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 && (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>
              {watchlistData.length === 0
                ? 'Your watchlist is empty. Add anime from the watch page!'
                : 'No anime found!'}
            </p>
          )}
          {filtered.map(anime => (
            <div key={anime.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              backgroundColor: '#1a1a2e', borderRadius: '8px', padding: '12px',
              border: '1px solid #333', cursor: 'pointer'
            }}
              onClick={() => router.push(`/watch/${anime.id}`)}
            >
              <img src={anime.image} alt={anime.title}
                style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anime.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: statusColors[anime.status] ?? '#6c63ff',
                    color: 'white', padding: '2px 10px',
                    borderRadius: '12px', fontSize: '12px'
                  }}>{anime.status}</span>
                  <span style={{ color: '#aaa', fontSize: '12px' }}>{anime.eps ?? 0} EPS</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeEntry(anime.id) }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px', padding: '4px', flexShrink: 0 }}
              >✕</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}