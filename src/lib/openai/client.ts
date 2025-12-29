import OpenAI from 'openai'
import { getTemplateSkeleton } from '@/lib/templates/skeletons'

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
    lockedSectionsInstruction = `\n\n━━━ CRITICAL - LOCKED SECTIONS - DO NOT MODIFY ━━━
The following sections are LOCKED. You MUST copy them EXACTLY word-for-word from the base resume:

${lockedSections.map(s => `🔒 ${s}`).join('\n')}

RULES FOR LOCKED SECTIONS:
✗ DO NOT change ANY words, phrases, or sentences
✗ DO NOT rewrite, paraphrase, or "improve" the text
✗ DO NOT modify dates, company names, job titles, or achievements
✗ DO NOT add or remove bullet points
✗ DO NOT change the order of content within the section
✓ You MAY reorder where locked sections appear in the final resume
✓ Copy the section EXACTLY as it appears in the BASE RESUME above

RULES FOR UNLOCKED SECTIONS:
✓ Optimize wording for keywords from job description
✓ Rewrite for ATS compatibility
✓ Add emphasis and quantified achievements
✓ Incorporate missing keywords naturally

VERIFICATION STEP (REQUIRED):
Before returning the final resume, verify that each locked section appears EXACTLY as written in the base resume. If you changed even one word, you FAILED.`
  }

  // Get the template skeleton
  const templateSkeleton = getTemplateSkeleton(template)

  const systemPrompt = `You are an expert resume writer specializing in ATS-optimized resumes.

YOUR TASK:
You will receive a TEMPLATE with [PLACEHOLDERS] and a BASE RESUME with content.
You must fill in the placeholders with content from the base resume, optimized for the job description.

TEMPLATE TO USE (COPY THIS EXACT STRUCTURE):
${templateSkeleton}

CRITICAL RULES:
1. COPY the template structure EXACTLY - every line, every space, every format
2. REPLACE [PLACEHOLDERS] with actual content from the base resume
3. DO NOT add extra lines, sections, or formatting
4. DO NOT use asterisks (*), markdown (**), or special characters
5. Use "•" for bullet points (already in template)
6. Headers are already in ALL CAPS (keep them)
7. If base resume has more jobs than template slots, include the most relevant ones
8. If base resume has fewer items, leave those placeholder sections out

${lockedSectionsInstruction}

PLACEHOLDER FILLING STRATEGY:
- [FIRST_NAME] [LAST_NAME]: Extract from base resume
- [PROFESSIONAL_SUMMARY_PARAGRAPH]: Write 2-3 sentences targeting the job, incorporating keywords
- [JOB_TITLE_1], [COMPANY_NAME_1], etc.: Copy exactly from base resume
- [RESPONSIBILITY_1], [RESPONSIBILITY_2], etc.: Rewrite base resume bullets to include job keywords
- [SKILL_CATEGORY_1]: Group related skills (e.g., "Systems & Administration", "Programming")
- [SKILLS_LIST_1]: Comma-separated list of relevant skills

KEYWORD OPTIMIZATION:
- Incorporate missing keywords naturally into responsibilities
- Update professional summary/profile with key terms
- Emphasize transferable skills matching job requirements
- Use exact phrases from job description when possible

OUTPUT FORMAT:
Return ONLY the filled template - no explanations, no preambles, no markdown code blocks.
The output should look exactly like the template structure above, just with placeholders replaced.`

  const userPrompt = `BASE RESUME:
${baseResume}

JOB DESCRIPTION:
${jobDescription}

${customRequests ? `CUSTOM REQUESTS:\n${customRequests}\n` : ''}

KEYWORD ANALYSIS:
- Total Keywords: ${keywords.length}
- Currently Matched: ${originalMatchedKeywords.length} (${originalAtsScore}%)
- Missing Keywords: ${keywords.filter(k => !originalMatchedKeywords.includes(k)).join(', ')}
- Target Score: 80%+

INSTRUCTIONS:
1. Take the TEMPLATE structure from the system prompt
2. Fill in EVERY placeholder using content from the BASE RESUME above
3. Optimize bullets and summary to include MISSING KEYWORDS
4. Ensure the output matches the template format EXACTLY
5. Return ONLY the completed resume - no other text

${lockedSections.length > 0 ? `
LOCKED SECTIONS REMINDER:
For these sections, copy content EXACTLY from base resume:
${lockedSections.map(s => `- ${s}`).join('\n')}
` : ''}

Begin generating the resume now.`

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