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
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4 opacity-50">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No habits yet</h3>
        <p className="text-gray-500 text-sm">Create your first habit to start building amazing streaks!</p>
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
    <div className="p-6 space-y-3">
      {habits.map((habit) => {
        const completed = isCompletedToday(habit._id);
        const loading = loadingHabits.has(habit._id);
        
        return (
          <div
            key={habit._id}
            className={`rounded-2xl p-4 transition-all duration-300 ${
              completed
                ? "bg-gray-100 border border-gray-200"
                : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleToggleCompletion(habit._id)}
                disabled={loading}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  completed
                    ? "bg-gray-800 border-gray-800 text-white shadow-lg"
                    : "border-gray-300 hover:border-gray-500 hover:bg-gray-100"
                } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : completed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </button>
              
              <div className="flex-1">
                <h3 className={`font-semibold text-base ${completed ? "text-gray-800" : "text-gray-900"}`}>
                  {habit.name}
                </h3>
                {habit.description && (
                  <p className={`text-sm mt-1 ${completed ? "text-gray-600" : "text-gray-500"}`}>
                    {habit.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">Points</div>
                  <div className="font-bold text-lg text-gray-800">
                    {habit.pointsPerCompletion}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">Category</div>
                  <div className="text-sm font-semibold text-gray-700 capitalize">
                    {habit.category}
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
