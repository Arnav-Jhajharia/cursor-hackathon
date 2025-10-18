import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Complete a habit
export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit) throw new Error("Habit not found");

    const now = Date.now();
    
    // Check if already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.getTime();

    const existingCompletion = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", args.habitId)
         .gte("completedAt", startOfDay)
         .lt("completedAt", endOfDay)
      )
      .first();

    if (existingCompletion) {
      throw new Error("Habit already completed today");
    }

    // Create completion record
    const completionId = await ctx.db.insert("habitCompletions", {
      habitId: args.habitId,
      userId: args.userId,
      completedAt: now,
      pointsEarned: habit.pointsPerCompletion,
      notes: args.notes,
    });

    // Update user stats
    const user = await ctx.db.get(args.userId);
    if (user) {
      // Calculate new streak
      const completions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
        .order("desc")
        .collect();

      let streak = 1;
      let currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1);

      for (const completion of completions) {
        const completionDate = new Date(completion.completedAt);
        completionDate.setHours(0, 0, 0, 0);
        
        if (completionDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      await ctx.db.patch(args.userId, {
        totalPoints: user.totalPoints + habit.pointsPerCompletion,
        currentStreak: Math.max(user.currentStreak, streak),
        longestStreak: Math.max(user.longestStreak, streak),
        updatedAt: now,
      });
    }

    return completionId;
  },
});

// Undo a habit completion (if completed today)
export const undoHabitCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.getTime();

    const completion = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", args.habitId)
         .gte("completedAt", startOfDay)
         .lt("completedAt", endOfDay)
      )
      .first();

    if (!completion) {
      throw new Error("No completion found for today");
    }

    // Delete the completion
    await ctx.db.delete(completion._id);

    // Update user stats
    const user = await ctx.db.get(args.userId);
    const habit = await ctx.db.get(args.habitId);
    
    if (user && habit) {
      await ctx.db.patch(args.userId, {
        totalPoints: Math.max(0, user.totalPoints - habit.pointsPerCompletion),
        updatedAt: Date.now(),
      });
    }

    return completion._id;
  },
});

// Get completions for a specific habit
export const getHabitCompletions = query({
  args: {
    habitId: v.id("habits"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.collect();
  },
});

// Get user's completion history
export const getUserCompletions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("habitCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.collect();
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

// Get completion statistics for a user
export const getUserCompletionStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = tomorrow.getTime();

    const todayCompletions = completions.filter(completion => 
      completion.completedAt >= startOfDay && completion.completedAt < endOfDay
    );

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekStart = thisWeek.getTime();

    const weekCompletions = completions.filter(completion => 
      completion.completedAt >= weekStart
    );

    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const monthStart = thisMonth.getTime();

    const monthCompletions = completions.filter(completion => 
      completion.completedAt >= monthStart
    );

    return {
      totalCompletions: completions.length,
      todayCompletions: todayCompletions.length,
      weekCompletions: weekCompletions.length,
      monthCompletions: monthCompletions.length,
      totalPoints: completions.reduce((sum, completion) => sum + completion.pointsEarned, 0),
    };
  },
});
