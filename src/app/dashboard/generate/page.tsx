'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles, Loader2, AlertCircle, FileText } from 'lucide-react'
import { generatePDF, generateDOCX, downloadFile, generateFilename } from '@/lib/download/generators'

export default function GeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  
  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [otherRequest, setOtherRequest] = useState('')
  const [originalAtsScore, setOriginalAtsScore] = useState(0)
  const [originalMatchedKeywords, setOriginalMatchedKeywords] = useState<string[]>([])
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [downloadingDOCX, setDownloadingDOCX] = useState(false)
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null)
  
  // Results state
  const [generated, setGenerated] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([])
  const [atsScore, setAtsScore] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    checkUserResume()
  }, [])

  const checkUserResume = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has uploaded resume
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('resume_text, resume_uploaded')
        .eq('user_id', user.id)
        .single()

      if (!prefs || !prefs.resume_text) {
        // No resume uploaded, redirect to profile
        router.push('/dashboard/profile')
        return
      }

      setHasResume(true)
      
      // Load last generation after confirming user has resume
      await loadLastGeneration()
    } catch (err) {
      console.error('Error checking resume:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadLastGeneration = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get most recent generated resume
      const { data, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        // Restore the state
        setJobTitle(data.job_title || '')
        setCompanyName(data.company_name || '')
        setJobDescription(data.job_description || '')
        setGeneratedContent(data.generated_content || '')
        
        // Parse keywords from saved data
        const keywordData = data.keywords_matched as any
        if (keywordData) {
          setKeywords(keywordData.all || [])
          setMatchedKeywords(keywordData.matched || [])
          setOriginalMatchedKeywords(keywordData.original || [])
          setOriginalAtsScore(keywordData.originalScore || 0)
        }
        
        setAtsScore(data.ats_score || 0)
        setGenerated(true)
        setGeneratedResumeId(data.id)
        console.log('Loaded existing resume ID:', data.id)
      }
    } catch (err) {
      console.error('Error loading last generation:', err)
      // Don't show error to user, just don't load previous generation
    }
  }

  const toggleCustomRequest = (request: string) => {
    setCustomRequests(prev =>
      prev.includes(request)
        ? prev.filter(r => r !== request)
        : [...prev, request]
    )
  }

  const handleGenerate = async () => {
    // Validation
    if (!jobDescription.trim()) {
      setError('Please paste a job description')
      return
    }

    if (jobDescription.length < 100) {
      setError('Job description seems too short. Please paste the complete job posting.')
      return
    }

    setGenerating(true)
    setError('')

    try {
      // Combine custom requests
      const allRequests = [...customRequests]
      if (otherRequest.trim()) {
        allRequests.push(otherRequest.trim())
      }

      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          companyName,
          jobDescription,
          customRequests: allRequests.join('; '),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate resume')
      }

      // Set results
      setGeneratedContent(data.content)
      setKeywords(data.keywords)
      setMatchedKeywords(data.matchedKeywords)
      setAtsScore(data.atsScore)
      setOriginalAtsScore(data.originalAtsScore)
      setOriginalMatchedKeywords(data.originalMatchedKeywords)
      setGenerated(true)
      setGeneratedResumeId(data.generatedId)
      console.log('New generated resume ID:', data.generatedId)

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to generate resume')
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
        jobTitle,
        companyName,
      })

      const filename = generateFilename(jobTitle, companyName, 'pdf')
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
        jobTitle,
        companyName,
      })

      const filename = generateFilename(jobTitle, companyName, 'docx')
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

  const customRequestOptions = [
    'Emphasize leadership experience',
    'Highlight technical skills',
    'Focus on quantifiable achievements',
    'Include certifications prominently',
    'Emphasize remote work experience',
    'Highlight team collaboration',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold">Generate Resume</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Customize Resume for Job
            </CardTitle>
            <CardDescription>
              Paste the job description and we'll create a tailored resume that highlights your relevant experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Job Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Characters: {jobDescription.length}
              </p>
            </div>

            {/* Custom Requests */}
            <div>
              <Label className="mb-3 block">Custom Requests (Optional)</Label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {customRequestOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={customRequests.includes(option)}
                      onCheckedChange={() => toggleCustomRequest(option)}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="otherRequest">Other (specify)</Label>
                <Input
                  id="otherRequest"
                  value={otherRequest}
                  onChange={(e) => setOtherRequest(e.target.value)}
                  placeholder="Any other specific requests..."
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
                  Generating Your Customized Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {generated && (
          <div id="results" className="space-y-6">
            {/* ATS Score */}
            <Card>
              <CardHeader>
                <CardTitle>ATS Match Analysis</CardTitle>
                <CardDescription>
                  See how much your resume improved for this job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Before vs After Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original Score */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Original Resume</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-red-600">{originalAtsScore}%</span>
                      <span className="text-sm text-gray-500">match</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {originalMatchedKeywords.length}/{keywords.length} keywords
                    </p>
                  </div>

                  {/* Generated Score */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Generated Resume</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-green-600">{atsScore}%</span>
                      <span className="text-sm text-gray-500">match</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {matchedKeywords.length}/{keywords.length} keywords
                    </p>
                  </div>
                </div>

                {/* Improvement Indicator */}
                {atsScore > originalAtsScore && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm text-blue-800 font-medium">
                      🎉 Improvement: <span className="text-2xl font-bold text-blue-600">+{atsScore - originalAtsScore}%</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Added {matchedKeywords.length - originalMatchedKeywords.length} more keywords
                    </p>
                  </div>
                )}

                {/* Progress Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Original</span>
                      <span className="text-xs font-medium">{originalAtsScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all"
                        style={{ width: `${originalAtsScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Generated</span>
                      <span className="text-xs font-medium">{atsScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          atsScore >= 80
                            ? 'bg-green-600'
                            : atsScore >= 60
                            ? 'bg-yellow-600'
                            : 'bg-orange-600'
                        }`}
                        style={{ width: `${atsScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Keyword Breakdown */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-green-700">
                      ✅ Keywords Added ({matchedKeywords.length - originalMatchedKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchedKeywords
                        .filter(k => !originalMatchedKeywords.includes(k))
                        .map((keyword, idx) => (
                          <span
                            key={idx}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-700">
                      Already Included ({originalMatchedKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {originalMatchedKeywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Resume */}
            <Card>
              <CardHeader>
                <CardTitle>Your Customized Resume</CardTitle>
                <CardDescription>
                  Review the generated content below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent}
                  </pre>
                </div>

                {/* Cover Letter Button */}
<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Need a Cover Letter?</h4>
              <p className="text-sm text-blue-700 mb-3">
                  Generate a personalized cover letter for this job application
              </p>
              <Button 
  variant="outline"
  className="w-full border-blue-300 hover:bg-blue-100"
  disabled={!generatedResumeId}
  onClick={() => {
    if (generatedResumeId) {
      router.push(`/dashboard/cover-letter?resumeId=${generatedResumeId}`)
    }
  }}
>
  <FileText className="h-4 w-4 mr-2" />
  Generate Cover Letter
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
                        <>
                          Download PDF
                        </>
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
                        <>
                          Download DOCX
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setGenerated(false)}
                      className="flex-1"
                    >
                      Generate Another
                    </Button>
                    <Button 
                      variant="ghost" 
                      asChild
                      className="flex-1"
                    >
                      <a href="/dashboard/history">View History</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}