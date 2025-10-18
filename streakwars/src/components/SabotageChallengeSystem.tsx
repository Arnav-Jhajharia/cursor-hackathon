"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface SabotageChallengeSystemProps {
  warId: Id<"challengeWars">;
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  isChallenger: boolean;
}

export default function SabotageChallengeSystem({ warId, challengeId, userId, isChallenger }: SabotageChallengeSystemProps) {
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proof, setProof] = useState("");
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [powerToUse, setPowerToUse] = useState(1);

  const availableChallenges = useQuery(api.sabotageChallenges.getAvailableSabotageChallenges, { warId });
  const completedChallenges = useQuery(api.sabotageChallenges.getCompletedSabotageChallenges, { warId });
  const activeSabotage = useQuery(api.challengeWars.getActiveSabotage, { userId, challengeId });

  const completeChallenge = useMutation(api.sabotageChallenges.completeSabotageChallenge);
  const useSabotagePower = useMutation(api.sabotageChallenges.useSabotagePower);

  const totalSabotagePower = activeSabotage?.sabotagePower || 0;
  const totalCompleted = completedChallenges?.length || 0;

  const handleCompleteChallenge = async () => {
    if (!selectedChallenge) return;

    try {
      const result = await completeChallenge({
        warId,
        challengeId: selectedChallenge.id,
        proof: proof.trim() || undefined,
      });

      console.log("✅ Challenge completed:", result);
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      setProof("");
      
      // Show success effect
      showChallengeCompleteEffect(selectedChallenge.name, result.sabotagePowerEarned);
    } catch (error) {
      console.error("❌ Error completing challenge:", error);
      alert("Failed to complete challenge: " + (error as Error).message);
    }
  };

  const handleUseSabotagePower = async () => {
    try {
      const result = await useSabotagePower({
        warId,
        powerToUse,
      });

      console.log("💀 Sabotage power used:", result);
      setShowPowerModal(false);
      setPowerToUse(1);
      
      // Show sabotage effect
      showSabotageEffect(result.powerUsed, result.penaltiesApplied);
    } catch (error) {
      console.error("❌ Error using sabotage power:", error);
      alert("Failed to use sabotage power: " + (error as Error).message);
    }
  };

  const showChallengeCompleteEffect = (challengeName: string, powerEarned: number) => {
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #00ff00, #00cc00, #00ff00);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: challengeComplete 1s ease-in-out;
      ">
        <div>🔥 CHALLENGE COMPLETE! 🔥</div>
        <div style="font-size: 2rem; margin-top: 1rem;">${challengeName}</div>
        <div style="font-size: 2.5rem; margin-top: 1rem;">+${powerEarned} SABOTAGE POWER!</div>
      </div>
      <style>
        @keyframes challengeComplete {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 2000);
  };

  const showSabotageEffect = (powerUsed: number, penaltiesApplied: number) => {
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: sabotagePower 1s ease-in-out;
      ">
        <div>💀 SABOTAGE POWER USED! 💀</div>
        <div style="font-size: 2rem; margin-top: 1rem;">${powerUsed} POWER → ${penaltiesApplied} PENALTIES!</div>
        <div style="font-size: 2rem; margin-top: 1rem;">YOUR OPPONENT IS SUFFERING!</div>
      </div>
      <style>
        @keyframes sabotagePower {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 2000);
  };

  if (!isChallenger) {
    // Defender view - show sabotage pressure
    if (activeSabotage && totalSabotagePower > 0) {
      return (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-red-800">💀 SABOTAGE POWER THREAT!</h3>
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
              {totalSabotagePower} POWER
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalSabotagePower}</div>
              <div className="text-sm text-red-700">Sabotage Power</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalCompleted}</div>
              <div className="text-sm text-red-700">Challenges Completed</div>
            </div>
          </div>

          <div className="bg-red-100 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">
              🚨 Your opponent has completed {totalCompleted} sabotage challenges and has {totalSabotagePower} sabotage power!
              They can use this power to make your life HELL! Complete your own challenges to fight back!
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Challenger view
  return (
    <>
      <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-purple-800">🔥 SABOTAGE CHALLENGE SYSTEM</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
              {totalSabotagePower} POWER
            </span>
            {totalSabotagePower > 0 && (
              <button
                onClick={() => setShowPowerModal(true)}
                className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700"
              >
                USE POWER
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalSabotagePower}</div>
            <div className="text-sm text-purple-700">Sabotage Power</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalCompleted}</div>
            <div className="text-sm text-purple-700">Challenges Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{availableChallenges?.length || 0}</div>
            <div className="text-sm text-purple-700">Available</div>
          </div>
        </div>

        <div className="bg-purple-100 rounded-lg p-3 mb-4">
          <p className="text-purple-800 text-sm font-medium">
            💀 Complete random challenges to earn sabotage power! Use this power to make your opponent suffer!
          </p>
        </div>

        {/* Available Challenges */}
        {availableChallenges && availableChallenges.length > 0 && (
          <div>
            <h4 className="font-bold text-purple-800 mb-2">AVAILABLE CHALLENGES:</h4>
            <div className="grid grid-cols-1 gap-2">
              {availableChallenges.slice(0, 3).map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setShowChallengeModal(true);
                  }}
                  className="p-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{challenge.name}</div>
                      <div className="text-sm opacity-90">{challenge.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">+{challenge.sabotagePower}</div>
                      <div className="text-xs opacity-90">POWER</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed Challenges */}
        {completedChallenges && completedChallenges.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold text-purple-800 mb-2">COMPLETED CHALLENGES:</h4>
            <div className="space-y-1">
              {completedChallenges.slice(0, 3).map((completion) => (
                <div
                  key={completion._id}
                  className="p-2 bg-green-100 text-green-800 rounded-lg text-sm"
                >
                  ✅ {completion.challenge?.name} (+{completion.sabotagePower} power)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Challenge Completion Modal */}
      {showChallengeModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Complete Challenge</h2>
            
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 text-lg">{selectedChallenge.name}</h3>
                <p className="text-purple-700 text-sm mt-1">{selectedChallenge.description}</p>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
                    +{selectedChallenge.sabotagePower} SABOTAGE POWER
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof (Optional)
                </label>
                <textarea
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe how you completed this challenge..."
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Be honest! This is about building real habits and making your opponent suffer!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChallengeModal(false);
                  setSelectedChallenge(null);
                  setProof("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteChallenge}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                🔥 COMPLETE CHALLENGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Use Sabotage Power Modal */}
      {showPowerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💀 Use Sabotage Power</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-bold text-red-800">Current Power: {totalSabotagePower}</h3>
                <p className="text-red-700 text-sm mt-1">
                  Use your sabotage power to make your opponent suffer!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Power to Use (1-{totalSabotagePower})
                </label>
                <input
                  type="number"
                  value={powerToUse}
                  onChange={(e) => setPowerToUse(Math.min(Math.max(1, parseInt(e.target.value) || 1), totalSabotagePower))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="1"
                  max={totalSabotagePower}
                />
              </div>

              <div className="bg-red-100 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  💀 Using {powerToUse} power will apply {Math.floor(powerToUse / 2)} penalties to your opponent!
                  They will lose {powerToUse * 25} coins and face extra challenges!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPowerModal(false);
                  setPowerToUse(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUseSabotagePower}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                💀 USE SABOTAGE POWER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
