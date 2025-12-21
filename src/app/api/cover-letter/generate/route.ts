import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCoverLetter } from '@/lib/openai/coverLetter'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const {
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
    } = body

    // Validation
    if (!jobTitle || !companyName || !applicantName) {
      return NextResponse.json(
        { error: 'Job title, company name, and applicant name are required' },
        { status: 400 }
      )
    }

    // Generate cover letter
    const result = await generateCoverLetter({
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
    })

    // Save to database
    const { data: savedCoverLetter, error: saveError } = await supabase
      .from('generated_cover_letters')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone,
        applicant_address: applicantAddress,
        additional_highlights: additionalHighlights,
        custom_requests: customRequests,
        generated_content: result.content,
        template_used: 'template_1',
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving cover letter:', saveError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      content: result.content,
      coverLetterId: savedCoverLetter?.id,
    })
  } catch (error: any) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}