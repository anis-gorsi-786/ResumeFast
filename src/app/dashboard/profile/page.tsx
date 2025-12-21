'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ResumeUpload from '@/components/profile/ResumeUpload'
import ManualEntry from '@/components/profile/ManualEntry'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ResumeFast</h1>
          <Button variant="ghost" asChild>
            <a href="/dashboard">← Back to Dashboard</a>
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Setup Your Profile</h2>
          <p className="text-gray-600">
            Upload your existing resume or fill in the details manually
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="template">Choose Template</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Upload your current resume (PDF or DOCX) and we'll extract the information automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template">
  <Card>
    <CardHeader>
      <CardTitle>Select Resume Template</CardTitle>
      <CardDescription>
        Choose the format that best matches your style and industry
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Choose from professionally designed resume templates
        </p>
        <Button asChild size="lg">
          <a href="/dashboard/templates">View Templates →</a>
        </Button>
      </div>
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Enter Details Manually</CardTitle>
                <CardDescription>
                  Fill in your professional information step by step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManualEntry />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}