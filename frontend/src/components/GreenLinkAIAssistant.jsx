import { useState, useRef, useEffect } from 'react';
import { askPlantDoctor } from '../services/aiService';

export default function GreenLinkAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '🌿 **Hello! I am GreenLink AI**, your botanical specialist & plant doctor.\n\nNeed plant care advice, disease diagnosis, or listing assistance? Ask me anything!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    '🍂 Yellow leaves diagnosis',
    '💧 How often should I water?',
    '🪴 Best low-light indoor plants',
    '🐛 How to treat spider mites & pests'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const answer = await askPlantDoctor(textToSend.trim());
      setMessages((prev) => [...prev, { sender: 'bot', text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'I encountered an issue processing your botanical query. Please try again!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="ai-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open GreenLink AI Botanical Advisor"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, var(--pine) 0%, #1f4a33 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            boxShadow: '0 8px 24px rgba(27, 67, 50, 0.35)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '.95rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{ fontSize: '1.25rem' }}>🤖🌿</span>
          <span>GreenLink AI</span>
        </button>
      )}

      {/* Floating AI Chat Window */}
      {isOpen && (
        <div
          className="ai-chat-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 999,
            background: 'var(--paper)',
            borderRadius: '18px',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.25s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--pine) 0%, #1f4a33 100%)',
              color: '#fff',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                🌿
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.98rem' }}>GreenLink AI Doctor</div>
                <div style={{ fontSize: '.72rem', opacity: 0.85 }}>Botanical Intelligence System</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setMessages([messages[0]])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '.8rem'
                }}
                title="Reset conversation"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '1.1rem',
                  lineHeight: 1
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--cream)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                style={{
                  fontSize: '.74rem',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  color: 'var(--pine)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s ease'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: m.sender === 'user' ? 'var(--pine)' : 'var(--cream)',
                  color: m.sender === 'user' ? '#fff' : 'var(--ink)',
                  fontSize: '.86rem',
                  lineHeight: 1.45,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'var(--cream)',
                  color: 'var(--ink-mid)',
                  fontSize: '.85rem'
                }}
              >
                🌱 Analyzing botanical query…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              background: 'var(--paper)',
              display: 'flex',
              gap: '8px'
            }}
          >
            <input
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about plant symptoms, care..."
              style={{
                fontSize: '.85rem',
                padding: '8px 12px',
                borderRadius: '24px'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{
                borderRadius: '24px',
                padding: '8px 16px',
                fontSize: '.85rem'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
