"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function GroupsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Form state for creating group
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupCategory, setGroupCategory] = useState("general");
  const [isPublic, setIsPublic] = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const userGroups = useQuery(api.groups.getUserGroups, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const publicGroups = useQuery(api.groups.getPublicGroups, { limit: 20 });

  const createGroup = useMutation(api.groups.createGroup);
  const joinGroupByCode = useMutation(api.groups.joinGroupByCode);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const result = await createGroup({
        name: groupName,
        description: groupDescription,
        leaderId: currentUser._id,
        isPublic,
        maxMembers,
        category: groupCategory,
      });

      setShowCreateModal(false);
      setGroupName("");
      setGroupDescription("");
      setGroupCategory("general");
      setIsPublic(false);
      setMaxMembers(10);
      
      // Navigate to the new group
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group: " + (error as Error).message);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await joinGroupByCode({
        inviteCode: joinCode.toUpperCase(),
        userId: currentUser._id,
      });

      setShowJoinModal(false);
      setJoinCode("");
      alert("Successfully joined group!");
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group: " + (error as Error).message);
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view groups</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Groups & Teams</h1>
          <p className="text-gray-600">Create or join groups to compete together in challenges!</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            ➕ Create Group
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            🔗 Join with Code
          </button>
        </div>

        {/* My Groups */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Groups</h2>
          {userGroups && userGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups?.filter((group): group is NonNullable<typeof group> => group !== null).map((group) => (
                <div
                  key={group._id}
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      group.userRole === "leader" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {group.userRole}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>👥 {group.memberCount} members</span>
                    <span className="capitalize">{group.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
              <p className="text-gray-600 mb-4">Create your first group or join an existing one!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Group
              </button>
            </div>
          )}
        </div>

        {/* Public Groups */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Groups</h2>
          {publicGroups && publicGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicGroups?.filter((group): group is NonNullable<typeof group> => group !== null).map((group) => (
                <div
                  key={group._id}
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>👥 {group.memberCount} members</span>
                    <span className="capitalize">{group.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Public Groups</h3>
              <p className="text-gray-600">Be the first to create a public group!</p>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={groupCategory}
                    onChange={(e) => setGroupCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="fitness">Fitness</option>
                    <option value="work">Work</option>
                    <option value="friends">Friends</option>
                    <option value="study">Study</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Members
                  </label>
                  <input
                    type="number"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2"
                    max="50"
                  />
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
                    Make this group public
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Group</h2>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
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
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Join Group
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
