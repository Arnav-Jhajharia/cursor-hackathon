"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface HabitListProps {
  userId: Id<"users">;
}

export default function HabitList({ userId }: HabitListProps) {
  const habits = useQuery(api.habits.getUserActiveHabits, { userId });
  const todayCompletions = useQuery(api.habitCompletions.getTodayCompletions, { userId });
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const undoCompletion = useMutation(api.habitCompletions.undoHabitCompletion);

  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());

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

  return (
    <div className="p-5 space-y-3">
      {habits.map((habit) => {
        const completed = isCompletedToday(habit._id);
        const loading = loadingHabits.has(habit._id);

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
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
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
  );
}
