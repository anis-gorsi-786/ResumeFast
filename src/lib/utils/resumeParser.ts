export interface ResumeSection {
  title: string
  content: string
  startLine: number
  endLine: number
}

export function parseResumeSections(resumeText: string): ResumeSection[] {
  const lines = resumeText.split('\n')
  const sections: ResumeSection[] = []
  
  let currentSection: ResumeSection | null = null
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // Detect section headers (ALL CAPS, short, not a bullet)
    const isHeader = 
      trimmed === trimmed.toUpperCase() && 
      trimmed.length > 2 && 
      trimmed.length < 50 &&
      !trimmed.includes('•') &&
      !trimmed.includes('-') &&
      !trimmed.match(/^\d/)
    
    if (isHeader) {
      // Save previous section
      if (currentSection) {
        currentSection.endLine = index - 1
        sections.push(currentSection)
      }
      
      // Start new section
      currentSection = {
        title: trimmed,
        content: '',
        startLine: index,
        endLine: index,
      }
    } else if (currentSection) {
      // Add to current section
      currentSection.content += line + '\n'
    }
  })
  
  // Save last section
  if (currentSection) {
    currentSection.endLine = lines.length - 1
    sections.push(currentSection)
  }
  
  return sections
}

export function getSectionContent(resumeText: string, section: ResumeSection): string {
  const lines = resumeText.split('\n')
  return lines.slice(section.startLine, section.endLine + 1).join('\n')
}

export function normalizeSectionTitle(title: string): string {
  // Normalize common variations
  const normalized = title.toUpperCase().trim()
  
  // Map variations to standard names
  const mappings: { [key: string]: string } = {
    'WORK EXPERIENCE': 'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE': 'EXPERIENCE',
    'EMPLOYMENT HISTORY': 'EXPERIENCE',
    'WORK HISTORY': 'EXPERIENCE',
    'EDUCATIONAL BACKGROUND': 'EDUCATION',
    'ACADEMIC BACKGROUND': 'EDUCATION',
    'SKILLS & EXPERTISE': 'SKILLS',
    'TECHNICAL SKILLS': 'SKILLS',
    'CORE COMPETENCIES': 'SKILLS',
  }
  
  return mappings[normalized] || normalized
}