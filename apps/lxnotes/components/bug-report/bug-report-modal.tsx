'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogScrollableContent,
  DialogStickyFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BugReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  screenshot: string | null
  onRemoveScreenshot: () => void
  context: {
    route: string
    module: string
    browser: string
    os: string
  }
}

type Severity = 'low' | 'medium' | 'high' | 'critical'

export function BugReportModal({
  open,
  onOpenChange,
  screenshot,
  onRemoveScreenshot,
  context,
}: BugReportModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isSubmitting

  async function handleSubmit() {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          route: context.route,
          module: context.module,
          browser: context.browser,
          os: context.os,
          timestamp: new Date().toISOString(),
          screenshotBase64: screenshot || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${response.status})`)
      }

      toast.success('Bug report submitted')
      setTitle('')
      setDescription('')
      setSeverity('medium')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit bug report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="bug-report-modal">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Describe the issue you encountered. A screenshot has been captured automatically.
          </DialogDescription>
        </DialogHeader>

        <DialogScrollableContent className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="bug-title">Title</Label>
            <Input
              id="bug-title"
              data-testid="bug-report-title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-description">Description</Label>
            <Textarea
              id="bug-description"
              data-testid="bug-report-description"
              placeholder="What happened? What did you expect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={4000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-severity">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger data-testid="bug-report-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {screenshot && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Screenshot</Label>
                <button
                  type="button"
                  onClick={onRemoveScreenshot}
                  data-testid="bug-report-remove-screenshot"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URI, not optimizable */}
              <img
                src={`data:image/png;base64,${screenshot}`}
                alt="Bug report screenshot"
                className="w-full rounded-md border"
              />
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <div><span className="font-medium">Route:</span> {context.route}</div>
            <div><span className="font-medium">Module:</span> {context.module}</div>
            <div><span className="font-medium">Browser:</span> {context.browser}</div>
            <div><span className="font-medium">OS:</span> {context.os}</div>
          </div>
        </DialogScrollableContent>

        <DialogStickyFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="bug-report-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="bug-report-submit"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  )
}
