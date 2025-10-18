import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Apply war penalty to user's rewards
export const applyWarPenalty = mutation({
  args: {
    userId: v.id("users"),
    penaltyAmount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.rewardsBalance || 0;
    const newBalance = Math.max(0, currentBalance - args.penaltyAmount);

    await ctx.db.patch(args.userId, {
      rewardsBalance: newBalance,
    });

    // Record the penalty transaction
    await ctx.db.insert("rewardsTransactions", {
      userId: args.userId,
      amount: -args.penaltyAmount,
      type: "war_penalty",
      description: args.reason,
      createdAt: Date.now(),
    });

    return {
      previousBalance: currentBalance,
      newBalance,
      penaltyApplied: args.penaltyAmount,
    };
  },
});

// Get user's war penalty status
export const getUserWarPenalties = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const pendingWars = await ctx.db
      .query("challengeWars")
      .withIndex("by_defender", (q) => q.eq("defenderId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const activeWars = await ctx.db
      .query("challengeWars")
      .withIndex("by_defender", (q) => q.eq("defenderId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const totalPenalty = pendingWars.length * 5; // 5 coins per pending war
    const pressureLevel = Math.min(pendingWars.length, 5);

    return {
      pendingWarsCount: pendingWars.length,
      activeWarsCount: activeWars.length,
      totalPenalty,
      pressureLevel,
      effects: {
        rickRoll: pressureLevel >= 1,
        frozenButtons: pressureLevel >= 2,
        dareRequired: pressureLevel >= 3,
        verificationRequired: pressureLevel >= 4,
        coinPenalty: pressureLevel >= 5,
      },
    };
  },
});

// Complete a dare to reduce war pressure
export const completeWarDare = mutation({
  args: {
    userId: v.id("users"),
    dareType: v.string(),
    proof: v.optional(v.string()), // URL to proof (video, image, etc.)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Give bonus rewards for completing dare
    const bonusRewards = 25;
    const currentBalance = user.rewardsBalance || 0;
    
    await ctx.db.patch(args.userId, {
      rewardsBalance: currentBalance + bonusRewards,
    });

    // Record the dare completion
    await ctx.db.insert("rewardsTransactions", {
      userId: args.userId,
      amount: bonusRewards,
      type: "dare_completion",
      description: `Completed war dare: ${args.dareType}`,
      createdAt: Date.now(),
    });

    // TODO: Store dare completion record for tracking

    return {
      bonusRewards,
      newBalance: currentBalance + bonusRewards,
    };
  },
});

// Skip verification with penalty
export const skipWarVerification = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const penaltyAmount = 30;
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.rewardsBalance || 0;
    const newBalance = Math.max(0, currentBalance - penaltyAmount);

    await ctx.db.patch(args.userId, {
      rewardsBalance: newBalance,
    });

    await ctx.db.insert("rewardsTransactions", {
      userId: args.userId,
      amount: -penaltyAmount,
      type: "verification_skip",
      description: "Skipped war verification",
      createdAt: Date.now(),
    });

    return {
      penaltyApplied: penaltyAmount,
      newBalance,
    };
  },
});

// SABOTAGE-SPECIFIC PENALTIES
export const applySabotagePenalty = mutation({
  args: { 
    defenderId: v.id("users"),
    warId: v.id("challengeWars"),
    penaltyType: v.string(), // "dare", "verification", "coin_loss", "ui_degradation"
    intensity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.defenderId);
    if (!user) {
      throw new Error("User not found");
    }

    const penaltyAmount = args.intensity * 50; // Scale penalty with intensity
    const currentBalance = user.rewardsBalance || 0;
    const newBalance = Math.max(0, currentBalance - penaltyAmount);

    // Apply coin penalty
    await ctx.db.patch(args.defenderId, {
      rewardsBalance: newBalance,
    });

    // Record the sabotage penalty transaction
    await ctx.db.insert("rewardsTransactions", {
      userId: args.defenderId,
      amount: -penaltyAmount,
      type: "sabotage_penalty",
      description: `Sabotage penalty: ${args.penaltyType} (intensity ${args.intensity})`,
      createdAt: Date.now(),
    });

    return {
      message: `💀 SABOTAGE PENALTY: ${args.penaltyType.toUpperCase()}!`,
      penaltyAmount,
      newBalance,
      intensity: args.intensity,
    };
  },
});

export const getSabotagePenalties = query({
  args: { 
    userId: v.id("users"),
    warId: v.optional(v.id("challengeWars")),
  },
  handler: async (ctx, args) => {
    const penalties = await ctx.db
      .query("rewardsTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "sabotage_penalty"))
      .collect();

    if (args.warId) {
      return penalties.filter(p => p.description?.includes(args.warId!.toString()));
    }

    return penalties;
  },
});
