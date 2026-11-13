const SESSION_KEY = 'helpdesk_session_id'

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// Used by the "New chat" button: a fresh id means a fresh conversation.
export function resetSessionId() {
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}
