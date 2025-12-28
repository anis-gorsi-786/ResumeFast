export interface ResumeTemplate {
  id: string
  name: string
  description: string
  features: string[]
  bestFor: string[]
  preview: string
}

export const templates: ResumeTemplate[] = [
  {
    id: 'template_1',
    name: 'Clean Professional',
    description: 'Classic, ATS-friendly format perfect for corporate roles',
    features: [
      'Single-column layout',
      'Clean typography',
      'Maximum ATS compatibility',
      'Professional appearance'
    ],
    bestFor: [
      'Entry to mid-level positions',
      'Corporate environments',
      'ATS-heavy companies'
    ],
    preview: '/templates/template-1-preview.png'
  },
  {
    id: 'template_2',
    name: 'Modern Executive',
    description: 'Bold, modern design for senior positions',
    features: [
      'Two-column layout',
      'Professional color accents',
      'Skills bar visualization',
      'Modern typography'
    ],
    bestFor: [
      'Senior positions',
      'Creative industries',
      'Stand-out applications'
    ],
    preview: '/templates/template-2-preview.png'
  }
]

export function getTemplateById(id: string): ResumeTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function getDefaultTemplate(): ResumeTemplate {
  return templates[0]
}