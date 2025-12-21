import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateInterviewQuestions } from '@/lib/openai/interviewQuestions'

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
    const { coverLetterId } = body

    if (!coverLetterId) {
      return NextResponse.json(
        { error: 'Cover letter ID is required' },
        { status: 400 }
      )
    }

    // Get cover letter data
    const { data: coverLetter, error: clError } = await supabase
      .from('generated_cover_letters')
      .select('*')
      .eq('id', coverLetterId)
      .eq('user_id', user.id)
      .single()

    if (clError || !coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      )
    }

    // Get resume data
    const { data: resume, error: resumeError } = await supabase
      .from('generated_resumes')
      .select('*')
      .eq('id', coverLetter.resume_id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Generate interview questions
    const result = await generateInterviewQuestions({
      resumeContent: resume.generated_content,
      coverLetterContent: coverLetter.generated_content,
      jobTitle: coverLetter.job_title,
      companyName: coverLetter.company_name,
      jobDescription: coverLetter.job_description || resume.job_description,
    })

    // Save to database
    const { data: savedQuestions, error: saveError } = await supabase
      .from('interview_questions')
      .insert({
        user_id: user.id,
        resume_id: resume.id,
        cover_letter_id: coverLetter.id,
        job_title: coverLetter.job_title,
        company_name: coverLetter.company_name,
        questions_and_answers: result.questions,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving interview questions:', saveError)
    }

    return NextResponse.json({
      questions: result.questions,
      generalTips: result.generalTips,
      interviewPrepId: savedQuestions?.id,
    })
  } catch (error: any) {
    console.error('Interview questions generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview questions' },
      { status: 500 }
    )
  }
}