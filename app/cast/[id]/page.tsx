import { notFound } from 'next/navigation'
import { getCast } from '@/lib/mock-data'
import CastSidebar from '@/components/cast/CastSidebar'
import CastDashboard from '@/components/cast/CastDashboard'

export default function CastPage({ params }: { params: { id: string } }) {
  const cast = getCast(params.id)
  if (!cast) notFound()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <CastSidebar cast={cast} />
      <main className="flex-1 overflow-auto" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <CastDashboard cast={cast} />
      </main>
    </div>
  )
}
