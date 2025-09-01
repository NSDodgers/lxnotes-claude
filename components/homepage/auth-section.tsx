'use client'

import { useRouter } from 'next/navigation'

export function AuthSection() {
  const router = useRouter()

  const handleSignIn = () => {
    // For now, directly navigate to the app
    // TODO: Replace with Supabase Auth when ready
    router.push('/cue-notes')
  }

  const features = [
    'Cue notes entry and management',
    'Script setup with cue numbering', 
    'iPad-optimized interface',
    'Print and email views'
  ]

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-white text-xl font-bold mb-3">
        Sign In to Your Account
      </h2>
      <p className="text-gray-400 mb-5 leading-relaxed">
        Access your productions and manage lighting notes
      </p>

      {/* Feature List */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-300">
            <span className="text-purple-400 mr-3 mt-1 text-lg">•</span>
            <span className="leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Sign In Button */}
      <button
        onClick={handleSignIn}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
      >
        Sign In to Continue
      </button>
    </div>
  )
}