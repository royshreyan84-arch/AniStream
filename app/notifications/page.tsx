"use client"
import { useState } from 'react'
import { Navbar } from '@/app/lib/Navbar'
import { NavigationTabs } from '@/app/lib/NavigationTabs'

const communityNotifs = [
  { id: 1, user: '@ShinobiX99', action: 'replied on', anime: 'Demon Slayer Season 3', time: '2 days ago', read: false },
  { id: 2, user: '@AnimeKing07', action: 'replied on', anime: 'Jujutsu Kaisen Season 2', time: '3 days ago', read: false },
  { id: 3, user: '@OtakuGirl22', action: 'replied on', anime: 'Attack on Titan Final Season', time: '5 days ago', read: true },
]

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('Anime')
  const [notifs, setNotifs] = useState(communityNotifs)

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })))
  }

  return (
    <main style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      <Navbar isLoggedIn={true} />
      <NavigationTabs currentTab="Notifications" />

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Tabs + Mark all read */}
        <div style={{
          backgroundColor: '#1a1a2e', borderRadius: '10px',
          overflow: 'hidden', border: '1px solid #333'
        }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
            {['Anime', 'Community'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '14px', border: 'none',
                backgroundColor: activeTab === tab ? '#0d0f1a' : 'transparent',
                color: activeTab === tab ? '#6c63ff' : '#aaa',
                fontSize: '15px', cursor: 'pointer', fontWeight: 'bold',
                borderBottom: activeTab === tab ? '2px solid #6c63ff' : 'none'
              }}>{tab}</button>
            ))}
          </div>

          {/* Mark all as read */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderBottom: '1px solid #333',
            cursor: 'pointer', color: '#aaa', fontSize: '14px'
          }} onClick={markAllRead}>
            <span>✓</span>
            <span>Mark all as read</span>
          </div>

          {/* Anime tab - empty */}
          {activeTab === 'Anime' && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              There is no notification
            </div>
          )}

          {/* Community tab */}
          {activeTab === 'Community' && (
            <div>
              {notifs.map(notif => (
                <div key={notif.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px', borderBottom: '1px solid #333',
                  backgroundColor: notif.read ? 'transparent' : '#1a1040'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    backgroundColor: '#6c63ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0
                  }}>👤</div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>{notif.user}</span>
                      <span style={{ color: '#aaa' }}> {notif.action}</span>
                    </p>
                    <p style={{ margin: '0 0 4px', color: '#6c63ff', fontSize: '13px' }}>{notif.anime}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{notif.time}</p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#6c63ff', flexShrink: 0
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}