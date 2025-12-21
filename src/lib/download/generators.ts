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

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Set font
  pdf.setFont('helvetica')

  // Parse content and add to PDF
  const lines = content.split('\n')
  let y = 20 // Starting Y position
  const lineHeight = 6
  const maxWidth = 170
  const leftMargin = 20

  lines.forEach((line) => {
    // Check if we need a new page
    if (y > 280) {
      pdf.addPage()
      y = 20
    }

    if (!line.trim()) {
      y += lineHeight / 2 // Half line for blank lines
      return
    }

    // Detect headers (ALL CAPS or starts with numbers/bullets)
    const isHeader = line === line.toUpperCase() && line.length < 100
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')

    if (isHeader) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(line.trim(), leftMargin, y)
      y += lineHeight + 2
    } else {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      // Handle long lines with word wrap
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

  const lines = content.split('\n')
  const paragraphs: Paragraph[] = []

  lines.forEach((line) => {
    if (!line.trim()) {
      // Empty line
      paragraphs.push(new Paragraph({ text: '' }))
      return
    }

    // Detect headers (ALL CAPS)
    const isHeader = line === line.toUpperCase() && line.length < 100
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')

    if (isHeader) {
      // Section header
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              bold: true,
              size: 24, // 12pt
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )
    } else if (isBullet) {
      // Bullet point
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22, // 11pt
            }),
          ],
          spacing: { before: 50, after: 50 },
          indent: { left: 360 },
        })
      )
    } else {
      // Regular text
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22, // 11pt
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
              top: 720, // 0.5 inch
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