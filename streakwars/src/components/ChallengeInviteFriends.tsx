"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface ChallengeInviteFriendsProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  onInvitesSent?: () => void;
}

export default function ChallengeInviteFriends({ 
  challengeId, 
  userId, 
  onInvitesSent 
}: ChallengeInviteFriendsProps) {
  const [selectedFriends, setSelectedFriends] = useState<Id<"users">[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const invitableFriends = useQuery(api.challenges.getInvitableFriends, {
    userId,
    challengeId,
  });

  const inviteFriends = useMutation(api.challenges.inviteFriendsToChallenge);

  const handleFriendToggle = (friendId: Id<"users">) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedFriends.length === 0) return;

    try {
      await inviteFriends({
        challengeId,
        inviterId: userId,
        friendIds: selectedFriends,
      });
      
      setSelectedFriends([]);
      setIsOpen(false);
      onInvitesSent?.();
      alert(`Invited ${selectedFriends.length} friend(s) to the challenge!`);
    } catch (error) {
      console.error("Error sending invitations:", error);
      alert("Error sending invitations");
    }
  };

  if (!invitableFriends || invitableFriends.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">
          No friends available to invite to this challenge.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Invite Friends ({invitableFriends.length})
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Invite Friends</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {invitableFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFriends.includes(friend._id)
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => handleFriendToggle(friend._id)}
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {friend.name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{friend.name}</div>
                      <div className="text-sm text-gray-500">{friend.email}</div>
                    </div>
                    {selectedFriends.includes(friend._id) && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedFriends.length} friend(s) selected
                </span>
                <div className="space-x-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvites}
                    disabled={selectedFriends.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Invites
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
