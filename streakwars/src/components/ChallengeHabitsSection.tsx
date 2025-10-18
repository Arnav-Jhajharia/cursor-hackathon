"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface ChallengeHabitsSectionProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  targetHabits: string[];
}

export default function ChallengeHabitsSection({ challengeId, userId, targetHabits }: ChallengeHabitsSectionProps) {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionProof, setCompletionProof] = useState("");

  // Queries
  const challengeHabits = useQuery(api.challengeHabits.getChallengeHabits, { challengeId, userId });
  const userHabits = useQuery(api.habits.getUserHabits, { userId });
  const challengeCompletions = useQuery(api.habits.getHabitCompletions, 
    selectedHabit ? { 
      habitId: selectedHabit as Id<"habits">, 
      startDate: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
      endDate: Date.now()
    } : "skip"
  );

  // Mutations
  const createHabitFromChallenge = useMutation(api.challengeHabits.createHabitFromChallenge);
  const completeChallengeHabit = useMutation(api.challengeHabits.completeChallengeHabit);

  const handleCreateHabit = async (habitName: string) => {
    try {
      await createHabitFromChallenge({
        challengeId,
        userId,
        habitName,
      });
      alert(`Created habit: ${habitName}`);
    } catch (error) {
      console.error("Error creating habit:", error);
      alert("Failed to create habit: " + (error as Error).message);
    }
  };

  const handleCompleteHabit = async () => {
    if (!selectedHabit || !completionProof.trim()) {
      alert("Please provide proof of completion!");
      return;
    }

    try {
      const result = await completeChallengeHabit({
        challengeId,
        userId,
        habitId: selectedHabit as Id<"habits">,
      });
      
      console.log("✅ Challenge habit completed:", result);
      setShowCompletionModal(false);
      setSelectedHabit(null);
      setCompletionProof("");
      
      // Show success effect
      showCompletionEffect(result.pointsEarned || 0);
    } catch (error) {
      console.error("❌ Error completing challenge habit:", error);
      alert("Failed to complete habit: " + (error as Error).message);
    }
  };

  const showCompletionEffect = (pointsEarned: number) => {
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #10B981, #059669, #10B981);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: challengeHabitComplete 3s ease-in-out;
        padding: 2rem;
        text-align: center;
      ">
        <div>🎯 CHALLENGE HABIT COMPLETE! 🎯</div>
        <div style="font-size: 1.5rem; margin-top: 1rem;">+${pointsEarned} Challenge Points!</div>
        <div style="font-size: 1.2rem; margin-top: 1rem;">Keep up the great work!</div>
      </div>
      <style>
        @keyframes challengeHabitComplete {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.05); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 3000);
  };

  const isHabitCompletedToday = (habitId: string) => {
    if (!challengeCompletions) return false;
    return challengeCompletions.some(completion => 
      completion.habitId === habitId && 
      new Date(completion.completedAt).toDateString() === new Date().toDateString()
    );
  };

  const getHabitStatus = (habitName: string) => {
    const existingHabit = userHabits?.find(habit => habit.name === habitName);
    if (!existingHabit) return "not_created";
    
    const isCompleted = isHabitCompletedToday(existingHabit._id);
    return isCompleted ? "completed" : "available";
  };

  if (targetHabits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Challenge Habits</h2>
        <p className="text-gray-500 text-sm">No specific habits defined for this challenge.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">🎯 Challenge Habits</h2>
          <div className="text-sm text-gray-600">
            Complete these habits to earn challenge points!
          </div>
        </div>
        
        <div className="space-y-3">
          {targetHabits.map((habitName, index) => {
            const status = getHabitStatus(habitName);
            const existingHabit = userHabits?.find(habit => habit.name === habitName);
            
            return (
              <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                status === "completed" 
                  ? "bg-green-50 border-green-200" 
                  : status === "available"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {status === "completed" ? "✅" : status === "available" ? "🎯" : "📝"}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{habitName}</div>
                      <div className="text-sm text-gray-600">
                        {status === "completed" 
                          ? "Completed today! +10 points" 
                          : status === "available"
                          ? "Ready to complete - Click to earn points!"
                          : "Create this habit first"
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {status === "not_created" && (
                      <button
                        onClick={() => handleCreateHabit(habitName)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Create Habit
                      </button>
                    )}
                    
                    {status === "available" && existingHabit && (
                      <button
                        onClick={() => {
                          setSelectedHabit(existingHabit._id);
                          setShowCompletionModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Complete (+10 pts)
                      </button>
                    )}
                    
                    {status === "completed" && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Complete challenge habits daily to earn points and climb the leaderboard!
          </p>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && selectedHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Complete Challenge Habit</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-green-800 text-lg">
                  {userHabits?.find(h => h._id === selectedHabit)?.name}
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  Complete this habit to earn 10 challenge points!
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                    +10 CHALLENGE POINTS
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔒 Proof Required *
                </label>
                <textarea
                  value={completionProof}
                  onChange={(e) => setCompletionProof(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe how you completed this habit, take a photo, or provide evidence..."
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  You must provide proof to complete this challenge habit!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedHabit(null);
                  setCompletionProof("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteHabit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                🎯 COMPLETE HABIT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
