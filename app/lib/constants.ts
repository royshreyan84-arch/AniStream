// Colors
export const COLORS = {
  primary: '#6c63ff',
  dark: '#0d0f1a',
  darkBg: '#0a0b14',
  cardBg: '#1a1a2e',
  border: '#333',
  text: '#ffffff',
  textMuted: '#aaa',
  textDim: '#666',
  error: '#ff4444',
  success: '#00c853',
  warning: '#ff9800',
  info: '#2196f3',
} as const

// Spacing
export const SPACING = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px',
} as const

// Border Radius
export const RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  full: '50%',
} as const

// Z-Index
export const Z_INDEX = {
  dropdown: 100,
  modal: 200,
  overlay: 199,
  navbar: 9999,
} as const

// Navigation items
export const NAV_ITEMS = [
  { label: 'Profile', href: '/profile' },
  { label: 'History', href: '/history' },
  { label: 'Watchlist', href: '/watchlist' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Settings', href: '/settings' },
  { label: 'Import', href: '/import' },
  { label: 'Sync', href: '/sync' },
] as const

// Profile menu items
export const PROFILE_MENU_ITEMS = [
  { label: 'Profile', href: '/profile' },
  { label: 'Continue Watching', href: '/history' },
  { label: 'Watch List', href: '/watchlist' },
  { label: 'Notification', href: '/notifications' },
  { label: 'List Import', href: '/import' },
  { label: 'AniList Sync', href: '/sync' },
  { label: 'Settings', href: '/settings' },
  { label: 'Logout', href: '#' },
] as const
