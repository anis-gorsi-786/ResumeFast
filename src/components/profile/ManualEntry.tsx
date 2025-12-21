'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface WorkExperience {
  id: string
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  achievements: string[]
}

interface Education {
  id: string
  degree: string
  institution: string
  location: string
  graduationDate: string
  achievements: string
}

export default function ManualEntry() {
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
  })

  const [professionalSummary, setProfessionalSummary] = useState('')
  
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: '1',
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: [''],
    },
  ])

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      achievements: '',
    },
  ])

  const [skills, setSkills] = useState('')
  const [saving, setSaving] = useState(false)

  const addWorkExperience = () => {
    setWorkExperience([
      ...workExperience,
      {
        id: Date.now().toString(),
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        achievements: [''],
      },
    ])
  }

  const removeWorkExperience = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id))
  }

  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        achievements: '',
      },
    ])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactInfo,
          professionalSummary,
          workExperience,
          education,
          skills: skills.split(',').map(s => s.trim()),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      alert('Profile saved successfully!')
    } catch (error) {
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={contactInfo.fullName}
              onChange={e => setContactInfo({ ...contactInfo, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={contactInfo.phone}
              onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
              placeholder="+61 400 000 000"
            />
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={contactInfo.linkedin}
              onChange={e => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
              placeholder="linkedin.com/in/johndoe"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={contactInfo.location}
              onChange={e => setContactInfo({ ...contactInfo, location: e.target.value })}
              placeholder="Melbourne, VIC"
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Professional Summary</h3>
        <Textarea
          value={professionalSummary}
          onChange={e => setProfessionalSummary(e.target.value)}
          placeholder="Brief overview of your professional background and key strengths..."
          rows={4}
        />
      </div>

      {/* Work Experience */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Work Experience</h3>
          <Button variant="outline" size="sm" onClick={addWorkExperience}>
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>

        {workExperience.map((exp, index) => (
          <div key={exp.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Experience {index + 1}</h4>
              {workExperience.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkExperience(exp.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={exp.jobTitle}
                  onChange={e => {
                    const updated = workExperience.map(item =>
                      item.id === exp.id ? { ...item, jobTitle: e.target.value } : item
                    )
                    setWorkExperience(updated)
                  }}
                  placeholder="Senior Developer"
                />
              </div>

              <div>
                <Label>Company *</Label>
                <Input
                  value={exp.company}
                  onChange={e => {
                    const updated = workExperience.map(item =>
                      item.id === exp.id ? { ...item, company: e.target.value } : item
                    )
                    setWorkExperience(updated)
                  }}
                  placeholder="Tech Company"
                />
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={exp.location}
                  onChange={e => {
                    const updated = workExperience.map(item =>
                      item.id === exp.id ? { ...item, location: e.target.value } : item
                    )
                    setWorkExperience(updated)
                  }}
                  placeholder="Melbourne, VIC"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={e => {
                      const updated = workExperience.map(item =>
                        item.id === exp.id ? { ...item, startDate: e.target.value } : item
                      )
                      setWorkExperience(updated)
                    }}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={exp.endDate}
                    onChange={e => {
                      const updated = workExperience.map(item =>
                        item.id === exp.id ? { ...item, endDate: e.target.value } : item
                      )
                      setWorkExperience(updated)
                    }}
                    disabled={exp.current}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Key Achievements (one per line)</Label>
                <Textarea
                  placeholder="• Improved system performance by 40%&#10;• Led team of 5 developers&#10;• Implemented CI/CD pipeline"
                  rows={4}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Education</h3>
          <Button variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>

        {education.map((edu, index) => (
          <div key={edu.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Education {index + 1}</h4>
              {education.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(edu.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Degree *</Label>
                <Input
                  value={edu.degree}
                  onChange={e => {
                    const updated = education.map(item =>
                      item.id === edu.id ? { ...item, degree: e.target.value } : item
                    )
                    setEducation(updated)
                  }}
                  placeholder="Bachelor of Computer Science"
                />
              </div>

              <div>
                <Label>Institution *</Label>
                <Input
                  value={edu.institution}
                  onChange={e => {
                    const updated = education.map(item =>
                      item.id === edu.id ? { ...item, institution: e.target.value } : item
                    )
                    setEducation(updated)
                  }}
                  placeholder="University of Melbourne"
                />
              </div>

              <div>
                <Label>Graduation Date</Label>
                <Input
                  type="month"
                  value={edu.graduationDate}
                  onChange={e => {
                    const updated = education.map(item =>
                      item.id === edu.id ? { ...item, graduationDate: e.target.value } : item
                    )
                    setEducation(updated)
                  }}
                />
              </div>

              <div className="col-span-2">
                <Label>Notable Achievements</Label>
                <Textarea
                  value={edu.achievements}
                  onChange={e => {
                    const updated = education.map(item =>
                      item.id === edu.id ? { ...item, achievements: e.target.value } : item
                    )
                    setEducation(updated)
                  }}
                  placeholder="GPA 3.8, Dean's List, President of Tech Club"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Skills</h3>
        <Textarea
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="JavaScript, React, Node.js, Python, AWS, Docker (comma-separated)"
          rows={3}
        />
        <p className="text-sm text-gray-500">
          Enter your skills separated by commas
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Cancel</a>
        </Button>
      </div>
    </div>
  )
}