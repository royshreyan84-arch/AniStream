export interface RecentComment {
  id: number
  user: string
  content: string
  time: string
  animeId: number
  animeTitle: string
}
export interface Anime {
  id: number
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  type?: string
  episodes?: number
  status?: string
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  genres?: Array<{ name: string }>
}

export interface WatchlistItem {
  id: number
  title: string
  status: 'Watching' | 'Watched' | 'Planned' | 'On-Hold' | 'Dropped'
  eps: number
  image: string
}

export interface HistoryItem {
  id: number
  title: string
  ep: number
  watched: string
  total: string
  image: string
}

export interface NotificationItem {
  id: number
  user: string
  action: string
  anime: string
  time: string
  read: boolean
}
