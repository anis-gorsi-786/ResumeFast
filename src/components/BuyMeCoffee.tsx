'use client'

import { useState } from 'react'
import { Coffee, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BuyMeCoffee() {
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Support Us"
      >
        <Coffee className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border-2 border-yellow-400 p-4 max-w-sm">
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Minimize"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="bg-yellow-100 rounded-full p-2">
          <Coffee className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Enjoying Applya?</h3>
          <p className="text-xs text-gray-600">Support our development</p>
        </div>
      </div>

      
    <a href="https://buymeacoffee.com/applya.io"
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-2">
          
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
          <Coffee className="h-4 w-4 mr-2" />
          Buy Me a Coffee
        </Button>
      </a>

      <p className="text-xs text-gray-500 text-center">
        Your support helps keep Applya free!
      </p>
    </div>
  )
}