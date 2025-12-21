'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { generatePDF, downloadFile } from '@/lib/download/generators'
import { ArrowLeft, Sparkles, Loader2, CheckCircle, Download, Lightbulb } from 'lucide-react'

interface QuestionAnswer {
  question: string
  answer: string
  category: string
  tips: string[]
}

function InterviewPrepPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const coverLetterId = searchParams.get('coverLetterId')

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [questions, setQuestions] = useState<QuestionAnswer[]>([])
  const [generalTips, setGeneralTips] = useState<string[]>([])
  const [error, setError] = useState('')

  const [downloadingPDF, setDownloadingPDF] = useState(false)

  useEffect(() => {
    if (coverLetterId) {
      loadCoverLetterData(coverLetterId)
    } else {
      router.push('/dashboard/generate')
    }
  }, [coverLetterId])

  const loadCoverLetterData = async (id: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get cover letter data
      const { data: coverLetter, error } = await supabase
        .from('generated_cover_letters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !coverLetter) {
        setError('Cover letter not found')
        return
      }

      setJobTitle(coverLetter.job_title || '')
      setCompanyName(coverLetter.company_name || '')
    } catch (err) {
      console.error('Error loading cover letter:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetterId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate interview questions')
      }

      setQuestions(data.questions)
      setGeneralTips(data.generalTips)
      setGenerated(true)

      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to generate interview questions')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      // Format questions for PDF
      const content = formatQuestionsForPDF()
      
      const blob = await generatePDF({
        content,
        template: 'template_1',
        jobTitle: `Interview_Prep_${jobTitle}`,
        companyName,
      })

      const filename = `Interview_Prep_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      downloadFile(blob, filename)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const formatQuestionsForPDF = () => {
    let content = `INTERVIEW PREPARATION\n${jobTitle} at ${companyName}\n\n`
    content += `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`
    content += '═'.repeat(60) + '\n\n'

    content += 'GENERAL INTERVIEW TIPS:\n\n'
    generalTips.forEach((tip, idx) => {
      content += `${idx + 1}. ${tip}\n`
    })
    content += '\n' + '═'.repeat(60) + '\n\n'

    content += 'INTERVIEW QUESTIONS & ANSWERS:\n\n'
    
    questions.forEach((qa, idx) => {
      content += `QUESTION ${idx + 1} [${qa.category.toUpperCase()}]:\n`
      content += `${qa.question}\n\n`
      content += `ANSWER FRAMEWORK:\n${qa.answer}\n\n`
      content += `TIPS:\n`
      qa.tips.forEach((tip, tipIdx) => {
        content += `  • ${tip}\n`
      })
      content += '\n' + '-'.repeat(60) + '\n\n'
    })

    return content
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return 'bg-blue-100 text-blue-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'situational': return 'bg-green-100 text-green-800'
      case 'company-specific': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-xl font-bold">Interview Preparation</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!generated ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Prepare for Your Interview
              </CardTitle>
              <CardDescription>
                Get personalized interview questions and answer frameworks for {jobTitle} at {companyName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What You'll Get:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ 8-10 likely interview questions based on the job description</li>
                  <li>✓ Detailed answer frameworks using your actual experience</li>
                  <li>✓ Tips for delivering strong, confident answers</li>
                  <li>✓ General interview advice specific to this role</li>
                  <li>✓ Downloadable PDF for practice</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating}
                size="lg"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Interview Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Interview Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div id="results" className="space-y-6">
            {/* General Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  General Interview Tips
                </CardTitle>
                <CardDescription>
                  Key preparation advice for your {jobTitle} interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generalTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="font-semibold text-blue-600 mt-0.5">{idx + 1}.</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Questions and Answers */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Questions & Answer Frameworks</CardTitle>
                <CardDescription>
                  Practice these questions and use the frameworks to craft your responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((qa, idx) => (
                  <div key={idx} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">Question {idx + 1}</h3>
                      <Badge className={getCategoryColor(qa.category)}>
                        {qa.category}
                      </Badge>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <p className="font-medium text-gray-900">{qa.question}</p>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Answer Framework:</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{qa.answer}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Tips:</h4>
                      <ul className="space-y-1">
                        {qa.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Download Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    size="lg"
                    className="flex-1"
                  >
                    {downloadingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Interview Prep PDF
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setGenerated(false)}
                    size="lg"
                  >
                    Regenerate
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

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <InterviewPrepPageContent />
    </Suspense>
  )
}