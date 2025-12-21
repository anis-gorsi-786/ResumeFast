import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contactInfo, professionalSummary, workExperience, education, skills } = body

    // Upsert user preferences
    const { error: saveError } = await supabase
  .from('user_preferences')
  .upsert(
    {
      user_id: user.id,
      contact_info: contactInfo,
      professional_summary: professionalSummary,
      work_experience: workExperience,
      education: education,
      skills: { list: skills },
      resume_uploaded: false,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

    if (saveError) {
      console.error('Save error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Profile saved successfully' })
  } catch (error) {
    console.error('Profile save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}