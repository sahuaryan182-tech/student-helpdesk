const TOKEN_KEY = 'helpdesk_admin_token'
const NAME_KEY = 'helpdesk_admin_name'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(NAME_KEY)
}

export function isLoggedIn() {
  return !!getToken()
}

// The admin's display name is only used to personalise the sidebar.
export function getAdminName() {
  return localStorage.getItem(NAME_KEY)
}

export function setAdminName(name) {
  localStorage.setItem(NAME_KEY, name)
}
