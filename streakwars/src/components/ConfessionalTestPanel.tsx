"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ConfessionalSystem from "./ConfessionalSystem";

interface ConfessionalTestPanelProps {
  userId: Id<"users">;
}

export default function ConfessionalTestPanel({ userId }: ConfessionalTestPanelProps) {
  const [showTestModal, setShowTestModal] = useState(false);
  const [testHabitId, setTestHabitId] = useState<Id<"habits"> | null>(null);
  const [testHabitName, setTestHabitName] = useState("");
  const [testStreakLength, setTestStreakLength] = useState(7);

  // Get user's habits for testing
  const habits = useQuery(api.habits.getUserHabits, { userId });
  
  // Test mutations
  const triggerConfessional = useMutation(api.confessional.triggerConfessional);
  const triggerAntiConfessional = useMutation(api.confessional.triggerAntiConfessional);
  const testFalAI = useMutation(api.falAiActions.testFalAIConnection);

  const handleTestConfessional = async () => {
    if (!testHabitId) {
      alert("Please select a habit first");
      return;
    }

    try {
      const result = await triggerConfessional({
        userId,
        habitId: testHabitId,
        habitName: testHabitName,
        streakLength: testStreakLength,
      });

      alert(`Confessional triggered! Scenario: ${result.scenario.name}`);
      setShowTestModal(false);
    } catch (error) {
      console.error("Error triggering confessional:", error);
      alert("Error triggering confessional: " + (error as Error).message);
    }
  };

  const handleTestAntiConfessional = async () => {
    if (!testHabitId) {
      alert("Please select a habit first");
      return;
    }

    try {
      const result = await triggerAntiConfessional({
        userId,
        habitId: testHabitId,
        habitName: testHabitName,
        streakLength: testStreakLength,
        milestone: `${testStreakLength} days`
      });

      alert(`Anti-confessional triggered! Scenario: ${result.scenario.name}`);
      setShowTestModal(false);
    } catch (error) {
      console.error("Error triggering anti-confessional:", error);
      alert("Error triggering anti-confessional: " + (error as Error).message);
    }
  };

  const handleTestFalAI = async () => {
    try {
      const result = await testFalAI({});
      alert(`Fal.AI Test: ${result.message}`);
    } catch (error) {
      console.error("Error testing Fal.AI:", error);
      alert("Error testing Fal.AI: " + (error as Error).message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">🎬 Confessional Test Panel</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            😔 Test Confessional (Broken Streak)
          </button>
          
          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            🎉 Test Anti-Confessional (Milestone)
          </button>
        </div>

        <button
          onClick={handleTestFalAI}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          🔧 Test Fal.AI Connection
        </button>

        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <p><strong>How to test:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Select a habit from your list</li>
            <li>Choose a streak length (e.g., 7 days)</li>
            <li>Click "Test Confessional" to simulate a broken streak</li>
            <li>Click "Test Anti-Confessional" to simulate a milestone</li>
            <li>Check the Confessional Dashboard to see the results</li>
          </ol>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Confessional</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Habit
                </label>
                <select
                  value={testHabitId || ""}
                  onChange={(e) => {
                    const habitId = e.target.value as Id<"habits">;
                    setTestHabitId(habitId);
                    const habit = habits?.find(h => h._id === habitId);
                    setTestHabitName(habit?.name || "");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a habit...</option>
                  {habits?.map((habit) => (
                    <option key={habit._id} value={habit._id}>
                      {habit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Streak Length
                </label>
                <input
                  type="number"
                  value={testStreakLength}
                  onChange={(e) => setTestStreakLength(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="365"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTestConfessional}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  😔 Test Confessional
                </button>
                
                <button
                  onClick={handleTestAntiConfessional}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  🎉 Test Anti-Confessional
                </button>
              </div>

              <button
                onClick={() => setShowTestModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
