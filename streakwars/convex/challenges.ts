import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    prize: v.optional(v.string()),
    targetHabits: v.array(v.string()), // Changed to strings for now
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = now;
    const endDate = now + (args.duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    
    return await ctx.db.insert("challenges", {
      name: args.name,
      description: args.description,
      startDate: startDate,
      endDate: endDate,
      targetHabits: args.targetHabits,
      isActive: true,
      createdAt: now,
    });
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

