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

    // Format feedback data
    const feedbackData = {
      type: feedbackType,
      from: name || 'Anonymous',
      email: email || 'Not provided',
      message: message,
      timestamp: new Date().toISOString()
    }

    console.log('📧 NEW FEEDBACK RECEIVED:')
    console.log(JSON.stringify(feedbackData, null, 2))

    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        const emailSubject = `Applya Feedback: ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}`
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              New ${feedbackType.toUpperCase()} from Applya
            </h2>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${feedbackType}</p>
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
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
        `

        const emailText = `
NEW ${feedbackType.toUpperCase()} FROM APPLYA

Type: ${feedbackType}
From: ${name}
Email: ${email}

Message:
${message}

---
Sent from Applya Feedback Form
        `.trim()

        const { data, error } = await resend.emails.send({
          from: 'Applya <onboarding@resend.dev>',
          to: ['mohammed@mindflow.agency'],
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        })

        if (error) {
          console.error('❌ Resend error:', error)
        } else {
          console.log('✅ Email sent successfully:', data?.id)
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured - email not sent')
    }

    return NextResponse.json({ 
      message: 'Feedback submitted successfully'
    })
    
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}