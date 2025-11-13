import { useMemo } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROUTE_META = [
  { pattern: '/', title: 'Shop', subtitle: 'Shop › Books', end: true },
  { pattern: '/stores', title: 'Stores', subtitle: 'Admin › Stores' },
  { pattern: '/author', title: 'Authors', subtitle: 'Admin › Authors' },
  { pattern: '/books', title: 'Books', subtitle: 'Admin › Books' },
  { pattern: '/store/:storeId', title: 'Store Inventory', subtitle: 'Admin › Store Inventory' },
  { pattern: '/browsebooks', title: 'Browse Books', subtitle: 'Shop › Books' },
  { pattern: '/browseauthors', title: 'Browse Authors', subtitle: 'Shop › Authors' },
  { pattern: '/browsestores', title: 'Browse Stores', subtitle: 'Shop › Stores' },
]

const findMetaByPath = (pathname) =>
  ROUTE_META.find((route) =>
    matchPath({ path: route.pattern, end: route.end ?? false }, pathname)
  )

const getInitials = (displayName = '') => {
  const [first = '', second = ''] = displayName.split(' ')
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'U'
}

const Topbar = () => {
  const location = useLocation()
  const { user, isAuthenticated, openModal, signOut } = useAuth()

  const meta = useMemo(
    () => findMetaByPath(location.pathname) ?? { title: 'Dashboard', subtitle: 'Welcome' },
    [location.pathname]
  )

  return (
    <header className="border-b border-b-secondary-text/40">
      <div className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-secondary-text">{meta.title}</p>
          <p className="text-sm text-secondary-text/70">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          {isAuthenticated ? (
            <>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-main/10 text-sm font-semibold text-main">
                {getInitials(user.name)}
              </span>
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-secondary-text">{user.name}</span>
                <span className="text-xs text-secondary-text/70">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="rounded border border-main px-3 py-2 text-sm font-medium text-main transition hover:bg-main hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openModal}
              className="rounded bg-main px-4 py-2 text-sm font-medium text-white transition hover:bg-main/90"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
