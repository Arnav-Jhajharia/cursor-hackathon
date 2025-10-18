import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get habits for a specific challenge
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

    // Get user's existing habits that match the challenge target habits
    const userHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter habits that match challenge target habits
    const challengeHabits = userHabits.filter(habit => 
      challenge.targetHabits.includes(habit.name)
    );

    // Create virtual challenge habits for target habits that don't exist yet
    const virtualHabits = challenge.targetHabits
      .filter(habitName => !userHabits.some(habit => habit.name === habitName))
      .map(habitName => ({
        _id: `virtual_${args.challengeId}_${habitName}` as Id<"habits">,
        _creationTime: Date.now(),
        userId: args.userId,
        name: habitName,
        description: `Challenge habit: ${habitName}`,
        category: "challenge",
        targetFrequency: "daily",
        pointsPerCompletion: 10,
        isActive: true,
        isPublic: false,
        isVirtual: true, // Flag to indicate this is a virtual challenge habit
        challengeId: args.challengeId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

    return {
      challengeHabits,
      virtualHabits,
      allChallengeHabits: [...challengeHabits, ...virtualHabits],
    };
  },
});

// Create a real habit from a virtual challenge habit
export const createHabitFromChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    habitName: v.string(),
    userId: v.id("users"),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already has this habit
    const existingHabit = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("name"), args.habitName))
      .first();

    if (existingHabit) {
      throw new Error("You already have this habit!");
    }

    // Create the habit
    const habitId = await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.habitName,
      description: args.description || `Challenge habit: ${args.habitName}`,
      category: args.category || "challenge",
      targetFrequency: "daily",
      pointsPerCompletion: 10,
      isActive: true,
      isPublic: false,
      challengeId: args.challengeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { habitId, message: `Created habit: ${args.habitName}` };
  },
});

// Get sabotage habits for a war
export const getSabotageHabits = query({
  args: { 
    warId: v.id("challengeWars"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war) {
      throw new Error("War not found");
    }

    // Get completed sabotage challenges to generate habits
    const sabotageCompletions = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war", (q) => q.eq("warId", args.warId))
      .collect();

    // Generate sabotage habits based on completed challenges
    const sabotageHabits = sabotageCompletions.map(completion => ({
      _id: `sabotage_${completion._id}` as Id<"habits">,
      _creationTime: completion.completedAt,
      userId: args.userId,
      name: `Sabotage: ${completion.challengeId}`,
      description: `Sabotage habit from war challenge`,
      category: "sabotage",
      targetFrequency: "once",
      pointsPerCompletion: completion.sabotagePower * 5, // Higher points for sabotage
      isActive: true,
      isPublic: false,
      isSabotage: true,
      warId: args.warId,
      sabotageCompletionId: completion._id,
      createdAt: completion.completedAt,
      updatedAt: completion.completedAt,
    }));

    return sabotageHabits;
  },
});

// Complete a challenge habit (virtual or real)
export const completeChallengeHabit = mutation({
  args: {
    challengeId: v.id("challenges"),
    habitName: v.string(),
    userId: v.id("users"),
    points: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Check if user is participating in this challenge
    const participation = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) => 
        q.eq("challengeId", args.challengeId).eq("userId", args.userId)
      )
      .first();

    if (!participation) {
      throw new Error("You are not participating in this challenge");
    }

    // Find the actual habit
    const habit = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("name"), args.habitName))
      .first();

    if (!habit) {
      throw new Error("Habit not found. Please create it first.");
    }

    // Check if already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);

    const existingCompletion = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", habit._id).gte("completedAt", todayStart).lt("completedAt", todayEnd)
      )
      .first();

    if (existingCompletion) {
      throw new Error("You already completed this habit today!");
    }

    // Create habit completion
    const completionId = await ctx.db.insert("habitCompletions", {
      habitId: habit._id,
      userId: args.userId,
      completedAt: Date.now(),
      pointsEarned: args.points || habit.pointsPerCompletion,
      verificationStatus: "verified", // Auto-verify challenge habits
      notes: `Challenge completion: ${challenge.name}`,
    });

    // Update user stats
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalPoints: (user.totalPoints || 0) + (args.points || habit.pointsPerCompletion),
        currentStreak: (user.currentStreak || 0) + 1,
        longestStreak: Math.max(user.longestStreak || 0, (user.currentStreak || 0) + 1),
        updatedAt: Date.now(),
      });
    }

    return {
      completionId,
      message: `Completed ${args.habitName} for challenge: ${challenge.name}`,
      pointsEarned: args.points || habit.pointsPerCompletion,
    };
  },
});
