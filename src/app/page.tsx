import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-600">ResumeFast</h1>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started Free</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Land Your Dream Job with AI-Powered Applications
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Generate ATS-optimized resumes, compelling cover letters, and ace your interviews - all in minutes.
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free →
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="font-semibold mb-2">Smart Resume Generation</h3>
            <p className="text-gray-600">AI customizes your resume for each job, boosting ATS scores by 50%+</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="font-semibold mb-2">Personalized Cover Letters</h3>
            <p className="text-gray-600">Generate compelling cover letters that stand out to recruiters</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="font-semibold mb-2">Interview Preparation</h3>
            <p className="text-gray-600">Get likely questions and strong answer frameworks</p>
          </div>
        </div>
      </main>
    </div>
  )
}