import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Clear all challenges and related data
export const clearAllChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all challenges
    const challenges = await ctx.db.query("challenges").collect();
    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    // Delete all challenge participants
    const participants = await ctx.db.query("challengeParticipants").collect();
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete all challenge invitations
    const invitations = await ctx.db.query("challengeInvitations").collect();
    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Delete all challenge wars
    const wars = await ctx.db.query("challengeWars").collect();
    for (const war of wars) {
      await ctx.db.delete(war._id);
    }

    // Delete all war history
    const warHistory = await ctx.db.query("warHistory").collect();
    for (const history of warHistory) {
      await ctx.db.delete(history._id);
    }

    // Delete all prize pools
    const prizePools = await ctx.db.query("prizePools").collect();
    for (const pool of prizePools) {
      await ctx.db.delete(pool._id);
    }

    return { 
      deleted: {
        challenges: challenges.length,
        participants: participants.length,
        invitations: invitations.length,
        wars: wars.length,
        warHistory: warHistory.length,
        prizePools: prizePools.length
      }
    };
  },
});

// Clear all habits
export const clearAllHabits = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all habits
    const habits = await ctx.db.query("habits").collect();
    for (const habit of habits) {
      await ctx.db.delete(habit._id);
    }

    // Delete all habit completions
    const completions = await ctx.db.query("habitCompletions").collect();
    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    return { 
      deleted: {
        habits: habits.length,
        completions: completions.length
      }
    };
  },
});

// Clear everything (nuclear option)
export const clearEverything = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear challenges first
    await ctx.runMutation(api.cleanup.clearAllChallenges, {});
    
    // Clear habits
    await ctx.runMutation(api.cleanup.clearAllHabits, {});
    
    // Clear friends
    const friends = await ctx.db.query("friends").collect();
    for (const friend of friends) {
      await ctx.db.delete(friend._id);
    }

    // Clear pending invitations
    const pendingInvitations = await ctx.db.query("pendingInvitations").collect();
    for (const invitation of pendingInvitations) {
      await ctx.db.delete(invitation._id);
    }

    // Clear notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Clear rewards transactions
    const rewardsTransactions = await ctx.db.query("rewardsTransactions").collect();
    for (const transaction of rewardsTransactions) {
      await ctx.db.delete(transaction._id);
    }

    return { 
      message: "Everything has been cleared! Fresh start! 🧹",
      deleted: {
        friends: friends.length,
        pendingInvitations: pendingInvitations.length,
        notifications: notifications.length,
        rewardsTransactions: rewardsTransactions.length
      }
    };
  },
});
