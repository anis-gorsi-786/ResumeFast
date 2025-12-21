'use client'

import { useState, useEffect, Suspense} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { extractPersonalDetails } from '@/lib/openai/coverLetter'
import { generatePDF, generateDOCX, downloadFile, generateFilename } from '@/lib/download/generators'
import { ArrowLeft, Sparkles, Loader2, AlertCircle, FileText, Lightbulb } from 'lucide-react'

export default function CoverLetterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('resumeId')

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeContent, setResumeContent] = useState('')
  const [generatedCoverLetterId, setGeneratedCoverLetterId] = useState<string | null>(null)

  // Personal details
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [applicantAddress, setApplicantAddress] = useState('')

  // Additional content
  const [additionalHighlights, setAdditionalHighlights] = useState('')
  const [customRequests, setCustomRequests] = useState('')

  // Results
  const [generatedContent, setGeneratedContent] = useState('')
  const [error, setError] = useState('')

  // Download states
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [downloadingDOCX, setDownloadingDOCX] = useState(false)

  useEffect(() => {
    if (resumeId) {
      loadResumeData(resumeId)
    } else {
      router.push('/dashboard/generate')
    }
  }, [resumeId])

  const loadResumeData = async (id: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get resume data
      const { data: resume, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !resume) {
        setError('Resume not found')
        return
      }

      // Set job details
      setJobTitle(resume.job_title || '')
      setCompanyName(resume.company_name || '')
      setJobDescription(resume.job_description || '')
      setResumeContent(resume.generated_content || '')

      // Get base resume for personal details
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('resume_text')
        .eq('user_id', user.id)
        .single()

      if (prefs?.resume_text) {
        // Extract personal details from base resume
        const details = extractPersonalDetails(prefs.resume_text)
        setApplicantName(details.name)
        setApplicantEmail(details.email)
        setApplicantPhone(details.phone)
        setApplicantAddress(details.address)
      }
    } catch (err) {
      console.error('Error loading resume:', err)
      setError('Failed to load resume data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    // Validation
    if (!jobTitle.trim() || !companyName.trim()) {
      setError('Please provide job title and company name')
      return
    }

    if (!applicantName.trim()) {
      setError('Please provide your name')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          resumeContent,
          jobTitle,
          companyName,
          jobDescription,
          applicantName,
          applicantEmail,
          applicantPhone,
          applicantAddress,
          additionalHighlights,
          customRequests,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cover letter')
      }

      setGeneratedContent(data.content)
      setGenerated(true)
      setGeneratedCoverLetterId(data.coverLetterId)

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      const blob = await generatePDF({
        content: generatedContent,
        template: 'template_1',
        jobTitle: `Cover_Letter_${jobTitle}`,
        companyName,
      })

      const filename = `Cover_Letter_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      downloadFile(blob, filename)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadDOCX = async () => {
    setDownloadingDOCX(true)
    try {
      const blob = await generateDOCX({
        content: generatedContent,
        template: 'template_1',
        jobTitle: `Cover_Letter_${jobTitle}`,
        companyName,
      })

      const filename = `Cover_Letter_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`
      downloadFile(blob, filename)
    } catch (error) {
      console.error('DOCX generation error:', error)
      alert('Failed to generate DOCX')
    } finally {
      setDownloadingDOCX(false)
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
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Generate Cover Letter</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Cover Letter Details
            </CardTitle>
            <CardDescription>
              Confirm the details below and we'll generate a personalized cover letter
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Tech Corp"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Your Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="City, State ZIP"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                These details were extracted from your resume. Please verify and update if needed.
              </p>
            </div>

            {/* Additional Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Additional Information (Optional)</h3>
              <div>
                <Label htmlFor="highlights">
                  Personal Projects or Achievements Not in Resume
                </Label>
                <Textarea
                  id="highlights"
                  value={additionalHighlights}
                  onChange={(e) => setAdditionalHighlights(e.target.value)}
                  placeholder="E.g., Built a mobile app with 10k downloads, Led volunteer coding workshop..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Highlight relevant projects, volunteer work, or achievements to include in your cover letter
                </p>
              </div>

              <div>
                <Label htmlFor="customRequests">Custom Requests</Label>
                <Input
                  id="customRequests"
                  value={customRequests}
                  onChange={(e) => setCustomRequests(e.target.value)}
                  placeholder="E.g., Emphasize remote work experience, mention relocation readiness..."
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="lg"
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Your Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {generated && (
          <div id="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Cover Letter</CardTitle>
                <CardDescription>
                  Review your personalized cover letter below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent}
                  </pre>
                </div>

{/* Interview Prep Button */}
<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
    <Lightbulb className="h-4 w-4" />
    Prepare for the Interview
  </h4>
  <p className="text-sm text-green-700 mb-3">
    Get personalized interview questions and answer frameworks
  </p>
  <Button 
  variant="outline"
  className="w-full border-green-300 hover:bg-green-100"
  disabled={!generatedCoverLetterId}
  onClick={() => {
    if (generatedCoverLetterId) {
      router.push(`/dashboard/interview-prep?coverLetterId=${generatedCoverLetterId}`)
    }
  }}
>
  <Lightbulb className="h-4 w-4 mr-2" />
  Prepare for Interview
</Button>
</div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF || downloadingDOCX}
                    >
                      {downloadingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        'Download PDF'
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleDownloadDOCX}
                      disabled={downloadingPDF || downloadingDOCX}
                    >
                      {downloadingDOCX ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating DOCX...
                        </>
                      ) : (
                        'Download DOCX'
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setGenerated(false)}
                    className="w-full"
                  >
                    Regenerate Cover Letter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CoverLetterPageContent />
    </Suspense>
  )
}