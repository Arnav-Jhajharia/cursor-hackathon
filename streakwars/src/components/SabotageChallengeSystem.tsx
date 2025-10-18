"use client";

import { useQuery, useMutation, useAction } from "convex/react";
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

  const availableChallenges = useQuery(api.sabotageChallenges.getPersonalizedSabotageChallenges, { warId, userId });
  const completedChallenges = useQuery(api.sabotageChallenges.getCompletedSabotageChallenges, { warId });
  const activeSabotage = useQuery(api.challengeWars.getActiveSabotage, { userId, challengeId });

  const completeChallenge = useMutation(api.sabotageChallenges.completeSabotageChallenge);
  const useSabotagePower = useMutation(api.sabotageChallenges.useSabotagePower);
  
  // AI Actions (these are actions, not mutations)
  const generateAIPoem = useAction(api.aiSabotageActions.generateAIPoem);
  const generateProgrammingJoke = useAction(api.aiSabotageActions.generateProgrammingJoke);
  const generateTechHaiku = useAction(api.aiSabotageActions.generateTechHaiku);
  const getAILifeAdvice = useAction(api.aiSabotageActions.getAILifeAdvice);
  const generateSciFiStory = useAction(api.aiSabotageActions.generateSciFiStory);
  const verifyAIChallenge = useAction(api.aiSabotageActions.verifyAIChallenge);

  const totalSabotagePower = activeSabotage?.sabotagePower || 0;
  const totalCompleted = completedChallenges?.length || 0;

  const handleCompleteChallenge = async () => {
    if (!selectedChallenge) return;

    try {
      // Handle AI-powered challenges
      if (selectedChallenge.requiresAI) {
        await handleAIChallenge(selectedChallenge);
        return;
      }

      // Handle regular challenges - require proof for verification
      if (!proof.trim()) {
        alert("Please provide proof of completion! Take a photo, write a description, or record evidence of your challenge completion.");
        return;
      }

      // For non-AI challenges, we still want some verification
      const result = await completeChallenge({
        warId,
        challengeId: selectedChallenge.id,
        proof: proof.trim(),
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

  const handleAIChallenge = async (challenge: any) => {
    try {
      let aiResult;
      
      switch (challenge.id) {
        case "ai_poem":
          aiResult = await generateAIPoem({ topic: "coding" });
          break;
        case "ai_joke":
          aiResult = await generateProgrammingJoke({});
          break;
        case "ai_haiku":
          aiResult = await generateTechHaiku({});
          break;
        case "ai_advice":
          aiResult = await getAILifeAdvice({});
          break;
        case "ai_story":
          aiResult = await generateSciFiStory({});
          break;
        default:
          throw new Error("Unknown AI challenge");
      }

      if (aiResult.success) {
        // Now verify the AI result with robust verification
        const verificationResult = await verifyAIChallenge({
          challengeId: challenge.id,
          userResponse: aiResult.result!,
          expectedType: challenge.id.replace('ai_', ''),
        });

        if (verificationResult.success) {
          // Complete the challenge with verified AI result
          const result = await completeChallenge({
            warId,
            challengeId: challenge.id,
            proof: `AI Generated: ${aiResult.result} | Verification: ${verificationResult.result}`,
          });

          console.log("✅ AI Challenge completed and verified:", result);
          setShowChallengeModal(false);
          setSelectedChallenge(null);
          setProof("");
          
          // Show success effect with AI result
          showAIChallengeCompleteEffect(challenge.name, aiResult.result!, verificationResult.sabotagePower || challenge.sabotagePower);
        } else {
          alert(`AI challenge verification failed: ${verificationResult.error || verificationResult.result}`);
        }
      } else {
        alert("AI challenge failed: " + aiResult.error);
      }
    } catch (error) {
      console.error("❌ Error completing AI challenge:", error);
      alert("Failed to complete AI challenge: " + (error as Error).message);
    }
  };

  const handleUseSabotagePower = async () => {
    try {
      const result = await useSabotagePower({
        warId,
      });

      console.log("💀 Sabotage power used:", result);
      setShowPowerModal(false);
      
      // Show sabotage effect
      showSabotageEffect(result.powerUsed, result.penaltiesApplied);
    } catch (error) {
      console.error("❌ Error using sabotage power:", error);
      alert("Failed to use sabotage power: " + (error as Error).message);
    }
  };

  const showAIChallengeCompleteEffect = (challengeName: string, aiResult: string, powerEarned: number) => {
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #8B5CF6, #A855F7, #8B5CF6);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: aiChallengeComplete 3s ease-in-out;
        padding: 2rem;
        text-align: center;
      ">
        <div>🤖 AI CHALLENGE COMPLETE! 🤖</div>
        <div style="font-size: 1.5rem; margin-top: 1rem;">${challengeName}</div>
        <div style="font-size: 1.2rem; margin-top: 1rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; max-width: 80%;">
          "${aiResult}"
        </div>
        <div style="font-size: 2rem; margin-top: 1rem;">+${powerEarned} SABOTAGE POWER!</div>
      </div>
      <style>
        @keyframes aiChallengeComplete {
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
            <button
              onClick={() => setShowPowerModal(true)}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                totalSabotagePower >= 20
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
              disabled={totalSabotagePower < 20}
            >
              {totalSabotagePower >= 20 ? "💀 SABOTAGE" : `${totalSabotagePower}/20`}
            </button>
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
          💀 Complete challenges to earn sabotage power! You need <span className="font-bold text-red-600">20 points</span> to activate sabotage. AI challenges give the most power!
        </p>
        <div className="mt-2 text-xs text-purple-600">
          DEBUG: Current Power: {totalSabotagePower} | Completed: {totalCompleted} | War ID: {warId}
        </div>
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
                      <div className="font-bold flex items-center gap-2">
                        {challenge.name}
                        {challenge.isPersonalized && (
                          <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                            YOUR HABIT
                          </span>
                        )}
                        {challenge.requiresAI && (
                          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-bold">
                            🤖 AI POWERED
                          </span>
                        )}
                      </div>
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

              {!selectedChallenge.requiresAI && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    🔒 Proof Required *
                  </label>
                  <textarea
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="REQUIRED: Describe how you completed this challenge, take a photo, or provide evidence..."
                    rows={3}
                    required
                  />
                  <p className="text-xs text-red-600 mt-1">
                    You must provide proof to complete this challenge!
                  </p>
                </div>
              )}
              
              {selectedChallenge.requiresAI && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-purple-800 text-sm font-medium">
                    🤖 AI Challenge: No proof needed - AI will generate and verify content automatically!
                  </p>
                </div>
              )}

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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💀 ACTIVATE SABOTAGE</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-bold text-red-800">Sabotage Power: {totalSabotagePower}/20</h3>
                <p className="text-red-700 text-sm mt-1">
                  You have enough power to activate MAXIMUM SABOTAGE!
                </p>
              </div>

              <div className="bg-red-100 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">💀 SABOTAGE EFFECTS:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Apply {Math.floor(totalSabotagePower / 2)} penalties to opponent</li>
                  <li>• Steal {totalSabotagePower * 25} coins from them</li>
                  <li>• Maximum intensity pressure</li>
                  <li>• Reset your sabotage power to 0</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPowerModal(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUseSabotagePower}
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