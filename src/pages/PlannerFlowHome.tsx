import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

export default function PlannerFlowHome() {
  return (
    <EmptyState
      icon={<ClipboardList size={40} />}
      title="PlannerFlow is coming soon"
      description="Plan goals, projects, and everyday life — right alongside your StudentFlow courses. This experience is being built next."
    />
  )
}
