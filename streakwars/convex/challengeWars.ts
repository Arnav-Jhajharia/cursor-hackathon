import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Declare war on someone
export const declareWar = mutation({
  args: {
    challengerId: v.id("users"),
    defenderId: v.id("users"),
    challengeId: v.id("challenges"),
    stakes: v.number(),
    taunt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours to accept

    // Check if there's already a pending war between these users for this challenge
    const existingWar = await ctx.db
      .query("challengeWars")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.challengerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("defenderId"), args.defenderId),
          q.eq(q.field("challengeId"), args.challengeId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingWar) {
      throw new Error("You already have a pending war with this person for this challenge!");
    }

    // Check if challenger has enough rewards
    const challenger = await ctx.db.get(args.challengerId);
    if (!challenger) {
      throw new Error("Challenger not found!");
    }

    // Give new users some starting rewards if they don't have enough
    const currentBalance = challenger.rewardsBalance || 0;
    if (currentBalance < args.stakes) {
      // Give them enough rewards to wage the war + some extra
      const neededRewards = args.stakes + 50; // Give them 50 extra rewards
      await ctx.db.patch(args.challengerId, {
        rewardsBalance: neededRewards,
      });
      
      // Create a transaction record
      await ctx.db.insert("rewardsTransactions", {
        userId: args.challengerId,
        amount: neededRewards - currentBalance,
        type: "bonus",
        description: "Welcome bonus for war system",
        createdAt: now,
      });
    }

    const warId = await ctx.db.insert("challengeWars", {
      challengerId: args.challengerId,
      defenderId: args.defenderId,
      challengeId: args.challengeId,
      status: "pending",
      stakes: args.stakes,
      taunt: args.taunt,
      createdAt: now,
      expiresAt,
    });

    return warId;
  },
});

// Accept a war challenge
export const acceptWar = mutation({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war) {
      throw new Error("War not found");
    }

    if (war.status !== "pending") {
      throw new Error("This war is no longer pending");
    }

    if (Date.now() > war.expiresAt) {
      throw new Error("This war challenge has expired");
    }

    // Check if defender has enough rewards
    const defender = await ctx.db.get(war.defenderId);
    if (!defender) {
      throw new Error("Defender not found!");
    }

    // Give defender enough rewards if they don't have enough
    const currentBalance = defender.rewardsBalance || 0;
    if (currentBalance < war.stakes) {
      // Give them enough rewards to accept the war + some extra
      const neededRewards = war.stakes + 50; // Give them 50 extra rewards
      await ctx.db.patch(war.defenderId, {
        rewardsBalance: neededRewards,
      });
      
      // Create a transaction record
      await ctx.db.insert("rewardsTransactions", {
        userId: war.defenderId,
        amount: neededRewards - currentBalance,
        type: "bonus",
        description: "Welcome bonus for accepting war",
        createdAt: Date.now(),
      });
    }

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "accepted",
      warStartedAt: Date.now(),
    });

    return { success: true };
  },
});

// Decline a war challenge
export const declineWar = mutation({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war) {
      throw new Error("War not found");
    }

    if (war.status !== "pending") {
      throw new Error("This war is no longer pending");
    }

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "declined",
    });

    // Challenger gets the stakes (defender is a coward)
    await ctx.runMutation(api.rewards.addRewards, {
      userId: war.challengerId,
      amount: war.stakes,
      type: "war_coward_bonus",
      description: `Bonus for ${(await ctx.db.get(war.defenderId))?.name || "Unknown"} being a coward`,
    });

    return { success: true };
  },
});

// Get pending war challenges for a user
export const getPendingWars = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const wars = await ctx.db
      .query("challengeWars")
      .withIndex("by_defender_status", (q) => 
        q.eq("defenderId", args.userId).eq("status", "pending")
      )
      .collect();

    const warsWithDetails = await Promise.all(
      wars.map(async (war) => {
        const challenger = await ctx.db.get(war.challengerId);
        const challenge = await ctx.db.get(war.challengeId);
        return {
          ...war,
          challenger,
          challenge,
        };
      })
    );

    return warsWithDetails;
  },
});

// Get active wars for a user
export const getActiveWars = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const wars = await ctx.db
      .query("challengeWars")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .filter((q) => 
        q.or(
          q.eq(q.field("challengerId"), args.userId),
          q.eq(q.field("defenderId"), args.userId)
        )
      )
      .collect();

    const warsWithDetails = await Promise.all(
      wars.map(async (war) => {
        const challenger = await ctx.db.get(war.challengerId);
        const defender = await ctx.db.get(war.defenderId);
        const challenge = await ctx.db.get(war.challengeId);
        
        // Get current points for both users
        const challengerParticipation = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge_user", (q) => 
            q.eq("challengeId", war.challengeId).eq("userId", war.challengerId)
          )
          .first();

        const defenderParticipation = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge_user", (q) => 
            q.eq("challengeId", war.challengeId).eq("userId", war.defenderId)
          )
          .first();

        return {
          ...war,
          challenger,
          defender,
          challenge,
          challengerPoints: challengerParticipation?.totalPoints || 0,
          defenderPoints: defenderParticipation?.totalPoints || 0,
        };
      })
    );

    return warsWithDetails;
  },
});

// Get war history for a user
export const getWarHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("warHistory")
      .withIndex("by_winner", (q) => q.eq("winnerId", args.userId))
      .collect();

    const loserHistory = await ctx.db
      .query("warHistory")
      .withIndex("by_loser", (q) => q.eq("loserId", args.userId))
      .collect();

    const allHistory = [...history, ...loserHistory]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 20); // Last 20 wars

    const historyWithDetails = await Promise.all(
      allHistory.map(async (war) => {
        const winner = await ctx.db.get(war.winnerId);
        const loser = await ctx.db.get(war.loserId);
        const challenge = await ctx.db.get(war.challengeId);
        return {
          ...war,
          winner,
          loser,
          challenge,
          isWinner: war.winnerId === args.userId,
        };
      })
    );

    return historyWithDetails;
  },
});

// Get users you can declare war on (challenge participants, not just friends)
export const getWarTargets = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Get ALL participants in the challenge (not just friends)
    const allParticipants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const warTargets = [];

    // Check each participant to see if they can be war targets
    for (const participation of allParticipants) {
      const targetUserId = participation.userId;
      
      // Skip yourself
      if (targetUserId === args.userId) {
        continue;
      }

      const targetUser = await ctx.db.get(targetUserId);
      if (targetUser) {
        // Check if there's already a pending war
        const existingWar = await ctx.db
          .query("challengeWars")
          .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
          .filter((q) => 
            q.and(
              q.eq(q.field("defenderId"), targetUserId),
              q.eq(q.field("challengeId"), args.challengeId),
              q.eq(q.field("status"), "pending")
            )
          )
          .first();

        if (!existingWar) {
          warTargets.push({
            ...targetUser,
            currentPoints: participation.totalPoints,
          });
        }
      }
    }

    return warTargets;
  },
});

// Complete a war (called when challenge ends)
export const completeWar = mutation({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    // Get final points for both users
    const challengerParticipation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", war.challengeId).eq("userId", war.challengerId)
      )
      .first();

    const defenderParticipation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", war.challengeId).eq("userId", war.defenderId)
      )
      .first();

    const challengerPoints = challengerParticipation?.totalPoints || 0;
    const defenderPoints = defenderParticipation?.totalPoints || 0;

    let winnerId: Id<"users">;
    let loserId: Id<"users">;

    if (challengerPoints > defenderPoints) {
      winnerId = war.challengerId;
      loserId = war.defenderId;
    } else if (defenderPoints > challengerPoints) {
      winnerId = war.defenderId;
      loserId = war.challengerId;
    } else {
      // Tie - no winner, return stakes to both
      await ctx.runMutation(api.rewards.addRewards, {
        userId: war.challengerId,
        amount: war.stakes,
        type: "war_tie_refund",
        description: "War ended in a tie - stakes returned",
      });
      await ctx.runMutation(api.rewards.addRewards, {
        userId: war.defenderId,
        amount: war.stakes,
        type: "war_tie_refund",
        description: "War ended in a tie - stakes returned",
      });

      await ctx.db.patch(args.warId, {
        status: "completed",
        warEndedAt: Date.now(),
      });

      return { result: "tie" };
    }

    // Winner takes all stakes
    await ctx.runMutation(api.rewards.addRewards, {
      userId: winnerId,
      amount: war.stakes * 2, // Winner gets both stakes
      type: "war_victory",
      description: `Victory over ${(await ctx.db.get(loserId as Id<"users">))?.name || "Unknown"}`,
    });

    // Record war history
    await ctx.db.insert("warHistory", {
      warId: args.warId,
      winnerId,
      loserId,
      challengeId: war.challengeId,
      stakes: war.stakes,
      winnerPoints: winnerId === war.challengerId ? challengerPoints : defenderPoints,
      loserPoints: loserId === war.challengerId ? challengerPoints : defenderPoints,
      warDuration: Math.ceil((Date.now() - (war.warStartedAt || war.createdAt)) / (24 * 60 * 60 * 1000)),
      completedAt: Date.now(),
    });

    // Record AI memory for psychological profiling
    const winner = await ctx.db.get(winnerId);
    const loser = await ctx.db.get(loserId);
    const challenge = await ctx.db.get(war.challengeId);
    
    if (winner && loser && challenge) {
      // Record winner's victory
      await ctx.db.insert("warMemories", {
        userId: winnerId,
        opponentId: loserId,
        challengeId: war.challengeId,
        warStakes: war.stakes,
        victoryMethod: challengerPoints > defenderPoints ? "domination" : "consistency",
        warDuration: Math.ceil((Date.now() - (war.warStartedAt || war.createdAt)) / (24 * 60 * 60 * 1000)),
        humiliationDelivered: `Defeated ${loser.name} in ${challenge.name}`,
        timestamp: Date.now(),
      });

      // Record loser's defeat
      await ctx.db.insert("warMemories", {
        userId: loserId,
        opponentId: winnerId,
        challengeId: war.challengeId,
        warStakes: war.stakes,
        defeatReason: challengerPoints > defenderPoints ? "low_points" : "inconsistency",
        warDuration: Math.ceil((Date.now() - (war.warStartedAt || war.createdAt)) / (24 * 60 * 60 * 1000)),
        humiliationMessage: `Defeated by ${winner.name} in ${challenge.name}`,
        timestamp: Date.now(),
      });
    }

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "completed",
      warEndedAt: Date.now(),
      winnerId,
      loserId,
    });

    return { 
      result: "completed", 
      winnerId, 
      loserId,
      winnerPoints: winnerId === war.challengerId ? challengerPoints : defenderPoints,
      loserPoints: loserId === war.challengerId ? challengerPoints : defenderPoints,
    };
  },
});

// SABOTAGE SYSTEM - Challenger can sabotage defender by doing extra habits
export const startSabotage = mutation({
  args: { 
    warId: v.id("challengeWars"),
    intensity: v.number(), // 1-5 intensity level
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    if (args.intensity < 1 || args.intensity > 5) {
      throw new Error("Sabotage intensity must be between 1-5");
    }

    const now = Date.now();
    
    // Update war with sabotage info
    await ctx.db.patch(args.warId, {
      sabotageActive: true,
      sabotageStartedAt: now,
      sabotageIntensity: args.intensity,
      sabotageHabitsCompleted: 0,
      sabotagePenaltiesApplied: 0,
    });

    return {
      message: `🔥 SABOTAGE ACTIVATED! Intensity level ${args.intensity}/5`,
      intensity: args.intensity,
      sabotageStartedAt: now,
    };
  },
});

export const recordSabotageHabit = mutation({
  args: { 
    warId: v.id("challengeWars"),
    habitId: v.id("habits"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || !war.sabotageActive) {
      throw new Error("Sabotage not active for this war");
    }

    const currentCount = war.sabotageHabitsCompleted || 0;
    const newCount = currentCount + 1;
    
    // Update sabotage progress
    await ctx.db.patch(args.warId, {
      sabotageHabitsCompleted: newCount,
    });

    // Calculate penalties for defender based on intensity
    const intensity = war.sabotageIntensity || 1;
    const penaltiesToApply = Math.floor(newCount / (6 - intensity)); // More intensity = fewer habits needed for penalties

    if (penaltiesToApply > (war.sabotagePenaltiesApplied || 0)) {
      // Apply new penalties to defender
      await ctx.db.patch(args.warId, {
        sabotagePenaltiesApplied: penaltiesToApply,
      });

      return {
        message: `💀 SABOTAGE HABIT #${newCount} COMPLETED!`,
        sabotageCount: newCount,
        penaltiesApplied: penaltiesToApply,
        intensity: intensity,
        nextPenaltyAt: Math.ceil((newCount + 1) / (6 - intensity)) * (6 - intensity),
      };
    }

    return {
      message: `🔥 Sabotage habit #${newCount} completed!`,
      sabotageCount: newCount,
      penaltiesApplied: penaltiesToApply,
      intensity: intensity,
    };
  },
});

export const endSabotage = mutation({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || !war.sabotageActive) {
      throw new Error("Sabotage not active for this war");
    }

    const now = Date.now();
    const sabotageDuration = now - (war.sabotageStartedAt || now);
    const totalHabits = war.sabotageHabitsCompleted || 0;
    const totalPenalties = war.sabotagePenaltiesApplied || 0;

    // End sabotage
    await ctx.db.patch(args.warId, {
      sabotageActive: false,
    });

    return {
      message: `🏁 SABOTAGE COMPLETE!`,
      duration: sabotageDuration,
      totalHabits: totalHabits,
      totalPenalties: totalPenalties,
      intensity: war.sabotageIntensity,
    };
  },
});

export const getActiveSabotage = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Find active sabotage where user is either challenger or defender
    const activeWars = await ctx.db
      .query("challengeWars")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("challengerId"), args.userId),
            q.eq(q.field("defenderId"), args.userId)
          ),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("sabotageActive"), true)
        )
      )
      .collect();

    return activeWars.length > 0 ? activeWars[0] : null;
  },
});
