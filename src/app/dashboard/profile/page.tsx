'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload, Check, Loader2, Eye, EyeOff, Calendar, FileText } from 'lucide-react'
import { SectionLock } from '@/components/profile/SectionLock'

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('resume')
  const [loading, setLoading] = useState(true)
  
  // Resume
  const [resumeText, setResumeText] = useState('')
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedAt, setUploadedAt] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [expandedPreview, setExpandedPreview] = useState(false)
  
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

      // Load preferences
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setResumeText(data.resume_text || '')
        setResumeUploaded(data.resume_uploaded || false)
        setSelectedTemplate(data.selected_template || 'template_1')
        setUploadedAt(data.updated_at || '')
      }

      // Get most recent upload for filename
      if (data?.resume_uploaded) {
        const { data: uploadData } = await supabase
          .from('resume_uploads')
          .select('file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (uploadData) {
          setFileName(uploadData.file_name)
          setUploadedAt(uploadData.created_at)
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
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
      setFileName(file.name)
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
          <TabsList className="grid w-full grid-cols-3">
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Resume uploaded successfully</span>
                    </div>
                    <div className="ml-7 space-y-1 text-sm text-green-700">
                      {fileName && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>File: {fileName}</span>
                        </div>
                      )}
                      {uploadedAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Uploaded: {new Date(uploadedAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      )}
                    </div>
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
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                      <h4 className="font-medium text-gray-900">Extracted Text Preview</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPreview(!expandedPreview)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {expandedPreview ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Expand Full Text
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className={`p-4 bg-white ${expandedPreview ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'}`}>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                        {expandedPreview ? resumeText : resumeText.substring(0, 500) + '...'}
                      </p>
                    </div>
                    
                    {!expandedPreview && (
                      <div className="bg-gradient-to-t from-white to-transparent h-8 -mt-8 relative pointer-events-none" />
                    )}

                    <div className="bg-gray-50 px-4 py-2 border-t">
                      <p className="text-xs text-gray-500">
                        Characters extracted: <strong>{resumeText.length.toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {resumeUploaded && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">✅ What's Next?</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Your resume has been saved! Now you can:
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        className="w-full justify-start border-blue-300 hover:bg-blue-100"
                        onClick={() => setActiveTab('template')}
                      >
                        1. Choose a Template
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full justify-start border-blue-300 hover:bg-blue-100"
                        onClick={() => setActiveTab('locks')}
                      >
                        2. Lock Sections (Optional)
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={() => router.push('/dashboard/generate')}
                      >
                        3. Generate Resume for a Job
                      </Button>
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