"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import ChallengeBuilder from "../../components/ChallengeBuilder";

export default function ChallengesPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"active" | "available" | "create">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  const activeChallenges = useQuery(api.challenges.getUserActiveChallenges, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const availableChallenges = useQuery(api.challenges.getAvailableChallenges, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const createChallenge = useMutation(api.challenges.createChallenge);
  const createDefaultChallenges = useMutation(api.challengeSets.createDefaultChallenges);

  useEffect(() => {
    if (user && !currentUser) {
      createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
        avatar: user.imageUrl,
      });
    }
  }, [user, currentUser, createOrUpdateUser]);

  const handleJoinChallenge = async (challengeId: Id<"challenges">) => {
    if (!currentUser) return;
    try {
      await joinChallenge({ userId: currentUser._id, challengeId });
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Error joining challenge");
    }
  };

  const handleCreateChallenge = async (challengeData: any) => {
    if (!currentUser) return;
    try {
      await createChallenge({
        ...challengeData,
        createdBy: currentUser._id,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenges</h1>
          <p className="text-gray-600">Compete with friends and build better habits together</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active ({activeChallenges?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "available"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Available ({availableChallenges?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "create"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create Challenge
          </button>
        </div>

        {/* Active Challenges Tab */}
        {activeTab === "active" && (
          <div>
            {!activeChallenges || activeChallenges.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 opacity-50">🏆</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No active challenges</h3>
                <p className="text-gray-500 text-lg mb-8">Join a challenge to start competing with friends!</p>
                <button
                  onClick={() => setActiveTab("available")}
                  className="px-8 py-3 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
                >
                  Browse Challenges
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeChallenges.map((challenge: any) => (
                  <div key={challenge._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.name}</h3>
                      <p className="text-gray-600 text-sm">{challenge.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{challenge.userPoints || 0}</div>
                        <div className="text-xs text-gray-500">Your Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{challenge.participants?.length || 0}</div>
                        <div className="text-xs text-gray-500">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{challenge.daysRemaining || 0}</div>
                        <div className="text-xs text-gray-500">Days Left</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-2">Challenge Goals:</div>
                      <div className="space-y-1">
                        {challenge.targetHabits?.map((habit: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700">• {habit}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Challenges Tab */}
        {activeTab === "available" && (
          <div>
            {!availableChallenges || availableChallenges.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 opacity-50">📋</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No available challenges</h3>
                <p className="text-gray-500 text-lg mb-8">Create a new challenge or load pre-made challenges to get started!</p>
                <div className="space-x-4">
                  <button
                    onClick={async () => {
                      try {
                        await createDefaultChallenges({});
                        alert("Default challenges created! Refresh to see them.");
                      } catch (error) {
                        console.error("Error creating default challenges:", error);
                        alert("Error creating default challenges");
                      }
                    }}
                    className="px-8 py-3 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
                  >
                    Load Pre-made Challenges
                  </button>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
                  >
                    Create Custom Challenge
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableChallenges.map((challenge: any) => (
                  <div key={challenge._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.name}</h3>
                      <p className="text-gray-600 text-sm">{challenge.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{challenge.participants?.length || 0}</div>
                        <div className="text-xs text-gray-500">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{challenge.duration || 30} days</div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-600 mb-2">Challenge Goals:</div>
                      <div className="space-y-1">
                        {challenge.targetHabits?.map((habit: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700">• {habit}</div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinChallenge(challenge._id)}
                      className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
                    >
                      Join Challenge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Challenge Tab */}
        {activeTab === "create" && (
          <div>
            <div className="text-center py-16">
              <div className="text-8xl mb-6 opacity-50">🎯</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Create Your Challenge</h3>
              <p className="text-gray-500 text-lg mb-8">Design a custom challenge for you and your friends</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
              >
                Create Challenge
              </button>
            </div>
          </div>
        )}

        {/* Create Challenge Modal */}
        {showCreateModal && currentUser && (
          <ChallengeBuilder
            userId={currentUser._id}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateChallenge}
          />
        )}
      </div>
    </div>
  );
}

