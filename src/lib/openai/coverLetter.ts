// This file should ONLY be imported by server-side code (API routes)
// DO NOT import this in any client components

export interface GenerateCoverLetterParams {
  resumeContent: string
  jobTitle: string
  companyName: string
  jobDescription: string
  applicantName: string
  applicantEmail?: string
  applicantPhone?: string
  applicantAddress?: string
  additionalHighlights?: string
  customRequests?: string
}

export interface GeneratedCoverLetter {
  content: string
  tone: string
}

export async function generateCoverLetter(
  params: GenerateCoverLetterParams
): Promise<GeneratedCoverLetter> {
  // Import OpenAI only when this function is called (server-side only)
  const OpenAI = (await import('openai')).default
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const {
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
  } = params

  const systemPrompt = `You are an expert cover letter writer specializing in professional, compelling cover letters that get interviews.

Your task is to write a personalized cover letter that:
1. Opens with a strong hook that shows genuine interest
2. Demonstrates understanding of the company and role
3. Highlights relevant achievements from the resume
4. Shows personality while maintaining professionalism
5. Creates a narrative connecting past experience to future contribution
6. Closes with a confident call to action

CRITICAL GUIDELINES:
- Keep it to 3-4 paragraphs maximum
- Use first person ("I", "my")
- Be specific - reference actual achievements and skills
- Show enthusiasm without being desperate
- Match the tone to the industry (professional but warm)
- Avoid clichés like "I am writing to express my interest"
- Include quantifiable achievements where possible
- Make it personal to this specific role and company

STRUCTURE:
Paragraph 1: Strong opening - Why this role excites you + brief intro
Paragraph 2-3: Your relevant experience and achievements (from resume)
Paragraph 4: Why you're a great fit + call to action

DO NOT:
- Repeat the resume word-for-word
- Use generic phrases
- Be overly formal or robotic
- Include lies or exaggerations
- Make it longer than one page`

  const userPrompt = `Write a compelling cover letter for this application:

ROLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

APPLICANT RESUME:
${resumeContent}

APPLICANT DETAILS:
Name: ${applicantName}
${applicantEmail ? `Email: ${applicantEmail}` : ''}
${applicantPhone ? `Phone: ${applicantPhone}` : ''}
${applicantAddress ? `Address: ${applicantAddress}` : ''}

${additionalHighlights ? `ADDITIONAL HIGHLIGHTS TO INCLUDE:\n${additionalHighlights}\n` : ''}

${customRequests ? `CUSTOM REQUESTS:\n${customRequests}\n` : ''}

Format the letter with proper spacing and paragraphs.
Include the applicant's contact details at the top in standard format.
Date the letter as: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

EXAMPLE FORMAT:
[Applicant Name]
[Email] | [Phone]
[Address if provided]

${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Dear Hiring Manager,

[Cover letter content...]

Sincerely,
[Applicant Name]

Return ONLY the cover letter following this format.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    const content = completion.choices[0]?.message?.content || ''

    return {
      content,
      tone: 'professional-warm',
    }
  } catch (error: any) {
    console.error('Cover letter generation error:', error)
    throw new Error(`Failed to generate cover letter: ${error.message}`)
  }
}

/**
 * Extract personal details from resume text
 * This is a pure function with no external dependencies - safe for client or server
 */
export function extractPersonalDetails(resumeText: string): {
  name: string
  email: string
  phone: string
  address: string
} {
  const details = {
    name: '',
    email: '',
    phone: '',
    address: '',
  }

  // Extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) {
    details.email = emailMatch[0]
  }

  // Extract phone (various formats)
  const phoneMatch = resumeText.match(/(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/)
  if (phoneMatch) {
    details.phone = phoneMatch[0]
  }

  // Extract name (first line or first capitalized words)
  const lines = resumeText.split('\n').filter(l => l.trim())
  if (lines.length > 0) {
    const firstLine = lines[0].trim()
    // Check if it looks like a name (2-4 capitalized words, not too long)
    if (firstLine.length < 50 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(firstLine)) {
      details.name = firstLine
    }
  }

  // Extract address (look for city, state, zip pattern)
  const addressMatch = resumeText.match(/([A-Z][a-z]+,?\s+[A-Z]{2}\s+\d{5}(-\d{4})?)/)
  if (addressMatch) {
    details.address = addressMatch[0]
  }

  return details
}