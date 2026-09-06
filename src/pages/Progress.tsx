import { AlertTriangle, BarChart3, CalendarPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudy } from '../hooks/useStudy'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ProgressGroupList } from '../components/progress/ProgressGroupList'
import { Badge } from '../components/ui/Badge'
import { overallProgress, progressByCourse, progressByTopic, progressByType } from '../utils/calculations'
import { computeReviewSuggestions } from '../utils/review'
import { MASTERY_LABELS } from '../types'
import { formatFriendlyDate } from '../utils/date'
import { generateId } from '../utils/id'
import type { StudyItem } from '../types'

export default function Progress() {
  const { items, addItem, activeGoal } = useStudy()

  if (!activeGoal || items.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={40} />}
        title="No progress to show yet"
        description="Add study content and complete a few lessons to see your progress here."
        action={
          <Link to="/student/content">
            <Button>Add study content</Button>
          </Link>
        }
      />
    )
  }

  const overall = overallProgress(items)
  const byCourse = progressByCourse(items)
  const byTopic = progressByTopic(items)
  const byType = progressByType(items)
  const lowMastery = items
    .filter((i) => i.completed && i.mastery != null && i.mastery <= 2)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
  const reviewSuggestions = computeReviewSuggestions(items)

  const nextOrder = items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1

  const scheduleReview = (source: (typeof reviewSuggestions)[number]) => {
    const now = new Date().toISOString()
    const reviewItem: StudyItem = {
      id: generateId('item'),
      goalId: activeGoal.id,
      title: `Review: ${source.itemTitle}`,
      course: source.course,
      topic: source.topic,
      type: 'Review',
      durationMinutes: 20,
      difficulty: 'Easy',
      priority: 'High',
      completed: false,
      completedDate: null,
      mastery: null,
      notes: '',
      createdDate: now,
      order: nextOrder,
    }
    addItem(reviewItem)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Overall goal progress" />
        <ProgressBar percent={overall.percent} tone="indigo" size="md" showPercent />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {overall.completed} / {overall.total} lessons completed
        </p>
      </Card>

      {lowMastery.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader title="Low-mastery topics" subtitle="These need extra review" />
          <div className="space-y-2">
            {lowMastery.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={15} className="shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.topic}</p>
                  </div>
                </div>
                <Badge tone="amber">{MASTERY_LABELS[item.mastery ?? 1]}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="By course" />
          <ProgressGroupList groups={byCourse} />
        </Card>
        <Card>
          <CardHeader title="By topic" />
          <ProgressGroupList groups={byTopic} />
        </Card>
        <Card>
          <CardHeader title="By study type" />
          <ProgressGroupList groups={byType} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Suggested reviews" subtitle="Based on your mastery ratings" />
        {reviewSuggestions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No reviews are due right now.</p>
        ) : (
          <div className="space-y-2">
            {reviewSuggestions.map((s) => (
              <div key={s.itemId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{s.itemTitle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Due:</span>
                    {s.dueDates.map((d) => (
                      <Badge key={d} tone="amber">
                        {formatFriendlyDate(d)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={<CalendarPlus size={14} />} onClick={() => scheduleReview(s)}>
                  Schedule review
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
