import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    
    // Accept both .docx and .doc (OpenDocument)
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text'
    ]
    
    const validExtensions = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')
    
    if (!validTypes.includes(fileType) && !validExtensions) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text based on file type
    let extractedText = ''
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, use pdf-parse
      const pdfParse = await import('pdf-parse')
      const pdfData = await pdfParse.default(buffer)
      extractedText = pdfData.text
    } else {
      // For DOCX/DOC files, use mammoth
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    }

    // Clean up extracted text
    extractedText = extractedText.trim()

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from file. Please try a different format or use manual entry.' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const storageFileName = `${user.id}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storageFileName, buffer, {
        contentType: fileType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(storageFileName)

    // Save to database
    const { data: resumeData, error: dbError } = await supabase
      .from('resume_uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileType,
        extracted_text: extractedText,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save resume data: ' + dbError.message },
        { status: 500 }
      )
    }

   // Update user preferences (upsert ensures only one record per user)
const { error: upsertError } = await supabase
  .from('user_preferences')
  .upsert(
    {
      user_id: user.id,
      resume_text: extractedText,
      resume_uploaded: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id', // This ensures we update if user_id already exists
    }
  )

if (upsertError) {
  console.error('Upsert error:', upsertError)
}

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      data: {
        id: resumeData.id,
        fileName: file.name,
        extractedText: extractedText.substring(0, 500) + '...', // Preview
        fullTextLength: extractedText.length,
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}