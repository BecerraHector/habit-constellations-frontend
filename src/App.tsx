import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HabitsPage } from '@/pages/HabitsPage'
import { GalaxiesPage } from '@/pages/GalaxiesPage'
import { GalaxyDetailPage } from '@/pages/GalaxyDetailPage'
import { FriendsPage } from '@/pages/FriendsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HabitsPage />} />
          <Route path="/galaxias" element={<GalaxiesPage />} />
          <Route path="/galaxias/:id" element={<GalaxyDetailPage />} />
          <Route path="/amigos" element={<FriendsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
