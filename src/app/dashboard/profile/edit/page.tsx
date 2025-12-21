'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadResumeData()
  }, [])

  const loadResumeData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('resume_text')
        .eq('user_id', user.id)
        .single()

      if (preferences && !prefError) {
        setResumeText(preferences.resume_text || '')
      } else {
        // Try to get from latest upload
        const { data: upload, error: uploadError } = await supabase
          .from('resume_uploads')
          .select('extracted_text')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (upload && !uploadError) {
          setResumeText(upload.extracted_text || '')
        }
      }
    } catch (err) {
      console.error('Error loading resume:', err)
      setError('Failed to load resume data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!resumeText.trim()) {
      setError('Resume text cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { error: saveError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          resume_text: resumeText,
          updated_at: new Date().toISOString(),
        })

      if (saveError) throw saveError

      setSuccess(true)
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      console.error('Save error:', err)
      setError('Failed to save changes: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Edit Resume Details</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✅ Changes saved successfully! Redirecting to dashboard...
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-2">Your Resume Content</h2>
            <p className="text-sm text-gray-600">
              Review and edit the text extracted from your resume. This will be used to generate customized resumes for job applications.
            </p>
          </div>

          <div className="p-6">
            <Label htmlFor="resume-text" className="text-base font-medium mb-3 block">
              Resume Text
            </Label>
            <Textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Your resume content will appear here..."
            />
            <p className="text-sm text-gray-500 mt-3">
              Characters: <strong>{resumeText.length.toLocaleString()}</strong>
            </p>
          </div>

          <div className="p-6 bg-gray-50 border-t">
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.back()} size="lg">
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Editing</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure all your contact information is correct</li>
            <li>• Check that dates and company names are accurate</li>
            <li>• Ensure achievements are clearly stated</li>
            <li>• This base content will be customized for each job application</li>
          </ul>
        </div>
      </main>
    </div>
  )
}