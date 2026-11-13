import Icon from './Icon'
import { formatTime } from '../utils/time'

function matchLevel(confidence) {
  return confidence >= 0.7 ? 'strong' : 'partial'
}

export default function ChatMessage({ message }) {
  const { role, text, confidence, resolved, category, time, kind, source, sourceQuestion, sourceAnswer } = message
  const isBot = role === 'bot'
  const isAi = isBot && source === 'ai'
  const showMeta = isBot && kind !== 'welcome'
  const pct = typeof confidence === 'number' ? Math.round(confidence * 100) : null

  return (
    <div className={`msg ${isBot ? 'msg-bot' : 'msg-user'}`}>
      <div className="msg-avatar" aria-hidden="true">
        <Icon name={isBot ? 'bot' : 'user'} size={16} />
      </div>
      <div className="msg-main">
        <div className={`msg-bubble${isBot && resolved === false ? ' is-unresolved' : ''}`}>{text}</div>
        <div className="msg-meta">
          {showMeta && isAi && (
            <span className="ai-tag" title="Written by AI using only the FAQ entries">
              <Icon name="sparkle" size={12} /> AI-assisted
            </span>
          )}
          {showMeta && resolved && category && <span className="tag">{category}</span>}
          {showMeta && resolved && !isAi && pct !== null && (
            <span className={`meter ${matchLevel(confidence)}`} title="How closely your question matched this FAQ">
              <span className="meter-bar"><span className="meter-fill" style={{ width: `${pct}%` }} /></span>
              <span className="meter-label">{pct}% match</span>
            </span>
          )}
          {showMeta && resolved === false && (
            <span className="hint">No confident match · try rephrasing</span>
          )}
          {time && <span className="msg-time">{formatTime(time)}</span>}
        </div>

        {isAi && sourceQuestion && (
          <details className="ai-source">
            <summary>Based on FAQ: {sourceQuestion}</summary>
            <div className="ai-original">{sourceAnswer}</div>
          </details>
        )}
        {isAi && (
          <p className="ai-note">
            Written by AI from the helpdesk FAQ. For anything important, please confirm with the helpdesk.
          </p>
        )}
      </div>
    </div>
  )
}
