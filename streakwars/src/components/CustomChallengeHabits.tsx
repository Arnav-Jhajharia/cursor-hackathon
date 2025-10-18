"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface CustomChallengeHabitsProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
}

export default function CustomChallengeHabits({ challengeId, userId }: CustomChallengeHabitsProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const customHabits = useQuery(api.customChallengeHabits.getCustomChallengeHabits, {
    challengeId,
    userId,
  });

  const addHabit = useMutation(api.customChallengeHabits.addCustomChallengeHabit);
  const removeHabit = useMutation(api.customChallengeHabits.removeCustomChallengeHabit);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      setIsAdding(true);
      await addHabit({
        challengeId,
        userId,
        habitName: newHabitName.trim(),
      });
      setNewHabitName("");
    } catch (error) {
      console.error("Failed to add custom habit:", error);
      alert("Failed to add custom habit. It might already exist.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveHabit = async (habitName: string) => {
    try {
      await removeHabit({
        challengeId,
        userId,
        habitName,
      });
    } catch (error) {
      console.error("Failed to remove custom habit:", error);
      alert("Failed to remove custom habit.");
    }
  };

  if (customHabits === undefined) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Your Custom Habits</h3>
      
      {/* Add new habit form */}
      <form onSubmit={handleAddHabit} className="flex gap-2">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Add a custom habit..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !newHabitName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* List of custom habits */}
      {customHabits.length > 0 ? (
        <div className="space-y-2">
          {customHabits.map((habitName) => (
            <div
              key={habitName}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-900">{habitName}</span>
              <button
                onClick={() => handleRemoveHabit(habitName)}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          No custom habits added yet. Add your own habits to track in this challenge!
        </div>
      )}
    </div>
  );
}
