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
      createdAt: now,
      updatedAt: now,
    });
  },
});

