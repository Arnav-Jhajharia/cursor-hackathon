"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

interface MiniWarPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MiniWarPage({ params }: MiniWarPageProps) {
  const { id } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Get mini war details
  const miniWar = useQuery(api.miniWars.getMiniWar, { miniWarId: id as Id<"miniWars"> });
  const participants = useQuery(api.miniWars.getMiniWarParticipants, { miniWarId: id as Id<"miniWars"> });

  // Get user's habits for quick completion
  const userHabits = useQuery(api.habits.getUserActiveHabits, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Mutations
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const joinMiniWar = useMutation(api.miniWars.joinMiniWar);
  const leaveMiniWar = useMutation(api.miniWars.leaveMiniWar);
  const startMiniWar = useMutation(api.miniWars.startMiniWar);

  // Calculate time left in mini war
  useEffect(() => {
    if (miniWar && miniWar.warStartedAt) {
      const warDuration = 2 * 60 * 60 * 1000; // 2 hours
      const endTime = miniWar.warStartedAt + warDuration;
      const updateTimer = () => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [miniWar]);

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
        notes: "⚡ MINI WAR COMPLETION! ⚡",
      });
      
      // Add some dramatic effect
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error("Error completing habit:", error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes("already completed today")) {
        alert("🔥 This habit was already completed today! Try completing a different habit!");
      } else {
        alert("Error completing habit: " + errorMessage);
      }
      
      setIsUpdating(false);
    }
  };

  const handleJoinMiniWar = async () => {
    if (!currentUser || !miniWar) return;

    try {
      await joinMiniWar({
        miniWarId: miniWar._id,
        userId: currentUser._id,
      });
      alert("Successfully joined the mini war!");
    } catch (error) {
      console.error("Error joining mini war:", error);
      alert("Failed to join mini war: " + (error as Error).message);
    }
  };

  const handleLeaveMiniWar = async () => {
    if (!currentUser || !miniWar) return;

    try {
      await leaveMiniWar({
        miniWarId: miniWar._id,
        userId: currentUser._id,
      });
      alert("Left the mini war");
      router.push("/mini-wars");
    } catch (error) {
      console.error("Error leaving mini war:", error);
      alert("Failed to leave mini war: " + (error as Error).message);
    }
  };

  const handleStartMiniWar = async () => {
    if (!currentUser || !miniWar) return;

    try {
      await startMiniWar({
        miniWarId: miniWar._id,
        creatorId: currentUser._id,
      });
      alert("⚡ Mini war started! Good luck!");
    } catch (error) {
      console.error("Error starting mini war:", error);
      alert("Failed to start mini war: " + (error as Error).message);
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view this mini war</p>
        </div>
      </div>
    );
  }

  if (!miniWar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mini War Not Found</h1>
          <p className="text-gray-600">This mini war doesn't exist or has ended</p>
        </div>
      </div>
    );
  }

  const isParticipant = miniWar.participants.includes(currentUser._id);
  const isCreator = miniWar.creatorId === currentUser._id;
  const canStart = isCreator && miniWar.status === "waiting" && miniWar.participants.length >= 2;
  const canJoin = !isParticipant && miniWar.status === "waiting" && miniWar.participants.length < miniWar.maxParticipants;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-black">
      {/* Mini War Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-orange-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">⚡ MINI WAR ⚡</h1>
              <p className="text-orange-200 text-xl">{miniWar.name}</p>
              {miniWar.description && (
                <p className="text-orange-300 text-sm mt-1">{miniWar.description}</p>
              )}
            </div>
            <div className="text-right">
              {miniWar.status === "active" && (
                <>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-orange-200 text-sm">Time Remaining</div>
                </>
              )}
              <div className={`px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                miniWar.status === "waiting" 
                  ? "bg-yellow-100 text-yellow-800"
                  : miniWar.status === "active"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {miniWar.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mini War Info */}
        <div className="bg-orange-900 bg-opacity-80 rounded-2xl border-2 border-orange-600 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400">{miniWar.participants.length}/{miniWar.maxParticipants}</div>
              <div className="text-orange-200">Participants</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">{miniWar.stakes * miniWar.participants.length}</div>
              <div className="text-orange-200">Total Prize Pool</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">2h</div>
              <div className="text-orange-200">Duration</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {miniWar.status === "waiting" && (
          <div className="flex gap-4 mb-8">
            {canJoin && (
              <button
                onClick={handleJoinMiniWar}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                ⚡ Join Mini War
              </button>
            )}
            {canStart && (
              <button
                onClick={handleStartMiniWar}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                🚀 Start War!
              </button>
            )}
            {isParticipant && !isCreator && (
              <button
                onClick={handleLeaveMiniWar}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Leave Mini War
              </button>
            )}
          </div>
        )}

        {/* Live Leaderboard */}
        {miniWar.status === "active" && participants && (
          <div className="bg-red-900 bg-opacity-80 rounded-2xl border-2 border-red-600 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🏆 LIVE LEADERBOARD 🏆</h2>
            <div className="space-y-4">
              {participants.map((participant, index) => {
                const isCurrentUser = participant.userId === currentUser._id;
                return (
                  <div
                    key={participant._id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0 
                        ? "bg-yellow-600 bg-opacity-50 border-2 border-yellow-400"
                        : isCurrentUser
                        ? "bg-blue-600 bg-opacity-50 border-2 border-blue-400"
                        : "bg-gray-800 bg-opacity-50 border border-gray-600"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 
                          ? "bg-yellow-400 text-black"
                          : isCurrentUser
                          ? "bg-blue-400 text-white"
                          : "bg-gray-400 text-white"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {participant.user?.name || "Unknown"}
                          {isCurrentUser && " (You)"}
                        </div>
                        <div className="text-sm text-gray-300">
                          {participant.habitsCompleted} habits • {participant.pointsEarned} points
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="text-2xl">👑</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Habit Completion */}
        {miniWar.status === "active" && isParticipant && (
          <div className="bg-orange-900 bg-opacity-80 rounded-2xl border-2 border-orange-600 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">⚡ QUICK HABIT COMPLETION ⚡</h3>
            <div className="text-center">
              <button
                onClick={handleQuickHabitComplete}
                disabled={isUpdating || !userHabits || userHabits.length === 0}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={userHabits && userHabits.length > 0 ? `Complete: ${userHabits[0].name}` : "No habits available"}
              >
                ✅ Complete {userHabits && userHabits.length > 0 ? userHabits[0].name : "Habit"}
              </button>
              <p className="text-orange-200 text-sm mt-2">
                Complete habits as fast as possible to climb the leaderboard!
              </p>
            </div>
          </div>
        )}

        {/* Participants List */}
        {miniWar.status === "waiting" && participants && (
          <div className="bg-gray-800 bg-opacity-50 rounded-2xl border border-gray-600 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">👥 Participants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participants.map((participant) => {
                const isCurrentUser = participant.userId === currentUser._id;
                return (
                  <div
                    key={participant._id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      isCurrentUser ? "bg-blue-600 bg-opacity-50" : "bg-gray-700 bg-opacity-50"
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {participant.user?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {participant.user?.name || "Unknown"}
                        {isCurrentUser && " (You)"}
                      </div>
                      <div className="text-sm text-gray-300">
                        {participant.userId === miniWar.creatorId ? "Creator" : "Participant"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {miniWar.status === "completed" && participants && (
          <div className="bg-yellow-900 bg-opacity-80 rounded-2xl border-2 border-yellow-600 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🏆 MINI WAR RESULTS 🏆</h2>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                Winner: {participants[0]?.user?.name || "Unknown"}
              </div>
              <div className="text-orange-200">
                Completed {participants[0]?.habitsCompleted || 0} habits in 2 hours!
              </div>
            </div>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant._id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 
                      ? "bg-yellow-600 bg-opacity-50"
                      : "bg-gray-800 bg-opacity-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-semibold">
                      {participant.user?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="text-white">
                    {participant.habitsCompleted} habits • {participant.pointsEarned} points
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/mini-wars")}
            className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            🏠 Back to Mini Wars
          </button>
          {miniWar.status === "waiting" && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/mini-wars/join/${miniWar.inviteCode}`);
                alert("Invite link copied to clipboard!");
              }}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              📤 Share Invite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
