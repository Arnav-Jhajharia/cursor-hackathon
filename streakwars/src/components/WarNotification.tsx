"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface WarNotificationProps {
  war: any;
  onWarResolved: () => void;
}

export default function WarNotification({ war, onWarResolved }: WarNotificationProps) {
  const [isResponding, setIsResponding] = useState(false);
  const acceptWar = useMutation(api.challengeWars.acceptWar);
  const declineWar = useMutation(api.challengeWars.declineWar);

  const timeRemaining = Math.max(0, war.expiresAt - Date.now());
  const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      await acceptWar({ warId: war._id });
      onWarResolved();
    } catch (error: any) {
      alert(error.message || "Error accepting war");
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await declineWar({ warId: war._id });
      onWarResolved();
    } catch (error: any) {
      alert(error.message || "Error declining war");
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-900 to-black border-2 border-red-600 rounded-2xl p-6 mb-4 animate-pulse">
      {/* War Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">⚔️</div>
        <h3 className="text-2xl font-bold text-red-400 mb-1">WAR DECLARED!</h3>
        <div className="text-white font-semibold">
          <span className="text-red-400">{war.challenger?.name}</span> challenges you to battle!
        </div>
      </div>

      {/* Challenge Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="text-center">
          <h4 className="text-lg font-bold text-white mb-1">{war.challenge?.name}</h4>
          <p className="text-gray-300 text-sm">{war.challenge?.description}</p>
        </div>
      </div>

      {/* Stakes */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-yellow-400 mb-1">
          💰 {war.stakes} REWARDS AT STAKE
        </div>
        <div className="text-red-300 text-sm">
          Winner takes ALL, loser gets NOTHING!
        </div>
      </div>

      {/* Taunt */}
      {war.taunt && (
        <div className="bg-red-800 border border-red-600 rounded-lg p-3 mb-4">
          <div className="text-red-200 text-center font-semibold">
            "{war.taunt}"
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="text-center mb-4">
        <div className="text-lg font-bold text-white">
          ⏰ {hoursLeft}h {minutesLeft}m to respond
        </div>
        <div className="text-red-300 text-sm">
          Decline = Automatic loss + "COWARD" badge
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleDecline}
          disabled={isResponding}
          className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {isResponding ? "..." : "😰 Decline (Coward)"}
        </button>
        <button
          onClick={handleAccept}
          disabled={isResponding}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isResponding ? "..." : "⚔️ ACCEPT WAR ⚔️"}
        </button>
      </div>
    </div>
  );
}
