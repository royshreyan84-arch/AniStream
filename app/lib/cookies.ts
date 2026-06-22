// lib/cookies.ts
// Lightweight cookie helpers for user preferences + session tracking

const COOKIE_DEFAULTS = {
  // 30 days for preferences
  PREFS_MAX_AGE: 60 * 60 * 24 * 30,
  // 7 days inactivity timeout — after this, user must log in again
  SESSION_MAX_AGE: 60 * 60 * 24 * 7,
}

// ── Core helpers ──────────────────────────────────────────────────────────────

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    'Path=/',
    'SameSite=Lax',
    // Add Secure in production
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const key = encodeURIComponent(name) + '='
  const found = document.cookie.split(';').find(c => c.trim().startsWith(key))
  return found ? decodeURIComponent(found.trim().slice(key.length)) : null
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/`
}

// ── Preference cookies ────────────────────────────────────────────────────────

/** Save user's preferred audio type (sub/dub) */
export function saveAudioPref(type: 'sub' | 'dub') {
  setCookie('audio_pref', type, COOKIE_DEFAULTS.PREFS_MAX_AGE)
}

/** Get user's preferred audio type, defaults to 'sub' */
export function getAudioPref(): 'sub' | 'dub' {
  const val = getCookie('audio_pref')
  return val === 'dub' ? 'dub' : 'sub'
}

/** Save last watched episode for an anime */
export function saveLastEpisode(animeId: string, episode: number) {
  setCookie(`last_ep_${animeId}`, String(episode), COOKIE_DEFAULTS.PREFS_MAX_AGE)
}

/** Get last watched episode for an anime */
export function getLastEpisode(animeId: string): number {
  const val = getCookie(`last_ep_${animeId}`)
  return val ? parseInt(val, 10) : 1
}

/** Save username preference */
export function saveUsername(name: string) {
  setCookie('username', name, COOKIE_DEFAULTS.PREFS_MAX_AGE)
  // Also keep in localStorage as backup
  if (typeof localStorage !== 'undefined') localStorage.setItem('username', name)
}

/** Get username */
export function getUsername(): string {
  return getCookie('username') ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : null) ?? 'Guest'
}
export function saveRememberMe (enabled: boolean) {
  setCookie(
    'remember_me',
    enabled ?'true':'false',
    COOKIE_DEFAULTS.PREFS_MAX_AGE
  )
}
export function getRememberMe(): boolean {
  return getCookie ('remember_me')==='true'
}
// ── Session activity tracking ─────────────────────────────────────────────────

/** Call this on any user interaction to refresh the inactivity timer */
export function refreshSessionActivity() {
  const rememberMe = getRememberMe()

  const maxAge = rememberMe
  ?COOKIE_DEFAULTS.PREFS_MAX_AGE  //30days
  :COOKIE_DEFAULTS.SESSION_MAX_AGE //7days

  setCookie('last_active',Date.now().toString(),maxAge)
}

/**
 * Check if the session has been inactive too long.
 * Returns true if user should be logged out.
 */
export function isSessionExpired(): boolean {
  const lastActive = getCookie('last_active')
  if (!lastActive) return false  // first visit, don't force logout
  const rememberMe = getRememberMe()

  const timeout = rememberMe
   ?COOKIE_DEFAULTS.PREFS_MAX_AGE
   :COOKIE_DEFAULTS.SESSION_MAX_AGE 
   const elapsed = Date.now() - parseInt(lastActive, 10)
   return elapsed > timeout * 1000
}

/** Clear all session cookies (call on logout) */
export function clearSessionCookies() {
  deleteCookie('last_active')
  // Keep preferences (audio_pref, username) — only clear session
}