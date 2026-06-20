"use client"
import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar, Users } from 'lucide-react';

const PINK = '#ff2475'
const PURPLE = '#6c63ff'
const BG = '#0d0f1a'
const CARD = '#13152b'
const CARD_ALT = '#1a1d35'
const BORDER = '#1e2140'
const MUTED = '#8b8fa8'

// --- TYPES ---
interface Comment {
  id: string;
  user_name: string;
  content: string;
  likes: number;
  dislikes: number;
  parent_id: string | null;
  created_at: string;
  replies?: Comment[];
}

interface ScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    title: { english: string; romaji: string };
    coverImage: { medium: string };
  };
}

export default function CommunityAndSchedule() {
  const [activeTab, setActiveTab] = useState<'community' | 'schedule'>('community');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleDay, setScheduleDay] = useState<'TODAY' | 'TOMORROW'>('TODAY');
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Check login state — matches the rest of the app (localStorage, not cookies)
  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    setCurrentUser(storedUser && storedUser !== 'Guest' ? storedUser : null);
  }, []);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchComments();
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
          fetchComments();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      fetchAniListSchedule();
    }
  }, [activeTab, scheduleDay]);

  // --- SUPABASE COMMUNITY LOGIC ---
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) { console.error('Error fetching comments:', error); return; }
    if (data) {
      const commentMap: { [key: string]: Comment } = {};
      const roots: Comment[] = [];
      data.forEach((item) => { commentMap[item.id] = { ...item, replies: [] }; });
      data.forEach((item) => {
        const mapped = commentMap[item.id];
        if (item.parent_id) commentMap[item.parent_id]?.replies?.push(mapped);
        else roots.push(mapped);
      });
      setComments(roots.reverse());
    }
  };

  const handlePostComment = async (parentId: string | null = null) => {
    if (!currentUser) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    const { error } = await supabase.from('comments').insert([
      { user_name: currentUser, content, parent_id: parentId },
    ]);

    if (error) {
      console.error('Error posting:', error);
    } else {
      if (parentId) { setReplyContent(''); setReplyToId(null); }
      else setNewComment('');
    }
  };

  const handleVote = async (id: string, type: 'likes' | 'dislikes', currentCount: number) => {
    const { error } = await supabase
      .from('comments')
      .update({ [type]: currentCount + 1 })
      .eq('id', id);
    if (error) console.error('Error voting:', error);
  };

  // --- ANILIST SCHEDULE LOGIC ---
  const fetchAniListSchedule = async () => {
    setLoadingSchedule(true);
    const startOfWeek = Math.floor(Date.now() / 1000);
    const oneDay = 24 * 60 * 60;
    const endOfWeek = startOfWeek + (scheduleDay === 'TODAY' ? oneDay : oneDay * 2);

    const query = `
      query ($start: Int, $end: Int) {
        Page(page: 1, perPage: 20) {
          airingSchedules(airingAt_greater: $start, airingAt_less: $end, sort: TIME) {
            id
            airingAt
            episode
            media {
              title { english romaji }
              coverImage { medium }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { start: startOfWeek, end: endOfWeek } }),
      });
      const resData = await response.json();
      setSchedule(resData?.data?.Page?.airingSchedules ?? []);
    } catch (err) {
      console.error('Failed to fetch anime schedule:', err);
      setSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // --- UI RENDER HELPER ---
  const renderCommentItem = (comment: Comment, isReply = false) => (
    <div key={comment.id} style={{
      padding: '16px', borderRadius: '10px',
      backgroundColor: isReply ? '#0f1124' : CARD_ALT,
      border: `1px solid ${BORDER}`,
      marginLeft: isReply ? '32px' : 0,
      marginTop: isReply ? '12px' : '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600, color: PURPLE, fontSize: '13px' }}>@{comment.user_name}</span>
        <span style={{ fontSize: '11px', color: MUTED }}>
          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style={{ color: '#e5e7eb', fontSize: '13px', margin: '4px 0' }}>{comment.content}</p>

      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: MUTED }}>
        <button onClick={() => handleVote(comment.id, 'likes', comment.likes)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: MUTED, cursor: 'pointer' }}>
          <ThumbsUp size={14} /> {comment.likes}
        </button>
        <button onClick={() => handleVote(comment.id, 'dislikes', comment.dislikes)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: MUTED, cursor: 'pointer' }}>
          <ThumbsDown size={14} /> {comment.dislikes}
        </button>
        {!isReply && currentUser && (
          <button onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: MUTED, cursor: 'pointer' }}>
            <MessageSquare size={14} /> Reply
          </button>
        )}
      </div>

      {replyToId === comment.id && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '8px', backgroundColor: BG, border: `1px solid ${BORDER}`, color: 'white', outline: 'none' }}
          />
          <button onClick={() => handlePostComment(comment.id)}
            style={{ padding: '8px 14px', backgroundColor: PURPLE, border: 'none', color: 'white', fontSize: '12px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>
            Reply
          </button>
        </div>
      )}

      {comment.replies && comment.replies.map((reply) => renderCommentItem(reply, true))}
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '16px', backgroundColor: CARD, color: 'white', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('community')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
            fontWeight: 600, fontSize: '14px', background: 'none', cursor: 'pointer',
            border: 'none', borderBottom: activeTab === 'community' ? `2px solid ${PURPLE}` : '2px solid transparent',
            color: activeTab === 'community' ? PURPLE : MUTED,
          }}
        >
          <Users size={18} /> Community
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
            fontWeight: 600, fontSize: '14px', background: 'none', cursor: 'pointer',
            border: 'none', borderBottom: activeTab === 'schedule' ? `2px solid ${PURPLE}` : '2px solid transparent',
            color: activeTab === 'schedule' ? PURPLE : MUTED,
          }}
        >
          <Calendar size={18} /> Airing Schedule
        </button>
      </div>

      {/* COMMUNITY */}
      {activeTab === 'community' && (
        <div>
          {currentUser ? (
            <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: CARD_ALT, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '11px', color: MUTED, margin: '0 0 8px' }}>
                Posting publicly as <span style={{ color: PURPLE, fontWeight: 600 }}>@{currentUser}</span>
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment(null)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', backgroundColor: BG, border: `1px solid ${BORDER}`, color: 'white', fontSize: '13px', outline: 'none', minWidth: 0 }}
                />
                <button onClick={() => handlePostComment(null)}
                  style={{ padding: '10px 20px', backgroundColor: PURPLE, color: 'white', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', textAlign: 'center', fontSize: '13px', color: '#ffd97a' }}>
              🔒 You must be logged in to chat. Guest users can only view discussion.
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
            {comments.length === 0 ? (
              <p style={{ color: MUTED, textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>No discussions yet. Be the first to break the ice!</p>
            ) : (
              comments.map((comment) => renderCommentItem(comment))
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE */}
      {activeTab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['TODAY', 'TOMORROW'] as const).map(day => (
              <button key={day} onClick={() => setScheduleDay(day)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.5px', border: 'none', cursor: 'pointer',
                  backgroundColor: scheduleDay === day ? PURPLE : CARD_ALT,
                  color: scheduleDay === day ? 'white' : MUTED,
                }}>
                {day}
              </button>
            ))}
          </div>

          {loadingSchedule ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED, fontSize: '13px' }}>
              Fetching official release schedules from AniList...
            </div>
          ) : schedule.length === 0 ? (
            <p style={{ color: MUTED, textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>No new releases scheduled for this timeframe.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              {schedule.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', backgroundColor: CARD_ALT, border: `1px solid ${BORDER}` }}>
                  <img src={item.media.coverImage.medium} alt="Cover" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontWeight: 600, fontSize: '13px', color: '#e5e7eb', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.media.title.english || item.media.title.romaji}
                    </h4>
                    <p style={{ fontSize: '11px', color: PURPLE, fontWeight: 600, margin: '2px 0' }}>Episode {item.episode}</p>
                    <p style={{ fontSize: '10px', color: MUTED, margin: 0 }}>
                      Airing at: {new Date(item.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}