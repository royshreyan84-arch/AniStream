'use client'
import Image from 'next/image'

export default function Landing() {
  return (
    <main style={{
      backgroundColor: '#0d0f1a',
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden',
      fontFamily: 'sans-serif',
      color: 'white',
    }}>

     
        

      {/* Hero */}
<div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 40px)' }}>
  <div style={{
    borderRadius: '24px',
    border: '1px solid rgba(108,99,255,0.15)',
    overflow: 'hidden',
    boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
    position: 'relative',
  }}>

    {/* Banner image as background */}
    <div style={{ position: 'relative', width: '100%', minHeight: '320px' }}>
      <Image
        src="/images/hero-banner.jpeg"
        alt="Anime banner"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
      {/* Gradient overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(13,15,26,0.1) 0%, rgba(13,15,26,0.95) 85%)',
      }} />
    </div>

    {/* Text + search content, overlapping bottom of image */}
    <div style={{
      backgroundColor: '#13152b',
      padding: 'clamp(24px, 6vw, 48px) clamp(20px, 5vw, 40px)',
      marginTop: '-60px',
      position: 'relative',
    }}>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', margin: '0 0 12px', lineHeight: 1.2 }}>
        Welcome to <span style={{ color: '#6c63ff' }}>AniStream</span>
      </h1>
      <p style={{ color: '#8b8fa8', fontSize: '16px', marginBottom: '28px' }}>
        Your ultimate anime streaming destination — thousands of series, free, in HD.
      </p>

      <form onSubmit={(e) => {
        e.preventDefault()
        const input = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
        window.location.href = `/search?q=${encodeURIComponent(input)}`
      }} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          name="q"
          placeholder="Search anime..."
          style={{
            flex: '1 1 180px',
            minWidth: 0,
            padding: '14px 18px', borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.06)', color: 'white',
            fontSize: '14px', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button type="submit" style={{
          padding: '14px 22px', borderRadius: '30px', border: 'none',
          backgroundColor: '#6c63ff', color: 'white', fontWeight: 'bold',
          cursor: 'pointer', fontSize: '14px', flexShrink: 0,
        }}>Search</button>
      </form>

      <p style={{ color: '#6b6f8a', fontSize: '12px', marginBottom: '28px', lineHeight: 1.6 }}>
        <strong style={{ color: '#8b8fa8' }}>Top search:</strong>{' '}
        One Piece, Jujutsu Kaisen, Demon Slayer, Attack on Titan, My Hero Academia, Solo Leveling
      </p>

      <a href="/home" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        backgroundColor: '#6c63ff', color: 'white', textDecoration: 'none',
        padding: '16px 36px', borderRadius: '30px', fontSize: '16px',
        fontWeight: 'bold', alignSelf: 'flex-start',
        boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
      }}>🎌 Watch Anime →</a>
    </div>

  </div>
</div>

      {/* Genres */}
      <div style={{ padding: '0 clamp(16px, 5vw, 40px) 32px' }}>
        <h2 style={{ fontSize: '18px', color: '#c0c0d0', marginBottom: '16px', fontWeight: 600 }}>
          Browse by genre
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['Action', 'Romance', 'Shounen', 'Fantasy', 'Sci-Fi', 'Comedy'].map(tag => (
            <span key={tag} style={{
              backgroundColor: '#1a1a2e', border: '1px solid #6c63ff',
              padding: '8px 18px', borderRadius: '20px', fontSize: '14px', color: '#aaa',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '48px', flexWrap: 'wrap',
        justifyContent: 'center', padding: '0 clamp(16px, 5vw, 40px) 56px',
      }}>
        {[
          { number: '10,000+', label: 'Anime Series' },
          { number: 'Free', label: 'No Subscription' },
          { number: 'HD', label: 'Quality Streams' },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6c63ff', margin: 0 }}>{stat.number}</p>
            <p style={{ color: '#aaa', margin: '4px 0 0', fontSize: '14px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#444', paddingBottom: '40px', fontSize: '14px' }}>
        No account needed • Free forever • Updated daily
      </p>
    </main>
  )
}