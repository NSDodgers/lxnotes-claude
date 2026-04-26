'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Monitor, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Hydration-safe "is this rendering on the client?" check. Avoids the
// setState-in-effect lint pattern while serving the same purpose as
// next-themes' canonical `mounted` flag: render unstyled / inactive on the
// server, then upgrade once we know which theme is active.
const subscribe = () => () => {}
const getServerSnapshot = () => false
const getClientSnapshot = () => true
function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

type ThemeValue = 'light' | 'system' | 'dark'

interface ThemeOption {
  value: ThemeValue
  label: string
  sublabel: string
  Icon: typeof Sun
  tooltip: string
}

const OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', sublabel: 'Always light', Icon: Sun, tooltip: 'Light theme' },
  { value: 'system', label: 'System', sublabel: 'Match your device', Icon: Monitor, tooltip: 'System theme' },
  { value: 'dark', label: 'Dark', sublabel: 'Always dark', Icon: Moon, tooltip: 'Dark theme' },
]

interface ThemeSwitcherProps {
  variant: 'compact' | 'segmented'
  className?: string
}

export function ThemeSwitcher({ variant, className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex gap-0.5 bg-bg-tertiary p-0.5 rounded-lg w-fit',
          className,
        )}
        role="radiogroup"
        aria-label="Theme"
      >
        {OPTIONS.map(({ value, Icon, tooltip }) => {
          const isActive = mounted && theme === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={tooltip}
              title={tooltip}
              data-testid={`theme-${value}`}
              onClick={() => setTheme(value)}
              className={cn(
                'h-7 w-7 rounded-md flex items-center justify-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg-tertiary',
                !mounted && 'opacity-60',
                isActive
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn('grid grid-cols-3 gap-3 max-w-2xl', className)}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, sublabel, Icon }) => {
        const isActive = mounted && theme === value
        const sublabelExtra =
          isActive && value === 'system' && resolvedTheme
            ? ` (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
            : ''
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-testid={`theme-${value}`}
            onClick={() => setTheme(value)}
            className={cn(
              'rounded-lg border-2 p-4 flex flex-col items-center text-center cursor-pointer transition-colors min-h-[120px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary',
              !mounted && 'opacity-60',
              isActive
                ? 'border-modules-production bg-bg-tertiary'
                : 'border-bg-tertiary hover:border-text-muted',
            )}
          >
            <Icon className="h-6 w-6 mb-2 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <span className="text-xs text-text-muted mt-1">
              {sublabel}
              {sublabelExtra}
            </span>
          </button>
        )
      })}
    </div>
  )
}
