"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface SabotageEffectsSystemProps {
  userId: Id<"users">;
  challengeId: Id<"challenges">;
}

export default function SabotageEffectsSystem({ userId, challengeId }: SabotageEffectsSystemProps) {
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [selectedEscapeTask, setSelectedEscapeTask] = useState<any>(null);
  const [escapeProof, setEscapeProof] = useState("");
  const [showCounterSabotageModal, setShowCounterSabotageModal] = useState(false);

  // Queries
  const sabotageEffects = useQuery(api.sabotageEffects.getSabotageEffects, { userId, challengeId });
  const escapeTasks = useQuery(api.sabotageEffects.getSabotageEscapeTasks, 
    sabotageEffects?.warId ? { warId: sabotageEffects.warId } : "skip"
  );

  // Mutations
  const completeEscapeTask = useMutation(api.sabotageEffects.completeEscapeTask);
  const launchCounterSabotage = useMutation(api.sabotageEffects.launchCounterSabotage);
  const launchImmediateCounterSabotage = useMutation(api.sabotageEffects.launchImmediateCounterSabotage);

  // Apply UI effects based on sabotage status
  useEffect(() => {
    if (sabotageEffects?.isUnderSabotage) {
      applySabotageEffects(sabotageEffects.effects);
    } else {
      removeSabotageEffects();
    }
  }, [sabotageEffects]);

  const applySabotageEffects = (effects: string[]) => {
    const body = document.body;
    
    // Remove any existing sabotage classes
    body.classList.remove("sabotage-gloomy", "sabotage-buttons", "sabotage-extreme");
    
    if (effects.includes("gloomy_ui")) {
      body.classList.add("sabotage-gloomy");
    }
    if (effects.includes("button_malfunctions")) {
      body.classList.add("sabotage-buttons");
    }
    if (effects.includes("extreme_effects")) {
      body.classList.add("sabotage-extreme");
    }
  };

  const removeSabotageEffects = () => {
    const body = document.body;
    body.classList.remove("sabotage-gloomy", "sabotage-buttons", "sabotage-extreme");
  };

  const handleCompleteEscapeTask = async () => {
    if (!selectedEscapeTask || !escapeProof.trim()) {
      alert("Please provide proof of completion!");
      return;
    }

    try {
      const result = await completeEscapeTask({
        warId: sabotageEffects!.warId,
        taskId: selectedEscapeTask.id,
        proof: escapeProof.trim(),
      });

      console.log("✅ Escape task completed:", result);
      setShowEscapeModal(false);
      setSelectedEscapeTask(null);
      setEscapeProof("");

      if (result.sabotageBroken) {
        showSabotageBrokenEffect();
      } else {
        showEscapeTaskCompleteEffect(result.remaining);
      }
    } catch (error) {
      console.error("❌ Error completing escape task:", error);
      alert("Failed to complete escape task: " + (error as Error).message);
    }
  };

  const handleLaunchCounterSabotage = async () => {
    try {
      const result = await launchCounterSabotage({
        warId: sabotageEffects!.warId,
      });

      console.log("💀 Counter-sabotage launched:", result);
      setShowCounterSabotageModal(false);
      showCounterSabotageEffect();
    } catch (error) {
      console.error("❌ Error launching counter-sabotage:", error);
      alert("Failed to launch counter-sabotage: " + (error as Error).message);
    }
  };

  const handleLaunchImmediateCounterSabotage = async () => {
    try {
      const result = await launchImmediateCounterSabotage({
        warId: sabotageEffects!.warId,
      });

      console.log("💀 Immediate counter-sabotage launched:", result);
      showCounterSabotageEffect();
    } catch (error) {
      console.error("❌ Error launching immediate counter-sabotage:", error);
      alert("Failed to launch immediate counter-sabotage: " + (error as Error).message);
    }
  };

  const showSabotageBrokenEffect = () => {
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
        font-size: 3rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: sabotageBroken 4s ease-in-out;
        padding: 2rem;
        text-align: center;
      ">
        <div>🎉 SABOTAGE BROKEN! 🎉</div>
        <div style="font-size: 1.5rem; margin-top: 1rem;">You are FREE!</div>
        <div style="font-size: 1.2rem; margin-top: 1rem;">The darkness lifts...</div>
      </div>
      <style>
        @keyframes sabotageBroken {
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
    }, 4000);
  };

  const showEscapeTaskCompleteEffect = (remaining: number) => {
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #F59E0B, #D97706, #F59E0B);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: escapeTaskComplete 3s ease-in-out;
        padding: 2rem;
        text-align: center;
      ">
        <div>⚡ ESCAPE TASK COMPLETE! ⚡</div>
        <div style="font-size: 1.5rem; margin-top: 1rem;">${remaining} more tasks to break sabotage!</div>
      </div>
      <style>
        @keyframes escapeTaskComplete {
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

  const showCounterSabotageEffect = () => {
    const effect = document.createElement('div');
    effect.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #DC2626, #B91C1C, #DC2626);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        animation: counterSabotage 4s ease-in-out;
        padding: 2rem;
        text-align: center;
      ">
        <div>💀 COUNTER-SABOTAGE! 💀</div>
        <div style="font-size: 1.5rem; margin-top: 1rem;">MAXIMUM INTENSITY!</div>
        <div style="font-size: 1.2rem; margin-top: 1rem;">Your opponent is now under extreme pressure!</div>
      </div>
      <style>
        @keyframes counterSabotage {
          0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          20% { opacity: 1; transform: scale(1.05) rotate(5deg); }
          80% { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(1) rotate(0deg); }
        }
      </style>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => {
      document.body.removeChild(effect);
    }, 4000);
  };

  if (!sabotageEffects?.isUnderSabotage) {
    return null;
  }

  return (
    <>
      {/* Sabotage Status Banner */}
      <div className="fixed top-0 left-0 right-0 bg-red-900 text-white p-4 z-40 text-center font-bold">
        💀 YOU ARE UNDER SABOTAGE! 💀 Intensity: {sabotageEffects.intensity}/10
        <div className="text-sm mt-1">
          Complete escape tasks to break free! Penalties applied: {sabotageEffects.penaltiesApplied}
        </div>
      </div>

      {/* Escape Tasks Panel */}
      <div className="fixed bottom-4 right-4 bg-red-800 text-white p-4 rounded-lg shadow-lg z-30 max-w-sm">
        <h3 className="font-bold text-lg mb-3">🚨 ESCAPE TASKS</h3>
        <p className="text-sm mb-3">
          Complete 3 escape tasks to break the sabotage and regain control!
        </p>
        
        {escapeTasks && escapeTasks.length > 0 && (
          <div className="space-y-2">
            {escapeTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedEscapeTask(task);
                  setShowEscapeModal(true);
                }}
                className="w-full p-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium transition-colors"
              >
                {task.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleLaunchImmediateCounterSabotage}
            className="w-full p-2 bg-red-700 hover:bg-red-600 rounded text-sm font-bold transition-colors"
          >
            ⚡ IMMEDIATE COUNTER-SABOTAGE
          </button>
          <button
            onClick={() => setShowCounterSabotageModal(true)}
            className="w-full p-2 bg-purple-700 hover:bg-purple-600 rounded text-sm font-bold transition-colors"
          >
            💀 MAXIMUM COUNTER-SABOTAGE
          </button>
        </div>
      </div>

      {/* Escape Task Modal */}
      {showEscapeModal && selectedEscapeTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Complete Escape Task</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-bold text-red-800 text-lg">{selectedEscapeTask.name}</h3>
                <p className="text-red-700 text-sm mt-1">{selectedEscapeTask.description}</p>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">
                    Difficulty: {selectedEscapeTask.difficulty}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  🔒 Proof Required *
                </label>
                <textarea
                  value={escapeProof}
                  onChange={(e) => setEscapeProof(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="REQUIRED: Describe how you completed this escape task, take a photo, or provide evidence..."
                  rows={3}
                  required
                />
                <p className="text-xs text-red-600 mt-1">
                  You must provide proof to complete this escape task!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEscapeModal(false);
                  setSelectedEscapeTask(null);
                  setEscapeProof("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteEscapeTask}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                ⚡ COMPLETE ESCAPE TASK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter-Sabotage Modal */}
      {showCounterSabotageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💀 COUNTER-SABOTAGE</h2>
            
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-bold text-purple-800">Launch Maximum Intensity Sabotage</h3>
                <p className="text-purple-700 text-sm mt-1">
                  You've completed your escape tasks. Now launch an even more intense sabotage against your opponent!
                </p>
              </div>

              <div className="bg-red-100 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">💀 COUNTER-SABOTAGE EFFECTS:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Maximum intensity (10/10)</li>
                  <li>• Steal 500 coins from opponent</li>
                  <li>• Apply 5 additional penalties</li>
                  <li>• Extreme UI effects</li>
                  <li>• Block all their actions</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCounterSabotageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchCounterSabotage}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                💀 LAUNCH COUNTER-SABOTAGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sabotage CSS Effects */}
      <style jsx global>{`
        .sabotage-gloomy {
          filter: grayscale(50%) brightness(0.7) contrast(1.2);
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }
        
        .sabotage-gloomy * {
          color: #666 !important;
        }
        
        .sabotage-buttons button {
          animation: buttonGlitch 2s infinite;
          transform: translateX(2px);
        }
        
        .sabotage-buttons button:hover {
          transform: translateX(-2px) scale(0.98);
        }
        
        .sabotage-extreme {
          animation: screenShake 0.5s infinite;
        }
        
        @keyframes buttonGlitch {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(2px); }
          50% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        
        @keyframes screenShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
        }
      `}</style>
    </>
  );
}
