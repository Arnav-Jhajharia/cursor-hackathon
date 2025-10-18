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

// Confetti animation component
const ConfettiAnimation = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${1.5 + Math.random() * 1}s`,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 4)],
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Coin animation component
const CoinAnimation = ({ show, points }: { show: boolean; points: number }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-coin-bounce bg-yellow-500 text-white font-semibold text-sm px-3 py-1 rounded-full shadow-lg">
        +{points} 🪙
      </div>
    </div>
  );
};

export default function HabitList({ userId }: HabitListProps) {
  const habits = useQuery(api.habits.getUserHabitsWithChallenges, { userId });
  const todayCompletions = useQuery(api.habitCompletions.getTodayCompletions, { userId });
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const undoCompletion = useMutation(api.habitCompletions.undoHabitCompletion);

  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCoin, setShowCoin] = useState(false);
  const [coinPoints, setCoinPoints] = useState(0);
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    completionId: Id<"habitCompletions"> | null;
    habitName: string;
  }>({
    isOpen: false,
    completionId: null,
    habitName: "",
  });

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Play completion sound
  const playCompletionSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  };

  const isCompletedToday = (habitId: string) => {
    return todayCompletions?.some(completion => completion.habitId === habitId) ?? false;
  };

  const getTodayCompletion = (habitId: string) => {
    return todayCompletions?.find(completion => completion.habitId === habitId);
  };

  const handleToggleCompletion = async (habitId: string) => {
    if (loadingHabits.has(habitId)) return;

    const completed = isCompletedToday(habitId);
    const habit = habits?.find(h => h._id === habitId);
    
    setLoadingHabits(prev => new Set(prev).add(habitId));

    try {
      if (completed) {
        const completion = getTodayCompletion(habitId);
        if (completion) {
          await undoCompletion({ completionId: completion._id });
        }
      } else {
        await completeHabit({ habitId: habitId as Id<"habits">, userId });
        
        // Trigger animations and feedback
        if (habit) {
          triggerHaptic();
          playCompletionSound();
          setCoinPoints(habit.pointsPerCompletion);
          setShowCoin(true);
          setShowConfetti(true);
          
          // Hide animations after delay
          setTimeout(() => {
            setShowConfetti(false);
            setShowCoin(false);
          }, 1500);
        }
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
              className={`bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
                completed && completion?.verificationStatus === "rejected"
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
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
                    <p className="text-sm text-gray-600 mb-2">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">🪙 +{habit.pointsPerCompletion}</span>
                    {getVerificationStatusIcon(getTodayCompletion(habit._id))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Verify Button */}
                  {isCompletedToday(habit._id) && (
                    <button
                      onClick={() => {
                        const completion = getTodayCompletion(habit._id);
                        if (completion && completion.verificationStatus !== "verified") {
                          handleVerifyHabit(completion._id, habit.name);
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Verify
                    </button>
                  )}

                  {/* Complete Button */}
                  <button
                    onClick={() => handleToggleCompletion(habit._id)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform active:scale-95 ${
                      loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Complete"
                    )}
                  </button>
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
              className={`bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-75 ${
                completion?.verificationStatus === "rejected"
                  ? "border-red-300 bg-red-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-500 line-through">
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
                    <p className="text-sm text-gray-400 mb-2 line-through">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">🪙 +{habit.pointsPerCompletion}</span>
                    {getVerificationStatusIcon(completion)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Verify Button */}
                  {completion && completion.verificationStatus !== "verified" && (
                    <button
                      onClick={() => handleVerifyHabit(completion._id, habit.name)}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Verify
                    </button>
                  )}

                  {/* Undo Button */}
                  <button
                    onClick={() => handleToggleCompletion(habit._id)}
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

      {/* Animations */}
      <ConfettiAnimation show={showConfetti} />
      <CoinAnimation show={showCoin} points={coinPoints} />

      {/* Verification Modal */}
      <VerificationModal
        completionId={verificationModal.completionId!}
        habitName={verificationModal.habitName}
        isOpen={verificationModal.isOpen}
        onClose={() => setVerificationModal({ isOpen: false, completionId: null, habitName: "" })}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes coin-bounce {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
        }
        
        .animate-confetti {
          animation: confetti linear forwards;
        }
        
        .animate-coin-bounce {
          animation: coin-bounce 1.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}