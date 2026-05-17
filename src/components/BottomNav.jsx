import { Link, useLocation } from 'react-router-dom'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const FeedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
  </svg>
)
const NotesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const NewIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)

export default function BottomNav() {
  const { pathname } = useLocation()

  const items = [
    { to: '/',      label: 'home',  Icon: HomeIcon  },
    { to: '/feed',  label: 'feed',  Icon: FeedIcon  },
    { to: '/notes', label: 'notes', Icon: NotesIcon },
    { to: '/new',   label: 'new',   Icon: NewIcon   },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, Icon }) => (
        <Link key={to} to={to}
          className={`bottom-nav-item ${pathname === to ? 'active' : ''}`}>
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  )
}
