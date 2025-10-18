"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface ChallengesPageProps {
  userId: Id<"users">;
}

export default function ChallengesPage({ userId }: ChallengesPageProps) {
  const [activeTab, setActiveTab] = useState<"active" | "available" | "create">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const activeChallenges = useQuery(api.challenges.getUserActiveChallenges, { userId });
  const availableChallenges = useQuery(api.challenges.getAvailableChallenges, { userId });
  
  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const createChallenge = useMutation(api.challenges.createChallenge);
  const createDefaultChallenges = useMutation(api.challengeSets.createDefaultChallenges);

  const handleJoinChallenge = async (challengeId: Id<"challenges">) => {
    try {
      await joinChallenge({ userId, challengeId });
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Error joining challenge");
    }
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      await createChallenge({
        ...challengeData,
        createdBy: userId,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge");
    }
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Challenges</h1>
        <p className="text-slate-600">Compete with friends and build better habits together</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white border border-slate-200 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
            activeTab === "active"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Active ({activeChallenges?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
            activeTab === "available"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Available ({availableChallenges?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
            activeTab === "create"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Create
        </button>
      </div>

      {/* Active Challenges Tab */}
      {activeTab === "active" && (
        <div>
          {!activeChallenges || activeChallenges.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No active challenges</h3>
              <p className="text-slate-500 text-sm">Join a challenge to start competing with friends</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map((challenge: any) => (
                <div key={challenge._id} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{challenge.name}</h3>
                      <p className="text-slate-600 text-sm">{challenge.description}</p>
                    </div>
                    <div className="text-right bg-indigo-50 px-3 py-2 rounded-lg">
                      <div className="text-xs text-slate-600 font-medium">Rank</div>
                      <div className="text-xl font-bold text-indigo-600">#{challenge.userRank || "?"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center bg-slate-50 rounded-lg py-2.5">
                      <div className="text-lg font-bold text-slate-900">{challenge.userPoints || 0}</div>
                      <div className="text-xs text-slate-600 font-medium">Points</div>
                    </div>
                    <div className="text-center bg-slate-50 rounded-lg py-2.5">
                      <div className="text-lg font-bold text-slate-900">{challenge.participants?.length || 0}</div>
                      <div className="text-xs text-slate-600 font-medium">Players</div>
                    </div>
                    <div className="text-center bg-slate-50 rounded-lg py-2.5">
                      <div className="text-lg font-bold text-slate-900">{challenge.daysRemaining || 0}</div>
                      <div className="text-xs text-slate-600 font-medium">Days Left</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-sm text-slate-700 font-semibold mb-2">Challenge Goals</div>
                    <div className="space-y-1">
                      {challenge.targetHabits?.map((habitId: string, index: number) => (
                        <div key={index} className="text-sm text-slate-600">• {habitId}</div>
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
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No available challenges</h3>
              <p className="text-slate-500 text-sm mb-6">Create a new challenge or load pre-made challenges to get started</p>
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
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all"
              >
                Load Pre-made Challenges
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {availableChallenges.map((challenge: any) => (
                <div key={challenge._id} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{challenge.name}</h3>
                      <p className="text-slate-600 text-sm">{challenge.description}</p>
                    </div>
                    <div className="text-right bg-indigo-50 px-3 py-2 rounded-lg">
                      <div className="text-xs text-slate-600 font-medium">Duration</div>
                      <div className="text-base font-bold text-indigo-600">{challenge.duration || 30}d</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center bg-slate-50 rounded-lg py-2.5">
                      <div className="text-lg font-bold text-slate-900">{challenge.participants?.length || 0}</div>
                      <div className="text-xs text-slate-600 font-medium">Players</div>
                    </div>
                    <div className="text-center bg-slate-50 rounded-lg py-2.5">
                      <div className="text-lg font-bold text-slate-900">{challenge.prize || "$0"}</div>
                      <div className="text-xs text-slate-600 font-medium">Prize</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-slate-700 font-semibold mb-2">Goals</div>
                    <div className="space-y-1">
                      {challenge.targetHabits?.map((habitId: string, index: number) => (
                        <div key={index} className="text-sm text-slate-600">• {habitId}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinChallenge(challenge._id)}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all"
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
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Create Your Challenge</h3>
            <p className="text-slate-500 text-sm mb-6">Design a custom challenge for you and your friends</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all"
            >
              Create Challenge
            </button>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateChallenge}
        />
      )}
    </div>
  );
}

// Create Challenge Modal Component
function CreateChallengeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    prize: "",
    targetHabits: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Create Challenge</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Challenge Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g., 30-Day Fitness Challenge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              placeholder="Describe what this challenge is about..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (days)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                min="1"
                max="365"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Prize Pool</label>
              <input
                type="text"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., $100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
