'use client'
import { useState } from 'react'

export default function Sync() {
  const [activeTab, setActiveTab] = useState('Sync')
  const [anilistUsername, setAnilistUsername] = useState('')
  const [syncMode, setSyncMode] = useState('merge')

  const handleSync = () => {
    if (!anilistUsername.trim()) {
      alert('Please enter an AniList username!')
      return
    }
    alert(`Syncing with AniList for user: ${anilistUsername}`)
  }

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

      {/* Top icon navigation */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '32px',
        padding: '20px', backgroundColor: '#0a0b14',
        borderBottom: '1px solid #1a1a2e'
      }}>
        {[
          { label: 'Profile', href: '/profile' },
          { label: 'History', href: '/history' },
          { label: 'Watchlist', href: '/watchlist' },
          { label: 'Notifications', href: '/notifications' },
          { label: 'Settings', href: '/settings' },
          { label: 'Import', href: '/import' },
          { label: 'Sync', href: '/sync' },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            color: item.label === 'Sync' ? '#6c63ff' : '#aaa',
            textDecoration: 'none', fontSize: '13px',
            borderBottom: item.label === 'Sync' ? '2px solid #6c63ff' : 'none',
            paddingBottom: '4px'
          }}>{item.label}</a>
        ))}
      </div>

      <div style={{ maxWidth: '500px', margin: '32px auto', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#1a1a2e', borderRadius: '12px',
          border: '1px solid #333', overflow: 'hidden'
        }}>

          {/* Sync/Unsync tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
            {['Sync', 'Unsync'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '14px', border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab ? 'white' : '#aaa',
                fontSize: '15px', cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #6c63ff' : 'none',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}>{tab}</button>
            ))}
          </div>

          <div style={{ padding: '24px' }}>

            {activeTab === 'Sync' && (
              <>
                {/* Info text */}
                <div style={{ color: '#666', fontSize: '13px', marginBottom: '24px', lineHeight: '1.8' }}>
                  <p style={{ margin: '0 0 4px' }}>Sync your anime list with AniList</p>
                  <p style={{ margin: '0 0 4px' }}>- Your AniList account must be public.</p>
                  <p style={{ margin: '0 0 4px' }}>- Your watch history will be synchronized with your AniList profile.</p>
                  <p style={{ margin: 0 }}>- This process will take some time, please be patient.</p>
                </div>

                {/* AniList Username */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    AniList username
                  </label>
                  <input type="text" placeholder="AniList username"
                    value={anilistUsername} onChange={e => setAnilistUsername(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', backgroundColor: '#0d0f1a',
                      border: '1px solid #333', borderRadius: '8px', color: 'white',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }} />
                </div>

                {/* Sync Mode */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                    Sync mode
                  </label>
                  <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
                    {[{ value: 'merge', label: 'Merge' }, { value: 'replace', label: 'Replace' }].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="syncMode" value={opt.value}
                          checked={syncMode === opt.value}
                          onChange={() => setSyncMode(opt.value)} />
                        <span style={{ color: 'white', fontSize: '14px' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', margin: '4px 0' }}>
                    Merge: Merge your existing list with AniList.
                  </p>
                  <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                    Replace: Replace your current list with AniList data.
                  </p>
                </div>

                {/* Sync Button */}
                <button onClick={handleSync} style={{
                  width: '100%', padding: '14px', backgroundColor: '#6c63ff',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
                }}>Sync</button>
              </>
            )}

            {activeTab === 'Unsync' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#aaa', marginBottom: '24px' }}>Disconnect your AniList account from AniStream</p>
                <button style={{
                  padding: '14px 32px', backgroundColor: '#ff4444',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '16px', cursor: 'pointer'
                }}>Unsync Account</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}
