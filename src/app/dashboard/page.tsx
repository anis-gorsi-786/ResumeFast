'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { getTemplateById } from '@/lib/templates'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template_1')
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const getUser = async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      router.push('/login')
      return
    }
    
    setUser(user)

    // Get selected template
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('selected_template')
      .eq('user_id', user.id)
      .single()

    if (prefs) {
      setSelectedTemplate(prefs.selected_template || 'template_1')
    }

    setLoading(false)
  }

  getUser()
}, [router])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Applya</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-3xl font-bold mb-4">Welcome to Your Dashboard!</h2>
          <p className="text-gray-600 mb-4">
            Logged in as: <strong>{user?.email}</strong>
          </p>
          <p className="text-gray-600 mb-6">
            This is your protected dashboard. Set up your profile to start generating resumes!
        </p>

        <Button asChild size="lg">
            <a href="/dashboard/profile">Setup Profile →</a>
        </Button>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 className="font-semibold text-blue-900 mb-2">🎉 Welcome to Applya!</h3>
  <p className="text-sm text-blue-800 mb-4">
    Set up your profile and choose a template to start generating customized resumes.
  </p>
  
  <div className="space-y-3">
    <Button asChild className="w-full">
      <a href="/dashboard/profile">Setup Profile →</a>
    </Button>

    <Button asChild className="w-full" variant="outline">
      <a href="/dashboard/generate">Generate Resume →</a>
    </Button>

    <Button asChild className="w-full" variant="outline">
      <a href="/dashboard/history">View History →</a>
    </Button>

    <div className="p-4 bg-white rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Selected Template</p>
          <p className="text-sm text-gray-600">
            {getTemplateById(selectedTemplate)?.name || 'Clean Professional'}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard/templates">Change</a>
        </Button>
      </div>
    </div>
  </div>
</div>
        </div>
      </main>
    </div>
  )
}