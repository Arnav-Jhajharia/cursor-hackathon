"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface WarPressureSystemProps {
  children: React.ReactNode;
}

export default function WarPressureSystem({ children }: WarPressureSystemProps) {
  const { user } = useUser();
  const [showRickRoll, setShowRickRoll] = useState(false);
  const [frozenButtons, setFrozenButtons] = useState<string[]>([]);
  const [showDareModal, setShowDareModal] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [coinPenalty, setCoinPenalty] = useState(0);
  const [warPressure, setWarPressure] = useState<any>(null);

  // Get current user and pending wars
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const pendingWars = useQuery(api.challengeWars.getPendingWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  useEffect(() => {
    if (pendingWars && pendingWars.length > 0) {
      const totalPressure = pendingWars.length;
      setWarPressure({ count: totalPressure, wars: pendingWars });

      // Apply pressure based on number of pending wars
      if (totalPressure >= 1) {
        // Level 1: Rick Roll (10% chance)
        if (Math.random() < 0.1) {
          setShowRickRoll(true);
          setTimeout(() => setShowRickRoll(false), 5000);
        }
      }

      if (totalPressure >= 2) {
        // Level 2: Freeze random buttons
        const buttonsToFreeze = ['create-habit', 'join-challenge', 'add-friend'];
        const randomButton = buttonsToFreeze[Math.floor(Math.random() * buttonsToFreeze.length)];
        setFrozenButtons(prev => [...prev, randomButton]);
      }

      if (totalPressure >= 3) {
        // Level 3: Force dare completion
        if (Math.random() < 0.3) {
          setShowDareModal(true);
        }
      }

      if (totalPressure >= 4) {
        // Level 4: Require verification for actions
        setVerificationRequired(true);
      }

      if (totalPressure >= 5) {
        // Level 5: Coin penalty
        setCoinPenalty(totalPressure * 5);
      }
    } else {
      // Reset all pressure when no wars
      setWarPressure(null);
      setFrozenButtons([]);
      setShowDareModal(false);
      setVerificationRequired(false);
      setCoinPenalty(0);
    }
  }, [pendingWars]);

  // Rick Roll Modal
  if (showRickRoll) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">🎵 WAR PRESSURE 🎵</h2>
          <p className="text-gray-700 mb-4">Someone declared war on you! Time to feel the pressure...</p>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 italic">
              "Never gonna give you up, never gonna let you down... 
              But your opponents will! 💀"
            </p>
          </div>
          <button
            onClick={() => setShowRickRoll(false)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Accept My Fate 😭
          </button>
        </div>
      </div>
    );
  }

  // Dare Modal
  if (showDareModal) {
    return (
      <div className="fixed inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-red-900 to-black rounded-2xl p-8 max-w-lg text-center border-2 border-red-600">
          <h2 className="text-3xl font-bold text-white mb-4">⚔️ WAR DARE ⚔️</h2>
          <p className="text-red-200 mb-6">
            You have {warPressure?.count} pending wars! Complete this dare to reduce pressure:
          </p>
          
          <div className="bg-red-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">🎯 DARE CHALLENGE</h3>
            <p className="text-red-100 mb-4">
              Record yourself doing 10 push-ups while saying "I will not lose this war!" 
              and post it to your story.
            </p>
            <div className="text-sm text-red-300">
              ⏰ Time limit: 2 hours<br/>
              💰 Reward: -1 war pressure level<br/>
              💀 Failure: +2 war pressure levels
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowDareModal(false);
                // TODO: Implement dare completion tracking
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ✅ Accept Dare
            </button>
            <button
              onClick={() => {
                setShowDareModal(false);
                // Increase pressure for declining
                setCoinPenalty(prev => prev + 20);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              😤 Decline (Penalty)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verification Modal
  if (verificationRequired) {
    return (
      <div className="fixed inset-0 bg-yellow-900 bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-yellow-900 to-orange-900 rounded-2xl p-8 max-w-md text-center border-2 border-yellow-600">
          <h2 className="text-2xl font-bold text-white mb-4">🔒 VERIFICATION REQUIRED</h2>
          <p className="text-yellow-200 mb-6">
            You have {warPressure?.count} pending wars! Prove you're not a bot:
          </p>
          
          <div className="bg-yellow-800 rounded-lg p-6 mb-6">
            <p className="text-yellow-100 mb-4">
              Type "I WILL WIN THIS WAR" to continue:
            </p>
            <input
              type="text"
              placeholder="I WILL WIN THIS WAR"
              className="w-full px-3 py-2 bg-yellow-700 text-white rounded-lg border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value === "I WILL WIN THIS WAR") {
                  setVerificationRequired(false);
                }
              }}
            />
          </div>

          <button
            onClick={() => setVerificationRequired(false)}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Skip (Add Pressure)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* War Pressure Indicator */}
      {warPressure && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-red-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔️</span>
              <span className="font-bold">{warPressure.count} WAR{warPressure.count > 1 ? 'S' : ''}</span>
            </div>
            <div className="text-xs text-red-200">
              Pressure Level: {Math.min(warPressure.count, 5)}/5
            </div>
          </div>
        </div>
      )}

      {/* Coin Penalty Display */}
      {coinPenalty > 0 && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-orange-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="font-bold">-{coinPenalty} coins</span>
            </div>
            <div className="text-xs text-orange-200">
              War penalty active
            </div>
          </div>
        </div>
      )}

      {/* Frozen Button Overlay */}
      {frozenButtons.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {frozenButtons.map((buttonId) => (
            <div
              key={buttonId}
              className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center"
            >
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-800">
                <div className="text-center">
                  <div className="text-2xl mb-2">❄️</div>
                  <div className="font-bold">BUTTON FROZEN</div>
                  <div className="text-sm">Complete pending wars to unfreeze!</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content with Pressure Effects */}
      <div className={warPressure ? "opacity-90 filter grayscale-10" : ""}>
        {children}
      </div>
    </div>
  );
}
