import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get current active challenge
export const getCurrentChallenge = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("challenges")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.and(
          q.lte(q.field("startDate"), now),
          q.gte(q.field("endDate"), now)
        )
      )
      .first();
  },
});

// Get all challenges
export const getAllChallenges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("challenges")
      .order("desc")
      .collect();
  },
});

// Get challenge by ID
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.challengeId);
  },
});

// Create a new challenge
export const createChallenge = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    duration: v.number(), // Duration in days
    targetHabits: v.array(v.string()), // Changed to strings for now
    createdBy: v.id("users"),
    prizeType: v.string(),
    prizeAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = now;
    const endDate = now + (args.duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    
    // Generate unique invite code
    const inviteCode = generateInviteCode();
    
    const challengeId = await ctx.db.insert("challenges", {
      name: args.name,
      description: args.description,
      startDate: startDate,
      endDate: endDate,
      targetHabits: args.targetHabits,
      isActive: true,
      prizeType: args.prizeType,
      prizeAmount: args.prizeAmount,
      currency: args.currency,
      createdBy: args.createdBy,
      createdAt: now,
      isPublic: args.isPublic || false,
      inviteCode,
    });

    // Create prize pool if it's a money challenge
    if (args.prizeType === "money" && args.prizeAmount) {
      await ctx.db.insert("prizePools", {
        challengeId,
        totalAmount: args.prizeAmount * 100, // Convert to cents
        currency: args.currency || "USD",
        status: "active",
        createdAt: now,
      });
    }

    return challengeId;
  },
});

// Join a challenge
export const joinChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already participating
    const existingParticipation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (existingParticipation) {
      throw new Error("Already participating in this challenge");
    }

    const now = Date.now();
    return await ctx.db.insert("challengeParticipants", {
      challengeId: args.challengeId,
      userId: args.userId,
      joinedAt: now,
      totalPoints: 0,
      streakCount: 0,
      isActive: true,
    });
  },
});

// Leave a challenge
export const leaveChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (participation) {
      await ctx.db.patch(participation._id, {
        isActive: false,
      });
    }
  },
});

// Get challenge participants
export const getChallengeParticipants = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_active", (q) => 
        q.eq("challengeId", args.challengeId).eq("isActive", true)
      )
      .collect();

    // Get user details for each participant
    const participantsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        return {
          ...participant,
          user,
        };
      })
    );

    // Sort by total points (descending)
    return participantsWithDetails.sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

// Get user's challenge participation
export const getUserChallengeParticipation = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get challenge details for each participation
    const participationsWithDetails = await Promise.all(
      participations.map(async (participation) => {
        const challenge = await ctx.db.get(participation.challengeId);
        return {
          ...participation,
          challenge,
        };
      })
    );

    return participationsWithDetails;
  },
});

// Get challenge leaderboard
export const getChallengeLeaderboard = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_active", (q) => 
        q.eq("challengeId", args.challengeId).eq("isActive", true)
      )
      .collect();

    // Get user details and sort by points
    const leaderboard = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        return {
          userId: participant.userId,
          user,
          totalPoints: participant.totalPoints,
          streakCount: participant.streakCount,
          joinedAt: participant.joinedAt,
        };
      })
    );

    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

// Update challenge participant stats
export const updateChallengeParticipantStats = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    pointsToAdd: v.number(),
    newStreakCount: v.number(),
  },
  handler: async (ctx, args) => {
    const participation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (participation) {
      await ctx.db.patch(participation._id, {
        totalPoints: participation.totalPoints + args.pointsToAdd,
        streakCount: args.newStreakCount,
      });
    }
  },
});

// Get user's active challenges
export const getUserActiveChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get user's active participations
    const participations = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get challenge details and filter for active challenges
    const activeChallenges = await Promise.all(
      participations.map(async (participation) => {
        const challenge = await ctx.db.get(participation.challengeId);
        if (!challenge || !challenge.isActive || challenge.endDate < now) {
          return null;
        }

        // Get all participants for this challenge
        const allParticipants = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge_active", (q) => 
            q.eq("challengeId", challenge._id).eq("isActive", true)
          )
          .collect();

        // Calculate user's rank
        const sortedParticipants = allParticipants.sort((a, b) => b.totalPoints - a.totalPoints);
        const userRank = sortedParticipants.findIndex(p => p.userId === args.userId) + 1;

        // Calculate days remaining
        const daysRemaining = Math.ceil((challenge.endDate - now) / (24 * 60 * 60 * 1000));

        return {
          ...challenge,
          userPoints: participation.totalPoints,
          userRank: userRank,
          participants: allParticipants,
          daysRemaining: daysRemaining,
        };
      })
    );

    return activeChallenges.filter(challenge => challenge !== null);
  },
});

// Get available challenges (not joined by user)
export const getAvailableChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get all active challenges
    const allChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.gte(q.field("endDate"), now))
      .collect();

    // Get user's participations
    const userParticipations = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userChallengeIds = new Set(userParticipations.map(p => p.challengeId));

    // Filter out challenges user is already participating in
    const availableChallenges = allChallenges.filter(challenge => 
      !userChallengeIds.has(challenge._id)
    );

    // Get participant counts for each challenge
    const challengesWithDetails = await Promise.all(
      availableChallenges.map(async (challenge) => {
        const participants = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge_active", (q) => 
            q.eq("challengeId", challenge._id).eq("isActive", true)
          )
          .collect();

        const duration = Math.ceil((challenge.endDate - challenge.startDate) / (24 * 60 * 60 * 1000));

        return {
          ...challenge,
          participants: participants,
          duration: duration,
        };
      })
    );

    return challengesWithDetails;
  },
});

// Invite friends to a challenge
export const inviteFriendsToChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    inviterId: v.id("users"),
    friendIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.createdBy !== args.inviterId) {
      throw new Error("Only the challenge creator can invite friends");
    }

    const invitations = [];
    for (const friendId of args.friendIds) {
      // Check if friend is already invited or participating
      const existingInvitation = await ctx.db
        .query("challengeInvitations")
        .withIndex("by_challenge_invitee", (q) => 
          q.eq("challengeId", args.challengeId).eq("inviteeId", friendId)
        )
        .first();

      const existingParticipation = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge_user", (q) => 
          q.eq("challengeId", args.challengeId).eq("userId", friendId)
        )
        .first();

      if (!existingInvitation && !existingParticipation) {
        const invitationId = await ctx.db.insert("challengeInvitations", {
          challengeId: args.challengeId,
          inviterId: args.inviterId,
          inviteeId: friendId,
          status: "pending",
          createdAt: Date.now(),
        });
        invitations.push(invitationId);
      }
    }

    return invitations;
  },
});

// Get pending challenge invitations for a user
export const getPendingChallengeInvitations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("challengeInvitations")
      .withIndex("by_invitee_status", (q) => 
        q.eq("inviteeId", args.userId).eq("status", "pending")
      )
      .collect();

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const challenge = await ctx.db.get(invitation.challengeId);
        const inviter = await ctx.db.get(invitation.inviterId);
        const invitee = await ctx.db.get(invitation.inviteeId);
        return {
          ...invitation,
          challenge,
          inviter,
          invitee,
        };
      })
    );

    return invitationsWithDetails;
  },
});

// Accept a challenge invitation
export const acceptChallengeInvitation = mutation({
  args: { invitationId: v.id("challengeInvitations") },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been responded to");
    }

    // Update invitation status
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Add user to challenge participants
    await ctx.db.insert("challengeParticipants", {
      challengeId: invitation.challengeId,
      userId: invitation.inviteeId,
      joinedAt: Date.now(),
      totalPoints: 0,
      streakCount: 0,
      isActive: true,
    });

    return { success: true };
  },
});

// Decline a challenge invitation
export const declineChallengeInvitation = mutation({
  args: { invitationId: v.id("challengeInvitations") },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been responded to");
    }

    await ctx.db.patch(args.invitationId, {
      status: "declined",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get friends who can be invited to a challenge
export const getInvitableFriends = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Get user's accepted friends
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .collect();

    const friendIds = friendships.map(f => f.friendId);

    // Get friends who are not already invited or participating
    const invitableFriends = [];
    for (const friendId of friendIds) {
      const existingInvitation = await ctx.db
        .query("challengeInvitations")
        .withIndex("by_challenge_invitee", (q) => 
          q.eq("challengeId", args.challengeId).eq("inviteeId", friendId)
        )
        .first();

      const existingParticipation = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge_user", (q) => 
          q.eq("challengeId", args.challengeId).eq("userId", friendId)
        )
        .first();

      if (!existingInvitation && !existingParticipation) {
        const friend = await ctx.db.get(friendId);
        if (friend) {
          invitableFriends.push(friend);
        }
      }
    }

    return invitableFriends;
  },
});

// Get pending invitations for a specific challenge (for challenge creator)
export const getChallengePendingInvitations = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("challengeInvitations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.inviterId);
        const invitee = await ctx.db.get(invitation.inviteeId);
        return {
          ...invitation,
          inviter,
          invitee,
        };
      })
    );

    return invitationsWithDetails;
  },
});


