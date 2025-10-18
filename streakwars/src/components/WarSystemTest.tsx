"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function WarSystemTest() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  
  const currentUser = useQuery(api.users.getUserByClerkId, { clerkId: "test" });
  const challenges = useQuery(api.challenges.getUserActiveChallenges, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const warTargets = useQuery(api.challengeWars.getWarTargets, 
    currentUser && selectedChallenge ? { userId: currentUser._id, challengeId: selectedChallenge as any } : "skip"
  );

  return (
    <div className="bg-gradient-to-br from-orange-900 to-black border-4 border-orange-600 rounded-2xl p-8 mb-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">⚔️🧪</div>
        <h2 className="text-3xl font-bold text-white mb-2">WAR SYSTEM TEST</h2>
        <p className="text-orange-300">Check if the war system is working</p>
      </div>

      <div className="space-y-4">
        <div className="bg-black border-2 border-orange-500 rounded-xl p-4">
          <h3 className="text-lg font-bold text-orange-400 mb-2">📊 System Status:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Current User:</strong> {currentUser ? "✅ Found" : "❌ Not found"}</p>
            <p><strong>Active Challenges:</strong> {challenges ? challenges.length : "Loading..."}</p>
            <p><strong>War Targets:</strong> {warTargets ? warTargets.length : "Loading..."}</p>
          </div>
        </div>

        {challenges && challenges.length > 0 && (
          <div className="bg-black border-2 border-orange-500 rounded-xl p-4">
            <h3 className="text-lg font-bold text-orange-400 mb-2">🎯 Your Challenges:</h3>
            <div className="space-y-2">
              {challenges.map((challenge) => (
                <div key={challenge._id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-white">{challenge.name}</span>
                  <button
                    onClick={() => setSelectedChallenge(challenge._id)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedChallenge === challenge._id 
                        ? "bg-orange-600 text-white" 
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedChallenge && warTargets && (
          <div className="bg-black border-2 border-orange-500 rounded-xl p-4">
            <h3 className="text-lg font-bold text-orange-400 mb-2">⚔️ War Targets:</h3>
            {warTargets.length > 0 ? (
              <div className="space-y-2">
                {warTargets.map((target) => (
                  <div key={target._id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">{target.name}</span>
                    <span className="text-green-400 text-sm">✅ Can declare war</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-400">❌ No war targets found. Make sure you have friends in this challenge!</p>
            )}
          </div>
        )}

        <div className="bg-red-900 border-2 border-red-500 rounded-xl p-4">
          <h3 className="text-lg font-bold text-red-400 mb-2">🚨 If War System Not Working:</h3>
          <ol className="text-red-300 text-sm space-y-1">
            <li>1. Use cleanup panel to clear everything</li>
            <li>2. Go to Friends tab and add friends</li>
            <li>3. Create a new challenge and invite friends</li>
            <li>4. Join the challenge yourself</li>
            <li>5. Go to challenge detail page</li>
            <li>6. Look for "⚔️ Declare War" section</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
