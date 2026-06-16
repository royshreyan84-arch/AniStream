'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/app/lib/Navbar'
import { NavigationTabs } from '@/app/lib/NavigationTabs'

const ITEMS_PER_PAGE = 10

const initialHistory = [
  { id: 1, title: 'Sousou no Frieren', ep: 6, watched: '22:13', total: '23:52', image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg' },
  { id: 2, title: 'Demon Slayer', ep: 12, watched: '23:33', total: '23:46', image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' },
  { id: 3, title: 'Jujutsu Kaisen', ep: 1, watched: '00:33', total: '14:29', image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' },
  { id: 4, title: 'Attack on Titan', ep: 8, watched: '00:14', total: '23:46', image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
]

export default function History() {
  const [history, setHistory] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchHistory')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
          return
        }
      }
    } catch (err) {}
    setHistory(initialHistory)
    localStorage.setItem('watchHistory', JSON.stringify(initialHistory))
  }, [])

  const syncHistory = (nextHistory: any[]) => {
    setHistory(nextHistory)
    try {
      localStorage.setItem('watchHistory', JSON.stringify(nextHistory))
    } catch (err) {}
  }

  const removeAnime = (id: number) => {
    const next = history.filter(a => a.id !== id)
    syncHistory(next)
    // If current page is now empty, go back one page
    const newTotalPages = Math.ceil(next.length / ITEMS_PER_PAGE)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }

  const clearAll = () => {
    syncHistory([])
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE)
  const paginatedHistory = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <main style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <Navbar isLoggedIn={true} />
      <NavigationTabs currentTab="History" />

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Header row */}
        {history.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
              {history.length} item{history.length !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
            </p>
            <button onClick={clearAll} style={{
              backgroundColor: 'transparent', color: '#ff4444',
              border: '1px solid #ff4444', padding: '8px 16px',
              borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
            }}>Clear All</button>
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
            <p style={{ fontSize: '48px' }}>📺</p>
            <p style={{ fontSize: '18px' }}>No watch history yet</p>
            <a href="/home" style={{ color: '#6c63ff' }}>Start watching anime</a>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {paginatedHistory.map(anime => (
            <div key={anime.id} style={{ position: 'relative' }}>
              <button onClick={() => removeAnime(anime.id)} style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'white', border: 'none',
                color: 'black', fontSize: '14px', fontWeight: 'bold',
                cursor: 'pointer', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>

              <div style={{ backgroundColor: '#1a1a2e', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ position: 'relative' }}>
                  <img src={anime.image} alt={anime.title}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', padding: '6px 10px',
                    display: 'flex', justifyContent: 'space-between', fontSize: '12px'
                  }}>
                    <span style={{ color: '#6c63ff' }}>EP {anime.ep}</span>
                    <span style={{ color: 'white' }}>{anime.watched} / {anime.total}</span>
                  </div>
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{anime.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === 1 ? '#444' : '#6c63ff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>«</button>

            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 14px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === 1 ? '#444' : '#6c63ff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>‹ Prev</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc: (number | string)[], p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => (
                p === '...'
                  ? <span key={`dot-${i}`} style={{ color: '#aaa', padding: '0 4px' }}>...</span>
                  : <button key={p} onClick={() => setCurrentPage(p as number)} style={{
                    padding: '8px 13px', borderRadius: '6px',
                    border: `1px solid ${currentPage === p ? '#6c63ff' : '#333'}`,
                    backgroundColor: currentPage === p ? '#6c63ff' : 'transparent',
                    color: 'white', cursor: 'pointer', fontWeight: currentPage === p ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}>{p}</button>
              ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 14px', borderRadius: '6px', border: '1px solid #6c63ff',
                backgroundColor: 'transparent', color: currentPage === totalPages ? '#444' : '#6c63ff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>Next ›</button>

            <button
              onClick={() => setCurrentPage(totalPages)}
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