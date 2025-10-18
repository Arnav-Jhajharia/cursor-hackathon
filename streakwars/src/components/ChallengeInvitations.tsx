"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";

interface ChallengeInvitationsProps {
  userId: Id<"users">;
}

export default function ChallengeInvitations({ userId }: ChallengeInvitationsProps) {
  const pendingInvitations = useQuery(api.challenges.getPendingChallengeInvitations, { userId });
  const acceptInvitation = useMutation(api.challenges.acceptChallengeInvitation);
  const declineInvitation = useMutation(api.challenges.declineChallengeInvitation);

  const handleAcceptInvitation = async (invitationId: Id<"challengeInvitations">) => {
    try {
      await acceptInvitation({ invitationId });
      alert("Challenge invitation accepted! You're now part of the challenge.");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Error accepting invitation");
    }
  };

  const handleDeclineInvitation = async (invitationId: Id<"challengeInvitations">) => {
    try {
      await declineInvitation({ invitationId });
      alert("Challenge invitation declined.");
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Error declining invitation");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Challenge Invitations</h2>
        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          {pendingInvitations.length} pending
        </div>
      </div>

      <div className="space-y-4">
        {pendingInvitations.map((invitation) => (
          <div key={invitation._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {invitation.inviter?.avatar ? (
                    <img
                      src={invitation.inviter.avatar}
                      alt={invitation.inviter.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold">
                      {invitation.inviter?.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {invitation.inviter?.name || "Unknown User"}
                  </div>
                  <div className="text-sm text-gray-500">
                    invited you to a challenge
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(invitation.createdAt)}
              </div>
            </div>

            {invitation.challenge && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{invitation.challenge.name}</h3>
                  <Link
                    href={`/challenges/${invitation.challenge._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-2">{invitation.challenge.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>
                      {new Date(invitation.challenge.startDate).toLocaleDateString()} - 
                      {new Date(invitation.challenge.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🎯</span>
                    <span>{invitation.challenge.targetHabits?.length || 0} habits</span>
                  </div>
                  {invitation.challenge.prizeType && invitation.challenge.prizeType !== "none" && (
                    <div className="flex items-center space-x-1">
                      <span>{invitation.challenge.prizeType === "money" ? "💰" : "🪙"}</span>
                      <span>
                        {invitation.challenge.prizeType === "money" 
                          ? `$${invitation.challenge.prizeAmount} ${invitation.challenge.currency || 'USD'}`
                          : `${invitation.challenge.prizeAmount} App Coins`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleAcceptInvitation(invitation._id)}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
              >
                Accept Challenge
              </button>
              <button
                onClick={() => handleDeclineInvitation(invitation._id)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-400 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
