import {
  BarChart3,
  BookOpen,
  CalendarRange,
  LayoutDashboard,
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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: Target },
  { to: '/plan', label: 'Study Plan', icon: CalendarRange },
  { to: '/content', label: 'Study Content', icon: BookOpen },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]
