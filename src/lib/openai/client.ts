import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerateResumeParams {
  baseResume: string
  jobDescription: string
  customRequests?: string
  template: string
  lockedSections?: string[]
}

export interface GeneratedResume {
  content: string
  keywords: string[]
  matchedKeywords: string[]
  atsScore: number
  originalMatchedKeywords: string[]
  originalAtsScore: number
}

export async function generateCustomizedResume(
  params: GenerateResumeParams
): Promise<GeneratedResume> {
  const { baseResume, jobDescription, customRequests, template, lockedSections = [] } = params

  // Extract keywords from job description
  const keywords = await extractKeywords(jobDescription)

  // Calculate ORIGINAL resume match (before generation)
  const originalMatchedKeywords = calculateKeywordMatch(baseResume, keywords)
  const originalAtsScore = Math.round((originalMatchedKeywords.length / keywords.length) * 100)

  // Build locked sections instruction
  let lockedSectionsInstruction = ''
  if (lockedSections.length > 0) {
    lockedSectionsInstruction = `\n\nCRITICAL - LOCKED SECTIONS:
The following sections are LOCKED and must NOT be modified:
${lockedSections.map(s => `- ${s}`).join('\n')}

For locked sections:
- Keep the exact wording
- Keep all dates, companies, titles exactly as written
- DO NOT rewrite, rephrase, or reorganize
- You may reorder locked sections relative to unlocked sections
- You may emphasize locked sections by placing them prominently

For UNLOCKED sections only:
- Optimize wording for keywords
- Rewrite for ATS compatibility
- Add emphasis and achievements`
  }

  // Build the prompt
const systemPrompt = `You are an expert resume writer specializing in ATS-optimized resumes. 
Your PRIMARY GOAL is to maximize keyword matching while maintaining truthfulness.

TEMPLATE FORMAT - CRITICAL:
${template === 'template_1' ? `
Use this exact structure (Template 1 - Clean Professional):

FIRST NAME LAST NAME
City, State | Phone: +XX XXXX XXX XXX | Email: email@email.com | LinkedIn: linkedin.com/in/username

PROFESSIONAL SUMMARY
[2-3 sentences targeting the specific role and key achievements]

EDUCATION
[Degree] - [Field]
University Name | Start Year - End Year
- Key achievements or projects

PROFESSIONAL EXPERIENCE
Job Title
Company Name | Location | MM/YYYY - Present/End Date
- Key responsibility or achievement (start with action verb)
- Another key accomplishment (quantify when possible)
- Example of impact or improvement
- Additional relevant task or role

TECHNICAL SKILLS
- Category: [Specific skills and tools]
- Category: [Specific skills and tools]

VOLUNTEERING & MEMBERSHIPS
- Role - Organization Name | Year
` : `
Use this exact structure (Template 2 - Modern Executive):

FIRST NAME LAST NAME
City, State | Phone: +XX XXXX XXX XXX | Email: email@email.com | LinkedIn: linkedin.com/in/username

PROFESSIONAL PROFILE
[2-3 sentences showing dedication and key strengths relevant to target role]

KEY CAPABILITIES
- Skill or area of expertise: Brief explanation of strength or capability
- Another skill: Brief explanation of proficiency
- Problem-solving area: Summary of excellence area
- Customer/stakeholder focus: Approach to outcomes

CAREER SUMMARY
(Job Title) - Company Name | Location | Year - Year

QUALIFICATION
- Bachelor Degree (or Certification)

PROFESSIONAL DEVELOPMENT
- [Certification / Training] | Issuing Organization | Year

RECENT PROFESSIONAL EXPERIENCE
(Job Title)
Company Name | Location | Month YYYY - Present
- Key responsibility: Primary duty description
- Special achievement: Highlighting example of success or impact
- Problem solving: Resolving issue or implementing improvement
- Process improvement: Success in efficiency or procedure
- Clear & effective communication: Interacting with clients or colleagues
- Technical expertise: Demonstrating specific skills relevant to role

REFERENCES
Available upon request
`}

FORMATTING RULES - VERY IMPORTANT:
- DO NOT use asterisks (*) for any formatting
- DO NOT use markdown bold (**text**)
- Use ALL CAPS for section headers exactly as shown in template
- Use plain text only
- Use bullet points with "•" character
- Keep exact section names from template
- Follow template structure precisely
- Use proper spacing between sections

${lockedSectionsInstruction}

KEYWORD OPTIMIZATION STRATEGY (for unlocked sections only):
- Incorporate ALL missing keywords naturally
- Reword achievements to include target keywords
- Use exact terminology from job description
- Include keyword variations
- Emphasize relevant experiences

FORBIDDEN:
- Do NOT deviate from template structure
- Do NOT add or remove sections from template
- Do NOT use asterisks, markdown, or special formatting
- Do NOT modify locked sections
- Do NOT fabricate information

TARGET: Achieve 80%+ keyword match while maintaining resume authenticity and following template structure exactly.`

  const userPrompt = `BASE RESUME:
${baseResume}

JOB DESCRIPTION:
${jobDescription}

${customRequests ? `CUSTOM REQUESTS:\n${customRequests}\n` : ''}

KEY REQUIREMENTS FROM JOB:
${keywords.join(', ')}

CURRENT KEYWORD MATCH: ${originalAtsScore}% (${originalMatchedKeywords.length}/${keywords.length} keywords)
TARGET MATCH: 80%+ 

MISSING KEYWORDS TO INCORPORATE:
${keywords.filter(k => !originalMatchedKeywords.includes(k)).join(', ')}

OPTIMIZATION PRIORITY:
1. Include EVERY relevant keyword from the missing list above
2. Rewrite experience bullets to naturally include these terms
3. Update the professional summary to include key technical terms
4. Emphasize transferable skills that match the requirements
5. Use exact keyword phrases when possible (e.g., "IT Service Level Agreement" not "SLA")

Please generate a customized version of this resume that:
1. Emphasizes relevant experience for this specific role
2. Incorporates keywords from the job description naturally
3. Reorders sections to highlight most relevant qualifications first
4. Maintains all factual accuracy
5. Uses the ${template === 'template_1' ? 'Clean Professional' : 'Modern Executive'} format

Return ONLY the customized resume text, no explanations or meta-commentary.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    // Calculate NEW resume match (after generation)
    const newMatchedKeywords = calculateKeywordMatch(generatedContent, keywords)
    const newAtsScore = Math.round((newMatchedKeywords.length / keywords.length) * 100)

    return {
      content: generatedContent,
      keywords,
      matchedKeywords: newMatchedKeywords,
      atsScore: newAtsScore,
      // Add original scores for comparison
      originalMatchedKeywords,
      originalAtsScore,
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    throw new Error(`Failed to generate resume: ${error.message}`)
  }
}

async function extractKeywords(jobDescription: string): Promise<string[]> {
  const prompt = `Extract the most important keywords and required skills from this job description. 
Focus on:
- Technical skills
- Required qualifications
- Key responsibilities
- Industry-specific terms
- Certifications or tools mentioned

Return ONLY a comma-separated list of keywords, nothing else.

JOB DESCRIPTION:
${jobDescription}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    })

    const keywordsText = completion.choices[0]?.message?.content || ''
    
    // Parse and clean keywords
    const keywords = keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && k.length < 50) // Remove empty and too long
      .slice(0, 30) // Limit to 30 keywords

    return keywords
  } catch (error: any) {
    console.error('Keyword extraction error:', error)
    // Fallback: simple keyword extraction
    return simpleKeywordExtraction(jobDescription)
  }
}

function simpleKeywordExtraction(text: string): string[] {
  // Fallback: extract capitalized words and common tech terms
  const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  const techTerms = text.match(/\b(?:JavaScript|Python|React|AWS|SQL|API|Git|Docker|Azure|Node\.js|TypeScript|CSS|HTML)\b/gi) || []
  
  const combined = [...new Set([...words, ...techTerms])]
  return combined.slice(0, 20)
}

function calculateKeywordMatch(text: string, keywords: string[]): string[] {
  const normalizedText = text.toLowerCase()
  
  return keywords.filter(keyword => {
    const normalizedKeyword = keyword.toLowerCase().trim()
    
    // Check for exact match
    if (normalizedText.includes(normalizedKeyword)) {
      return true
    }
    
    // Check for partial matches (for multi-word keywords)
    const keywordParts = normalizedKeyword.split(/\s+/)
    if (keywordParts.length > 1) {
      // If it's a multi-word keyword, check if most words are present
      const matchedParts = keywordParts.filter(part => 
        part.length > 2 && normalizedText.includes(part)
      )
      return matchedParts.length >= Math.ceil(keywordParts.length / 2)
    }
    
    // Check for word boundaries (avoid substring matches like "IT" in "with")
    const regex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return regex.test(text)
  })
}

export { openai }