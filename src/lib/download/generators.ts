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
 * Using Helvetica (closest to Calibri in jsPDF) with all black text
 */
export async function generatePDF(data: ResumeData): Promise<Blob> {
  const { content, template } = data

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Use Helvetica (closest to Calibri available in jsPDF)
  pdf.setFont('helvetica')

  // All text should be BLACK
  const colors = {
    primary: [0, 0, 0],      // Black for headers
    secondary: [0, 0, 0],    // Black for subheaders  
    text: [0, 0, 0],         // Black for text
    link: [0, 0, 255]        // Blue for hyperlinks (if any)
  }

  const lines = content.split('\n')
  let y = 20
  const lineHeight = 6
  const maxWidth = 170
  const leftMargin = 20
  const pageWidth = 210

  let isFirstLine = true
  let lastWasHeader = false

  lines.forEach((line, index) => {
    // Page break check
    if (y > 280) {
      pdf.addPage()
      y = 20
    }

    if (!line.trim()) {
      y += lineHeight / 2
      return
    }

    const trimmed = line.trim()

    // 1. DETECT NAME (first line - centered, large, bold, BLACK)
    if (isFirstLine && trimmed.length > 0 && trimmed.length < 50) {
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      
      const textWidth = pdf.getTextWidth(trimmed)
      const centerX = (pageWidth - textWidth) / 2
      pdf.text(trimmed, centerX, y)
      
      y += lineHeight + 2
      isFirstLine = false
      return
    }

    // 2. DETECT CONTACT LINE (second line - centered, smaller, BLACK)
    if (index === 1 && trimmed.includes('|')) {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
      
      const textWidth = pdf.getTextWidth(trimmed)
      const centerX = (pageWidth - textWidth) / 2
      pdf.text(trimmed, centerX, y)
      
      // Add horizontal line under header (BLACK)
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
      pdf.setLineWidth(0.5)
      pdf.line(leftMargin, y + 3, pageWidth - leftMargin, y + 3)
      
      y += lineHeight + 5
      return
    }

    // 3. DETECT SECTION HEADERS (ALL CAPS, short)
    const isHeader = trimmed === trimmed.toUpperCase() && 
                     trimmed.length > 2 && 
                     trimmed.length < 60 &&
                     !trimmed.includes('•') &&
                     !trimmed.includes('-') &&
                     !trimmed.startsWith('(')

    if (isHeader) {
      y += 2 // Extra space before header
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      pdf.text(trimmed, leftMargin, y)
      
      // Underline section headers (BLACK)
      const headerWidth = pdf.getTextWidth(trimmed)
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
      pdf.setLineWidth(0.3)
      pdf.line(leftMargin, y + 1, leftMargin + headerWidth, y + 1)
      
      y += lineHeight + 2
      lastWasHeader = true
      return
    }

    // 4. DETECT JOB TITLES / SUBHEADERS (contains company/location patterns OR in parentheses)
    const isSubheader = (
      (trimmed.includes('|') && !trimmed.includes('@')) || // Location pattern
      (trimmed.startsWith('(') && trimmed.includes(')')) || // Template 2 style
      (lastWasHeader && !trimmed.startsWith('•') && !trimmed.startsWith('-')) // First line after header
    )

    if (isSubheader) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
      
      const splitLine = pdf.splitTextToSize(trimmed, maxWidth)
      splitLine.forEach((subLine: string) => {
        if (y > 280) {
          pdf.addPage()
          y = 20
        }
        pdf.text(subLine, leftMargin, y)
        y += lineHeight
      })
      
      lastWasHeader = false
      return
    }

    // 5. DETECT BULLET POINTS
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-')

    if (isBullet) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      
      const bulletText = trimmed.replace(/^[•\-]\s*/, '  • ')
      const splitLine = pdf.splitTextToSize(bulletText, maxWidth - 5)
      
      splitLine.forEach((subLine: string) => {
        if (y > 280) {
          pdf.addPage()
          y = 20
        }
        pdf.text(subLine, leftMargin + 2, y)
        y += lineHeight
      })
      
      lastWasHeader = false
      return
    }

    // 6. REGULAR TEXT
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    
    const splitLine = pdf.splitTextToSize(trimmed, maxWidth)
    splitLine.forEach((subLine: string) => {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(subLine, leftMargin, y)
      y += lineHeight
    })
    
    lastWasHeader = false
  })

  return pdf.output('blob')
}

/**
 * Generate DOCX from resume text
 * Using Calibri font with all black text
 */
export async function generateDOCX(data: ResumeData): Promise<Blob> {
  const { content, template } = data

  // All text should be BLACK
  const colors = {
    primary: '000000',   // Black for headers
    secondary: '000000', // Black for subheaders
  }

  const lines = content.split('\n')
  const paragraphs: Paragraph[] = []

  let isFirstLine = true

  lines.forEach((line, index) => {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: '' }))
      return
    }

    const trimmed = line.trim()

    // 1. NAME (first line - centered, large, bold, BLACK, Calibri)
    if (isFirstLine && trimmed.length > 0 && trimmed.length < 50) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 36, // 18pt
              color: colors.primary,
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      )
      isFirstLine = false
      return
    }

    // 2. CONTACT LINE (second line - centered, BLACK, Calibri)
    if (index === 1 && trimmed.includes('|')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 20, // 10pt
              color: colors.secondary,
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          border: {
            bottom: {
              color: colors.primary,
              space: 1,
              size: 6,
              style: 'single',
            },
          },
        })
      )
      return
    }

    // 3. SECTION HEADERS (ALL CAPS - BLACK, bold, Calibri)
    const isHeader = trimmed === trimmed.toUpperCase() && 
                     trimmed.length > 2 && 
                     trimmed.length < 60 &&
                     !trimmed.includes('•') &&
                     !trimmed.includes('-') &&
                     !trimmed.startsWith('(')

    if (isHeader) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 26, // 13pt
              color: colors.primary,
              font: 'Calibri',
            }),
          ],
          spacing: { before: 240, after: 120 },
          border: {
            bottom: {
              color: colors.primary,
              space: 1,
              size: 3,
              style: 'single',
            },
          },
        })
      )
      return
    }

    // 4. SUBHEADERS (job titles, companies - BLACK, bold, Calibri)
    const isSubheader = (
      (trimmed.includes('|') && !trimmed.includes('@')) ||
      (trimmed.startsWith('(') && trimmed.includes(')'))
    )

    if (isSubheader) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 22, // 11pt
              color: colors.secondary,
              font: 'Calibri',
            }),
          ],
          spacing: { before: 120, after: 60 },
        })
      )
      return
    }

    // 5. BULLET POINTS (BLACK, normal, Calibri)
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-')

    if (isBullet) {
      const bulletText = trimmed.replace(/^[•\-]\s*/, '')
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletText,
              size: 22,
              font: 'Calibri',
            }),
          ],
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          indent: { left: 360 },
        })
      )
      return
    }

    // 6. REGULAR TEXT (BLACK, normal, Calibri)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 22,
            font: 'Calibri',
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    )
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