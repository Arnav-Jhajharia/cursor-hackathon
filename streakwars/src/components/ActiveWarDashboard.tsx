"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActiveWarDashboardProps {
  war: any;
  isChallenger: boolean;
}

export default function ActiveWarDashboard({ war, isChallenger }: ActiveWarDashboardProps) {
  const [showTaunts, setShowTaunts] = useState(false);
  const router = useRouter();

  const opponent = isChallenger ? war.defender : war.challenger;
  const myPoints = isChallenger ? war.challengerPoints : war.defenderPoints;
  const opponentPoints = isChallenger ? war.defenderPoints : war.challengerPoints;
  const pointDifference = myPoints - opponentPoints;

  const getWarStatus = () => {
    if (pointDifference > 0) {
      return { status: "winning", color: "text-green-400", icon: "🔥" };
    } else if (pointDifference < 0) {
      return { status: "losing", color: "text-red-400", icon: "💀" };
    } else {
      return { status: "tied", color: "text-yellow-400", icon: "⚔️" };
    }
  };

  const warStatus = getWarStatus();

  const WAR_TAUNTS = [
    "You're going DOWN! 💥",
    "I'm crushing you! 🚀",
    "Give up already! 😂",
    "This is too easy! 🎯",
    "You're getting DESTROYED! 💀",
    "I'm the champion! 👑",
    "Your defeat is inevitable! ⚔️",
    "I'm unstoppable! 🔥",
    "You can't beat me! 💪",
    "I'm dominating! 🏆"
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 rounded-2xl p-6 mb-4">
      {/* War Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">⚔️</div>
        <h3 className="text-2xl font-bold text-white mb-1">ACTIVE WAR</h3>
        <div className="text-gray-300">
          vs <span className="text-red-400 font-semibold">{opponent?.name}</span>
        </div>
      </div>

      {/* Challenge Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-center">
          <h4 className="text-lg font-bold text-white mb-1">{war.challenge?.name}</h4>
          <p className="text-gray-300 text-sm">{war.challenge?.description}</p>
        </div>
      </div>

      {/* Battle Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-white font-semibold">Battle Progress</div>
          <div className={`font-bold ${warStatus.color}`}>
            {warStatus.icon} You're {warStatus.status.toUpperCase()}
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white">You</span>
              <span className="text-white font-bold">{myPoints} pts</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (myPoints / Math.max(myPoints + opponentPoints, 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400">{opponent?.name}</span>
              <span className="text-red-400 font-bold">{opponentPoints} pts</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (opponentPoints / Math.max(myPoints + opponentPoints, 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stakes */}
      <div className="text-center mb-6">
        <div className="text-xl font-bold text-yellow-400 mb-1">
          💰 {war.stakes} REWARDS AT STAKE
        </div>
        <div className="text-gray-300 text-sm">
          Winner takes ALL, loser gets NOTHING!
        </div>
      </div>

      {/* Point Difference */}
      <div className="text-center mb-6">
        <div className={`text-2xl font-bold ${pointDifference > 0 ? 'text-green-400' : pointDifference < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
          {pointDifference > 0 ? `+${pointDifference}` : pointDifference < 0 ? `${pointDifference}` : '0'} points
        </div>
        <div className="text-gray-300 text-sm">
          {pointDifference > 0 ? "You're ahead!" : pointDifference < 0 ? "You're behind!" : "It's a tie!"}
        </div>
      </div>

      {/* Psychological Warfare */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-white font-semibold">🔥 Psychological Warfare</div>
          <button
            onClick={() => setShowTaunts(!showTaunts)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            {showTaunts ? "Hide" : "Show"} Taunts
          </button>
        </div>
        
        {showTaunts && (
          <div className="space-y-2">
            {WAR_TAUNTS.map((taunt, index) => (
              <button
                key={index}
                className="w-full p-2 bg-red-900 border border-red-600 rounded-lg text-red-200 text-sm hover:bg-red-800 transition-colors"
              >
                {taunt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => router.push(`/war/${war._id}`)}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          🔥 View Live War
        </button>
        <button
          onClick={() => setShowTaunts(!showTaunts)}
          className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          {showTaunts ? "Hide Taunts" : "Show Taunts"}
        </button>
      </div>

      {/* War Rules */}
      <div className="mt-4 text-center text-gray-400 text-xs">
        War continues until challenge ends. No backing out!
      </div>
    </div>
  );
}
