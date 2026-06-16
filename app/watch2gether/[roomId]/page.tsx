'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'

const COLORS = {
  primary: '#6c63ff',
  pink: '#ff2475',
  dark: '#0d0f1a',
  card: '#13152a',
  cardHover: '#1a1d35',
  border: '#1e2140',
  text: '#ffffff',
  muted: '#8b8fa8',
}

interface RoomMessage {
  id: number
  user_id: string
  username: string
  message: string
  created_at: string
}

interface Room {
  id: string
  anime_id: string
  anime_title: string | null
  episode: number
  created_by: string
}

export default function Watch2GetherRoom() {
  const params = useParams()
  const router = useRouter()
  const roomId = params?.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('Guest')
  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ---- Auth check (guests can view, but not chat) ----
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setIsLoggedIn(false)
        setUserId(null)
        setUsername('Guest')
        return
      }
      setIsLoggedIn(true)
      setUserId(data.user.id)
      setUsername(data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'Guest')
    })
  }, [])

  // ---- Load room + subscribe to room updates (anime/episode sync) ----
  useEffect(() => {
    if (!roomId) return

    const loadRoom = async () => {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      if (error || !data) {
        setErrorMsg('Room not found.')
        setLoading(false)
        return
      }
      setRoom(data)
      setLoading(false)
    }
    loadRoom()

    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload: any) => {
        setRoom(payload.new as Room)
      })
      .subscribe()

    return () => { supabase.removeChannel(roomChannel) }
  }, [roomId])

  // Check ownership once room + userId are known
  useEffect(() => {
    if (room && userId) setIsOwner(room.created_by === userId)
  }, [room, userId])

  // ---- Load + subscribe to chat messages ----
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      const { data } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (data) setMessages(data)
    }
    loadMessages()

    const chatChannel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (payload: any) => {
        setMessages((prev: RoomMessage[]) => [...prev, payload.new as RoomMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(chatChannel) }
  }, [roomId])

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return
    const text = newMessage.trim()
    setNewMessage('')
    const { error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      user_id: userId,
      username,
      message: text,
    })
    if (error) console.error('Failed to send message:', error)
  }

  const changeEpisode = async (delta: number) => {
    if (!room || !isOwner) return
    const newEp = Math.max(1, room.episode + delta)
    const { error } = await supabase.from('rooms').update({ episode: newEp }).eq('id', room.id)
    if (error) console.error('Failed to update episode:', error)
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}/watch2gether/${roomId}`
    navigator.clipboard.writeText(url).then(() => alert('Invite link copied!'))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: COLORS.muted }}>Loading room...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !room) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: COLORS.muted, marginBottom: '16px' }}>{errorMsg ?? 'Room not found.'}</p>
          <button onClick={() => router.push('/home')} style={{ backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const playerUrl = `https://vidsrc.cc/v2/embed/anime/${room.anime_id}/${room.episode}/sub`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, color: COLORS.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '18px', fontWeight: 600 }}>← Back</button>
        <span style={{ color: COLORS.muted }}>|</span>
        <span style={{ fontWeight: 600, fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🎉 Watch2Gether — {room.anime_title ?? room.anime_id} (Ep {room.episode})
        </span>
        <button onClick={copyInviteLink} style={{ backgroundColor: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '6px 12px', color: COLORS.text, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          📋 Copy Invite Link
        </button>
      </nav>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Player */}
        <div>
          <div style={{ backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', paddingTop: '56.25%', marginBottom: '10px' }}>
            <iframe
              key={playerUrl}
              src={playerUrl}
              allowFullScreen
              referrerPolicy="origin"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            />
          </div>

          {/* Episode controls — only the room owner can change episodes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${COLORS.border}` }}>
            <span style={{ color: COLORS.muted, fontSize: '13px' }}>
              Everyone in this room is watching <strong style={{ color: COLORS.text }}>Episode {room.episode}</strong>
            </span>
            {isOwner ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => changeEpisode(-1)} disabled={room.episode <= 1} style={{ backgroundColor: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '6px 12px', color: room.episode <= 1 ? COLORS.muted : COLORS.text, cursor: room.episode <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}>◀◀ Prev</button>
                <button onClick={() => changeEpisode(1)} style={{ backgroundColor: COLORS.cardHover, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '6px 12px', color: COLORS.text, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Next ▶▶</button>
              </div>
            ) : (
              <span style={{ color: COLORS.muted, fontSize: '12px' }}>Only the host can change episodes</span>
            )}
          </div>

          <div style={{ backgroundColor: '#1a1b2e', border: `1px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: COLORS.muted }}>
            ⚠️ Playback (play/pause/seek) is not synced — only the anime and episode are shared. Use chat to coordinate timing with your friends!
          </div>
        </div>

        {/* Chat */}
        <div style={{ backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', height: '70vh', position: 'sticky', top: '70px' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>💬 Live Chat</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && (
              <p style={{ color: COLORS.muted, fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No messages yet. Say hi! 👋</p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.user_id === userId ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '11px', color: COLORS.muted, marginBottom: '2px' }}>{m.username}</span>
                <div style={{
                  backgroundColor: m.user_id === userId ? COLORS.primary : COLORS.cardHover,
                  color: '#fff', borderRadius: '10px', padding: '6px 12px', fontSize: '13px',
                  maxWidth: '85%', wordBreak: 'break-word',
                }}>
                  {m.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: `1px solid ${COLORS.border}` }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, backgroundColor: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px 12px', color: COLORS.text, fontSize: '13px', outline: 'none', minWidth: 0 }}
              />
              <button onClick={sendMessage} style={{ backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>Send</button>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
              <p style={{ color: COLORS.muted, fontSize: '12px', margin: '0 0 8px' }}>Log in to join the chat</p>
              <button onClick={() => router.push('/login')} style={{ backgroundColor: COLORS.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

  )
}