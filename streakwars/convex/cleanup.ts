import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Clear all habits for the current user
export const clearAllHabits = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all habits for this user
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let deletedHabits = 0;
    for (const habit of habits) {
      // Delete all habit completions for this habit
      const completions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();

      for (const completion of completions) {
        await ctx.db.delete(completion._id);
      }

      // Delete the habit
      await ctx.db.delete(habit._id);
      deletedHabits++;
    }

    return {
      message: `Cleared ${deletedHabits} habits and their completions`,
      deleted: {
        habits: deletedHabits,
      },
    };
  },
});

// Clear all challenges for the current user
export const clearAllChallenges = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all challenges created by this user
    const challenges = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .collect();

    let deletedChallenges = 0;
    for (const challenge of challenges) {
      // Delete all challenge participants
      const participants = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete all challenge invitations
      const invitations = await ctx.db
        .query("challengeInvitations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const invitation of invitations) {
        await ctx.db.delete(invitation._id);
      }

      // Delete all wars for this challenge
      const wars = await ctx.db
        .query("challengeWars")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const war of wars) {
        // Delete sabotage challenge completions
        const sabotageCompletions = await ctx.db
          .query("sabotageChallengeCompletions")
          .withIndex("by_war", (q) => q.eq("warId", war._id))
          .collect();

        for (const completion of sabotageCompletions) {
          await ctx.db.delete(completion._id);
        }

        // Delete war history
        const warHistory = await ctx.db
          .query("warHistory")
          .filter((q) => q.eq(q.field("warId"), war._id))
          .collect();

        for (const history of warHistory) {
          await ctx.db.delete(history._id);
        }

        // Delete war memories
        const warMemories = await ctx.db
          .query("warMemories")
          .filter((q) => q.eq(q.field("challengeId"), challenge._id))
          .collect();

        for (const memory of warMemories) {
          await ctx.db.delete(memory._id);
        }

        // Delete AI humiliations
        const aiHumiliations = await ctx.db
          .query("aiHumiliations")
          .filter((q) => q.eq(q.field("warId"), war._id))
          .collect();

        for (const humiliation of aiHumiliations) {
          await ctx.db.delete(humiliation._id);
        }

        await ctx.db.delete(war._id);
      }

      // Delete the challenge
      await ctx.db.delete(challenge._id);
      deletedChallenges++;
    }

    return {
      message: `Cleared ${deletedChallenges} challenges and all related data`,
      deleted: {
        challenges: deletedChallenges,
      },
    };
  },
});

// Clear everything for the current user
export const clearEverything = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Clear habits directly (avoid circular reference)
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let deletedHabits = 0;
    for (const habit of habits) {
      // Delete all habit completions for this habit
      const completions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();

      for (const completion of completions) {
        await ctx.db.delete(completion._id);
      }

      // Delete the habit
      await ctx.db.delete(habit._id);
      deletedHabits++;
    }
    
    // Clear challenges directly (avoid circular reference)
    const challenges = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .collect();

    let deletedChallenges = 0;
    for (const challenge of challenges) {
      // Delete all challenge participants
      const participants = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete all challenge invitations
      const invitations = await ctx.db
        .query("challengeInvitations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const invitation of invitations) {
        await ctx.db.delete(invitation._id);
      }

      // Delete all wars for this challenge
      const wars = await ctx.db
        .query("challengeWars")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const war of wars) {
        // Delete sabotage challenge completions
        const sabotageCompletions = await ctx.db
          .query("sabotageChallengeCompletions")
          .withIndex("by_war", (q) => q.eq("warId", war._id))
          .collect();

        for (const completion of sabotageCompletions) {
          await ctx.db.delete(completion._id);
        }

        // Delete war history
        const warHistory = await ctx.db
          .query("warHistory")
          .filter((q) => q.eq(q.field("warId"), war._id))
          .collect();

        for (const history of warHistory) {
          await ctx.db.delete(history._id);
        }

        // Delete war memories
        const warMemories = await ctx.db
          .query("warMemories")
          .filter((q) => q.eq(q.field("challengeId"), challenge._id))
          .collect();

        for (const memory of warMemories) {
          await ctx.db.delete(memory._id);
        }

        // Delete AI humiliations
        const aiHumiliations = await ctx.db
          .query("aiHumiliations")
          .filter((q) => q.eq(q.field("warId"), war._id))
          .collect();

        for (const humiliation of aiHumiliations) {
          await ctx.db.delete(humiliation._id);
        }

        await ctx.db.delete(war._id);
      }

      // Delete the challenge
      await ctx.db.delete(challenge._id);
      deletedChallenges++;
    }

    // Clear friends
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let deletedFriends = 0;
    for (const friend of friends) {
      await ctx.db.delete(friend._id);
      deletedFriends++;
    }

    // Clear rewards transactions
    const transactions = await ctx.db
      .query("rewardsTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let deletedTransactions = 0;
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
      deletedTransactions++;
    }

    // Reset user stats
    await ctx.db.patch(user._id, {
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      rewardsBalance: 100, // Give them some starting rewards
    });

    return {
      message: "Cleared everything! You now have a fresh start.",
      deleted: {
        habits: deletedHabits,
        challenges: deletedChallenges,
        friends: deletedFriends,
        transactions: deletedTransactions,
      },
    };
  },
});
