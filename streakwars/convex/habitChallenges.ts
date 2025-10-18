import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Challenge another user's habit completion
export const challengeHabitCompletion = mutation({
  args: {
    completionId: v.id("habitCompletions"),
    challengerId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    // Can't challenge your own completion
    if (completion.userId === args.challengerId) {
      throw new Error("Cannot challenge your own habit completion");
    }

    // Check if already challenged
    const existingChallenge = await ctx.db
      .query("habitChallenges")
      .withIndex("by_completion", (q) => q.eq("completionId", args.completionId))
      .first();

    if (existingChallenge) {
      throw new Error("This completion has already been challenged");
    }

    // Create challenge record
    const challengeId = await ctx.db.insert("habitChallenges", {
      completionId: args.completionId,
      challengerId: args.challengerId,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    // Trigger audit verification
    await ctx.scheduler.runAfter(0, api.habitVerification.triggerAuditVerification, {
      completionId: args.completionId,
      auditReason: `Challenged by user: ${args.reason}`,
    });

    // Create notification for the challenged user
    const habit = await ctx.db.get(completion.habitId);
    const challenger = await ctx.db.get(args.challengerId);
    
    if (habit && challenger) {
      await ctx.db.insert("notifications", {
        userId: completion.userId,
        type: "habit_challenged",
        title: "Habit Completion Challenged",
        message: `${challenger.name} has challenged your "${habit.name}" completion. Please provide verification.`,
        isRead: false,
        data: { 
          challengeId,
          completionId: args.completionId,
          habitId: habit._id,
          habitName: habit.name,
          challengerName: challenger.name,
          reason: args.reason 
        },
        createdAt: Date.now(),
      });
    }

    return challengeId;
  },
});

// Get challenges for a user's completions
export const getUserCompletionChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's completions that have been challenged
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const challengedCompletions = completions.filter(c => c.requiresVerification);

    // Get challenge details for each completion
    const challengesWithDetails = await Promise.all(
      challengedCompletions.map(async (completion) => {
        const challenge = await ctx.db
          .query("habitChallenges")
          .withIndex("by_completion", (q) => q.eq("completionId", completion._id))
          .first();

        const habit = await ctx.db.get(completion.habitId);
        const challenger = challenge ? await ctx.db.get(challenge.challengerId) : null;

        return {
          completion,
          habit,
          challenge,
          challenger,
        };
      })
    );

    return challengesWithDetails.filter(item => item.challenge !== null);
  },
});

// Get challenges made by a user
export const getUserChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("habitChallenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .collect();

    // Get completion and habit details for each challenge
    const challengesWithDetails = await Promise.all(
      challenges.map(async (challenge) => {
        const completion = await ctx.db.get(challenge.completionId);
        const habit = completion ? await ctx.db.get(completion.habitId) : null;
        const challengedUser = completion ? await ctx.db.get(completion.userId) : null;

        return {
          challenge,
          completion,
          habit,
          challengedUser,
        };
      })
    );

    return challengesWithDetails;
  },
});

// Resolve a challenge (admin or system function)
export const resolveChallenge = mutation({
  args: {
    challengeId: v.id("habitChallenges"),
    resolution: v.union(v.literal("upheld"), v.literal("dismissed")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    const completion = await ctx.db.get(challenge.completionId);
    if (!completion) {
      throw new Error("Completion not found");
    }

    // Update challenge status
    await ctx.db.patch(args.challengeId, {
      status: args.resolution,
      resolvedAt: Date.now(),
      adminNotes: args.adminNotes,
    });

    // If challenge is upheld, mark completion as rejected
    if (args.resolution === "upheld") {
      await ctx.db.patch(completion._id, {
        verificationStatus: "rejected",
        verificationResult: {
          verified: false,
          confidence: 0,
          reason: `Challenge upheld: ${args.adminNotes || challenge.reason}`,
          verifiedAt: Date.now(),
        },
      });
    }

    // Create notifications for both users
    const habit = await ctx.db.get(completion.habitId);
    const challenger = await ctx.db.get(challenge.challengerId);
    
    if (habit && challenger) {
      // Notify challenged user
      await ctx.db.insert("notifications", {
        userId: completion.userId,
        type: "challenge_resolved",
        title: `Challenge ${args.resolution === "upheld" ? "Upheld" : "Dismissed"}`,
        message: `Your challenge for "${habit.name}" has been ${args.resolution === "upheld" ? "upheld" : "dismissed"}.`,
        isRead: false,
        data: { 
          challengeId: args.challengeId,
          completionId: completion._id,
          habitId: habit._id,
          habitName: habit.name,
          resolution: args.resolution,
          adminNotes: args.adminNotes 
        },
        createdAt: Date.now(),
      });

      // Notify challenger
      await ctx.db.insert("notifications", {
        userId: challenge.challengerId,
        type: "challenge_resolved",
        title: `Challenge ${args.resolution === "upheld" ? "Upheld" : "Dismissed"}`,
        message: `Your challenge for "${habit.name}" has been ${args.resolution === "upheld" ? "upheld" : "dismissed"}.`,
        isRead: false,
        data: { 
          challengeId: args.challengeId,
          completionId: completion._id,
          habitId: habit._id,
          habitName: habit.name,
          resolution: args.resolution,
          adminNotes: args.adminNotes 
        },
        createdAt: Date.now(),
      });
    }

    return { success: true, resolution: args.resolution };
  },
});

// Get challenge statistics
export const getChallengeStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userChallenges = await ctx.db
      .query("habitChallenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .collect();

    const userCompletions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const challengedCompletions = userCompletions.filter(c => c.requiresVerification);

    const stats = {
      challengesMade: userChallenges.length,
      challengesReceived: challengedCompletions.length,
      challengesUpheld: userChallenges.filter(c => c.status === "upheld").length,
      challengesDismissed: userChallenges.filter(c => c.status === "dismissed").length,
      pendingChallenges: userChallenges.filter(c => c.status === "pending").length,
    };

    return stats;
  },
});
