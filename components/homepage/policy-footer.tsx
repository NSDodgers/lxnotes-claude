'use client'

import { useState, useEffect } from 'react'

// TypeScript declarations for Termly
declare global {
  interface Window {
    Termly: {
      init: () => void
      rendered: boolean
    }
  }
}

export function PolicyFooter() {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [termlyLoaded, setTermlyLoaded] = useState(false)
  const [termlyError, setTermlyError] = useState(false)

  // Inject Termly script when component mounts
  useEffect(() => {
    const injectTermlyScript = () => {
      if (document.getElementById('termly-jssdk')) {
        setTermlyLoaded(true)
        return // Already loaded
      }
      
      const script = document.createElement('script')
      script.id = 'termly-jssdk'
      script.src = 'https://app.termly.io/embed-policy.min.js'
      script.type = 'text/javascript'
      
      script.onload = () => {
        console.log('Termly script loaded successfully')
        setTermlyLoaded(true)
        setTermlyError(false)
      }
      
      script.onerror = () => {
        console.error('Failed to load Termly script')
        setTermlyError(true)
        setTermlyLoaded(false)
      }
      
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

    injectTermlyScript()
  }, [])

  // Initialize Termly embeds with retry logic
  const initializeTermly = () => {
    if (!termlyLoaded || !window.Termly) {
      console.log('Termly not ready, retrying...')
      return
    }

    try {
      // Force Termly to scan and initialize all embeds
      window.Termly.init()
      console.log('Termly initialized')
    } catch (error) {
      console.error('Error initializing Termly:', error)
    }
  }

  const handleShowPrivacy = () => {
    setShowPrivacy(true)
    
    // Multiple attempts to initialize Termly with increasing delays
    setTimeout(initializeTermly, 100)
    setTimeout(initializeTermly, 300)
    setTimeout(initializeTermly, 500)
    setTimeout(initializeTermly, 1000)
  }

  const handleShowTerms = () => {
    setShowTerms(true)
    
    // Multiple attempts to initialize Termly with increasing delays
    setTimeout(initializeTermly, 100)
    setTimeout(initializeTermly, 300)
    setTimeout(initializeTermly, 500)
    setTimeout(initializeTermly, 1000)
  }

  return (
    <>
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-4 flex justify-center space-x-6">
          <button
            onClick={handleShowPrivacy}
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            Privacy Policy
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={handleShowTerms}
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            Terms and Conditions
          </button>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowPrivacy(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
            <div className="p-8">
              <div name="termly-embed" data-id="c6c38049-569e-4423-90e2-059ac73fe68b"></div>
              {termlyError && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                  <p className="text-gray-600 mb-3">
                    Unable to load the embedded privacy policy. Please visit our privacy policy directly:
                  </p>
                  <a 
                    href="https://app.termly.io/document/privacy-policy/c6c38049-569e-4423-90e2-059ac73fe68b"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    View Privacy Policy
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
            <div className="p-8">
              <div name="termly-embed" data-id="546566cc-e444-44ee-87e2-f360c2d5cb0f"></div>
              {termlyError && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Terms and Conditions</h3>
                  <p className="text-gray-600 mb-3">
                    Unable to load the embedded terms and conditions. Please visit our terms directly:
                  </p>
                  <a 
                    href="https://app.termly.io/document/terms-and-conditions/546566cc-e444-44ee-87e2-f360c2d5cb0f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    View Terms and Conditions
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}