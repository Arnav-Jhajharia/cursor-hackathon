"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

export default function MiniWarsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Form state for creating mini war
  const [miniWarName, setMiniWarName] = useState("");
  const [miniWarDescription, setMiniWarDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [stakes, setStakes] = useState(100);
  const [isPublic, setIsPublic] = useState(false);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const userMiniWars = useQuery(api.miniWars.getUserMiniWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const publicMiniWars = useQuery(api.miniWars.getPublicMiniWars, { limit: 20 });

  const createMiniWar = useMutation(api.miniWars.createMiniWar);
  const joinMiniWarByCode = useMutation(api.miniWars.joinMiniWarByCode);
  const startMiniWar = useMutation(api.miniWars.startMiniWar);

  const handleCreateMiniWar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const result = await createMiniWar({
        name: miniWarName,
        description: miniWarDescription,
        creatorId: currentUser._id,
        maxParticipants,
        stakes,
        isPublic,
      });

      setShowCreateModal(false);
      setMiniWarName("");
      setMiniWarDescription("");
      setMaxParticipants(8);
      setStakes(100);
      setIsPublic(false);
      
      // Navigate to the mini war page
      router.push(`/mini-wars/${result.miniWarId}`);
    } catch (error) {
      console.error("Error creating mini war:", error);
      alert("Failed to create mini war: " + (error as Error).message);
    }
  };

  const handleJoinMiniWar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await joinMiniWarByCode({
        inviteCode: joinCode.toUpperCase(),
        userId: currentUser._id,
      });

      setShowJoinModal(false);
      setJoinCode("");
      alert("Successfully joined mini war!");
    } catch (error) {
      console.error("Error joining mini war:", error);
      alert("Failed to join mini war: " + (error as Error).message);
    }
  };

  const handleStartMiniWar = async (miniWarId: Id<"miniWars">) => {
    if (!currentUser) return;

    try {
      await startMiniWar({
        miniWarId,
        creatorId: currentUser._id,
      });
      alert("Mini war started! Good luck!");
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
          <p className="text-gray-600">Please sign in to view mini wars</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ Mini Wars ⚡</h1>
          <p className="text-gray-600">2-hour intense habit completion battles! Who can complete the most habits?</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            ⚡ Create Mini War
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            🔗 Join with Code
          </button>
        </div>

        {/* My Mini Wars */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Mini Wars</h2>
          {userMiniWars && userMiniWars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMiniWars.map((miniWar) => (
                <div
                  key={miniWar._id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/mini-wars/${miniWar._id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{miniWar.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      miniWar.status === "waiting" 
                        ? "bg-yellow-100 text-yellow-800"
                        : miniWar.status === "active"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {miniWar.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{miniWar.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>👥 {miniWar.participantCount}/{miniWar.maxParticipants}</span>
                    <span>💰 {miniWar.stakes} rewards</span>
                  </div>
                  {miniWar.isCreator && miniWar.status === "waiting" && miniWar.participantCount >= 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartMiniWar(miniWar._id);
                      }}
                      className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      ⚡ Start War!
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mini Wars Yet</h3>
              <p className="text-gray-600 mb-4">Create your first 2-hour habit battle or join an existing one!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Create Mini War
              </button>
            </div>
          )}
        </div>

        {/* Public Mini Wars */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Mini Wars</h2>
          {publicMiniWars && publicMiniWars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicMiniWars.map((miniWar) => (
                <div
                  key={miniWar._id}
                  onClick={() => router.push(`/mini-wars/${miniWar._id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{miniWar.name}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{miniWar.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>👥 {miniWar.participantCount}/{miniWar.maxParticipants}</span>
                    <span>💰 {miniWar.stakes} rewards</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Public Mini Wars</h3>
              <p className="text-gray-600">Be the first to create a public mini war!</p>
            </div>
          )}
        </div>

        {/* Create Mini War Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Create Mini War</h2>
              <form onSubmit={handleCreateMiniWar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mini War Name
                  </label>
                  <input
                    type="text"
                    value={miniWarName}
                    onChange={(e) => setMiniWarName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Morning Rush"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={miniWarDescription}
                    onChange={(e) => setMiniWarDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="What's this mini war about?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="2"
                      max="8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stakes (rewards)
                    </label>
                    <input
                      type="number"
                      value={stakes}
                      onChange={(e) => setStakes(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="10"
                      max="1000"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Make this mini war public
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Create Mini War
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Mini War Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Mini War</h2>
              <form onSubmit={handleJoinMiniWar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono"
                    placeholder="ABC123"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Join Mini War
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
