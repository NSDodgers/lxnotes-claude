"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-400 mb-6">
              A critical error occurred. Please try again.
            </p>
            
            <button
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            
            {process.env.NODE_ENV === "development" && error.digest && (
              <p className="text-xs text-gray-500 mt-4">
                Error Digest: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}