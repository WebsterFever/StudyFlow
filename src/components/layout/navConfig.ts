import {
  BarChart3,
  BookOpen,
  CalendarRange,
  Flag,
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
  { to: '/student/notes', label: 'Study Notes', icon: NotebookPen },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]
