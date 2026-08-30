import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, CheckCircle2, Clock, Flame, Percent, Timer, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudy } from '../hooks/useStudy'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { StatCard } from '../components/dashboard/StatCard'
import {
  averageSessionDurationMinutes,
  completedItemsCount,
  overallProgress,
  totalActualMinutes,
  totalPlannedMinutes,
} from '../utils/calculations'
import { estimatedVsActual, hoursPerDaySeries, lessonsCompletedByType, masteryByTopic } from '../utils/stats'
import { computeStreak } from '../utils/streak'
import { formatHours, formatMinutes } from '../utils/date'

const TYPE_COLORS: Record<string, string> = {
  Video: '#4f46e5',
  Exercise: '#2563eb',
  Project: '#7c3aed',
  Reading: '#64748b',
  Review: '#d97706',
}

const CHART_AXIS = { fontSize: 12, fill: '#64748b' }

export default function Statistics() {
  const { state } = useStudy()
  const { items, sessions } = state

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={40} />}
        title="Nothing to analyze yet"
        description="Complete a few study sessions to unlock your statistics."
        action={
          <Link to="/content">
            <Button>Add study content</Button>
          </Link>
        }
      />
    )
  }

  const streak = computeStreak(sessions)
  const overall = overallProgress(items)
  const plannedTotal = totalPlannedMinutes(sessions)
  const actualTotal = totalActualMinutes(sessions)
  const avgSession = averageSessionDurationMinutes(sessions)
  const dailySeries = hoursPerDaySeries(sessions, 14)
  const evsA = estimatedVsActual(items, sessions, 8)
  const byType = lessonsCompletedByType(items)
  const topicMastery = masteryByTopic(items).sort((a, b) => b.averageMastery - a.averageMastery)
  const strongest = topicMastery.slice(0, 3)
  const weakest = [...topicMastery].sort((a, b) => a.averageMastery - b.averageMastery).slice(0, 3)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Clock size={20} />} label="Total planned" value={formatHours(plannedTotal)} sub={formatMinutes(plannedTotal)} />
        <StatCard icon={<Timer size={20} />} label="Total actual" value={formatHours(actualTotal)} sub={formatMinutes(actualTotal)} tone="green" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Lessons completed" value={completedItemsCount(items)} sub={`${overall.percent}% of ${overall.total}`} />
        <StatCard icon={<Percent size={20} />} label="Avg. session length" value={formatMinutes(avgSession)} tone="slate" />
        <StatCard icon={<Flame size={20} />} label="Current streak" value={`${streak.currentStreak} days`} tone="amber" />
        <StatCard icon={<TrendingUp size={20} />} label="Longest streak" value={`${streak.longestStreak} days`} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Study hours per day" subtitle="Last 14 days — planned vs actual" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySeries} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={CHART_AXIS} axisLine={false} tickLine={false} />
              <YAxis
                tick={CHART_AXIS}
                axisLine={false}
                tickLine={false}
                width={44}
                allowDecimals={false}
                tickFormatter={(v: number) => (v === 0 ? '0' : v % 60 === 0 ? `${v / 60}h` : `${v}m`)}
              />
              <Tooltip
                formatter={(value) => formatMinutes(Number(value))}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="planned" name="Planned" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Estimated vs. actual time" subtitle="Most recently completed lessons" />
          {evsA.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Complete a lesson to see this comparison.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evsA} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                  <YAxis dataKey="label" type="category" tick={CHART_AXIS} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(value) => formatMinutes(Number(value))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="estimated" name="Estimated" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Lessons completed by type" />
          {byType.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No completed lessons yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="count" nameKey="type" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {byType.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Strongest topics" subtitle="Highest average mastery" />
          <TopicMasteryList topics={strongest} tone="green" />
        </Card>
        <Card>
          <CardHeader title="Weakest topics" subtitle="Lowest average mastery" />
          <TopicMasteryList topics={weakest} tone="amber" />
        </Card>
      </div>
    </div>
  )
}

function TopicMasteryList({ topics, tone }: { topics: { topic: string; averageMastery: number; ratedCount: number }[]; tone: 'green' | 'amber' }) {
  if (topics.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Not enough rated lessons yet.</p>
  }
  return (
    <div className="space-y-2.5">
      {topics.map((t) => (
        <div key={t.topic} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.topic}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              tone === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
          >
            {t.averageMastery.toFixed(1)} / 5
          </span>
        </div>
      ))}
    </div>
  )
}
