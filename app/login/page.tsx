'use client'
import { useState, type CSSProperties } from 'react'

type View = 'auth' | 'forgot' | 'sent' | 'reset'

export default function Login() {
  const [view, setView] = useState<View>('auth')
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', isLogin ? email : username)
    if (rememberMe) localStorage.setItem('rememberMe', 'true')
    window.location.href = '/home'
  }

  const goToLogin = () => {
    setView('auth')
    setIsLogin(true)
    setResetError('')
    setResetSuccess(false)
  }

  // Step 1: user submits their email
  const handleSendResetLink = () => {
    if (!resetEmail) {
      setResetError('Please enter your email address')
      return
    }
    setResetError('')

    // TODO (Supabase): replace the line below with:
    // await supabase.auth.resetPasswordForEmail(resetEmail, {
    //   redirectTo: `${window.location.origin}/reset-password`,
    // })
    localStorage.setItem('resetEmail', resetEmail)

    setView('sent')
  }

  // Step 3: user submits new password
  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      setResetError('Please fill in both fields')
      return
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    setResetError('')

    // TODO (Supabase): replace the line below with:
    // await supabase.auth.updateUser({ password: newPassword })
    localStorage.setItem('password_' + resetEmail, newPassword)

    setResetSuccess(true)
    setTimeout(goToLogin, 1800)
  }

  // Shared styles
  const inputStyle: CSSProperties = {
    width: '100%', padding: '12px 14px',
    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)', color: 'white',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  }

  const passwordInputStyle: CSSProperties = {
    ...inputStyle,
    padding: '12px 44px 12px 14px',
  }

  const labelStyle: CSSProperties = {
    display: 'block', color: '#8b8fa8', fontSize: '11px', fontWeight: 600,
    letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase',
  }

  const titleStyle: CSSProperties = {
    textAlign: 'center', color: 'white',
    marginTop: 0, marginBottom: '6px',
    fontSize: '22px', fontWeight: 700,
    letterSpacing: '0.3px',
  }

  const subtitleStyle: CSSProperties = {
    textAlign: 'center', color: '#8b8fa8', fontSize: '13px',
    marginBottom: '24px', marginTop: 0,
  }

  const primaryButtonStyle: CSSProperties = {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
    transition: 'opacity 0.2s',
  }

  const eyeButtonStyle: CSSProperties = {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#8b8fa8',
    cursor: 'pointer', fontSize: '16px', padding: 0,
  }

  const errorStyle: CSSProperties = {
    color: '#f87171', fontSize: '12px', textAlign: 'center',
    marginBottom: '14px', marginTop: '-4px',
  }

  const backLinkStyle: CSSProperties = {
    textAlign: 'center', color: '#6c63ff', fontSize: '13px',
    marginTop: '18px', cursor: 'pointer', fontWeight: 600,
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(135deg, #0d0f1a 0%, #1a0f2e 40%, #0a1628 70%, #0d0f1a 100%)',
      }} />

      {/* Blurred glow effects */}
      <div style={{
        position: 'fixed', top: '10%', left: '15%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
        zIndex: 0, filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '15%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,179,237,0.1) 0%, transparent 70%)',
        zIndex: 0, filter: 'blur(40px)',
      }} />

      {/* Logo top left */}
      <a href="/" style={{
        position: 'fixed', top: '20px', left: '28px',
        color: '#6c63ff', fontSize: '22px', textDecoration: 'none',
        fontWeight: 'bold', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        ⚔️ AniStream
      </a>

      {/* Close button */}
      <a href="/" style={{
        position: 'fixed', top: '16px', right: '20px',
        width: '32px', height: '32px', borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white', textDecoration: 'none', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: 'bold',
        backdropFilter: 'blur(10px)',
      }}>✕</a>

      {/* Modal card */}
      <div style={{
        position: 'relative', zIndex: 1,
        backgroundColor: 'rgba(15, 17, 35, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '40px 36px',
        borderRadius: '16px',
        border: '1px solid rgba(108, 99, 255, 0.3)',
        width: '100%',
        maxWidth: '380px',
        margin: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.1)',
      }}>

        {/* ============ LOGIN / SIGN UP ============ */}
        {view === 'auth' && (
          <>
            {/* Title */}
            <h2 style={titleStyle}>
              {isLogin ? 'Welcome back!' : 'Create account'}
            </h2>
            <p style={subtitleStyle}>
              {isLogin ? 'Sign in to continue to AniStream' : 'Join AniStream today'}
            </p>

            {/* Login / Sign Up tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '30px',
              marginBottom: '24px',
              padding: '4px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <button onClick={() => setIsLogin(true)} style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '30px',
                backgroundColor: isLogin ? '#6c63ff' : 'transparent',
                color: isLogin ? 'white' : '#8b8fa8',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                transition: 'all 0.2s',
              }}>Login</button>
              <button onClick={() => setIsLogin(false)} style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '30px',
                backgroundColor: !isLogin ? '#6c63ff' : 'transparent',
                color: !isLogin ? 'white' : '#8b8fa8',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                transition: 'all 0.2s',
              }}>Sign Up</button>
            </div>

            {/* Username (sign up only) */}
            {!isLogin && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>USERNAME</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={passwordInputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={eyeButtonStyle}
                >{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#c0c0d0', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#6c63ff', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  Remember me
                </label>
                <span
                  onClick={() => {
                    setResetEmail(email)
                    setResetError('')
                    setView('forgot')
                  }}
                  style={{ color: '#6c63ff', fontSize: '13px', cursor: 'pointer' }}
                >
                  Forgot password?
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              style={primaryButtonStyle}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>

            {/* Bottom links */}
            <p style={{ textAlign: 'center', color: '#8b8fa8', marginTop: '20px', fontSize: '13px' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => setIsLogin(p => !p)}
                style={{ color: '#6c63ff', cursor: 'pointer', fontWeight: 600 }}
              >
                {isLogin ? 'Register' : 'Login'}
              </span>
              {isLogin && (
                <> {' or '}
                  <span style={{ color: '#6c63ff', cursor: 'pointer', fontWeight: 600 }}>Verify</span>
                </>
              )}
            </p>
          </>
        )}

        {/* ============ FORGOT PASSWORD - STEP 1: ENTER EMAIL ============ */}
        {view === 'forgot' && (
          <>
            <h2 style={titleStyle}>Reset password</h2>
            <p style={subtitleStyle}>
              Enter the email linked to your account and we'll send you a reset link
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="name@email.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendResetLink()}
                style={inputStyle}
              />
            </div>

            {resetError && <p style={errorStyle}>{resetError}</p>}

            <button
              onClick={handleSendResetLink}
              style={primaryButtonStyle}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Send Reset Link
            </button>

            <p style={backLinkStyle} onClick={goToLogin}>← Back to login</p>
          </>
        )}

        {/* ============ FORGOT PASSWORD - STEP 2: CHECK EMAIL ============ */}
        {view === 'sent' && (
          <>
            <div style={{ textAlign: 'center', fontSize: '40px', marginBottom: '12px' }}>📧</div>
            <h2 style={titleStyle}>Check your email!</h2>
            <p style={subtitleStyle}>
              We've sent a password reset link to{' '}
              <strong style={{ color: 'white' }}>{resetEmail}</strong>.
              Click the link in the email to continue.
            </p>

            {/*
              DEV / DUMMY ONLY — there's no real email being sent yet.
              This button simulates the user clicking the link from their inbox.
              Once Supabase is wired up, real emails will redirect users
              straight to the reset-password page (this button can be removed).
            */}
            <button
              onClick={() => setView('reset')}
              style={primaryButtonStyle}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              I clicked the link →
            </button>

            <p style={backLinkStyle} onClick={goToLogin}>← Back to login</p>
          </>
        )}

        {/* ============ FORGOT PASSWORD - STEP 3: SET NEW PASSWORD ============ */}
        {view === 'reset' && (
          <>
            <h2 style={titleStyle}>Set a new password</h2>
            <p style={subtitleStyle}>Choose a new password for {resetEmail}</p>

            {resetSuccess ? (
              <p style={{ textAlign: 'center', color: '#4ade80', fontSize: '14px', padding: '20px 0' }}>
                ✓ Password updated! Redirecting to login...
              </p>
            ) : (
              <>
                {/* New password */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>NEW PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={passwordInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(p => !p)}
                      style={eyeButtonStyle}
                    >{showNewPassword ? '🙈' : '👁️'}</button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>CONFIRM PASSWORD</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    style={inputStyle}
                  />
                </div>

                {resetError && <p style={errorStyle}>{resetError}</p>}

                <button
                  onClick={handleResetPassword}
                  style={primaryButtonStyle}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Reset Password
                </button>

                <p style={backLinkStyle} onClick={goToLogin}>← Back to login</p>
              </>
            )}
          </>
        )}

      </div>
    </main>
  )
}