"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";

interface JoinGroupPageProps {
  params: {
    code: string;
  };
}

export default function JoinGroupPage({ params }: JoinGroupPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const joinGroupByCode = useMutation(api.groups.joinGroupByCode);

  // Find group by invite code
  const publicGroups = useQuery(api.groups.getPublicGroups, { limit: 1000 });
  const group = publicGroups?.filter((g): g is NonNullable<typeof g> => g !== null).find(g => g.inviteCode === params.code.toUpperCase());

  const handleJoinGroup = async () => {
    if (!currentUser || isJoining) return;

    setIsJoining(true);
    try {
      const result = await joinGroupByCode({
        inviteCode: params.code.toUpperCase(),
        userId: currentUser._id,
      });

      alert("Successfully joined the group!");
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group: " + (error as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  // Show sign-in prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to sign in to join this group. Don't worry, it's quick and free!
            </p>
            <SignInButton mode="modal">
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors">
                Sign In to Join Group
              </button>
            </SignInButton>
            <p className="text-sm text-gray-500 mt-4">
              After signing in, you'll automatically be taken to join this group
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while getting user data
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite Code</h1>
            <p className="text-gray-600 mb-6">
              The invite code "{params.code}" is not valid or the group no longer exists.
            </p>
            <button
              onClick={() => router.push("/groups")}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Browse Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is already a member
  const isAlreadyMember = group.memberCount > 0; // This is a simplified check

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">👥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
            <p className="text-gray-600 mb-4">{group.description}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Members:</span>
                <p className="text-gray-600">{group.memberCount}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-600 capitalize">{group.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-600">{group.isPublic ? "Public" : "Private"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Max Members:</span>
                <p className="text-gray-600">{group.maxMembers}</p>
              </div>
            </div>
          </div>

          {isAlreadyMember ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-green-800 font-semibold mb-2">✅ You're already in this group!</div>
                <p className="text-green-700 text-sm">You can view the group and participate in challenges.</p>
              </div>
              <button
                onClick={() => router.push(`/groups/${group._id}`)}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
              >
                View Group
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join Group"}
            </button>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/groups")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
