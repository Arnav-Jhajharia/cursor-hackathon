"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface SabotageSystemProps {
  warId: Id<"challengeWars">;
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  isChallenger: boolean;
}

export default function SabotageSystem({ warId, challengeId, userId, isChallenger }: SabotageSystemProps) {
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [sabotageIntensity, setSabotageIntensity] = useState(3);
  const [sabotageActive, setSabotageActive] = useState(false);

  const activeSabotage = useQuery(api.challengeWars.getActiveSabotage, { 
    userId, 
    challengeId 
  });
  const userHabits = useQuery(api.habits.getUserActiveHabits, { userId });
  const challenge = useQuery(api.challenges.getChallenge, { challengeId: challengeId });

  const startSabotage = useMutation(api.challengeWars.startSabotage);
  const recordSabotageHabit = useMutation(api.challengeWars.recordSabotageHabit);
  const endSabotage = useMutation(api.challengeWars.endSabotage);
  const completeHabit = useMutation(api.habits.completeHabit);

  useEffect(() => {
    if (activeSabotage) {
      setSabotageActive(true);
    } else {
      setSabotageActive(false);
    }
  }, [activeSabotage]);

  const handleStartSabotage = async () => {
    console.log("🔥 Starting sabotage with warId:", warId, "intensity:", sabotageIntensity);
    try {
      const result = await startSabotage({
        warId,
        intensity: sabotageIntensity,
      });
      console.log("✅ Sabotage started successfully:", result);
      setShowSabotageModal(false);
      setSabotageActive(true);
    } catch (error) {
      console.error("❌ Error starting sabotage:", error);
      alert("Failed to start sabotage: " + (error as Error).message);
    }
  };

  const handleSabotageHabit = async (habitId: Id<"habits">) => {
    try {
      // Complete the habit first
      const completion = await completeHabit({
        habitId,
        userId,
        points: 10, // Standard points for sabotage
      });

      // Record it as a sabotage habit
      await recordSabotageHabit({
        warId,
        habitId,
        points: 10,
      });

      // Show sabotage effect
      showSabotageEffect();
    } catch (error) {
      console.error("Error completing sabotage habit:", error);
      alert("Failed to complete sabotage habit: " + (error as Error).message);
    }
  };

  const handleEndSabotage = async () => {
    try {
      await endSabotage({ warId });
      setSabotageActive(false);
    } catch (error) {
      console.error("Error ending sabotage:", error);
      alert("Failed to end sabotage: " + (error as Error).message);
    }
  };

  const showSabotageEffect = () => {
    // Create dramatic sabotage effect
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #ff0000, #ff6600, #ff0000);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: sabotagePulse 0.5s ease-in-out;
      ">
        💀 SABOTAGE! 💀
      </div>
      <style>
        @keyframes sabotagePulse {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 1000);
  };

  // Render main content
  let mainContent = null;

  if (!isChallenger) {
    // Defender view - show sabotage pressure
    if (activeSabotage) {
      const intensity = activeSabotage.sabotageIntensity || 1;
      const habitsCompleted = activeSabotage.sabotageHabitsCompleted || 0;
      const penaltiesApplied = activeSabotage.sabotagePenaltiesApplied || 0;

      mainContent = (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-red-800">💀 UNDER SABOTAGE ATTACK!</h3>
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
              INTENSITY {intensity}/5
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{habitsCompleted}</div>
              <div className="text-sm text-red-700">Sabotage Habits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{penaltiesApplied}</div>
              <div className="text-sm text-red-700">Penalties Applied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.floor(habitsCompleted / (6 - intensity))}
              </div>
              <div className="text-sm text-red-700">Next Penalty</div>
            </div>
          </div>

          <div className="bg-red-100 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">
              🚨 Your opponent is going HARD! Every habit they complete makes your life worse!
              Complete your own habits to fight back or face the consequences!
            </p>
          </div>
        </div>
      );
    }
  }

  // Challenger view - sabotage controls
  if (isChallenger && !sabotageActive) {
    mainContent = (
      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-bold text-orange-800 mb-3">🔥 SABOTAGE SYSTEM</h3>
        <p className="text-orange-700 text-sm mb-4">
          Activate sabotage to make your opponent's life HELL! Complete extra habits to force penalties on them!
        </p>
        <button
          onClick={() => {
            console.log("🔥 ACTIVATE SABOTAGE button clicked!");
            setShowSabotageModal(true);
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors"
        >
          💀 ACTIVATE SABOTAGE
        </button>
      </div>
    );
  }

  // Active sabotage view for challenger
  if (isChallenger && sabotageActive) {
    const intensity = activeSabotage?.sabotageIntensity || 1;
    const habitsCompleted = activeSabotage?.sabotageHabitsCompleted || 0;
    const penaltiesApplied = activeSabotage?.sabotagePenaltiesApplied || 0;

    mainContent = (
      <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-red-800">🔥 SABOTAGE ACTIVE!</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
              INTENSITY {intensity}/5
            </span>
            <button
              onClick={handleEndSabotage}
              className="px-3 py-1 bg-gray-600 text-white rounded-full text-sm font-bold hover:bg-gray-700"
            >
              END
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{habitsCompleted}</div>
            <div className="text-sm text-red-700">Habits Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{penaltiesApplied}</div>
            <div className="text-sm text-red-700">Penalties Applied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Math.ceil((habitsCompleted + 1) / (6 - intensity)) * (6 - intensity) - habitsCompleted}
            </div>
            <div className="text-sm text-red-700">Until Next Penalty</div>
          </div>
        </div>

        <div className="bg-red-100 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm font-medium">
            💀 Every habit you complete makes your opponent suffer! Go HARD!
          </p>
        </div>

        {/* Sabotage Habit Buttons */}
        {userHabits && userHabits.length > 0 && (
          <div>
            <h4 className="font-bold text-red-800 mb-2">SABOTAGE HABITS:</h4>
            <div className="grid grid-cols-2 gap-2">
              {userHabits.slice(0, 6).map((habit) => (
                <button
                  key={habit._id}
                  onClick={() => handleSabotageHabit(habit._id)}
                  className="p-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-sm"
                >
                  💀 {habit.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {mainContent}
      
      {/* Sabotage Intensity Modal */}
      {showSabotageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💀 ACTIVATE SABOTAGE</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sabotage Intensity (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSabotageIntensity(level)}
                      className={`w-12 h-12 rounded-lg font-bold text-white transition-colors ${
                        sabotageIntensity === level
                          ? "bg-red-600"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Higher intensity = fewer habits needed to apply penalties
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">Sabotage Effects:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Every habit you complete applies pressure to your opponent</li>
                  <li>• Higher intensity = more frequent penalties</li>
                  <li>• Your opponent will face extra dares, verification, and coin losses</li>
                  <li>• The more you sabotage, the worse their experience becomes!</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSabotageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSabotage}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                💀 ACTIVATE SABOTAGE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
