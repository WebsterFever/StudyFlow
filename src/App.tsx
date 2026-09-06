import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { StudyProvider } from './context/StudyContext'
import { PlannerProvider } from './context/PlannerContext'
import Login from './pages/Login'
import Register from './pages/Register'
import GoalFlowHome from './pages/GoalFlowHome'
import PlannerFlowHome from './pages/PlannerFlowHome'
import PlannerGoals from './pages/PlannerGoals'
import PlannerNotes from './pages/PlannerNotes'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import Today from './pages/Today'
import StudyPlan from './pages/StudyPlan'
import StudyContent from './pages/StudyContent'
import Assignments from './pages/Assignments'
import Exams from './pages/Exams'
import StudyNotes from './pages/StudyNotes'
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
              <PlannerProvider>
                <Layout />
              </PlannerProvider>
            </StudyProvider>
          }
        >
          <Route path="/" element={<GoalFlowHome />} />
          <Route path="/planner" element={<PlannerFlowHome />} />
          <Route path="/planner/goals" element={<PlannerGoals />} />
          <Route path="/planner/notes" element={<PlannerNotes />} />
          <Route path="/student" element={<Dashboard />} />
          <Route path="/student/goals" element={<Goals />} />
          <Route path="/student/today" element={<Today />} />
          <Route path="/student/plan" element={<StudyPlan />} />
          <Route path="/student/content" element={<StudyContent />} />
          <Route path="/student/assignments" element={<Assignments />} />
          <Route path="/student/exams" element={<Exams />} />
          <Route path="/student/notes" element={<StudyNotes />} />
          <Route path="/student/progress" element={<Progress />} />
          <Route path="/student/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
