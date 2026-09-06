import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ClipboardList,
  Flag,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/goals', label: 'Goals', icon: Flag },
  { to: '/student/today', label: 'Today', icon: Target },
  { to: '/student/plan', label: 'Study Plan', icon: CalendarRange },
  { to: '/student/content', label: 'Study Content', icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/exams', label: 'Exams', icon: GraduationCap },
  { to: '/student/notes', label: 'Study Notes', icon: NotebookPen },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export const PLANNER_NAV_ITEMS: NavItem[] = [
  { to: '/planner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner/goals', label: 'Goals', icon: Flag },
  { to: '/planner/notes', label: 'Notes', icon: NotebookPen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]
