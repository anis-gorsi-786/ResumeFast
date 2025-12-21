'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ExistingResume {
  id: string
  file_name: string
  created_at: string
  extracted_text: string
}

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [error, setError] = useState('')
  const [expandedPreview, setExpandedPreview] = useState(false)
  const [existingResume, setExistingResume] = useState<ExistingResume | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing resume on mount
  useEffect(() => {
    checkExistingResume()
  }, [])

  const checkExistingResume = async () => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Get user preferences (should only be one row now)
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('resume_text, updated_at')
      .eq('user_id', user.id)
      .single()

    if (prefs && prefs.resume_text) {
      setExistingResume({
        id: user.id,
        file_name: 'Resume.docx', // We don't store filename in preferences
        created_at: prefs.updated_at || new Date().toISOString(),
        extracted_text: prefs.resume_text,
      })
      setUploaded(true)
      setExtractedText(prefs.resume_text)
    }
  } catch (err) {
    console.error('Error checking existing resume:', err)
  } finally {
    setLoading(false)
  }
}

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const fileName = selectedFile.name.toLowerCase()
      const validExtensions = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')
      
      if (!validExtensions) {
        setError('Please upload a PDF or DOCX file')
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploaded(true)
      setExtractedText(data.data.extractedText)
      
      // Refresh to get the new resume
      await checkExistingResume()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleNewUpload = () => {
    setFile(null)
    setUploaded(false)
    setExtractedText('')
    setExistingResume(null)
    setExpandedPreview(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!uploaded ? (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <Label htmlFor="resume-upload" className="cursor-pointer">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600 hover:text-blue-700">
                  Click to upload
                </span>{' '}
                or drag and drop
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PDF or DOCX (max 5MB)
              </p>
            </Label>
            <Input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Resume uploaded successfully!</p>
              {existingResume && (
                <p className="text-sm text-green-700">
                  File: {existingResume.file_name} • Uploaded: {new Date(existingResume.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
              <h3 className="font-medium text-gray-900">Extracted Text Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPreview(!expandedPreview)}
                className="text-blue-600 hover:text-blue-700"
              >
                {expandedPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Expand Full Text
                  </>
                )}
              </Button>
            </div>
            
            <div className={`p-4 bg-white ${expandedPreview ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'}`}>
              <p className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                {expandedPreview ? extractedText : extractedText.substring(0, 500) + '...'}
              </p>
            </div>
            
            {!expandedPreview && (
              <div className="bg-gradient-to-t from-white to-transparent h-8 -mt-8 relative pointer-events-none" />
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">✅ What's Next?</h4>
            <p className="text-sm text-blue-800 mb-3">
              Your resume has been saved! Now you can customize the details before generating job-specific resumes.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <a href="/dashboard/profile/edit">Edit & Customize Details</a>
              </Button>
              <Button variant="outline" onClick={handleNewUpload}>
                Upload Different Resume
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Characters extracted: <strong>{extractedText.length.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}