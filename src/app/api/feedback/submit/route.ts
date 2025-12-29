import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { feedbackType, name, email, message } = await request.json()

    // Format email content
    const emailContent = `
NEW FEEDBACK FROM APPLYA

Type: ${feedbackType.toUpperCase()}
From: ${name}
Email: ${email}

Message:
${message}

---
Sent from Applya Feedback Form
    `.trim()

    // Send email using Resend (you'll need to set this up)
    // For now, we'll use a simple email service or just log it
    
    // TODO: Replace with actual email service (Resend, SendGrid, etc.)
    console.log('📧 FEEDBACK RECEIVED:')
    console.log(emailContent)

    // You can use Resend, SendGrid, or nodemailer here
    // Example with Resend:
    /*
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'feedback@applya.io',
      to: 'mohammed@mindflow.agency',
      subject: `Applya Feedback: ${feedbackType}`,
      text: emailContent,
    })
    */

    return NextResponse.json({ message: 'Feedback submitted successfully' })
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}