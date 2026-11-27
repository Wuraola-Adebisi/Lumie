import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <div className="grid min-h-screen place-items-center bg-cream"><p className="font-bold text-muted">Opening your desk…</p></div>
  if (status !== 'authenticated') return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
