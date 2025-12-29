'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FeedbackWidget() {
  const [isMinimized, setIsMinimized] = useState(true)

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Send Feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-xl border-2 border-blue-400 p-4 max-w-sm">
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Minimize"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="bg-blue-100 rounded-full p-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Share Your Feedback</h3>
          <p className="text-xs text-gray-600">Help us improve Applya</p>
        </div>
      </div>

      
     <a href="/feedback"
        className="block mb-2"
      >
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Feedback
        </Button>
      </a>

      <p className="text-xs text-gray-500 text-center">
        Bug reports, ideas, or suggestions welcome!
      </p>
    </div>
  )
}