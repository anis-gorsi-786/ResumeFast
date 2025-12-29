import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, X, ArrowRight, Lock, Target, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold">Applya</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            ✨ Free during beta - No credit card required
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Stop Wasting Hours on
            <br />
            <span className="text-blue-600">Every Job Application</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Applya optimizes your resume for each job in minutes — without the generic AI fluff.
            <br />
            <strong>You control what changes.</strong> AI handles the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 h-14">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
             <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Unlimited resumes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Tired of AI Tools That Rewrite Your Entire Career?
            </h2>
            <p className="text-xl text-gray-600">
              Most AI resume tools generate generic content that screams "AI wrote this."
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Other Tools */}
            <div className="bg-white rounded-lg border-2 border-red-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-900">Other AI Tools</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Rewrites your entire resume from scratch',
                  'Generic templates everyone uses',
                  'No control over what gets changed',
                  'Removes your authentic voice',
                  'Can\'t lock core sections',
                  'One-size-fits-all approach',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Applya */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-blue-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Applya</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Optimizes YOUR resume, keeps your structure',
                  'Lock education, work history — AI can\'t touch them',
                  'See before/after changes side-by-side',
                  'Choose which bullets to include',
                  'Your authentic voice stays intact',
                  'Tailored for each specific job',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Applya Works</h2>
            <p className="text-xl text-gray-600">
              From resume upload to interview prep in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Your Resume',
                description: 'Upload your base resume (PDF or DOCX). Lock sections you don\'t want AI to change.',
                icon: '📄',
              },
              {
                step: '2',
                title: 'Paste Job Description',
                description: 'Copy the job posting. Our AI analyzes keywords and requirements automatically.',
                icon: '🎯',
              },
              {
                step: '3',
                title: 'Review & Customize',
                description: 'See before/after changes. Accept, reject, or tweak. You\'re in control. Not Implemented yet!! for now you can See your ATS score improvement.',
                icon: '✏️',
              },
              {
                step: '4',
                title: 'Apply with Confidence',
                description: 'Download optimized resume, cover letter, and interview prep. Land that interview!',
                icon: '🚀',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Try It Free Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Job Seekers Choose Applya</h2>
            <p className="text-xl text-gray-600">
              Built for people who want control, not AI autopilot
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-8 w-8" />,
                title: 'Lock Core Sections',
                description: 'Your education and work history stay exactly as written. AI can\'t rewrite your career.',
                color: 'blue',
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: 'Smart Keyword Matching',
                description: 'See your ATS score improve from 4% to 85%+. Know exactly which keywords were added.',
                color: 'green',
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Complete Application Package',
                description: 'Get resume, cover letter, AND interview prep for each job. Save 2+ hours per application.',
                color: 'purple',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Before/After Comparison',
                description: 'See exactly what changed. Accept or reject modifications. Full transparency.',
                color: 'orange',
              },
              {
                icon: <Check className="h-8 w-8" />,
                title: 'Selective Bullet Points',
                description: 'Choose which achievements to highlight for different roles. One resume, many versions.',
                color: 'indigo',
              },
              {
                icon: <ArrowRight className="h-8 w-8" />,
                title: 'Version History',
                description: 'Track all generated resumes. Reuse or regenerate. Download anytime.',
                color: 'pink',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${feature.color}-100 text-${feature.color}-600 rounded-lg mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Land Your Next Interview?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of job seekers who've saved 10+ hours per week on applications
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 h-14">
              Start Free - No Credit Card Required
            </Button>
          </Link>
          <p className="mt-6 text-sm opacity-75">
            Free forever plan • Upgrade anytime • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <h3 className="text-white font-bold text-lg">Applya</h3>
              </div>
              <p className="text-sm text-gray-400">
                Apply smarter, not harder. AI-powered job applications that keep your authentic voice.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup" className="hover:text-white transition">Get Started</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-white transition">Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Resume Tips</a></li>
                <li><a href="#" className="hover:text-white transition">Interview Guide</a></li>
                <li><a href="#" className="hover:text-white transition">ATS Optimization</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:mohammed@mindflow.agency" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="https://buymeacoffee.com/applya" target="_blank" className="hover:text-white transition">Support Development ☕</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400">
              © 2024 Applya. Built with ❤️ for job seekers.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}