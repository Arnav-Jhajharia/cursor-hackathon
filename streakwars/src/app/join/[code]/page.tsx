"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinChallengePage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.code as string;
  
  const [isJoining, setIsJoining] = useState(false);

  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Get challenge details
  const challenge = useQuery(api.challengeInvites.getChallengeByCode, { inviteCode });
  const joinChallengeByCode = useMutation(api.challengeInvites.joinChallengeByCode);

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

  // Auto-join challenge after user is created (for new sign-ins)
  useEffect(() => {
    if (user && currentUser && challenge && !isJoining) {
      // Check if user is already a participant
      const isAlreadyParticipant = challenge.participants?.some(
        (p: any) => p.userId === currentUser._id
      );
      
      if (!isAlreadyParticipant) {
        // Auto-join the challenge for new users
        handleJoinChallenge();
      }
    }
  }, [user, currentUser, challenge]);

  const handleJoinChallenge = async () => {
    if (!currentUser) return;
    
    setIsJoining(true);
    try {
      const result = await joinChallengeByCode({
        inviteCode,
        userId: currentUser._id,
      });
      
      alert("Successfully joined the challenge!");
      router.push(`/challenges/${result.challengeId}`);
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      alert(error.message || "Error joining challenge");
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    if (!challenge) return "";
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const getPrizeIcon = () => {
    if (!challenge) return "🏆";
    switch (challenge.prizeType) {
      case "money": return "💰";
      case "rewards": return "🪙";
      default: return "🏆";
    }
  };

  const getPrizeText = () => {
    if (!challenge) return "Bragging Rights";
    switch (challenge.prizeType) {
      case "money": 
        return `$${challenge.prizeAmount} ${challenge.currency || 'USD'}`;
      case "rewards": 
        return `${challenge.prizeAmount} App Coins`;
      default: 
        return "Bragging Rights";
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
              You need to sign in to join this challenge. Don't worry, it's quick and free!
            </p>
            <SignInButton mode="modal">
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors">
                Sign In to Join Challenge
              </button>
            </SignInButton>
            <p className="text-sm text-gray-500 mt-4">
              After signing in, you'll automatically be taken to join this challenge
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while user data is being created
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-8xl mb-6 opacity-50">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Invalid Invite Code</h1>
          <p className="text-gray-600 mb-8">The challenge invite code you're looking for doesn't exist or has expired.</p>
          <button
            onClick={() => router.push('/challenges')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Browse Challenges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Challenge</h1>
          <p className="text-gray-600">You've been invited to join this challenge</p>
        </div>

        {/* Challenge Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{challenge.name}</h2>
            <p className="text-gray-600">{challenge.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatDate(challenge.startDate)}
              </div>
              <div className="text-sm text-gray-500">Start Date</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatDate(challenge.endDate)}
              </div>
              <div className="text-sm text-gray-500">End Date</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{getTimeRemaining()}</div>
              <div className="text-sm text-gray-500">Time Left</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{challenge.participantCount}</div>
              <div className="text-sm text-gray-500">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{getPrizeIcon()}</div>
              <div className="text-sm text-gray-500">Prize</div>
            </div>
          </div>

          {/* Prize Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {getPrizeText()}
              </div>
              <div className="text-sm text-gray-500">
                {challenge.prizeType === "money" ? "Real Money Prize" : 
                 challenge.prizeType === "rewards" ? "App Coins Prize" : "No Prize"}
              </div>
            </div>
          </div>

          {/* Target Habits */}
          {challenge.targetHabits && challenge.targetHabits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Target Habits</h3>
              <div className="space-y-2">
                {challenge.targetHabits.map((habit, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">🎯</span>
                    <span className="text-gray-900">{habit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Join Button or Already Joined Message */}
          {challenge.participants?.some((p: any) => p.userId === currentUser._id) ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-green-800 font-semibold mb-2">✅ You're already in this challenge!</div>
                <p className="text-green-700 text-sm">You can view your progress and compete with others.</p>
              </div>
              <button
                onClick={() => router.push(`/challenges/${challenge._id}`)}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
              >
                View Challenge
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinChallenge}
              disabled={isJoining}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join Challenge"}
            </button>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/challenges')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Challenges
          </button>
        </div>
      </div>
    </div>
  );
}
