import Icon from './Icon'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <Icon name={toast.type === 'error' ? 'alert' : 'check'} size={16} />
      <span>{toast.message}</span>
    </div>
  )
}
