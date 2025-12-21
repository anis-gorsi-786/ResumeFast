'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { templates, type ResumeTemplate } from '@/lib/templates'
import { Check, ArrowLeft, Loader2 } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template_1')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentTemplate()
  }, [])

  const loadCurrentTemplate = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('selected_template')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setSelectedTemplate(data.selected_template || 'template_1')
      }
    } catch (err) {
      console.error('Error loading template:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          selected_template: selectedTemplate,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Success! Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save template selection')
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Choose Resume Template</h1>
          </div>
          <Button onClick={handleSaveTemplate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Selection'
            )}
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Select Your Resume Format</h2>
          <p className="text-gray-600">
            Choose the template that best matches your industry and style preferences
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Template Tips</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>ATS Optimization:</strong> Both templates are ATS-friendly, but Template 1 has maximum compatibility</li>
            <li>• <strong>Industry Match:</strong> Choose based on your target industry's formality level</li>
            <li>• <strong>Change Anytime:</strong> You can switch templates whenever you want</li>
            <li>• <strong>Content First:</strong> The template only affects formatting - your content stays the same</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveTemplate} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

interface TemplateCardProps {
  template: ResumeTemplate
  isSelected: boolean
  onSelect: () => void
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-600 shadow-lg' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {template.name}
              {isSelected && (
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-normal">
                  Selected
                </span>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{template.description}</CardDescription>
          </div>
          {isSelected && <Check className="h-6 w-6 text-blue-600 flex-shrink-0" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Template Preview */}
        <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <p className="text-sm font-medium mb-1">Preview Coming Soon</p>
            <p className="text-xs">Visual preview of {template.name}</p>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Features:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {template.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Best For */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Best for:</h4>
          <div className="flex flex-wrap gap-2">
            {template.bestFor.slice(0, 3).map((use, idx) => (
              <span 
                key={idx}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                {use}
              </span>
            ))}
          </div>
        </div>

        <Button 
          variant={isSelected ? 'default' : 'outline'}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          {isSelected ? (
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
  )
}