import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCustomizedResume } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for generation

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { jobTitle, companyName, jobDescription, customRequests } = body

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    // Get user's resume and template
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('resume_text, selected_template')
      .eq('user_id', user.id)
      .single()

    if (prefsError || !prefs?.resume_text) {
      return NextResponse.json(
        { error: 'No resume found. Please upload your resume first.' },
        { status: 400 }
      )
    }

    // Generate customized resume
    const result = await generateCustomizedResume({
      baseResume: prefs.resume_text,
      jobDescription,
      customRequests,
      template: prefs.selected_template || 'template_1',
    })

    // Save to database
    const { data: savedResume, error: saveError } = await supabase
  .from('generated_resumes')
  .insert({
    user_id: user.id,
    job_title: jobTitle,
    company_name: companyName,
    job_description: jobDescription,
    custom_requests: customRequests,
    generated_content: result.content,
    keywords_matched: {
      all: result.keywords,
      matched: result.matchedKeywords,
      original: result.originalMatchedKeywords,
      originalScore: result.originalAtsScore,
    },
    ats_score: result.atsScore,
    template_used: prefs.selected_template || 'template_1',
  })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving generated resume:', saveError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
  content: result.content,
  keywords: result.keywords,
  matchedKeywords: result.matchedKeywords,
  atsScore: result.atsScore,
  originalMatchedKeywords: result.originalMatchedKeywords,
  originalAtsScore: result.originalAtsScore,
  generatedId: savedResume?.id,
})
  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    )
  }
}