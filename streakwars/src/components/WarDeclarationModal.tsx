"use client";

import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface WarDeclarationModalProps {
  targetUser: any;
  challengeId: Id<"challenges">;
  challengerId: Id<"users">;
  isOpen: boolean;
  onClose: () => void;
  onDeclareWar: (stakes: number, taunt: string) => void;
}

const WAR_TAUNTS = [
  "I'm about to DESTROY you! 💀",
  "Prepare for humiliation! 🔥",
  "Your streak ends here! ⚔️",
  "Time to show you who's boss! 👑",
  "You're going DOWN! 💥",
  "I challenge you to a duel! 🗡️",
  "Let's see what you're made of! 💪",
  "This is where you FAIL! 🎯",
  "I'm coming for your rewards! 💰",
  "Ready to get CRUSHED? 🚀"
];

export default function WarDeclarationModal({ 
  targetUser, 
  challengeId, 
  challengerId, 
  isOpen, 
  onClose, 
  onDeclareWar 
}: WarDeclarationModalProps) {
  const [stakes, setStakes] = useState(10);
  const [customTaunt, setCustomTaunt] = useState("");
  const [selectedTaunt, setSelectedTaunt] = useState("");

  const handleDeclareWar = () => {
    const taunt = customTaunt.trim() || selectedTaunt || "I challenge you to battle! ⚔️";
    onDeclareWar(stakes, taunt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-red-900 to-black rounded-2xl shadow-2xl w-full max-w-lg border-2 border-red-600">
        <div className="p-8">
          {/* Header with fire effects */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-pulse">⚔️</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2">DECLARE WAR</h2>
            <div className="text-xl text-white font-semibold">
              vs <span className="text-red-400">{targetUser.name}</span>
            </div>
          </div>

          {/* Stakes Selection */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-white mb-3">
              💰 WAR STAKES (Rewards)
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[5, 10, 25, 50, 100, 200].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStakes(amount)}
                  className={`p-3 rounded-lg border-2 font-bold transition-all ${
                    stakes === amount
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:border-red-500"
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={stakes}
              onChange={(e) => setStakes(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-bold text-center"
              placeholder="Custom amount"
              min="1"
            />
          </div>

          {/* Taunt Selection */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-white mb-3">
              🔥 CHOOSE YOUR TAUNT
            </label>
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {WAR_TAUNTS.map((taunt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTaunt(taunt)}
                  className={`w-full p-2 rounded-lg border text-left transition-all ${
                    selectedTaunt === taunt
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:border-red-500"
                  }`}
                >
                  {taunt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTaunt}
              onChange={(e) => setCustomTaunt(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              placeholder="Or write your own taunt..."
              maxLength={100}
            />
          </div>

          {/* Warning */}
          <div className="bg-red-800 border border-red-600 rounded-lg p-4 mb-6">
            <div className="text-red-200 text-sm">
              <div className="font-bold mb-2">⚠️ WAR RULES:</div>
              <ul className="space-y-1">
                <li>• Winner takes ALL stakes from loser</li>
                <li>• Loser gets "DEFEATED" badge</li>
                <li>• War lasts until challenge ends</li>
                <li>• No backing out once accepted!</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeclareWar}
              disabled={stakes < 1}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔥 DECLARE WAR 🔥
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
