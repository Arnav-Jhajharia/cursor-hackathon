import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get challenge habits for a specific challenge and user
export const getChallengeHabits = query({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Get user's habits that match the challenge target habits
    const userHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const challengeHabits = challenge.targetHabits.map(habitName => {
      const existingHabit = userHabits.find(habit => habit.name === habitName);
      return {
        name: habitName,
        habitId: existingHabit?._id || null,
        exists: !!existingHabit,
        category: existingHabit?.category || "general",
        pointsPerCompletion: existingHabit?.pointsPerCompletion || 10,
      };
    });

    return challengeHabits;
  },
});

// Create a habit from a challenge target habit
export const createHabitFromChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    habitName: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Check if habit already exists
    const existingHabit = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("name"), args.habitName))
      .first();

    if (existingHabit) {
      throw new Error("Habit already exists");
    }

    // Create the habit
    const habitId = await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.habitName,
      description: `Challenge habit: ${args.habitName}`,
      category: "challenge",
      targetFrequency: "daily", // Challenge habits are typically daily
      pointsPerCompletion: 10, // Challenge habits give 10 points
      isPublic: false,
      challengeId: args.challengeId, // Link to the challenge
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return { habitId, message: `Created challenge habit: ${args.habitName}` };
  },
});

// Complete a challenge habit and earn challenge points
export const completeChallengeHabit = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    const habit = await ctx.db.get(args.habitId);
    
    if (!challenge || !habit) {
      throw new Error("Challenge or habit not found");
    }

    if (habit.userId !== args.userId) {
      throw new Error("You can only complete your own habits");
    }

    if (habit.challengeId !== args.challengeId) {
      throw new Error("This habit is not part of this challenge");
    }

    // Check if already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCompletion = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("completedAt"), today.getTime()),
          q.lt(q.field("completedAt"), tomorrow.getTime())
        )
      )
      .first();

    if (existingCompletion) {
      throw new Error("Habit already completed today");
    }

    // Create habit completion
    const pointsEarned = habit.pointsPerCompletion || 10;
    const completionId = await ctx.db.insert("habitCompletions", {
      habitId: args.habitId,
      userId: args.userId,
      completedAt: Date.now(),
      pointsEarned: pointsEarned,
      verificationStatus: "verified", // Auto-verify challenge habits
      notes: "Challenge habit completion",
    });

    // Update user's rewards balance
    const user = await ctx.db.get(args.userId);
    if (user) {
      const newBalance = (user.rewardsBalance || 0) + pointsEarned;
      await ctx.db.patch(args.userId, {
        rewardsBalance: newBalance,
      });

      // Record the transaction
      await ctx.db.insert("rewardsTransactions", {
        userId: args.userId,
        amount: pointsEarned,
        type: "challenge_habit_completion",
        description: `Completed challenge habit: ${habit.name}`,
        createdAt: Date.now(),
      });
    }

    return {
      completionId,
      pointsEarned,
      message: `Completed challenge habit: ${habit.name} (+${pointsEarned} points)`,
    };
  },
});

// Get challenge habit completions for a user in a challenge
export const getChallengeHabitCompletions = query({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Get user's challenge habits
    const challengeHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .collect();

    // Get completions for these habits
    const completions = [];
    for (const habit of challengeHabits) {
      const habitCompletions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();

      completions.push({
        habitId: habit._id,
        habitName: habit.name,
        completions: habitCompletions,
        totalPoints: habitCompletions.reduce((sum, c) => sum + c.pointsEarned, 0),
      });
    }

    return completions;
  },
});

// Get challenge points summary for a user
export const getChallengePoints = query({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Get user's challenge habits
    const challengeHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .collect();

    // Get completions for these habits
    const completions = [];
    for (const habit of challengeHabits) {
      const habitCompletions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();

      completions.push({
        habitId: habit._id,
        habitName: habit.name,
        completions: habitCompletions,
        totalPoints: habitCompletions.reduce((sum: number, c) => sum + c.pointsEarned, 0),
      });
    }

    const totalPoints = completions.reduce((sum: number, habit) => sum + habit.totalPoints, 0);
    const totalCompletions = completions.reduce((sum: number, habit) => sum + habit.completions.length, 0);
    const uniqueHabitsCompleted = completions.filter((habit) => habit.completions.length > 0).length;

    return {
      totalPoints,
      totalCompletions,
      uniqueHabitsCompleted,
      habits: completions,
    };
  },
});