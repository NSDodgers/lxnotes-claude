"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bg-secondary rounded-lg border border-border p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />

            <h2 className="text-xl font-semibold text-text-primary mb-2 font-display">
              Something went wrong
            </h2>

            <p className="text-text-secondary mb-6">
              A critical error occurred. Please try again.
            </p>

            <Button
              onClick={reset}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            {process.env.NODE_ENV === "development" && error.digest && (
              <p className="text-xs text-text-muted mt-4 font-mono">
                Error Digest: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}