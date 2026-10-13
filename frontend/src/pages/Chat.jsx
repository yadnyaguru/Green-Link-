import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMessages, sendMessage, createRating, getMyRequests, getIncomingRequests } from '../services/index';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import StatusBadge from '../components/StatusBadge';

export default function Chat() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Conversations list & active selection
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);

  // Chat message state
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Rating state
  const [ratingVal, setRatingVal] = useState(5);
  const [comment, setComment] = useState('');
  const [rated, setRated] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const bottomRef = useRef();
  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

  // 1. Fetch all conversations involving the logged-in user (both as buyer and seller)
  const fetchConversations = async () => {
    try {
      const [mineRes, incomingRes] = await Promise.allSettled([
        getMyRequests(),
        getIncomingRequests(),
      ]);
      const mine = mineRes.status === 'fulfilled' ? mineRes.value.data || [] : [];
      const incoming = incomingRes.status === 'fulfilled' ? incomingRes.value.data || [] : [];

      // Combine and remove duplicates
      const map = new Map();
      [...mine, ...incoming].forEach((item) => {
        if (item && item._id) map.set(item._id, item);
      });
      const allThreads = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setConversations(allThreads);

      // If a requestId is present in the URL, select it
      if (requestId) {
        const target = allThreads.find((t) => t._id === requestId);
        if (target) {
          setActiveRequest(target);
        }
      } else if (allThreads.length > 0 && window.innerWidth > 820) {
        // On desktop, auto-select the latest conversation
        setActiveRequest(allThreads[0]);
        navigate(`/chat/${allThreads[0]._id}`, { replace: true });
      }
    } catch {
      setError('Could not load conversations');
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // When URL param requestId changes, update activeRequest
  useEffect(() => {
    if (requestId && conversations.length > 0) {
      const target = conversations.find((t) => t._id === requestId);
      if (target) {
        setActiveRequest(target);
      }
    }
  }, [requestId, conversations]);

  // 2. Poll & fetch messages for currently active conversation
  const loadMessages = async (silent = false) => {
    if (!requestId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const { data } = await getMessages(requestId);
      setMessages(data);
      if (!silent) scrollBottom();
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!requestId) {
      setMessages([]);
      return;
    }
    setRated(false);
    setRatingVal(5);
    setComment('');
    loadMessages();
    const interval = setInterval(() => loadMessages(true), 3000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleSelectThread = (thread) => {
    setActiveRequest(thread);
    navigate(`/chat/${thread._id}`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || !requestId) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const { data } = await sendMessage({ requestId, content });
      setMessages((prev) => [...prev, data]);
      scrollBottom();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!ratingVal) return setError('Please select a star rating');
    setRatingLoading(true);
    try {
      await createRating({ requestId, rating: ratingVal, comment });
      setRated(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  // Filter conversations in sidebar
  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase();
    return conversations.filter((c) => {
      const plantName = c.listing?.plant?.name?.toLowerCase() || '';
      const otherName = (c.requester?._id === user?._id ? c.provider?.name : c.requester?.name) || '';
      return plantName.includes(q) || otherName.toLowerCase().includes(q);
    });
  }, [conversations, searchFilter, user]);

  // Roles & permissions for active request
  const isRequester = user && activeRequest && (activeRequest.requester?._id === user._id || activeRequest.requester === user._id);
  const isProvider = user && activeRequest && (activeRequest.provider?._id === user._id || activeRequest.provider === user._id);
  const isCompleted = activeRequest?.status === 'completed';
  const otherParty = isRequester ? activeRequest?.provider : activeRequest?.requester;
  const plant = activeRequest?.listing?.plant;

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 12px)', paddingBottom: '30px' }}>
      <div className="container" style={{ maxWidth: '1160px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>💬 Messages & Chats</span>
              {conversations.length > 0 && (
                <span style={{ fontSize: '.8rem', background: 'var(--paper-mid)', color: 'var(--pine)', padding: '2px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {conversations.length} Active {conversations.length === 1 ? 'Thread' : 'Threads'}
                </span>
              )}
            </h2>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
              Direct messaging with buyers and verified nursery sellers
            </p>
          </div>
          <Link to="/requests" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
            📬 View Orders & Requests
          </Link>
        </div>

        {error && (
          <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
            {error} <span style={{ float: 'right' }}>✕</span>
          </div>
        )}

        {/* Messenger 2-Column Container */}
        <div className="messenger-container">
          {/* ── Left Column: Conversations Sidebar ── */}
          <div
            className="messenger-sidebar"
            style={{
              display: !requestId && window.innerWidth <= 820 ? 'flex' : undefined,
            }}
          >
            {/* Search Header */}
            <div className="messenger-sidebar-header">
              <input
                className="form-input"
                style={{ fontSize: '.88rem', padding: '8px 12px' }}
                placeholder="🔍 Search chats by plant or user…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Conversation Items List */}
            <div className="messenger-threads-list">
              {conversationsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px', width: 28, height: 28 }} />
                  <p style={{ fontSize: '.82rem', color: 'var(--ink-lite)' }}>Loading your chats…</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-mid)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                  <h4 style={{ margin: '0 0 6px', color: 'var(--pine)' }}>No Chats Found</h4>
                  <p style={{ fontSize: '.82rem', margin: 0, color: 'var(--ink-lite)' }}>
                    {searchFilter ? 'Try searching another name' : 'Chats will appear here once you request or list plants.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isUserRequester = user && (c.requester?._id === user._id || c.requester === user._id);
                  const partner = isUserRequester ? c.provider : c.requester;
                  const itemPlant = c.listing?.plant;
                  const isSelected = activeRequest?._id === c._id;

                  return (
                    <div
                      key={c._id}
                      className={`messenger-thread-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectThread(c)}
                    >
                      {/* Plant Image / Avatar */}
                      {itemPlant?.image ? (
                        <img
                          src={itemPlant.image}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: 'var(--sage-lite)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem'
                          }}
                        >
                          🌿
                        </div>
                      )}

                      {/* Thread Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '.92rem', color: isSelected ? 'var(--pine)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {itemPlant?.name || 'Plant Request'}
                          </span>
                          <span style={{ fontSize: '.7rem', color: 'var(--ink-lite)', fontFamily: 'var(--font-mono)' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '.8rem', color: 'var(--ink-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {partner?.name || 'User'}{' '}
                          <span style={{ fontSize: '.74rem', color: 'var(--ink-lite)' }}>
                            ({isUserRequester ? 'Seller' : 'Buyer'})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <StatusBadge status={c.status} />
                          {c.totalPrice > 0 && (
                            <span style={{ fontSize: '.74rem', fontWeight: 700, color: 'var(--pine)' }}>
                              ₹{c.totalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Column: Active Conversation Pane ── */}
          <div className="messenger-main-panel">
            {activeRequest ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Chat Top Banner */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: 'var(--paper)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Back to all chats on mobile */}
                    <button
                      className="btn btn-ghost btn-xs hide-desktop"
                      onClick={() => navigate('/chat')}
                      style={{ padding: '4px 8px', fontWeight: 600 }}
                    >
                      ← Chats
                    </button>
                    {plant?.image ? (
                      <img
                        src={plant.image}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'var(--sage-lite)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem'
                        }}
                      >
                        🌿
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: 'var(--pine)', fontSize: '1.1rem' }}>
                          {plant?.name || 'Plant Order'}
                        </strong>
                        <StatusBadge status={activeRequest.status} />
                      </div>
                      <div style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginTop: 2 }}>
                        Talking with <strong style={{ color: 'var(--ink)' }}>{otherParty?.name || 'Partner'}</strong>
                        {isRequester ? ' (Nursery Provider)' : ' (Customer)'}
                        {activeRequest.quantity && (
                          <span style={{ marginLeft: 6, color: 'var(--ink-lite)' }}>
                            • {activeRequest.quantity} plant(s)
                          </span>
                        )}
                        {activeRequest.totalPrice && (
                          <span style={{ marginLeft: 6, fontWeight: 700, color: 'var(--pine)' }}>
                            • ₹{activeRequest.totalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/requests"
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize: '.78rem', color: 'var(--pine)', textDecoration: 'underline' }}
                  >
                    View in Requests
                  </Link>
                </div>

                {/* Message Scroll View */}
                <div
                  className="chat-messages"
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 0,
                    background: 'var(--cream)',
                    minHeight: 280
                  }}
                >
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '36px 0' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px', width: 28, height: 28 }} />
                      <p style={{ fontSize: '.85rem', color: 'var(--ink-lite)' }}>Loading conversation…</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--ink-lite)', padding: '50px 20px' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div>
                      <h4 style={{ margin: '0 0 6px', color: 'var(--pine)' }}>Start the Conversation</h4>
                      <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--ink-mid)' }}>
                        Coordinate pickup timings, nursery address, or plant care instructions here.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender?._id === user?._id;
                      return (
                        <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`} key={m._id}>
                          {!mine && <div className="sender">{m.sender?.name}</div>}
                          {m.content}
                          <div className="time">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input row */}
                <form
                  className="chat-input-row"
                  onSubmit={handleSend}
                  style={{ borderRadius: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)' }}
                >
                  <input
                    className="form-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message… (Press Enter to send)"
                    autoComplete="off"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!text.trim() || sending}
                    style={{ padding: '8px 20px', fontWeight: 600 }}
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </form>

                {/* Rating Form — strictly for requester on completed orders, never for provider */}
                {isRequester && isCompleted && !rated && (
                  <div style={{ padding: '16px 20px', background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <strong style={{ color: 'var(--pine)', fontSize: '.95rem' }}>
                        ⭐ Rate this Purchase Experience
                      </strong>
                    </div>
                    <form onSubmit={handleRate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <StarRating value={ratingVal} interactive onChange={setRatingVal} />
                      <input
                        className="form-input"
                        style={{ fontSize: '.88rem' }}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your feedback (e.g. healthy plant, great service)…"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={ratingLoading}
                        style={{ alignSelf: 'flex-start', fontWeight: 600 }}
                      >
                        {ratingLoading ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}

                {rated && (
                  <div style={{ padding: '10px 20px', background: '#d4edda', color: '#155724', fontSize: '.84rem', fontWeight: 600, borderTop: '1px solid #c3e6cb' }}>
                    ⭐ Thank you! Your review has been submitted to the provider's profile.
                  </div>
                )}
              </div>
            ) : (
              /* No Conversation Selected Placeholder */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--ink-mid)'
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>💬</div>
                <h3 style={{ color: 'var(--pine)', margin: '0 0 10px' }}>
                  GreenLink Direct Messages
                </h3>
                <p style={{ maxWidth: '420px', margin: '0 0 24px', fontSize: '.92rem', color: 'var(--ink-lite)', lineHeight: 1.5 }}>
                  Select a chat thread from the left to coordinate order pickups, nursery directions, and healthy plant care with buyers and providers.
                </p>
                <Link to="/plants" className="btn btn-primary">
                  🌱 Browse Plant Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
