import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Join challenge via invite code
export const joinChallengeByCode = mutation({
  args: {
    inviteCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find challenge by invite code
    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!challenge) {
      throw new Error("Invalid invite code");
    }

    if (!challenge.isActive) {
      throw new Error("Challenge is not active");
    }

    if (new Date(challenge.endDate) < new Date()) {
      throw new Error("Challenge has ended");
    }

    // Check if user is already participating
    const existingParticipation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", challenge._id).eq("userId", args.userId)
      )
      .first();

    if (existingParticipation) {
      throw new Error("You are already participating in this challenge");
    }

    // Add user to challenge
    await ctx.db.insert("challengeParticipants", {
      challengeId: challenge._id,
      userId: args.userId,
      joinedAt: Date.now(),
      totalPoints: 0,
      streakCount: 0,
      isActive: true,
    });

    return { success: true, challengeId: challenge._id };
  },
});

// Get public challenges
export const getPublicChallenges = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("endDate"), now)
        )
      )
      .take(args.limit || 20);

    // Get participant counts for each challenge
    const challengesWithDetails = await Promise.all(
      challenges.map(async (challenge) => {
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

// Get challenge by invite code
export const getChallengeByCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!challenge) {
      return null;
    }

    // Get participant count
    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_active", (q) => 
        q.eq("challengeId", challenge._id).eq("isActive", true)
      )
      .collect();

    return {
      ...challenge,
      participantCount: participants.length,
    };
  },
});
