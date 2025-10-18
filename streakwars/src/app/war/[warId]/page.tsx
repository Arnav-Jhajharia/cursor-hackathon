"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

interface WarPageProps {
  params: Promise<{
    warId: string;
  }>;
}

export default function WarPage({ params }: WarPageProps) {
  const { warId } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Get war details
  const war = useQuery(api.challengeWars.getWarById, { warId: warId as Id<"challengeWars"> });
  
  // Get real-time participant data
  const allParticipants = useQuery(api.challenges.getChallengeParticipants, 
    war ? { challengeId: war.challengeId } : "skip"
  );
  
  // Filter for specific users
  const challengerData = allParticipants?.find(p => p.userId === war?.challengerId);
  const defenderData = allParticipants?.find(p => p.userId === war?.defenderId);

  // Get challenge details
  const challenge = useQuery(api.challenges.getChallenge, 
    war ? { challengeId: war.challengeId } : "skip"
  );

  // Get user details
  const challenger = useQuery(api.users.getUser, 
    war ? { userId: war.challengerId } : "skip"
  );
  const defender = useQuery(api.users.getUser, 
    war ? { userId: war.defenderId } : "skip"
  );

  // Get current user's habits for quick completion
  const userHabits = useQuery(api.habits.getUserActiveHabits, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Mutations for real-time actions
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const updateHabit = useMutation(api.habits.updateHabit);

  // Calculate time left in war
  useEffect(() => {
    if (war && war.warStartedAt) {
      const warDuration = 24 * 60 * 60 * 1000; // 24 hours
      const endTime = war.warStartedAt + warDuration;
      const updateTimer = () => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [war]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleQuickHabitComplete = async () => {
    if (!currentUser || isUpdating || !userHabits || userHabits.length === 0) return;
    
    setIsUpdating(true);
    try {
      // Complete the first available habit
      const habitToComplete = userHabits[0];
      await completeHabit({
        habitId: habitToComplete._id,
        userId: currentUser._id,
        notes: "⚔️ WAR COMPLETION! ⚔️",
      });
      
      // Add some dramatic effect
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error("Error completing habit:", error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes("already completed today")) {
        // Show a friendly message for already completed habits
        alert("🔥 This habit was already completed today! Try completing a different habit or wait until tomorrow!");
      } else {
        alert("Error completing habit: " + errorMessage);
      }
      
      setIsUpdating(false);
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view this war</p>
        </div>
      </div>
    );
  }

  if (!war || !challenger || !defender || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">War Not Found</h1>
          <p className="text-gray-600">This war doesn't exist or has ended</p>
        </div>
      </div>
    );
  }

  const isChallenger = currentUser._id === war.challengerId;
  const isDefender = currentUser._id === war.defenderId;
  const isParticipant = isChallenger || isDefender;

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You are not a participant in this war</p>
        </div>
      </div>
    );
  }

  const challengerPoints = challengerData?.totalPoints || 0;
  const defenderPoints = defenderData?.totalPoints || 0;
  const isWinning = isChallenger ? challengerPoints > defenderPoints : defenderPoints > challengerPoints;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black">
      {/* War Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">⚔️ LIVE WAR ⚔️</h1>
              <p className="text-red-200">{challenge.name}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                {formatTime(timeLeft)}
              </div>
              <div className="text-red-200 text-sm">Time Remaining</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* War Status */}
        <div className="bg-red-900 bg-opacity-80 rounded-2xl border-2 border-red-600 p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🔥 WAR IN PROGRESS 🔥</h2>
            <p className="text-red-200 mb-4">{war.taunt || "No mercy! Only victory!"}</p>
            <div className="text-3xl font-bold text-yellow-400">
              Stakes: {war.stakes} rewards
            </div>
          </div>
        </div>

        {/* Live Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Challenger */}
          <div className={`bg-gradient-to-br rounded-2xl border-2 p-6 ${
            isChallenger 
              ? "from-blue-900 to-blue-800 border-blue-500" 
              : "from-gray-800 to-gray-900 border-gray-600"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {challenger.name?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{challenger.name}</h3>
                  <p className="text-blue-200">Challenger</p>
                </div>
              </div>
              {isChallenger && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {challengerPoints}
                  </div>
                  <div className="text-blue-200 text-sm">Your Points</div>
                </div>
              )}
            </div>
            
            {isChallenger && (
              <div className="space-y-2">
                <div className="text-white font-semibold">Quick Actions:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleQuickHabitComplete}
                    disabled={isUpdating || !userHabits || userHabits.length === 0}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    title={userHabits && userHabits.length > 0 ? `Complete: ${userHabits[0].name}` : "No habits available"}
                  >
                    ✅ Complete {userHabits && userHabits.length > 0 ? userHabits[0].name : "Habit"}
                  </button>
                  <button
                    onClick={() => router.push(`/challenges/${challenge._id}`)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    📊 View Progress
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Defender */}
          <div className={`bg-gradient-to-br rounded-2xl border-2 p-6 ${
            isDefender 
              ? "from-green-900 to-green-800 border-green-500" 
              : "from-gray-800 to-gray-900 border-gray-600"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {defender.name?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{defender.name}</h3>
                  <p className="text-green-200">Defender</p>
                </div>
              </div>
              {isDefender && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {defenderPoints}
                  </div>
                  <div className="text-green-200 text-sm">Your Points</div>
                </div>
              )}
            </div>
            
            {isDefender && (
              <div className="space-y-2">
                <div className="text-white font-semibold">Quick Actions:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleQuickHabitComplete}
                    disabled={isUpdating || !userHabits || userHabits.length === 0}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    title={userHabits && userHabits.length > 0 ? `Complete: ${userHabits[0].name}` : "No habits available"}
                  >
                    ✅ Complete {userHabits && userHabits.length > 0 ? userHabits[0].name : "Habit"}
                  </button>
                  <button
                    onClick={() => router.push(`/challenges/${challenge._id}`)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    📊 View Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Battle Stats */}
        <div className="bg-black bg-opacity-50 rounded-2xl border border-red-600 p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">📊 LIVE BATTLE STATS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{challengerPoints}</div>
              <div className="text-red-200">Challenger Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{defenderPoints}</div>
              <div className="text-red-200">Defender Points</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${isWinning ? "text-green-400" : "text-red-400"}`}>
                {isWinning ? "🔥 WINNING" : "💀 LOSING"}
              </div>
              <div className="text-red-200">Your Status</div>
            </div>
          </div>
        </div>

        {/* Real-time Updates */}
        <div className="bg-red-900 bg-opacity-80 rounded-2xl border-2 border-red-600 p-6">
          <h3 className="text-xl font-bold text-white mb-4">⚡ REAL-TIME UPDATES</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>War is LIVE and updating in real-time!</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Points update automatically as you complete habits</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Winner takes all {war.stakes} rewards!</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.push(`/challenges/${challenge._id}`)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            📊 View Full Challenge
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
