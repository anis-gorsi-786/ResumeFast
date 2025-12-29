'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'improvement' | 'idea'>('feedback')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setError('Please provide your feedback')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          name: name || 'Anonymous',
          email: email || 'Not provided',
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
            <CardDescription>
              Help us make Applya better for everyone
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Thank You!
                </h3>
                <p className="text-gray-600">
                  Your feedback has been sent successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type */}
                <div>
                  <Label className="mb-3 block">What would you like to share?</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('feedback')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        feedbackType === 'feedback'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💬</div>
                        <div className="text-sm font-medium">Feedback</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackType('improvement')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        feedbackType === 'improvement'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🚀</div>
                        <div className="text-sm font-medium">Improvement</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackType('idea')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        feedbackType === 'idea'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💡</div>
                        <div className="text-sm font-medium">New Idea</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">Your Name (Optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Your Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll only use this if we need to follow up
                  </p>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">Your Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}