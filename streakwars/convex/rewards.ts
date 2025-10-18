import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Get user's rewards balance
export const getUserRewardsBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.rewardsBalance || 0;
  },
});

// Get user's rewards transaction history
export const getUserRewardsTransactions = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("rewardsTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// Add rewards to user's balance
export const addRewards = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    description: v.string(),
    challengeId: v.optional(v.id("challenges")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const newBalance = (user.rewardsBalance || 0) + args.amount;

    // Update user's balance
    await ctx.db.patch(args.userId, {
      rewardsBalance: newBalance,
      updatedAt: now,
    });

    // Create transaction record
    await ctx.db.insert("rewardsTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      description: args.description,
      challengeId: args.challengeId,
      createdAt: now,
    });

    return { newBalance, transactionId: "created" };
  },
});

// Spend rewards from user's balance
export const spendRewards = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.rewardsBalance || 0;
    if (currentBalance < args.amount) {
      throw new Error("Insufficient rewards balance");
    }

    const now = Date.now();
    const newBalance = currentBalance - args.amount;

    // Update user's balance
    await ctx.db.patch(args.userId, {
      rewardsBalance: newBalance,
      updatedAt: now,
    });

    // Create transaction record
    await ctx.db.insert("rewardsTransactions", {
      userId: args.userId,
      type: args.type,
      amount: -args.amount, // Negative for spending
      description: args.description,
      createdAt: now,
    });

    return { newBalance, transactionId: "created" };
  },
});

// Award challenge winners
export const awardChallengeWinner = mutation({
  args: {
    challengeId: v.id("challenges"),
    winnerId: v.id("users"),
    rewardAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Add rewards to winner
    await ctx.runMutation(api.rewards.addRewards, {
      userId: args.winnerId,
      amount: args.rewardAmount,
      type: "challenge_win",
      description: `Won challenge: ${challenge.name}`,
      challengeId: args.challengeId,
    });

    // Award participation rewards to all participants
    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const participationReward = Math.floor(args.rewardAmount * 0.1); // 10% of winner's reward

    for (const participant of participants) {
      if (participant.userId !== args.winnerId) {
        await ctx.runMutation(api.rewards.addRewards, {
          userId: participant.userId,
          amount: participationReward,
          type: "challenge_participation",
          description: `Participation reward for: ${challenge.name}`,
          challengeId: args.challengeId,
        });
      }
    }

    return { success: true };
  },
});

// Get rewards leaderboard
export const getRewardsLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit || 10);

    return users
      .map(user => ({
        userId: user._id,
        name: user.name,
        rewardsBalance: user.rewardsBalance || 0,
        totalPoints: user.totalPoints,
      }))
      .sort((a, b) => b.rewardsBalance - a.rewardsBalance);
  },
});
