import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/auth/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HabitsPage } from '@/pages/HabitsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HabitsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
