import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HabitsPage } from '@/pages/HabitsPage'
import { HabitDetailPage } from '@/pages/HabitDetailPage'
import { GalaxiesPage } from '@/pages/GalaxiesPage'
import { GalaxyDetailPage } from '@/pages/GalaxyDetailPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HabitsPage />} />
          <Route path="/habitos/:id" element={<HabitDetailPage />} />
          <Route path="/galaxias" element={<GalaxiesPage />} />
          <Route path="/galaxias/:id" element={<GalaxyDetailPage />} />
          <Route path="/amigos" element={<FriendsPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
