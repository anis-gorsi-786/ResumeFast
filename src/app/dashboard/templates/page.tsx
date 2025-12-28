'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { templates } from '@/lib/templates'

export default function TemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState('template_1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('selected_template')
        .eq('user_id', user.id)
        .single()

      if (data?.selected_template) {
        setSelectedTemplate(data.selected_template)
      }
    } catch (err) {
      console.error('Error loading template:', err)
    }
  }

  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplate(templateId)
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            selected_template: templateId,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )

      if (error) throw error

      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 500)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template selection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/profile')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <h1 className="text-xl font-bold">Select Your Resume Format</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-gray-600">
            Choose the template that best matches your industry and style preferences
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {selectedTemplate === template.id && (
                        <Badge className="bg-blue-600">Selected</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  {selectedTemplate === template.id && (
                    <Check className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Template Preview - ACTUAL IMAGE */}
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white border-2 border-gray-200 shadow-sm">
                  {template.preview ? (
                    <img 
                      src={template.preview} 
                      alt={`${template.name} preview`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Image failed to load:', template.preview)
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `
                            <div class="flex items-center justify-center h-full bg-gray-50">
                              <div class="text-center p-8">
                                <div class="text-4xl mb-2">📄</div>
                                <p class="text-gray-600 font-medium">Preview Coming Soon</p>
                                <p class="text-sm text-gray-500 mt-2">Visual preview of ${template.name}</p>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center p-8">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-gray-600 font-medium">Preview Coming Soon</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Visual preview of {template.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {template.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best For */}
                <div>
                  <h4 className="font-semibold mb-3">Best for:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.bestFor.map((item, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  className="w-full"
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={saving}
                >
                  {selectedTemplate === template.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select This Template'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Template Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>ATS Optimization:</strong> Both templates are ATS-friendly, but Template 1 has maximum compatibility
                  </li>
                  <li>
                    <strong>Industry Fit:</strong> Choose based on your target role and company culture
                  </li>
                  <li>
                    <strong>You Can Change:</strong> Switch templates anytime - your content stays the same
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}