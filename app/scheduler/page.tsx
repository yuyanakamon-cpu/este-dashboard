import Sidebar from '@/components/Sidebar'
import SchedulerDashboard from '@/components/schedule/SchedulerDashboard'

export default function SchedulerPage() {
  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <SchedulerDashboard />
      </main>
    </div>
  )
}
