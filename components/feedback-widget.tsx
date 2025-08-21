"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenFeedback = () => {
    setIsOpen(true);
  };

  const handleFallbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const feedback = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    console.log("User Feedback:", feedback);

    setIsOpen(false);
    alert("Thank you for your feedback! We'll review it shortly.");
  };

  return (
    <>
      <button
        onClick={handleOpenFeedback}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Send Feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Send Feedback</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFallbackSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  What happened? *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what happened or your suggestion..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Send Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}