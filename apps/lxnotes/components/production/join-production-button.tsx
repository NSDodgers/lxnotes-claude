'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'

interface JoinProductionButtonProps {
    productionId: string
    productionName: string
}

export function JoinProductionButton({
    productionId,
    productionName
}: JoinProductionButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleJoin = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/productions/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productionId }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to join production')
            }

            // Success - redirect to the production
            router.push(`/production/${productionId}/cue-notes`)
            router.refresh()
        } catch (err) {
            console.error('Error joining production:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4 w-full max-w-sm">
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            <Button
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                    </>
                ) : (
                    <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join &ldquo;{productionName}&rdquo;
                    </>
                )}
            </Button>
        </div>
    )
}
