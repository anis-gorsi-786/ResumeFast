'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload, Check, Loader2 } from 'lucide-react'
import { SectionLock } from '@/components/profile/SectionLock'

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(true)
  
  // Personal details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // Resume
  const [resumeText, setResumeText] = useState('')
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Template
  const [selectedTemplate, setSelectedTemplate] = useState('template_1')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Set email from auth
      setEmail(user.email || '')

      // Load preferences
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setName(data.name || '')
        setPhone(data.phone || '')
        setResumeText(data.resume_text || '')
        setResumeUploaded(data.resume_uploaded || false)
        setSelectedTemplate(data.selected_template || 'template_1')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDetails = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            name,
            phone,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )

      if (error) throw error

      alert('Details saved successfully!')
    } catch (error) {
      console.error('Error saving details:', error)
      alert('Failed to save details')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResumeUploaded(true)
      setResumeText(data.preview || '')
      alert('Resume uploaded successfully!')
      
      // Reload profile to get updated data
      await loadProfile()
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold">Profile Settings</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resume">Resume Upload</TabsTrigger>
            <TabsTrigger value="template">Choose Template</TabsTrigger>
            <TabsTrigger value="locks">Lock Sections</TabsTrigger>
          </TabsList>
          
          {/* Resume Upload Tab */}
          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Upload your base resume (PDF or DOCX)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeUploaded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">Resume uploaded successfully</span>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Click to upload or drag and drop
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {resumeUploaded ? 'Upload New Resume' : 'Upload Resume'}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF and DOCX (Max 5MB)
                  </p>
                </div>

                {resumeText && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Preview:</h4>
                    <div className="bg-gray-50 p-4 rounded border max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {resumeText.substring(0, 500)}...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template">
            <Card>
              <CardHeader>
                <CardTitle>Choose Resume Template</CardTitle>
                <CardDescription>
                  Select your preferred resume format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/dashboard/templates')}
                  className="w-full"
                >
                  View & Select Templates
                </Button>
                {selectedTemplate && (
                  <p className="text-sm text-gray-600 mt-4">
                    Current template: {selectedTemplate === 'template_1' ? 'Clean Professional' : 'Modern Executive'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lock Sections Tab */}
          <TabsContent value="locks">
            <SectionLock resumeText={resumeText} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}