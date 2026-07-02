import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { initSync } from './sync/sync'
import './index.css'

async function bootstrap() {
  // initSync seeds locally and/or syncs with the hub (if one is reachable).
  await initSync()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

void bootstrap()
