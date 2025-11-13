import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.svg'

const NAV_ITEMS = [
  { to: '/', label: 'Shop' },
  { to: '/stores', label: 'Stores' },
  { to: '/books', label: 'Books' },
  { to: '/author', label: 'Authors' },
]

const MobileNav = () => (
  <div className="mb-4 flex flex-col gap-3 md:hidden">
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
      <img src={logo} alt="Ovarc" className="h-8 w-auto" />
      <span className="text-sm font-medium text-slate-500">Admin Console</span>
    </div>
    <nav className="flex items-center gap-2 overflow-x-auto">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive ? 'bg-main text-white shadow' : 'bg-white text-slate-600 shadow-sm'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </div>
)

export default MobileNav



