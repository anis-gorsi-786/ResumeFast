export interface GenerateInterviewQuestionsParams {
  resumeContent: string
  coverLetterContent: string
  jobTitle: string
  companyName: string
  jobDescription: string
}

export interface QuestionAnswer {
  question: string
  answer: string
  category: 'behavioral' | 'technical' | 'situational' | 'company-specific'
  tips: string[]
}

export interface GeneratedInterviewQuestions {
  questions: QuestionAnswer[]
  generalTips: string[]
}

export async function generateInterviewQuestions(
  params: GenerateInterviewQuestionsParams
): Promise<GeneratedInterviewQuestions> {
  const OpenAI = (await import('openai')).default
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const { resumeContent, coverLetterContent, jobTitle, companyName, jobDescription } = params

  const systemPrompt = `You are an expert interview coach and career advisor specializing in helping candidates prepare for job interviews.

Your task is to:
1. Analyze the job description, resume, and cover letter
2. Predict the most likely interview questions for this specific role
3. Provide strong, tailored answer frameworks for each question
4. Include a mix of behavioral, technical, and situational questions
5. Make answers specific to the candidate's experience

CRITICAL GUIDELINES:
- Generate 8-10 highly relevant questions
- Base answers on ACTUAL experiences from the resume
- Use the STAR method (Situation, Task, Action, Result) for behavioral questions
- Provide specific, actionable answer frameworks (not generic advice)
- Include questions about gaps, transitions, or unique aspects of their background
- Consider the company culture and role requirements
- Make answers authentic to the candidate's voice

QUESTION CATEGORIES:
- Behavioral (past experiences, soft skills)
- Technical (role-specific skills and knowledge)
- Situational (hypothetical scenarios)
- Company-specific (why this company, culture fit)

ANSWER FORMAT:
- Concise but complete (2-3 paragraphs)
- Specific examples from resume
- Quantifiable achievements where possible
- Show enthusiasm and cultural fit
- Address the core of what interviewer is looking for`

  const userPrompt = `Generate interview preparation for this job application:

ROLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeContent}

CANDIDATE'S COVER LETTER:
${coverLetterContent}

Generate 8-10 interview questions with detailed answer frameworks.

For each question, provide:
1. The exact question
2. A strong answer framework based on the candidate's actual experience
3. The category (behavioral/technical/situational/company-specific)
4. 2-3 tips for delivering the answer effectively

Also include 5 general interview tips specific to this role and company.

Return the response in this exact JSON format:
{
  "questions": [
    {
      "question": "Tell me about a time when...",
      "answer": "Detailed answer framework here using STAR method...",
      "category": "behavioral",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ],
  "generalTips": [
    "Research the company's recent projects",
    "Prepare questions about team structure",
    "..."
  ]
}

Return ONLY valid JSON, no other text.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      questions: parsed.questions || [],
      generalTips: parsed.generalTips || [],
    }
  } catch (error: any) {
    console.error('Interview questions generation error:', error)
    throw new Error(`Failed to generate interview questions: ${error.message}`)
  }
}