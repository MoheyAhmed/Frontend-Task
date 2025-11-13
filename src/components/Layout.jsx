import { Outlet } from 'react-router-dom'
import Sidelist from './Sidelist/Sidelist'
import Topbar from './Topbar'
import SignInModal from './auth/SignInModal'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <>
      <SignInModal />
      <div className="flex min-h-screen bg-background">
        <aside className="hidden border-r border-slate-200 md:block">
          <Sidelist />
        </aside>
        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-4 md:px-8 md:pt-6">
          <MobileNav />
          <Topbar />
          <div className="pt-4">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}