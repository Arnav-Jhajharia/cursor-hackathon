"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

interface GroupPageProps {
  params: {
    id: string;
  };
}

export default function GroupPage({ params }: GroupPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings form state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);
  const [category, setCategory] = useState("general");

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const groupDetails = useQuery(api.groups.getGroupDetails, { groupId: params.id as Id<"groups"> });
  const groupChallenges = useQuery(api.groupChallenges.getGroupChallengeParticipation, 
    { groupId: params.id as Id<"groups"> }
  );
  const pendingWars = useQuery(api.groupWars.getPendingGroupWars, 
    { groupId: params.id as Id<"groups"> }
  );
  const activeWars = useQuery(api.groupWars.getActiveGroupWars, 
    { groupId: params.id as Id<"groups"> }
  );

  const leaveGroup = useMutation(api.groups.leaveGroup);
  const removeMember = useMutation(api.groups.removeMember);
  const updateGroup = useMutation(api.groups.updateGroup);

  const isLeader = groupDetails?.members?.find(m => m.userId === currentUser?._id)?.role === "leader";
  const isMember = groupDetails?.members?.find(m => m.userId === currentUser?._id);

  const handleLeaveGroup = async () => {
    if (!currentUser || !confirm("Are you sure you want to leave this group?")) return;

    try {
      await leaveGroup({
        groupId: params.id as Id<"groups">,
        userId: currentUser._id,
      });
      router.push("/groups");
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group: " + (error as Error).message);
    }
  };

  const handleRemoveMember = async (memberId: Id<"users">) => {
    if (!currentUser || !confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember({
        groupId: params.id as Id<"groups">,
        leaderId: currentUser._id,
        memberId,
      });
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member: " + (error as Error).message);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await updateGroup({
        groupId: params.id as Id<"groups">,
        userId: currentUser._id,
        name: groupName,
        description: groupDescription,
        isPublic,
        maxMembers,
        category,
      });
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group: " + (error as Error).message);
    }
  };

  const copyInviteCode = () => {
    if (groupDetails?.inviteCode) {
      navigator.clipboard.writeText(groupDetails.inviteCode);
      alert("Invite code copied to clipboard!");
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view this group</p>
        </div>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Group Not Found</h1>
          <p className="text-gray-600">This group doesn't exist or you don't have access to it</p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You are not a member of this group</p>
          <button
            onClick={() => router.push("/groups")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{groupDetails.name}</h1>
              <p className="text-gray-600">{groupDetails.description}</p>
            </div>
            <div className="flex gap-3">
              {isLeader && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ⚙️ Settings
                </button>
              )}
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔗 Invite
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>👥 {groupDetails.memberCount} members</span>
            <span className="capitalize">📂 {groupDetails.category}</span>
            <span>{groupDetails.isPublic ? "🌍 Public" : "🔒 Private"}</span>
            <span>📊 Max: {groupDetails.maxMembers}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Group Wars */}
            {(pendingWars && pendingWars.length > 0) || (activeWars && activeWars.length > 0) ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⚔️ Group Wars</h2>
                
                {/* Pending Wars */}
                {pendingWars && pendingWars.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Wars</h3>
                    <div className="space-y-3">
                      {pendingWars.map((war) => (
                        <div key={war._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-red-900">
                                {war.challengerGroup?.name} declared war on {groupDetails.name}!
                              </p>
                              <p className="text-sm text-red-700">Stakes: {war.stakes} rewards</p>
                              {war.taunt && <p className="text-sm text-red-600 italic">"{war.taunt}"</p>}
                            </div>
                            {isLeader && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // TODO: Implement accept war
                                    console.log("Accept war:", war._id);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => {
                                    // TODO: Implement decline war
                                    console.log("Decline war:", war._id);
                                  }}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Wars */}
                {activeWars && activeWars.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Wars</h3>
                    <div className="space-y-3">
                      {activeWars.map((war) => (
                        <div key={war._id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-orange-900">
                                {war.challengerGroup?.name} vs {war.defenderGroup?.name}
                              </p>
                              <p className="text-sm text-orange-700">Stakes: {war.stakes} rewards</p>
                              <p className="text-sm text-orange-600">
                                Challenge: {war.challenge?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-orange-600">War in progress...</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Group Challenges */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Group Challenges</h2>
              {groupChallenges && groupChallenges.length > 0 ? (
                <div className="space-y-4">
                  {groupChallenges.map((participation) => (
                    <div
                      key={participation._id}
                      onClick={() => router.push(`/challenges/${participation.challengeId}`)}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{participation.challenge?.name}</h3>
                          <p className="text-sm text-gray-600">{participation.challenge?.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{participation.totalPoints} points</p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(participation.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Challenges Yet</h3>
                  <p className="text-gray-600 mb-4">Join challenges as a group to compete together!</p>
                  <button
                    onClick={() => router.push("/challenges")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Members</h2>
              <div className="space-y-3">
                {groupDetails.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {member.user?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    {isLeader && member.role !== "leader" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Group Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/challenges")}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🏆 Join Challenge
                </button>
                <button
                  onClick={() => router.push("/groups")}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  👥 Browse Groups
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚪 Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite to Group</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupDetails.inviteCode || ""}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-center text-lg font-mono"
                    />
                    <button
                      onClick={copyInviteCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/groups/join/${groupDetails.inviteCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/groups/join/${groupDetails.inviteCode}`);
                        alert("Invite link copied to clipboard!");
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Group Settings</h2>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName || groupDetails.name}
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
                    value={groupDescription || groupDetails.description || ""}
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
                    value={category || groupDetails.category || "general"}
                    onChange={(e) => setCategory(e.target.value)}
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
                    value={maxMembers || groupDetails.maxMembers || 10}
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
                    checked={isPublic !== undefined ? isPublic : groupDetails.isPublic}
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
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
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
