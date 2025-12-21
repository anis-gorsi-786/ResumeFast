'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { generatePDF, generateDOCX, downloadFile, generateFilename } from '@/lib/download/generators'
import { ArrowLeft, Calendar, Download, Trash2, FileText, Loader2 } from 'lucide-react'

interface GeneratedResume {
  id: string
  job_title: string
  company_name: string
  ats_score: number
  created_at: string
  generated_content: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<GeneratedResume[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setResumes(data)
      }
    } catch (err) {
      console.error('Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteResume = async (id: string) => {
    if (!confirm('Delete this generated resume?')) return

    try {
      const supabase = createClient()
      await supabase
        .from('generated_resumes')
        .delete()
        .eq('id', id)

      setResumes(resumes.filter(r => r.id !== id))
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleDownload = async (resume: GeneratedResume, format: 'pdf' | 'docx') => {
    setDownloading(`${resume.id}-${format}`)
    try {
      const blob = format === 'pdf'
        ? await generatePDF({
            content: resume.generated_content,
            template: 'template_1',
            jobTitle: resume.job_title,
            companyName: resume.company_name,
          })
        : await generateDOCX({
            content: resume.generated_content,
            template: 'template_1',
            jobTitle: resume.job_title,
            companyName: resume.company_name,
          })

      const filename = generateFilename(resume.job_title, resume.company_name, format)
      downloadFile(blob, filename)
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download ${format.toUpperCase()}`)
    } finally {
      setDownloading(null)
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
              Back
            </Button>
            <h1 className="text-xl font-bold">Resume History</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Generated Resumes</h2>
          <p className="text-gray-600">
            View and download previously generated resumes
          </p>
        </div>

        {resumes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No resumes generated yet</p>
              <Button asChild>
                <a href="/dashboard/generate">Generate Your First Resume</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {resume.job_title || 'Untitled Position'}
                        {resume.company_name && (
                          <span className="text-sm font-normal text-gray-500">
                            at {resume.company_name}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                        <span className={`font-medium ${
                          resume.ats_score >= 80 ? 'text-green-600' :
                          resume.ats_score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          ATS Score: {resume.ats_score}%
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleDownload(resume, 'pdf')}
                      disabled={downloading === `${resume.id}-pdf`}
                    >
                      {downloading === `${resume.id}-pdf` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      PDF
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(resume, 'docx')}
                      disabled={downloading === `${resume.id}-docx`}
                    >
                      {downloading === `${resume.id}-docx` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      DOCX
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteResume(resume.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}