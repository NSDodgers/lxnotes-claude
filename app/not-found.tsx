import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                    <h1 className="text-4xl font-display font-bold text-primary">404</h1>
                    <h2 className="text-2xl font-semibold text-text-primary">Page Not Found</h2>
                    <p className="text-text-secondary">
                        The page you are looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
