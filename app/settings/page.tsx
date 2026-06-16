'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/app/lib/Navbar'
import { NavigationTabs } from '@/app/lib/NavigationTabs'
import { Toggle, Button } from '@/app/lib/components'
import { COLORS, SPACING } from '@/app/lib/constants'

export default function Settings() {
  const [continueWatching, setContinueWatching] = useState(true)
  const [language, setLanguage] = useState('japanese')
  const [autoLanguage, setAutoLanguage] = useState('subdub')
  const [autoPlay, setAutoPlay] = useState(true)
  const [autoNext, setAutoNext] = useState(true)
  const [autoComments, setAutoComments] = useState(true)
  const [skipSeconds, setSkipSeconds] = useState(10)
  const [autoSkip, setAutoSkip] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('animeSettings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (typeof parsed === 'object' && parsed !== null) {
          if (typeof parsed.continueWatching === 'boolean') setContinueWatching(parsed.continueWatching)
          if (typeof parsed.language === 'string') setLanguage(parsed.language)
          if (typeof parsed.autoLanguage === 'string') setAutoLanguage(parsed.autoLanguage)
          if (typeof parsed.autoPlay === 'boolean') setAutoPlay(parsed.autoPlay)
          if (typeof parsed.autoNext === 'boolean') setAutoNext(parsed.autoNext)
          if (typeof parsed.autoComments === 'boolean') setAutoComments(parsed.autoComments)
          if (typeof parsed.skipSeconds === 'number') setSkipSeconds(parsed.skipSeconds)
          if (typeof parsed.autoSkip === 'boolean') setAutoSkip(parsed.autoSkip)
        }
      } catch (error) {
        // ignore parse issues
      }
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('animeSettings', JSON.stringify({
        continueWatching,
        language,
        autoLanguage,
        autoPlay,
        autoNext,
        autoComments,
        skipSeconds,
        autoSkip,
      }))
    } catch (error) {
      console.error('Failed to persist settings', error)
    }
  }, [continueWatching, language, autoLanguage, autoPlay, autoNext, autoComments, skipSeconds, autoSkip])

  const saveSettings = () => {
    alert('Settings saved!')
  }

  return (
    <main style={{ backgroundColor: COLORS.dark, minHeight: '100vh', color: COLORS.text, fontFamily: 'sans-serif' }}>
      <Navbar isLoggedIn={true} />
      <NavigationTabs currentTab="Settings" />

      <div style={{ maxWidth: '500px', margin: `${SPACING.xl} auto`, padding: `0 ${SPACING.lg}` }}>
        <div
          style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: SPACING.lg,
            padding: SPACING.lg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Show continue watching */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.xl,
            }}
          >
            <span style={{ fontSize: '14px' }}>Show continue watching in home page</span>
            <Toggle value={continueWatching} onChange={() => setContinueWatching(!continueWatching)} />
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, marginBottom: SPACING.xl }} />

          {/* Language for anime name */}
          <div style={{ marginBottom: SPACING.xl }}>
            <p style={{ margin: `0 0 ${SPACING.md}`, fontSize: '14px' }}>Language for anime name</p>
            <div style={{ display: 'flex', gap: SPACING.xl }}>
              {['English', 'Japanese'].map((lang) => (
                <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="language"
                    value={lang.toLowerCase()}
                    checked={language === lang.toLowerCase()}
                    onChange={() => setLanguage(lang.toLowerCase())}
                  />
                  <span style={{ color: COLORS.text, fontSize: '14px' }}>{lang}</span>
                </label>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, marginBottom: SPACING.xl }} />

          {/* Auto select language */}
          <div style={{ marginBottom: SPACING.xl }}>
            <p style={{ margin: `0 0 ${SPACING.md}`, fontSize: '14px' }}>Auto select language</p>
            <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
              {[
                { value: 'subdub', label: 'Sub & Dub' },
                { value: 'sub', label: 'Only Sub' },
                { value: 'dub', label: 'Only Dub' },
              ].map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="autoLanguage"
                    value={opt.value}
                    checked={autoLanguage === opt.value}
                    onChange={() => setAutoLanguage(opt.value)}
                  />
                  <span style={{ color: COLORS.text, fontSize: '14px' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <p style={{ color: COLORS.textDim, fontSize: '12px', marginTop: SPACING.md }}>
              The system will automatically select your preferred source type to watch (if available).
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, marginBottom: SPACING.xl }} />

          {/* Auto play */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
            <span style={{ fontSize: '14px' }}>Auto play</span>
            <Toggle value={autoPlay} onChange={() => setAutoPlay(!autoPlay)} />
          </div>

          {/* Auto next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
            <span style={{ fontSize: '14px' }}>Auto next</span>
            <Toggle value={autoNext} onChange={() => setAutoNext(!autoNext)} />
          </div>

          {/* Auto load comments */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl }}>
            <span style={{ fontSize: '14px' }}>Auto load comments</span>
            <Toggle value={autoComments} onChange={() => setAutoComments(!autoComments)} />
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, marginBottom: SPACING.xl }} />

          {/* Skip seconds */}
          <div style={{ marginBottom: SPACING.xl }}>
            <p style={{ margin: `0 0 ${SPACING.md}`, fontSize: '14px' }}>Skip seconds</p>
            <input
              type="number"
              value={skipSeconds}
              onChange={(e) => setSkipSeconds(Number(e.target.value))}
              style={{
                width: '80px',
                padding: `${SPACING.xs} ${SPACING.md}`,
                backgroundColor: COLORS.dark,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                color: COLORS.text,
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <p style={{ color: COLORS.textDim, fontSize: '12px', marginTop: SPACING.md }}>
              Number of seconds to skip backward/forward when pressing J or L button on watch page.
            </p>
          </div>

          {/* Auto skip intro/outro */}
          <div style={{ marginBottom: SPACING.xl }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}
            >
              <span style={{ fontSize: '14px' }}>Auto skip intro, outro</span>
              <Toggle value={autoSkip} onChange={() => setAutoSkip(!autoSkip)} />
            </div>
            <p style={{ color: COLORS.textDim, fontSize: '12px' }}>
              The skip time is contributed by the community so it may not be available in all episodes.
            </p>
          </div>

          {/* Update Button */}
          <Button onClick={saveSettings}>Update</Button>
        </div>
      </div>
    </main>
  )
}