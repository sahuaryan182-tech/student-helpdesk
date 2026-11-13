import { useEffect, useRef, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import ChatMessage from '../components/ChatMessage'
import Icon from '../components/Icon'
import { TOPICS } from '../data/topics'
import { sendMessage, getHistory } from '../api/chat'
import { getSessionId, resetSessionId } from '../utils/session'

const WELCOME_TEXT =
  "Hello! I'm the Invertis Helpdesk Assistant. Ask me about fees, timetables, examinations, admissions, results or hostel, and I'll find the answer in the helpdesk knowledge base."

const FALLBACK_TEXT =
  "Sorry, I couldn't find a suitable answer in the current helpdesk knowledge base. Please try another question or contact the helpdesk."

let idCounter = 0
const nextId = () => ++idCounter

function welcomeMessage() {
  return { id: nextId(), role: 'bot', kind: 'welcome', text: WELCOME_TEXT }
}

// Rebuilds the visible conversation from the saved chat logs.
function restoreMessages(logs) {
  return logs.flatMap((log) => [
    { id: nextId(), role: 'student', text: log.question, time: log.createdAt },
    {
      id: nextId(),
      role: 'bot',
      text: log.answer || (log.resolved ? 'This answer was saved before answers were recorded.' : FALLBACK_TEXT),
      confidence: log.confidence,
      resolved: log.resolved,
      category: log.category,
      source: log.source,
      time: log.createdAt,
    },
  ])
}

export default function StudentChat() {
  const [sessionId, setSessionId] = useState(getSessionId)
  const [messages, setMessages] = useState(() => [welcomeMessage()])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  // Restore this browser's previous conversation once, on first load.
  useEffect(() => {
    let cancelled = false
    getHistory(sessionId)
      .then((logs) => {
        if (cancelled || logs.length === 0) return
        setMessages((prev) => [...prev, ...restoreMessages(logs)])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(override) {
    const text = (override ?? input).trim()
    if (!text || sending) return

    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { id: nextId(), role: 'student', text, time: new Date() }])
    setSending(true)

    try {
      const result = await sendMessage(sessionId, text)
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'bot',
          text: result.answer,
          confidence: result.confidence,
          resolved: result.resolved,
          category: result.category,
          source: result.source,
          sourceQuestion: result.sourceQuestion,
          sourceAnswer: result.sourceAnswer,
          time: new Date(),
        },
      ])
    } catch (err) {
      if (err.response?.status === 422) {
        setError('Please enter a valid question (up to 500 characters).')
      } else {
        setError('Could not reach the helpdesk server. Please check your connection and try again.')
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSend()
  }

  function startNewChat() {
    setSessionId(resetSessionId())
    setMessages([welcomeMessage()])
    setError(null)
    setInput('')
    inputRef.current?.focus()
  }

  const hasStudentMessage = messages.some((m) => m.role === 'student')

  return (
    <div className="site">
      <SiteHeader />

      <main className="container helpdesk">
        <section className="hd-intro">
          <p className="eyebrow">Student Helpdesk</p>
          <h1>How can we help you today?</h1>
          <p className="lede">
            Ask a question in your own words. Answers come from the helpdesk knowledge base maintained by the
            university administration.
          </p>
        </section>

        <div className="hd-grid">
          <section className="chat-card" aria-label="Chat with the helpdesk assistant">
            <div className="chat-head">
              <div className="chat-head-id">
                <span className="bot-badge"><Icon name="bot" size={20} /></span>
                <div>
                  <div className="chat-title">Helpdesk Assistant</div>
                  <div className="chat-status"><span className="status-dot" /> Online · answers from the FAQ knowledge base</div>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={startNewChat}>
                <Icon name="refresh" size={14} /> New chat
              </button>
            </div>

            <div className="chat-body" ref={bodyRef} role="log" aria-live="polite">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}

              {sending && (
                <div className="msg msg-bot">
                  <div className="msg-avatar" aria-hidden="true"><Icon name="bot" size={16} /></div>
                  <div className="msg-main">
                    <div className="msg-bubble typing" aria-label="Assistant is typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="inline-error" role="alert">
                <Icon name="alert" size={16} /> {error}
              </div>
            )}

            {!hasStudentMessage && (
              <div className="suggest">
                <span className="suggest-label">Try asking</span>
                {TOPICS.slice(0, 3).map((t) => (
                  <button key={t.category} type="button" className="chip" onClick={() => handleSend(t.question)} disabled={sending}>
                    {t.question}
                  </button>
                ))}
              </div>
            )}

            <form className="compose" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                maxLength={500}
                disabled={sending}
                aria-label="Your question"
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={sending || !input.trim()} aria-label="Send message">
                <Icon name="send" size={18} />
              </button>
            </form>
            <p className="chat-foot">
              If the assistant can't find a confident match it will say so instead of guessing. For anything urgent,
              contact the helpdesk directly.
            </p>
          </section>

          <aside className="hd-side" aria-label="Browse topics">
            <div className="side-card">
              <h2>Browse topics</h2>
              <p className="side-sub">Pick a topic to ask a common question.</p>
              <ul className="topic-list">
                {TOPICS.map((t) => (
                  <li key={t.category}>
                    <button type="button" className="topic" onClick={() => handleSend(t.question)} disabled={sending}>
                      <span className="topic-icon"><Icon name={t.icon} size={18} /></span>
                      <span className="topic-text">
                        <span className="topic-title">{t.category}</span>
                        <span className="topic-q">{t.question}</span>
                      </span>
                      <span className="topic-go"><Icon name="arrowRight" size={16} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-foot">
        <div className="container">Invertis University, Bareilly · Student Helpdesk</div>
      </footer>
    </div>
  )
}
