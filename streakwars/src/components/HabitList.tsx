"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import HabitVerificationSystem from "./HabitVerificationSystem";
import VerificationModal from "./VerificationModal";

interface HabitListProps {
  userId: Id<"users">;
}


export default function HabitList({ userId }: HabitListProps) {
  const router = useRouter();
  const habits = useQuery(api.habits.getUserHabitsWithChallenges, { userId });
  const todayCompletions = useQuery(api.habitCompletions.getTodayCompletions, { userId });
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


  const isCompletedToday = (habitId: string) => {
    return todayCompletions?.some(completion => completion.habitId === habitId) ?? false;
  };

  const getTodayCompletion = (habitId: string) => {
    return todayCompletions?.find(completion => completion.habitId === habitId);
  };

  const handleUndoCompletion = async (habitId: string) => {
    if (loadingHabits.has(habitId)) return;
    
    setLoadingHabits(prev => new Set(prev).add(habitId));

    try {
      const completion = getTodayCompletion(habitId);
      if (completion) {
        await undoCompletion({ completionId: completion._id });
      }
    } catch (error) {
      console.error("Error undoing habit completion:", error);
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
    if (!completion || !completion.verificationStatus || completion.verificationStatus === "none") {
      return null;
    }

    if (completion.verificationStatus === "verified") {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-green-500 font-medium">Verified</span>
        </div>
      );
    }

    if (completion.verificationStatus === "rejected") {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-red-500 font-medium">Failed</span>
        </div>
      );
    }

    if (completion.verificationStatus === "pending") {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-yellow-500 animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-yellow-500 font-medium">Pending</span>
        </div>
      );
    }

    return null;
  };

  if (!habits) {
    return (
      <div className="p-5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Separate completed and incomplete habits
  const incompleteHabits = habits.filter(habit => !isCompletedToday(habit._id));
  const completedHabits = habits.filter(habit => isCompletedToday(habit._id));

  return (
    <>
      <div className="p-4 space-y-3">
        {/* Incomplete Habits */}
        {incompleteHabits.map((habit) => {
          const loading = loadingHabits.has(habit._id);
          const isChallengeHabit = (habit as any).isChallengeHabit;
          const completed = isCompletedToday(habit._id);
          const completion = getTodayCompletion(habit._id);

          return (
            <div
              key={habit._id}
              className={`bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-lg cursor-pointer group ${
                completed && completion?.verificationStatus === "rejected"
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
              onClick={() => router.push(`/habits/${habit._id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {habit.name}
                    </h3>
                    {isChallengeHabit && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                        Challenge
                      </span>
                    )}
                    {(habit as any).isCustomHabit && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  
                  {habit.description && (
                    <p className="text-sm text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">🪙 +{habit.pointsPerCompletion}</span>
                    {getVerificationStatusIcon(getTodayCompletion(habit._id))}
                    <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
                      Click to view details →
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Verification System - only show if not completed */}
                  {!isCompletedToday(habit._id) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <HabitVerificationSystem
                        habitId={habit._id}
                        userId={userId}
                        habitName={habit.name}
                        habitCategory={habit.category}
                        onVerificationComplete={() => {
                          // Refresh the data
                          window.location.reload();
                        }}
                      />
                    </div>
                  )}

                  {/* Completed indicator */}
                  {isCompletedToday(habit._id) && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Completed Habits */}
        {completedHabits.map((habit) => {
          const loading = loadingHabits.has(habit._id);
          const completion = getTodayCompletion(habit._id);
          const isChallengeHabit = (habit as any).isChallengeHabit;

          return (
            <div
              key={habit._id}
              className={`bg-green-50 rounded-xl p-4 border border-green-200 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                completion?.verificationStatus === "rejected"
                  ? "border-red-300 bg-red-50"
                  : ""
              }`}
              onClick={() => router.push(`/habits/${habit._id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-green-700 group-hover:text-green-800 transition-colors">
                      {habit.name}
                    </h3>
                    {isChallengeHabit && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                        Challenge
                      </span>
                    )}
                    {(habit as any).isCustomHabit && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  
                  {habit.description && (
                    <p className="text-sm text-green-600 mb-2 group-hover:text-green-700 transition-colors">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600">🪙 +{habit.pointsPerCompletion}</span>
                    {getVerificationStatusIcon(completion)}
                    <span className="text-xs text-green-500 group-hover:text-green-600 transition-colors">
                      Click to verify/manage →
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Undo Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUndoCompletion(habit._id);
                    }}
                    disabled={loading}
                    className={`px-3 py-1 rounded-lg font-medium text-xs transition-all duration-200 ${
                      loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                    }`}
                  >
                    {loading ? (
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Undo"
                    )}
                  </button>

                  {/* Completed indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No habits yet. Create your first habit to get started!</p>
          </div>
        )}
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