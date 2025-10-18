"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface FriendsListProps {
  userId: Id<"users">;
}

export default function FriendsList({ userId }: FriendsListProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchEmail, setSearchEmail] = useState("");
  
  const friends = useQuery(api.friends.getUserFriends, { userId });
  const friendRequests = useQuery(api.friends.getPendingFriendRequests, { userId });
  const pendingInvitations = useQuery(api.friends.getPendingInvitations, { userId });
  
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.friends.rejectFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const handleSendRequest = async () => {
    if (!searchEmail.trim()) return;
    
    try {
      const result = await sendFriendRequest({ 
        userId: userId, 
        friendEmail: searchEmail.trim() 
      });
      
      if (result.type === "invitation") {
        // Show success message for invitation
        alert(result.message);
      }
      
      setSearchEmail("");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      alert(error.message || "Error sending friend request");
    }
  };

  const handleAcceptRequest = async (friendId: Id<"users">) => {
    try {
      await acceptFriendRequest({ userId, friendId });
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = async (friendId: Id<"users">) => {
    try {
      await rejectFriendRequest({ userId, friendId });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleRemoveFriend = async (friendId: Id<"users">) => {
    try {
      await removeFriend({ userId, friendId });
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "friends"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Friends ({friends?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "requests"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Requests ({friendRequests?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "search"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Add Friend ({pendingInvitations?.length || 0})
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <div>
          {!friends || friends.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends yet</h3>
              <p className="text-gray-500 text-sm">Add friends to compete and stay motivated together!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600">
                          {friend.friend?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.friend?.name}</h3>
                        <p className="text-sm text-gray-500">{friend.friend?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Points</div>
                        <div className="font-bold text-gray-800">{friend.friend?.totalPoints || 0}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.friendId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div>
          {!friendRequests || friendRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">📨</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
              <p className="text-gray-500 text-sm">Friend requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((request: any) => (
                <div key={request._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600">
                          {request.user?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.user?.name}</h3>
                        <p className="text-sm text-gray-500">{request.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.userId)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.userId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add a Friend</h3>
            <p className="text-sm text-gray-500 mb-4">Enter their email address to send a friend request</p>
            <div className="flex space-x-3">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="friend@example.com"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
              />
              <button
                onClick={handleSendRequest}
                disabled={!searchEmail.trim()}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Sent Invitations</h4>
              <div className="space-y-3">
                {pendingInvitations.map((invitation: any) => (
                  <div key={invitation._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">📧</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{invitation.toEmail}</h3>
                          <p className="text-sm text-gray-500">Invitation sent</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
