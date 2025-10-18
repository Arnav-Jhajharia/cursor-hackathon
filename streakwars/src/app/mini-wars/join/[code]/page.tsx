"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";

interface JoinMiniWarPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function JoinMiniWarPage({ params }: JoinMiniWarPageProps) {
  const { code } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Find mini war by invite code
  const publicMiniWars = useQuery(api.miniWars.getPublicMiniWars, { limit: 100 });
  const miniWar = publicMiniWars?.find(war => war.inviteCode === code.toUpperCase());

  const joinMiniWarByCode = useMutation(api.miniWars.joinMiniWarByCode);

  const handleJoinMiniWar = async () => {
    if (!currentUser || !miniWar) return;

    setIsJoining(true);
    try {
      await joinMiniWarByCode({
        inviteCode: code.toUpperCase(),
        userId: currentUser._id,
      });

      alert("Successfully joined the mini war!");
      router.push(`/mini-wars/${miniWar._id}`);
    } catch (error) {
      console.error("Error joining mini war:", error);
      alert("Failed to join mini war: " + (error as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to join this mini war</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Setting up your account</p>
        </div>
      </div>
    );
  }

  if (!miniWar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Code</h1>
          <p className="text-gray-600 mb-4">The mini war invite code "{code}" is not valid or has expired</p>
          <button
            onClick={() => router.push("/mini-wars")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Mini Wars
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyParticipant = miniWar.participants.includes(currentUser._id);
  const isFull = miniWar.participants.length >= miniWar.maxParticipants;
  const canJoin = !isAlreadyParticipant && miniWar.status === "waiting" && !isFull;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Mini War</h1>
            <p className="text-gray-600">You've been invited to join an intense 2-hour habit battle!</p>
          </div>

          {/* Mini War Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{miniWar.name}</h2>
            {miniWar.description && (
              <p className="text-gray-600 mb-4">{miniWar.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{miniWar.participants.length}/{miniWar.maxParticipants}</div>
                <div className="text-sm text-gray-500">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{miniWar.stakes * miniWar.participants.length}</div>
                <div className="text-sm text-gray-500">Prize Pool</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">Duration: 2 hours</div>
              <div className="text-sm text-gray-500">Complete as many habits as possible!</div>
            </div>
          </div>

          {/* Status Messages */}
          {isAlreadyParticipant && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <h3 className="font-semibold text-blue-800">You're already in this mini war!</h3>
                  <p className="text-blue-600 text-sm">You can view the mini war details and participate.</p>
                </div>
              </div>
            </div>
          )}

          {!isAlreadyParticipant && isFull && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🚫</div>
                <div>
                  <h3 className="font-semibold text-red-800">Mini War is Full</h3>
                  <p className="text-red-600 text-sm">This mini war has reached its maximum number of participants.</p>
                </div>
              </div>
            </div>
          )}

          {!isAlreadyParticipant && miniWar.status !== "waiting" && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⏰</div>
                <div>
                  <h3 className="font-semibold text-yellow-800">Mini War Not Available</h3>
                  <p className="text-yellow-600 text-sm">This mini war is {miniWar.status} and cannot be joined.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isAlreadyParticipant ? (
              <button
                onClick={() => router.push(`/mini-wars/${miniWar._id}`)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                View Mini War
              </button>
            ) : canJoin ? (
              <button
                onClick={handleJoinMiniWar}
                disabled={isJoining}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Joining..." : "⚡ Join Mini War"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/mini-wars")}
                className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Browse Other Mini Wars
              </button>
            )}
            
            <button
              onClick={() => router.push("/mini-wars")}
              className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Rules */}
          <div className="mt-8 bg-orange-50 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">⚡ Mini War Rules</h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Complete as many habits as possible in 2 hours</li>
              <li>• Winner takes the entire prize pool</li>
              <li>• Ties are broken by total points earned</li>
              <li>• Only habits completed during the war count</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
