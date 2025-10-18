import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a custom habit to a challenge
export const addCustomChallengeHabit = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    habitName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is participating in the challenge
    const participation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (!participation) {
      throw new Error("User is not participating in this challenge");
    }

    // Check if habit already exists
    const existingHabits = participation.customHabits || [];
    if (existingHabits.includes(args.habitName)) {
      throw new Error("This custom habit already exists");
    }

    // Get challenge details
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Add the custom habit to participation record
    const updatedHabits = [...existingHabits, args.habitName];
    await ctx.db.patch(participation._id, {
      customHabits: updatedHabits,
    });

    // Create actual habit object for the challenge
    await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.habitName,
      description: undefined,
      category: "Challenge",
      targetFrequency: "daily",
      pointsPerCompletion: 10,
      isActive: true,
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originalHabitId: undefined,
    });

    // Also create a general habit for future challenges (if it doesn't exist)
    const existingGeneralHabit = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("name"), args.habitName))
      .filter((q) => q.neq(q.field("category"), "Challenge"))
      .first();

    if (!existingGeneralHabit) {
      await ctx.db.insert("habits", {
        userId: args.userId,
        name: args.habitName,
        description: undefined,
        category: "Health", // Default category
        targetFrequency: "daily",
        pointsPerCompletion: 10,
        isActive: true,
        isPublic: true, // Make it available for future challenges
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalHabitId: undefined,
      });
    }

    return participation._id;
  },
});

// Remove a custom habit from a challenge
export const removeCustomChallengeHabit = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    habitName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is participating in the challenge
    const participation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (!participation) {
      throw new Error("User is not participating in this challenge");
    }

    // Remove the custom habit
    const existingHabits = participation.customHabits || [];
    const updatedHabits = existingHabits.filter(habit => habit !== args.habitName);
    
    await ctx.db.patch(participation._id, {
      customHabits: updatedHabits,
    });

    return participation._id;
  },
});

// Get user's custom habits for a challenge
export const getCustomChallengeHabits = query({
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

    if (!participation) {
      return [];
    }

    return participation.customHabits || [];
  },
});
