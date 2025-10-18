"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChallengeHabitItemProps {
  habitName: string;
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  onCreateHabit: any;
  onCompleteHabit: any;
}

export default function ChallengeHabitItem({
  habitName,
  challengeId,
  userId,
  onCreateHabit,
  onCompleteHabit,
}: ChallengeHabitItemProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if user already has this habit
  const userHabits = useQuery(api.habits.getUserHabits, { userId });
  const existingHabit = userHabits?.find(habit => habit.name === habitName);

  // Check if habit was completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000);

  const habitCompletions = useQuery(api.habits.getHabitCompletions, 
    existingHabit ? {
      habitId: existingHabit._id,
      startDate: todayStart,
      endDate: todayEnd,
    } : "skip"
  );

  const isCompletedToday = habitCompletions && habitCompletions.length > 0;

  const handleCreateHabit = async () => {
    setIsCreating(true);
    try {
      await onCreateHabit({
        challengeId,
        habitName,
        userId,
        category: "challenge",
        description: `Challenge habit: ${habitName}`,
      });
    } catch (error) {
      console.error("Error creating habit:", error);
      alert("Failed to create habit: " + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompleteHabit = async () => {
    if (!existingHabit) return;
    
    setIsCompleting(true);
    try {
      await onCompleteHabit({
        challengeId,
        habitName,
        userId,
        points: existingHabit.pointsPerCompletion,
      });
    } catch (error) {
      console.error("Error completing habit:", error);
      alert("Failed to complete habit: " + (error as Error).message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompletedToday ? "bg-green-100" : "bg-gray-100"
        }`}>
          {isCompletedToday ? (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
        </div>
        <div>
          <div className="font-medium text-gray-900">{habitName}</div>
          <div className="text-sm text-gray-500">
            {existingHabit ? "Personal habit" : "Challenge habit"}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!existingHabit ? (
          <button
            onClick={handleCreateHabit}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Habit"}
          </button>
        ) : isCompletedToday ? (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            ✅ Completed Today
          </div>
        ) : (
          <button
            onClick={handleCompleteHabit}
            disabled={isCompleting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? "Completing..." : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}
