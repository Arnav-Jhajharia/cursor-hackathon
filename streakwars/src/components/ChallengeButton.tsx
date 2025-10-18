"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChallengeButtonProps {
  completionId: Id<"habitCompletions">;
  habitName: string;
  challengerId: Id<"users">;
}

export default function ChallengeButton({ completionId, habitName, challengerId }: ChallengeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const challengeCompletion = useMutation(api.habitChallenges.challengeHabitCompletion);

  const handleSubmitChallenge = async () => {
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await challengeCompletion({
        completionId,
        challengerId,
        reason: reason.trim(),
      });
      
      setIsOpen(false);
      setReason("");
      alert("Challenge submitted successfully!");
    } catch (error) {
      console.error("Error submitting challenge:", error);
      alert("Failed to submit challenge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
      >
        🚨 Challenge
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Challenge "{habitName}"
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Challenge
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you think this completion should be verified..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitChallenge}
                  disabled={!reason.trim() || isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    reason.trim() && !isSubmitting
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Challenge"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
