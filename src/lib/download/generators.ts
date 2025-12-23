import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface ResumeData {
  content: string
  template: string
  jobTitle?: string
  companyName?: string
}

/**
 * Generate PDF from resume text
 */
export async function generatePDF(data: ResumeData): Promise<Blob> {
  const { content, template } = data

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  pdf.setFont('helvetica')

  // Clean the content - remove asterisks and markdown
  const cleanedContent = content
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '')   // Remove asterisks
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .trim()

  const lines = cleanedContent.split('\n')
  let y = 20
  const lineHeight = 6
  const maxWidth = 170
  const leftMargin = 20

  lines.forEach((line) => {
    if (y > 280) {
      pdf.addPage()
      y = 20
    }

    if (!line.trim()) {
      y += lineHeight / 2
      return
    }

    // Detect headers (ALL CAPS lines)
    const isHeader = line === line.toUpperCase() && 
                     line.length < 100 && 
                     line.trim().length > 0 &&
                     !line.includes('•') &&
                     !line.includes('-')
    
    const isBullet = line.trim().startsWith('•') || 
                     line.trim().startsWith('-') ||
                     line.trim().match(/^[\d]+\./)

    if (isHeader) {
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text(line.trim(), leftMargin, y)
      y += lineHeight + 3
    } else if (isBullet) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const bulletText = line.trim().replace(/^[•\-]\s*/, '  • ')
      const splitLine = pdf.splitTextToSize(bulletText, maxWidth - 5)
      splitLine.forEach((subLine: string) => {
        if (y > 280) {
          pdf.addPage()
          y = 20
        }
        pdf.text(subLine, leftMargin + 2, y)
        y += lineHeight
      })
    } else {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const splitLine = pdf.splitTextToSize(line.trim(), maxWidth)
      splitLine.forEach((subLine: string) => {
        if (y > 280) {
          pdf.addPage()
          y = 20
        }
        pdf.text(subLine, leftMargin, y)
        y += lineHeight
      })
    }
  })

  return pdf.output('blob')
}

/**
 * Generate DOCX from resume text
 */
export async function generateDOCX(data: ResumeData): Promise<Blob> {
  const { content } = data

  // Clean the content - remove asterisks and markdown
  const cleanedContent = content
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .trim()

  const lines = cleanedContent.split('\n')
  const paragraphs: Paragraph[] = []

  lines.forEach((line) => {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: '' }))
      return
    }

    const isHeader = line === line.toUpperCase() && 
                     line.length < 100 && 
                     line.trim().length > 0 &&
                     !line.includes('•') &&
                     !line.includes('-')
    
    const isBullet = line.trim().startsWith('•') || 
                     line.trim().startsWith('-') ||
                     line.trim().match(/^[\d]+\./)

    if (isHeader) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 240, after: 120 },
        })
      )
    } else if (isBullet) {
      const bulletText = line.trim().replace(/^[•\-]\s*/, '')
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletText,
              size: 22,
            }),
          ],
          spacing: { before: 60, after: 60 },
          indent: { left: 360 },
          bullet: { level: 0 },
        })
      )
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22,
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      )
    }
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  return blob
}

/**
 * Trigger file download in browser
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename based on job details
 */
export function generateFilename(
  jobTitle?: string,
  companyName?: string,
  extension: 'pdf' | 'docx' = 'pdf'
): string {
  const parts: string[] = ['Resume']

  if (jobTitle) {
    parts.push(jobTitle.replace(/[^a-zA-Z0-9]/g, '_'))
  }

  if (companyName) {
    parts.push(companyName.replace(/[^a-zA-Z0-9]/g, '_'))
  }

  const date = new Date().toISOString().split('T')[0]
  parts.push(date)

  return `${parts.join('_')}.${extension}`
}