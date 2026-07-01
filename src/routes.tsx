import { createHashRouter, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { useSession, isParent } from './store/session'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Week } from './screens/Week'
import { RoutineRunner } from './screens/RoutineRunner'
import { Chores } from './screens/Chores'
import { Rewards } from './screens/Rewards'
import { Challenges } from './screens/Challenges'
import { Help } from './screens/Help'
import { Settings } from './screens/Settings'
import { Approvals } from './screens/Approvals'

function RequireAuth() {
  const profile = useSession((s) => s.activeProfile)
  if (!profile) return <Navigate to="/" replace />
  return <Outlet />
}

function RequireParent() {
  const profile = useSession((s) => s.activeProfile)
  if (!isParent(profile)) return <Navigate to="/home" replace />
  return <Outlet />
}

export const router = createHashRouter([
  { path: '/', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/week', element: <Week /> },
          { path: '/chores', element: <Chores /> },
          { path: '/rewards', element: <Rewards /> },
          { path: '/challenges', element: <Challenges /> },
          { path: '/help', element: <Help /> },
          {
            element: <RequireParent />,
            children: [
              { path: '/settings', element: <Settings /> },
              { path: '/settings/approvals', element: <Approvals /> },
            ],
          },
        ],
      },
      // Routine runner is full-screen (outside the layout chrome).
      { path: '/routine/:id', element: <RoutineRunner /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
