import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { StudyProvider } from './context/StudyContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import StudyPlan from './pages/StudyPlan'
import StudyContent from './pages/StudyContent'
import Progress from './pages/Progress'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <StudyProvider>
              <Layout />
            </StudyProvider>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/today" element={<Today />} />
          <Route path="/plan" element={<StudyPlan />} />
          <Route path="/content" element={<StudyContent />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
