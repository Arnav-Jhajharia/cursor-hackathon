"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface ChallengeBuilderProps {
  userId: Id<"users">;
  onClose: () => void;
  onSubmit: (challengeData: any) => void;
}

export default function ChallengeBuilder({ userId, onClose, onSubmit }: ChallengeBuilderProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    prize: "",
  });
  
  const [selectedHabits, setSelectedHabits] = useState<Id<"habits">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user's habits and public habits
  const userHabits = useQuery(api.habits.getUserActiveHabits, { userId });
  const publicHabits = useQuery(api.habits.getPublicHabits, { limit: 50 });

  const handleHabitToggle = (habitId: Id<"habits">) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHabits.length === 0) {
      alert("Please select at least one habit for your challenge");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert habit IDs to habit names for the challenge
      const allHabits = [...(userHabits || []), ...(publicHabits || [])];
      const selectedHabitNames = selectedHabits
        .map(id => allHabits.find(h => h._id === id)?.name)
        .filter(Boolean);

      onSubmit({
        ...formData,
        targetHabits: selectedHabitNames,
      });
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Challenge</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Challenge Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Challenge Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g., 30-Day Fitness Challenge"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                min="1"
                max="365"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Describe what this challenge is about..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prize Pool (optional)</label>
            <input
              type="text"
              value={formData.prize}
              onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="e.g., $100, Gift Card, etc."
            />
          </div>

          {/* Habit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Habits for Challenge ({selectedHabits.length} selected)
            </label>
            
            <div className="space-y-6">
              {/* User's Habits */}
              {userHabits && userHabits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Habits</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {userHabits.map((habit) => (
                      <div
                        key={habit._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedHabits.includes(habit._id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleHabitToggle(habit._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                            {habit.description && (
                              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 capitalize">{habit.category}</span>
                              <span className="text-xs text-gray-500">{habit.targetFrequency}</span>
                              <span className="text-xs font-semibold text-blue-600">{habit.pointsPerCompletion} pts</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedHabits.includes(habit._id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}>
                            {selectedHabits.includes(habit._id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Habits */}
              {publicHabits && publicHabits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Public Habits</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {publicHabits.map((habit) => (
                      <div
                        key={habit._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedHabits.includes(habit._id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleHabitToggle(habit._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                            {habit.description && (
                              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500 capitalize">{habit.category}</span>
                              <span className="text-xs text-gray-500">{habit.targetFrequency}</span>
                              <span className="text-xs font-semibold text-blue-600">{habit.pointsPerCompletion} pts</span>
                              <span className="text-xs text-gray-500">by {habit.user?.name}</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedHabits.includes(habit._id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}>
                            {selectedHabits.includes(habit._id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedHabits.length === 0}
              className="flex-1 py-2 px-4 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
