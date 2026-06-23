import { supabase } from '@/app/lib/supabaseClient'

export async function saveWatchHistory(animeId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // guests — skip

  await supabase.from('watch_history').upsert(
    { user_id: user.id, anime_id: String(animeId), watched_at: new Date().toISOString() },
    { onConflict: 'user_id,anime_id' }
  )
}

export async function getWatchHistory(): Promise<Array<{ id: string }>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('watch_history')
    .select('anime_id')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .limit(100)

  return (data ?? []).map(row => ({ id: row.anime_id }))
}