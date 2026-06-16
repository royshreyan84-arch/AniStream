'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ITEMS_PER_PAGE = 10

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(query)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    if (!query) return
    setLoading(true)
    setCurrentPage(1)
    // Fetch with pagination from Jikan API
    fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=${ITEMS_PER_PAGE}&page=1`)
      .then(res => res.json())
      .then(data => {
        setResults(data.data || [])
        setTotalResults(data.pagination?.items?.total || 0)
        setLoading(false)
      })
  }, [query])

  const fetchPage = (page: number) => {
    setLoading(true)
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=${ITEMS_PER_PAGE}&page=${page}`)
      .then(res => res.json())
      .then(data => {
        setResults(data.data || [])
        setLoading(false)
      })
  }

  const handleSearch = () => {
    window.location.href = `/search?q=${encodeURIComponent(search)}`
  }

  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE)

  return (
    <main style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', backgroundColor: '#0a0b14', borderBottom: '2px solid #6c63ff'
      }}>
        <a href="/home" style={{ color: '#6c63ff', fontSize: '24px', textDecoration: 'none' }}>⚔️ AniStream</a>
        <a href="/home" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>

        {/* Search bar */}
        <div style={{
          display: 'flex', marginBottom: '16px',
          border: '1px solid #6c63ff', borderRadius: '8px', overflow: 'hidden'
        }}>
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search anime..."
            style={{
              flex: 1, padding: '14px 16px', backgroundColor: '#1a1a2e',
              border: 'none', color: 'white', fontSize: '16px', outline: 'none'
            }} />
          <button onClick={handleSearch} style={{
            padding: '14px 20px', backgroundColor: '#6c63ff',
            border: 'none', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
          }}>Search</button>
        </div>

        {/* Results count */}
        {!loading && totalResults > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ borderBottom: '2px solid #6c63ff', paddingBottom: '4px' }}>
              <span style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: '15px' }}>Anime</span>
            </div>
            <span style={{ color: '#aaa', fontSize: '13px' }}>
              {totalResults} results • Page {currentPage} of {totalPages}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <p style={{ fontSize: '32px' }}>⏳</p>
            <p>Searching...</p>
          </div>
        )}

        {/* No query */}
        {!query && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            Type something to search for anime!
          </div>
        )}

        {/* No results */}
        {query && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <p style={{ fontSize: '32px' }}>😢</p>
            <p>No results found for "{query}"</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.map((anime: any, index: number) => (
          <div key={`${anime.mal_id}-${index}`}
            onClick={() => window.location.href = `/watch/${anime.mal_id}`}
            style={{
              display: 'flex', gap: '16px', padding: '16px 0',
              borderBottom: '1px solid #1a1a2e', cursor: 'pointer',
              borderRadius: '8px', transition: 'background 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a1a2e')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <img src={anime.images.jpg.image_url} alt={anime.title}
              style={{ width: '65px', height: '85px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px' }}>{anime.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {anime.rating && (
                  <span style={{
                    backgroundColor: '#1a1a2e', border: '1px solid #444',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#aaa'
                  }}>{anime.rating.split(' ')[0]}</span>
                )}
                {anime.score && <span style={{ color: '#aaa', fontSize: '13px' }}>⭐ {anime.score}</span>}
                <span style={{ color: '#aaa', fontSize: '13px' }}>{anime.type}</span>
                {anime.year && <span style={{ color: '#aaa', fontSize: '13px' }}>{anime.year}</span>}
              </div>
              {anime.synopsis && (
                <p style={{ margin: '8px 0 0', color: '#666', fontSize: '12px', lineHeight: 1.5 }}>
                  {anime.synopsis.slice(0, 100)}...
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <button
              onClick={() => fetchPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === 1 ? '#444' : '#6c63ff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>«</button>

            <button
              onClick={() => fetchPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 14px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === 1 ? '#444' : '#6c63ff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>‹ Prev</button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, currentPage - 2)
              return Math.min(start + i, totalPages)
            }).filter((v, i, a) => a.indexOf(v) === i).map(p => (
              <button key={p} onClick={() => fetchPage(p)} style={{
                padding: '8px 13px', borderRadius: '6px',
                border: `1px solid ${currentPage === p ? '#6c63ff' : '#333'}`,
                backgroundColor: currentPage === p ? '#6c63ff' : 'transparent',
                color: 'white', cursor: 'pointer',
                fontWeight: currentPage === p ? 'bold' : 'normal', fontSize: '13px'
              }}>{p}</button>
            ))}

            <button
              onClick={() => fetchPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 14px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === totalPages ? '#444' : '#6c63ff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>Next ›</button>

            <button
              onClick={() => fetchPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === totalPages ? '#444' : '#6c63ff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>»</button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}