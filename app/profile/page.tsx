"use client"
import { useState, useEffect } from 'react'
import { Navbar } from '@/app/lib/Navbar'
import { NavigationTabs } from '@/app/lib/NavigationTabs'

export default function Profile() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [joinDate] = useState('Jun 10, 2026')

  useEffect(() => {
    setEmail(localStorage.getItem('username') || '')
    setUsername(localStorage.getItem('username') || '')
  }, [])

  const handleUpdate = () => {
    localStorage.setItem('username', username)
    alert('Profile updated successfully!')
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    window.location.href = '/'
  }

  return (
    <main style={{ backgroundColor: '#0d0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      <Navbar isLoggedIn={true} />
      <NavigationTabs currentTab="Profile" />

      {/* Profile Content */}
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 24px' }}>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ color: '#aaa', marginBottom: '16px' }}>Edit Avatar</p>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            backgroundColor: '#6c63ff', border: '3px solid #6c63ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', margin: '0 auto', cursor: 'pointer'
          }}>👤</div>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Click to change avatar</p>
        </div>

        {/* Join Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Join date</label>
          <div style={{
            padding: '12px 16px', backgroundColor: '#1a1a2e',
            borderRadius: '8px', border: '1px solid #333', color: '#aaa'
          }}>{joinDate}</div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', backgroundColor: '#1a1a2e',
              borderRadius: '8px', border: '1px solid #333', color: 'white',
              fontSize: '14px', boxSizing: 'border-box', outline: 'none'
            }} />
        </div>

        {/* Username */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', backgroundColor: '#1a1a2e',
              borderRadius: '8px', border: '1px solid #333', color: 'white',
              fontSize: '14px', boxSizing: 'border-box', outline: 'none'
            }} />
        </div>

        {/* Reading list visibility */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Reading list visibility</label>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
            Controls whether your watching list appears on your public profile.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="visibility" value="private"
                checked={visibility === 'private'} onChange={() => setVisibility('private')} />
              <span style={{ color: 'white' }}>Private</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="radio" name="visibility" value="public"
                checked={visibility === 'public'} onChange={() => setVisibility('public')} />
              <span style={{ color: 'white' }}>Public</span>
            </label>
          </div>
        </div>

        {/* Change Password */}
        <div style={{ marginBottom: '32px' }}>
          <a href="#" style={{ color: '#6c63ff', fontSize: '14px', textDecoration: 'none' }}>
            🔑 Change password
          </a>
        </div>

        {/* Update Button */}
        <button onClick={handleUpdate} style={{
          width: '100%', padding: '14px', backgroundColor: '#6c63ff',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
          marginBottom: '16px'
        }}>Update</button>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '14px', backgroundColor: 'transparent',
          color: '#ff4444', border: '1px solid #ff4444', borderRadius: '8px',
          fontSize: '16px', cursor: 'pointer'
        }}>Logout</button>

      </div>
    </main>
  )
}