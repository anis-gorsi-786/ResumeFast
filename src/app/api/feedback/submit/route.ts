import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { feedbackType, name, email, message } = await request.json()

    // Validate
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('📧 Sending feedback email...')
    console.log('API Key present:', !!process.env.RESEND_API_KEY)

    // Import and initialize Resend INSIDE the function
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    console.log('From:', 'anisgorsi@tutamail.com')
    console.log('To:', 'mohammed@mindflow.agency')

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Applya Feedback <anisgorsi@tutamail.com>',
      to: ['mohammed@mindflow.agency'],
      subject: `Applya Feedback: ${feedbackType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            New ${feedbackType.toUpperCase()} from Applya
          </h2>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> ${feedbackType}</p>
            <p><strong>From:</strong> ${name || 'Anonymous'}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Message:</h3>
            <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Sent from Applya Feedback Form
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error }, { status: 500 })
    }

    console.log('✅ Email sent successfully!')
    console.log('Email ID:', data?.id)

    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('❌ Feedback submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}