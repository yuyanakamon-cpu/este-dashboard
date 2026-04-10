'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MasterDashboard from '@/components/master/MasterDashboard'

const SESSION_KEY = 'este_master_auth'

export default function MasterDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
      router.replace('/master')
    }
  }, [router])

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <MasterDashboard />
      </main>
    </div>
  )
}
