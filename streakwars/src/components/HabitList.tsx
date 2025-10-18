"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import ConfidenceBar from "./ConfidenceBar";
import VerificationModal from "./VerificationModal";

interface HabitListProps {
  userId: Id<"users">;
}

export default function HabitList({ userId }: HabitListProps) {
  const habits = useQuery(api.habits.getUserActiveHabits, { userId });
  const todayCompletions = useQuery(api.habitCompletions.getTodayCompletions, { userId });
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const undoCompletion = useMutation(api.habitCompletions.undoHabitCompletion);

  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    completionId: Id<"habitCompletions"> | null;
    habitName: string;
  }>({
    isOpen: false,
    completionId: null,
    habitName: "",
  });

  if (!habits) {
    return (
      <div className="p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No habits yet</h3>
        <p className="text-slate-500 text-sm">Create your first habit to start building streaks</p>
      </div>
    );
  }

  const isCompletedToday = (habitId: Id<"habits">) => {
    return todayCompletions?.some(completion => completion.habitId === habitId) || false;
  };

  const getTodayCompletion = (habitId: Id<"habits">) => {
    return todayCompletions?.find(completion => completion.habitId === habitId);
  };

  const handleToggleCompletion = async (habitId: Id<"habits">) => {
    setLoadingHabits(prev => new Set(prev).add(habitId));
    
    try {
      if (isCompletedToday(habitId)) {
        await undoCompletion({ habitId, userId });
      } else {
        await completeHabit({ habitId, userId });
      }
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    } finally {
      setLoadingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const handleVerifyHabit = (completionId: Id<"habitCompletions">, habitName: string) => {
    setVerificationModal({
      isOpen: true,
      completionId,
      habitName,
    });
  };

  const getVerificationStatusIcon = (completion: any) => {
    if (!completion.verificationStatus || completion.verificationStatus === "none") {
      return null;
    }

    switch (completion.verificationStatus) {
      case "verified":
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-600 font-medium">Verified</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-red-600 font-medium">Rejected</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-yellow-600 font-medium">Pending</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-5 space-y-3">
        {habits.map((habit) => {
          const completed = isCompletedToday(habit._id);
          const loading = loadingHabits.has(habit._id);
          const completion = getTodayCompletion(habit._id);

          return (
            <div
              key={habit._id}
              className={`rounded-lg p-4 transition-all duration-200 ${
                completed
                  ? "bg-indigo-50 border border-indigo-200"
                  : "bg-white border border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleCompletion(habit._id)}
                  disabled={loading}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    completed
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-slate-300 hover:border-indigo-500"
                  } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-base truncate ${completed ? "text-slate-700" : "text-slate-900"}`}>
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className={`text-sm mt-0.5 truncate ${completed ? "text-slate-500" : "text-slate-600"}`}>
                      {habit.description}
                    </p>
                  )}
                  
                  {/* Verification Status */}
                  {completed && completion && (
                    <div className="mt-2 space-y-2">
                      {getVerificationStatusIcon(completion)}
                      
                      {/* Confidence Bar for verified completions */}
                      {completion.verificationResult && (
                        <ConfidenceBar
                          confidence={completion.verificationResult.confidence}
                          verified={completion.verificationResult.verified}
                          className="text-xs"
                        />
                      )}
                      
                      {/* Verification Reason */}
                      {completion.verificationResult?.reason && (
                        <p className="text-xs text-gray-600 italic">
                          "{completion.verificationResult.reason}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Verify Button */}
                  {completed && completion && (
                    <button
                      onClick={() => handleVerifyHabit(completion._id, habit.name)}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Verify with AI
                    </button>
                  )}
                  
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Points</div>
                    <div className="font-bold text-lg text-indigo-600">
                      {habit.pointsPerCompletion}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Modal */}
      <VerificationModal
        completionId={verificationModal.completionId!}
        habitName={verificationModal.habitName}
        isOpen={verificationModal.isOpen}
        onClose={() => setVerificationModal({ isOpen: false, completionId: null, habitName: "" })}
      />
    </>
  );
}
