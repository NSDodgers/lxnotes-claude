import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Authentication Error
        </h1>
        <p className="text-text-secondary mb-6">
          There was an error during the authentication process. Please try signing in again.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
