"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import SplitwiseConnect from "../../../components/SplitwiseConnect";
import ChallengeInviteFriends from "../../../components/ChallengeInviteFriends";
import ChallengeShareModal from "../../../components/ChallengeShareModal";
import WarDeclarationModal from "../../../components/WarDeclarationModal";
import WarNotification from "../../../components/WarNotification";
import ActiveWarDashboard from "../../../components/ActiveWarDashboard";
import SabotageChallengeSystem from "../../../components/SabotageChallengeSystem";
import SabotageEffectsSystem from "../../../components/SabotageEffectsSystem";
import SabotageHabitBlocker from "../../../components/SabotageHabitBlocker";
import ChallengeHabitsSection from "../../../components/ChallengeHabitsSection";

export default function ChallengeDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as Id<"challenges">;
  
  const [showSplitwiseConnect, setShowSplitwiseConnect] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWarModal, setShowWarModal] = useState(false);
  const [selectedWarTarget, setSelectedWarTarget] = useState<any>(null);

  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Get challenge details
  const challenge = useQuery(api.challenges.getChallenge, { challengeId });
  const participants = useQuery(api.challenges.getChallengeParticipants, { challengeId });
  const leaderboard = useQuery(api.challenges.getChallengeLeaderboard, { challengeId });
  const prizePool = useQuery(api.splitwise.getPrizePool, { challengeId });
  const challengePendingInvitations = useQuery(api.challenges.getChallengePendingInvitations, { challengeId });
  
  // War system queries
  const pendingWars = useQuery(api.challengeWars.getPendingWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const activeWars = useQuery(api.challengeWars.getActiveWars, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const warTargets = useQuery(api.challengeWars.getWarTargets, 
    currentUser ? { userId: currentUser._id, challengeId } : "skip"
  );

  // Mutations
  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const leaveChallenge = useMutation(api.challenges.leaveChallenge);
  const settleChallenge = useMutation(api.splitwise.settleMoneyChallenge as any);
  const declareWar = useMutation(api.challengeWars.declareWar);
  const launchImmediateCounterSabotage = useMutation(api.sabotageEffects.launchImmediateCounterSabotage);

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

  if (!currentUser || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isParticipant = participants?.some(p => p.userId === currentUser._id);
  const isCreator = challenge.createdBy === currentUser._id;
  const isActive = challenge.isActive;
  const isEnded = new Date(challenge.endDate) < new Date();
  const canJoin = !isParticipant && isActive && !isEnded;
  const canLeave = isParticipant && isActive && !isEnded && !isCreator;

  const handleJoinChallenge = async () => {
    if (!currentUser) return;
    
    // Check if it's a money challenge and user needs Splitwise
    if (challenge.prizeType === "money" && !currentUser.splitwiseUserId) {
      setShowSplitwiseConnect(true);
      return;
    }

    try {
      await joinChallenge({ userId: currentUser._id, challengeId });
      alert("Successfully joined the challenge!");
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Error joining challenge");
    }
  };

  const handleLeaveChallenge = async () => {
    if (!currentUser) return;
    try {
      await leaveChallenge({ userId: currentUser._id, challengeId });
      alert("Successfully left the challenge!");
    } catch (error) {
      console.error("Error leaving challenge:", error);
      alert("Error leaving challenge");
    }
  };

  const handleSettleChallenge = async () => {
    if (!isCreator || !leaderboard || leaderboard.length === 0) return;
    
    const winner = leaderboard[0];
    const participantsData = participants?.map(p => ({
      userId: p.userId,
      email: p.user?.email || "",
      amount: challenge.prizeAmount || 0,
      splitwiseUserId: p.user?.splitwiseUserId,
    })) || [];

    try {
      await settleChallenge({
        challengeId,
        winnerId: winner.userId,
        participants: participantsData,
      });
      alert("Challenge settled successfully! Check Splitwise for the payment.");
    } catch (error) {
      console.error("Error settling challenge:", error);
      alert("Error settling challenge");
    }
  };

  const handleDeclareWar = async (stakes: number, taunt: string) => {
    if (!currentUser || !selectedWarTarget) return;
    
    try {
      await declareWar({
        challengerId: currentUser._id,
        defenderId: selectedWarTarget._id,
        challengeId,
        stakes,
        taunt,
      });
      alert(`🔥 WAR DECLARED! You've challenged ${selectedWarTarget.name} to battle!`);
    } catch (error: any) {
      console.error("Error declaring war:", error);
      alert(error.message || "Error declaring war");
    }
  };

  const handleWarTargetSelect = (target: any) => {
    setSelectedWarTarget(target);
    setShowWarModal(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const getPrizeIcon = () => {
    switch (challenge.prizeType) {
      case "money": return "💰";
      case "rewards": return "🪙";
      default: return "🏆";
    }
  };

  const getPrizeText = () => {
    switch (challenge.prizeType) {
      case "money": 
        return `$${challenge.prizeAmount} ${challenge.currency || 'USD'}`;
      case "rewards": 
        return `${challenge.prizeAmount} App Coins`;
      default: 
        return "Bragging Rights";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sabotage Effects System */}
      <SabotageEffectsSystem userId={currentUser._id} challengeId={challengeId} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Challenges</span>
          </button>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{challenge.name}</h1>
                <p className="text-gray-600 mb-4">{challenge.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⏰</span>
                    <span className={isEnded ? "text-red-600" : "text-green-600"}>
                      {getTimeRemaining()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👥</span>
                    <span>{participants?.length || 0} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getPrizeIcon()}</span>
                  <span className="text-lg font-semibold text-gray-900">{getPrizeText()}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {challenge.prizeType === "money" ? "Real Money Prize" : 
                   challenge.prizeType === "rewards" ? "App Coins Prize" : "No Prize"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 flex-wrap">
              {canJoin && (
                <button
                  onClick={handleJoinChallenge}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Join Challenge
                </button>
              )}
              
              {canLeave && (
                <button
                  onClick={handleLeaveChallenge}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Leave Challenge
                </button>
              )}
              
              {isCreator && isActive && !isEnded && (
                <ChallengeInviteFriends 
                  challengeId={challengeId}
                  userId={currentUser._id}
                />
              )}
              
              {isCreator && challenge.inviteCode && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Share Challenge
                </button>
              )}
              
              {isCreator && isEnded && challenge.prizeType === "money" && prizePool?.status === "active" && (
                <button
                  onClick={handleSettleChallenge}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Settle Challenge
                </button>
              )}
            </div>
          </div>
        </div>

        {/* War Notifications */}
        {currentUser && pendingWars && pendingWars.length > 0 && (
          <div className="mb-6">
            {pendingWars
              .filter(war => war.challengeId === challengeId)
              .map((war) => (
                <WarNotification
                  key={war._id}
                  war={war}
                  onWarResolved={() => {
                    // Refresh data
                    window.location.reload();
                  }}
                />
              ))}
          </div>
        )}

        {/* Active Wars */}
        {currentUser && activeWars && activeWars.length > 0 && (
          <div className="mb-6">
            {activeWars
              .filter(war => war.challengeId === challengeId)
              .map((war) => (
                <div key={war._id}>
                  <ActiveWarDashboard
                    war={war}
                    isChallenger={war.challengerId === currentUser._id}
                  />
                  <SabotageChallengeSystem
                    warId={war._id}
                    challengeId={challengeId}
                    userId={currentUser._id}
                    isChallenger={war.challengerId === currentUser._id}
                  />
                  
                  {/* Counter-Sabotage Section for Defenders */}
                  {war.defenderId === currentUser._id && war.sabotageActive && (
                    <div className="bg-red-900 text-white rounded-2xl border border-red-700 shadow-lg p-6 mt-4">
                      <h3 className="text-xl font-bold mb-4 flex items-center">
                        💀 YOU'RE UNDER SABOTAGE! 💀
                      </h3>
                      <p className="text-red-200 mb-4">
                        Your opponent has activated sabotage against you! Fight back with counter-sabotage!
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const result = await launchImmediateCounterSabotage({ warId: war._id });
                              alert(result.message);
                            } catch (error) {
                              alert("Failed to launch counter-sabotage: " + (error as Error).message);
                            }
                          }}
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                          ⚡ IMMEDIATE COUNTER-SABOTAGE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Splitwise Connect Modal */}
        {showSplitwiseConnect && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Connect Splitwise</h3>
                  <button
                    onClick={() => setShowSplitwiseConnect(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <SplitwiseConnect 
                  userId={currentUser._id} 
                  onConnected={() => {
                    setShowSplitwiseConnect(false);
                    handleJoinChallenge();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Participants */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants ({participants?.length || 0})</h2>
            
            {!participants || participants.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 opacity-50">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No participants yet</h3>
                <p className="text-gray-500 text-sm">Be the first to join this challenge!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {participant.user?.avatar ? (
                          <img
                            src={participant.user.avatar}
                            alt={participant.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {participant.user?.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {participant.user?.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(participant.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {participant.totalPoints} pts
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.streakCount} streak
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leaderboard</h2>
            
            {!leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 opacity-50">🏆</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No participants yet</h3>
                <p className="text-gray-500 text-sm">Be the first to join this challenge!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((participant, index) => (
                  <div
                    key={participant.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? "bg-yellow-50 border border-yellow-200" :
                      index === 1 ? "bg-gray-50 border border-gray-200" :
                      index === 2 ? "bg-orange-50 border border-orange-200" :
                      "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-500 text-white" :
                        "bg-gray-300 text-gray-700"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {participant.user?.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.totalPoints} points
                        </div>
                      </div>
                    </div>
                    
                    {index < 3 && (
                      <div className="text-2xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


        {/* War Targets */}
        {isParticipant && warTargets && warTargets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚔️ Declare War</h2>
            <p className="text-gray-600 mb-4">Challenge your friends to 1v1 battles!</p>
              <div className="grid gap-3 md:grid-cols-2">
                {warTargets.map((target) => (
                  <div
                    key={target._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {target.avatar ? (
                          <img
                            src={target.avatar}
                            alt={target.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {target.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{target.name}</div>
                        <div className="text-sm text-gray-500">{target.currentPoints} points</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleWarTargetSelect(target)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      ⚔️ War
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenge Details */}
          <div className="space-y-6">
            {/* Pending Invitations (for challenge creator) */}
            {isCreator && challengePendingInvitations && challengePendingInvitations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Invitations</h2>
                <div className="space-y-3">
                  {challengePendingInvitations.map((invitation) => (
                      <div key={invitation._id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            {invitation.invitee?.avatar ? (
                              <img
                                src={invitation.invitee.avatar}
                                alt={invitation.invitee.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-semibold text-sm">
                                {invitation.invitee?.name?.charAt(0) || "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {invitation.invitee?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Invited {new Date(invitation.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-yellow-700 font-medium">
                          Pending
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {/* Challenge Habits Section */}
            <ChallengeHabitsSection 
              challengeId={challengeId}
              userId={currentUser._id}
              targetHabits={challenge.targetHabits}
            />

            {/* Prize Pool Details */}
            {challenge.prizeType !== "none" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Prize Pool</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Prize Type:</span>
                    <span className="font-semibold text-gray-900">
                      {getPrizeIcon()} {getPrizeText()}
                    </span>
                  </div>
                  
                  {challenge.prizeType === "money" && prizePool && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Pool:</span>
                        <span className="font-semibold text-gray-900">
                          ${(prizePool.totalAmount / 100).toFixed(2)} {prizePool.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-semibold ${
                          prizePool.status === "settled" ? "text-green-600" :
                          prizePool.status === "active" ? "text-blue-600" :
                          "text-gray-600"
                        }`}>
                          {prizePool.status}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {challenge.inviteCode && (
          <ChallengeShareModal
            challengeId={challengeId}
            inviteCode={challenge.inviteCode}
            challengeName={challenge.name}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* War Declaration Modal */}
        {selectedWarTarget && (
          <WarDeclarationModal
            targetUser={selectedWarTarget}
            challengeId={challengeId}
            challengerId={currentUser._id}
            isOpen={showWarModal}
            onClose={() => {
              setShowWarModal(false);
              setSelectedWarTarget(null);
            }}
            onDeclareWar={handleDeclareWar}
          />
        )}
      </div>
    </div>
  );
}
