import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all habits for a user
export const getUserHabits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active habits for a user
export const getUserActiveHabits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

// Get all habits for a user including challenge habits
export const getUserHabitsWithChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get personal habits
    const personalHabits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Get challenge habits from active challenges
    const challengeParticipations = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get challenge habits (actual habit objects created when joining challenges)
    const challengeHabits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("category"), "Challenge"))
      .collect();

    // Filter out personal habits that have the same name as challenge habits to avoid duplicates
    const challengeHabitNames = challengeHabits.map(h => h.name);
    const filteredPersonalHabits = personalHabits.filter(habit => 
      !challengeHabitNames.includes(habit.name)
    );

    return [...filteredPersonalHabits, ...challengeHabits];
  },
});

// Get habit by ID
export const getHabit = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.habitId);
  },
});

// Create a new habit
export const createHabit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetFrequency: v.string(),
    customFrequency: v.optional(v.string()),
    pointsPerCompletion: v.number(),
    isPublic: v.optional(v.boolean()),
    originalHabitId: v.optional(v.id("habits")),
    integrations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // If this is a remix, increment the remix count of the original habit
    if (args.originalHabitId) {
      const originalHabit = await ctx.db.get(args.originalHabitId);
      if (originalHabit) {
        await ctx.db.patch(originalHabit._id, {
          remixCount: (originalHabit.remixCount || 0) + 1,
          updatedAt: now,
        });
      }
    }
    
    return await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      category: args.category,
      targetFrequency: args.targetFrequency,
      customFrequency: args.customFrequency,
      pointsPerCompletion: args.pointsPerCompletion,
      isActive: true,
      isPublic: args.isPublic || false,
      originalHabitId: args.originalHabitId,
      remixCount: 0,
      integrations: args.integrations || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a habit
export const updateHabit = mutation({
  args: {
    habitId: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    targetFrequency: v.optional(v.string()),
    customFrequency: v.optional(v.string()),
    pointsPerCompletion: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { habitId, ...updates } = args;
    await ctx.db.patch(habitId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a habit
export const deleteHabit = mutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    // First, delete all completions for this habit
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();
    
    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    // Then delete the habit
    await ctx.db.delete(args.habitId);
  },
});

// Get all habit completions for a habit (no date restrictions)
export const getAllHabitCompletions = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .order("desc")
      .collect();
  },
});

// Get challenges that use a specific habit
export const getHabitChallenges = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    // Get the habit first to find its name
    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      return [];
    }

    // Find challenges that include this habit in their targetHabits
    const challenges = await ctx.db
      .query("challenges")
      .filter((q) => 
        q.eq(q.field("isActive"), true)
      )
      .collect();

    // Filter challenges that include this habit's name in their targetHabits
    const matchingChallenges = challenges.filter(challenge => 
      challenge.targetHabits.includes(habit.name)
    );

    return matchingChallenges;
  },
});

// Complete a habit
export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create habit completion record
    const completionId = await ctx.db.insert("habitCompletions", {
      habitId: args.habitId,
      userId: args.userId,
      pointsEarned: args.points,
      completedAt: now,
      verificationStatus: "none",
    });

    // Update user's total points
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalPoints: (user.totalPoints || 0) + args.points,
        updatedAt: now,
      });
    }

    return { completionId, points: args.points };
  },
});

// Complete habit and check for streak breaks/milestones
export const completeHabitWithConfessional = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get the habit
    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    // Get user's completions for this habit
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    // Calculate current streak
    const currentStreak = calculateStreak(completions, now);
    
    // Check if this is a milestone (7, 30, 100 days)
    const milestones = [7, 30, 100];
    const isMilestone = milestones.includes(currentStreak + 1);
    
    // Complete the habit
    const result = await ctx.runMutation("habits:completeHabit", {
      habitId: args.habitId,
      userId: args.userId,
      points: args.points,
    });

    // Trigger anti-confessional for milestones
    if (isMilestone) {
      await ctx.runMutation("confessional:triggerAntiConfessional", {
        userId: args.userId,
        habitId: args.habitId,
        habitName: habit.name,
        streakLength: currentStreak + 1,
        milestone: `${currentStreak + 1} days`
      });
    }

    return { 
      ...result, 
      currentStreak: currentStreak + 1,
      isMilestone,
      milestone: isMilestone ? `${currentStreak + 1} days` : null
    };
  },
});

// Check for broken streaks and trigger confessionals
export const checkStreakBreaks = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Get all user's habits
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const brokenStreaks = [];

    for (const habit of habits) {
      // Get completions for this habit
      const completions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect();

      if (completions.length === 0) continue;

      const currentStreak = calculateStreak(completions, now);
      const lastCompletion = completions[0];
      const timeSinceLastCompletion = now - lastCompletion.completedAt;

      // Check if streak is broken (no completion in the last 24-48 hours for daily habits)
      if (habit.targetFrequency === "daily" && timeSinceLastCompletion > (24 * 60 * 60 * 1000)) {
        // Check if this is actually a break (not just a new day)
        const yesterday = now - (24 * 60 * 60 * 1000);
        const hasCompletionYesterday = completions.some(
          c => c.completedAt >= yesterday && c.completedAt < now
        );

        if (!hasCompletionYesterday && currentStreak > 0) {
          // Trigger confessional for broken streak
          await ctx.runMutation("confessional:triggerConfessional", {
            userId: args.userId,
            habitId: habit._id,
            habitName: habit.name,
            streakLength: currentStreak,
          });

          brokenStreaks.push({
            habitId: habit._id,
            habitName: habit.name,
            streakLength: currentStreak,
          });
        }
      }
    }

    return { brokenStreaks };
  },
});

// Helper function to calculate streak
function calculateStreak(completions: any[], now: number): number {
  if (completions.length === 0) return 0;

  let streak = 0;
  const oneDay = 24 * 60 * 60 * 1000;
  let currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < completions.length; i++) {
    const completionDate = new Date(completions[i].completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(currentDate.getTime() - (streak * oneDay));
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (completionDate.getTime() < expectedDate.getTime()) {
      // Gap in streak, stop counting
      break;
    } else {
      // Completion is in the future, skip
      continue;
    }
  }

  return streak;
}

// Get habit completions for a specific date range
export const getHabitCompletions = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", args.habitId)
          .gte("completedAt", args.startDate)
          .lte("completedAt", args.endDate)
      )
      .collect();
  },
});

// Get user's habit completions for today
export const getTodayCompletions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.getTime();

    return await ctx.db
      .query("habitCompletions")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId)
         .gte("completedAt", startOfDay)
         .lt("completedAt", endOfDay)
      )
      .collect();
  },
});

// Calculate current streak for a habit
export const getHabitStreak = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit) return 0;

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .order("desc")
      .collect();

    if (completions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if completed today
    const todayCompletion = completions.find(completion => {
      const completionDate = new Date(completion.completedAt);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });

    if (!todayCompletion) {
      // Check if completed yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayCompletion = completions.find(completion => {
        const completionDate = new Date(completion.completedAt);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === yesterday.getTime();
      });
      
      if (!yesterdayCompletion) return 0;
    }

    // Count consecutive days
    let currentDate = new Date(today);
    for (const completion of completions) {
      const completionDate = new Date(completion.completedAt);
      completionDate.setHours(0, 0, 0, 0);
      
      if (completionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  },
});

// Get public habits that can be remixed
export const getPublicHabits = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isPublic"), true)
        )
      )
      .order("desc")
      .take(args.limit || 50);

    // Get user details for each habit
    const habitsWithUsers = await Promise.all(
      habits.map(async (habit) => {
        const user = await ctx.db.get(habit.userId);
        return {
          ...habit,
          user,
        };
      })
    );

    return habitsWithUsers;
  },
});

// Remix a public habit
export const remixHabit = mutation({
  args: {
    userId: v.id("users"),
    originalHabitId: v.id("habits"),
    customizations: v.optional(v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      pointsPerCompletion: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const originalHabit = await ctx.db.get(args.originalHabitId);
    if (!originalHabit || !originalHabit.isPublic) {
      throw new Error("Habit not found or not available for remixing");
    }

    const now = Date.now();
    
    // Increment remix count of original habit
    await ctx.db.patch(originalHabit._id, {
      remixCount: (originalHabit.remixCount || 0) + 1,
      updatedAt: now,
    });

    // Create the remixed habit
    return await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.customizations?.name || originalHabit.name,
      description: args.customizations?.description || originalHabit.description,
      category: originalHabit.category,
      targetFrequency: originalHabit.targetFrequency,
      customFrequency: originalHabit.customFrequency,
      pointsPerCompletion: args.customizations?.pointsPerCompletion || originalHabit.pointsPerCompletion,
      isActive: true,
      isPublic: false, // Remixed habits are private by default
      originalHabitId: args.originalHabitId,
      remixCount: 0,
      integrations: originalHabit.integrations || [], // Copy integrations from original
      createdAt: now,
      updatedAt: now,
    });
  },
});

