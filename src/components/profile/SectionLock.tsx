'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Lock, Unlock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseResumeSections, normalizeSectionTitle } from '@/lib/utils/resumeParser'

export function SectionLock({ resumeText }: { resumeText: string }) {
  const [sections, setSections] = useState<Array<{ title: string; locked: boolean }>>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSections()
  }, [resumeText])

  const loadSections = async () => {
    if (!resumeText) return

    // Parse sections from resume
    const parsedSections = parseResumeSections(resumeText)
    
    // Get locked sections from database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data } = await supabase
      .from('user_preferences')
      .select('locked_sections')
      .eq('user_id', user.id)
      .single()

    const lockedSections = (data?.locked_sections || []) as string[]

    // Combine
    const sectionsWithLockStatus = parsedSections.map(section => ({
      title: section.title,
      locked: lockedSections.includes(normalizeSectionTitle(section.title)),
    }))

    setSections(sectionsWithLockStatus)
  }

  const toggleSection = (title: string) => {
    setSections(prev =>
      prev.map(section =>
        section.title === title
          ? { ...section, locked: !section.locked }
          : section
      )
    )
    setSaved(false)
  }

  const saveLocks = async () => {
    setSaving(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const lockedSections = sections
        .filter(s => s.locked)
        .map(s => normalizeSectionTitle(s.title))

      const { error } = await supabase
        .from('user_preferences')
        .update({ locked_sections: lockedSections })
        .eq('user_id', user.id)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving locks:', error)
      alert('Failed to save section locks')
    } finally {
      setSaving(false)
    }
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lock Resume Sections</CardTitle>
          <CardDescription>
            Upload a resume first to lock sections
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Lock Resume Sections
        </CardTitle>
        <CardDescription>
          Prevent AI from modifying specific sections of your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What does locking do?</p>
              <p>
                Locked sections will be included in your resume exactly as written. 
                AI can still reorder or emphasize content, but won't change the wording.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`flex items-center justify-between p-4 rounded-lg border transition ${
                section.locked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {section.locked ? (
                  <Lock className="h-4 w-4 text-green-600" />
                ) : (
                  <Unlock className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <Label htmlFor={section.title} className="cursor-pointer">
                    {section.title}
                  </Label>
                  {section.locked && (
                    <p className="text-xs text-green-700 mt-1">
                      AI won't modify this section
                    </p>
                  )}
                </div>
              </div>
              <Switch
                id={section.title}
                checked={section.locked}
                onCheckedChange={() => toggleSection(section.title)}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={saveLocks}
            disabled={saving || saved}
            className="flex-1"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Lock Settings'}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            💡 Tip: Lock your Education and Work History to keep them exactly as written. 
            Let AI optimize your Skills and Summary sections.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}