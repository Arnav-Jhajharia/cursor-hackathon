"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function WarNotificationBanner() {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const pendingWars = useQuery(api.challengeWars.getPendingWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const warMessages = [
    "⚔️ WAR DECLARED! Someone wants to DESTROY you!",
    "🔥 BATTLE INCOMING! Your opponents are coming for you!",
    "💀 WAR PRESSURE! Multiple enemies are targeting you!",
    "⚡ COMBAT ALERT! You're under attack from all sides!",
    "🎯 WAR TARGET! You're being hunted by challengers!",
    "💥 BATTLE STATIONS! War has been declared on you!",
    "🗡️ COMBAT MODE! Your enemies are closing in!",
    "🚨 WAR EMERGENCY! Multiple wars pending against you!",
  ];

  useEffect(() => {
    if (pendingWars && pendingWars.length > 0) {
      setIsVisible(true);
      
      // Rotate messages every 3 seconds
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % warMessages.length);
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [pendingWars]);

  useEffect(() => {
    setCurrentMessage(warMessages[messageIndex]);
  }, [messageIndex]);

  if (!isVisible || !pendingWars) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg border-b-2 border-red-900">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl animate-pulse">⚔️</span>
              <span className="font-bold text-lg">{currentMessage}</span>
            </div>
            
            <div className="bg-red-800 px-3 py-1 rounded-full border border-red-900">
              <span className="text-sm font-semibold">
                {pendingWars.length} WAR{pendingWars.length > 1 ? 'S' : ''} PENDING
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm text-red-200">
              Pressure Level: {Math.min(pendingWars.length, 5)}/5
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-red-200 hover:text-white transition-colors"
              title="Hide notification (temporarily)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar showing pressure level */}
        <div className="mt-2">
          <div className="w-full bg-red-900 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(pendingWars.length, 5) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pulsing border effect */}
      <div className="absolute inset-0 border-2 border-red-400 animate-ping opacity-20" />
    </div>
  );
}
