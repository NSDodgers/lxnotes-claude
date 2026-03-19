'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { NotesProvider } from '@/lib/contexts/notes-context'
import { AuthProvider } from '@/components/auth/auth-provider'
import { KeyboardShortcutsProvider } from '@/lib/hooks/use-keyboard-shortcuts'
import { BugReportButton } from '@/components/bug-report/bug-report-button'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Hydrate stores with skipHydration: true on client mount
  // Order matters: dependencies must rehydrate before dependents
  // custom-types/priorities → filter-sort → page-style/email-message
  useEffect(() => {
    useCustomTypesStore.persist.rehydrate()
    useCustomPrioritiesStore.persist.rehydrate()
    useFilterSortPresetsStore.persist.rehydrate()
    usePageStylePresetsStore.persist.rehydrate()
    useEmailMessagePresetsStore.persist.rehydrate()
    useSidebarStore.persist.rehydrate()
  }, [])

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <NotesProvider>
          <KeyboardShortcutsProvider>
            {children}
            <BugReportButton />
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                },
              }}
            />
          </KeyboardShortcutsProvider>
        </NotesProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}