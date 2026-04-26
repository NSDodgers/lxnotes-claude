'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from 'next-themes'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { NotesProvider } from '@/lib/contexts/notes-context'
import { AuthProvider } from '@/components/auth/auth-provider'
import { KeyboardShortcutsProvider } from '@/lib/hooks/use-keyboard-shortcuts'
import { BugReportButton } from '@/components/bug-report/bug-report-button'
import { ThemeSyncProvider } from '@/components/theme/theme-sync-provider'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
    />
  )
}

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
  // custom-types/priorities → filter-sort → email-message
  useEffect(() => {
    useCustomTypesStore.persist.rehydrate()
    useCustomPrioritiesStore.persist.rehydrate()
    useFilterSortPresetsStore.persist.rehydrate()
    useEmailMessagePresetsStore.persist.rehydrate()
    useSidebarStore.persist.rehydrate()
  }, [])

  // ThemeProvider must be the OUTERMOST provider so the leaf-level ThemedToaster
  // (and any other consumer of useTheme) can read the resolved theme. AuthProvider
  // sits inside it; ThemeSyncProvider then sits between auth and the rest of the
  // tree because it needs both useTheme() and useAuthContext().
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <AuthProvider>
        <ThemeSyncProvider>
          <QueryClientProvider client={queryClient}>
            <NotesProvider>
              <KeyboardShortcutsProvider>
                {children}
                <BugReportButton />
                <ThemedToaster />
              </KeyboardShortcutsProvider>
            </NotesProvider>
          </QueryClientProvider>
        </ThemeSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
