import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">ResumeFast</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}