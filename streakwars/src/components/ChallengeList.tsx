"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface ChallengeListProps {
  userId: Id<"users">;
}

export default function ChallengeList({ userId }: ChallengeListProps) {
  const currentChallenge = useQuery(api.challenges.getCurrentChallenge);
  const userParticipation = useQuery(api.challenges.getUserChallengeParticipation, { userId });
  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const leaveChallenge = useMutation(api.challenges.leaveChallenge);
  
  const [loadingChallenge, setLoadingChallenge] = useState<string | null>(null);

  const handleJoinChallenge = async (challengeId: Id<"challenges">) => {
    setLoadingChallenge(challengeId);
    try {
      await joinChallenge({ challengeId, userId });
    } catch (error) {
      console.error("Error joining challenge:", error);
    } finally {
      setLoadingChallenge(null);
    }
  };

  const handleLeaveChallenge = async (challengeId: Id<"challenges">) => {
    setLoadingChallenge(challengeId);
    try {
      await leaveChallenge({ challengeId, userId });
    } catch (error) {
      console.error("Error leaving challenge:", error);
    } finally {
      setLoadingChallenge(null);
    }
  };

  const isParticipating = (challengeId: Id<"challenges">) => {
    return userParticipation?.some(p => p.challengeId === challengeId && p.isActive) || false;
  };

  const getParticipation = (challengeId: Id<"challenges">) => {
    return userParticipation?.find(p => p.challengeId === challengeId);
  };

  if (!currentChallenge) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Challenge</h3>
        <p className="text-gray-500">Check back soon for the next monthly challenge!</p>
      </div>
    );
  }

  const participation = getParticipation(currentChallenge._id);
  const participating = isParticipating(currentChallenge._id);

  return (
    <div className="space-y-6">
      {/* Current Challenge */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentChallenge.name}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentChallenge.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                Started: {new Date(currentChallenge.startDate).toLocaleDateString()}
              </span>
              <span>
                Ends: {new Date(currentChallenge.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {participating ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Your Progress</div>
                <div className="text-2xl font-bold text-blue-600">
                  {participation?.totalPoints || 0} pts
                </div>
                <div className="text-sm text-gray-500">
                  {participation?.streakCount || 0} day streak
                </div>
                <button
                  onClick={() => handleLeaveChallenge(currentChallenge._id)}
                  disabled={loadingChallenge === currentChallenge._id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {loadingChallenge === currentChallenge._id ? "Leaving..." : "Leave Challenge"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleJoinChallenge(currentChallenge._id)}
                disabled={loadingChallenge === currentChallenge._id}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loadingChallenge === currentChallenge._id ? "Joining..." : "Join Challenge"}
              </button>
            )}
          </div>
        </div>

        {participating && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Challenge Progress</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {participation?.totalPoints || 0}
                </div>
                <div className="text-sm text-gray-500">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {participation?.streakCount || 0}
                </div>
                <div className="text-sm text-gray-500">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor((Date.now() - currentChallenge.startDate) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-500">Days Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.ceil((currentChallenge.endDate - Date.now()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-500">Days Left</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Challenge Rules */}
      <div className="bg-white rounded-lg p-6 border">
        <h4 className="font-semibold text-gray-900 mb-3">How It Works</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Complete your habits daily to earn points</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Build streaks to earn bonus points</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Top 3 participants win bonus points at the end</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Challenge runs for the entire month</span>
          </li>
        </ul>
      </div>

      {/* Past Challenges */}
      {userParticipation && userParticipation.length > 0 && (
        <div className="bg-white rounded-lg p-6 border">
          <h4 className="font-semibold text-gray-900 mb-3">Your Challenge History</h4>
          <div className="space-y-3">
            {userParticipation
              .filter(p => !p.isActive)
              .map((participation) => (
                <div key={participation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {participation.challenge?.name || "Unknown Challenge"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Final Score: {participation.totalPoints} points
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {participation.challenge?.endDate 
                        ? new Date(participation.challenge.endDate).toLocaleDateString()
                        : "Completed"
                      }
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

