export interface ResumeTemplate {
  id: string
  name: string
  description: string
  preview: string
  features: string[]
  bestFor: string[]
}

export const templates: ResumeTemplate[] = [
  {
    id: 'template_1',
    name: 'Clean Professional',
    description: 'Single-column ATS-optimized format with clear section headers',
    preview: '/templates/template-1-preview.png', // We'll add this image later
    features: [
      'Single column layout (maximum ATS compatibility)',
      'ALL CAPS section headers',
      'Bullet points for achievements',
      'Clean, readable fonts',
      'No tables or graphics',
      'Right-aligned dates'
    ],
    bestFor: [
      'IT & Technical roles',
      'Corporate positions',
      'Government applications',
      'Conservative industries',
      'ATS-heavy companies'
    ]
  },
  {
    id: 'template_2',
    name: 'Modern Executive',
    description: 'Professional two-column format with visual hierarchy',
    preview: '/templates/template-2-preview.png', // Will add tomorrow
    features: [
      'Two-column layout',
      'Skills sidebar',
      'Modern typography',
      'Visual section dividers',
      'Professional color accents',
      'Compact yet readable'
    ],
    bestFor: [
      'Creative industries',
      'Startups & tech companies',
      'Senior positions',
      'Design-conscious roles',
      'Portfolio-heavy careers'
    ]
  }
]

export function getTemplateById(id: string): ResumeTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function getDefaultTemplate(): ResumeTemplate {
  return templates[0]
}