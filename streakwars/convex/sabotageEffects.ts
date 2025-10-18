import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Escape tasks that victims must complete to break sabotage
const SABOTAGE_ESCAPE_TASKS = [
  // Physical Escape Tasks
  { id: "pushups_10", name: "Do 10 Push-ups", description: "Complete 10 push-ups to break the sabotage", category: "physical", difficulty: 3, proofRequired: true },
  { id: "squats_20", name: "Do 20 Squats", description: "Complete 20 squats to break the sabotage", category: "physical", difficulty: 3, proofRequired: true },
  { id: "plank_60", name: "Hold Plank for 60 seconds", description: "Hold a plank for 60 seconds", category: "physical", difficulty: 4, proofRequired: true },
  { id: "burpees_5", name: "Do 5 Burpees", description: "Complete 5 burpees", category: "physical", difficulty: 4, proofRequired: true },
  { id: "jumping_jacks_50", name: "Do 50 Jumping Jacks", description: "Complete 50 jumping jacks", category: "physical", difficulty: 3, proofRequired: true },
  
  // Tech Escape Tasks
  { id: "commits_2", name: "Make 2 Git Commits", description: "Make 2 meaningful commits to any codebase", category: "tech", difficulty: 4, proofRequired: true },
  { id: "code_review", name: "Do a Code Review", description: "Review someone's code and provide feedback", category: "tech", difficulty: 3, proofRequired: true },
  { id: "debug_issue", name: "Debug a Real Issue", description: "Find and fix a bug in any project", category: "tech", difficulty: 5, proofRequired: true },
  { id: "write_tests", name: "Write Unit Tests", description: "Write at least 3 unit tests for any function", category: "tech", difficulty: 4, proofRequired: true },
  { id: "documentation", name: "Write Documentation", description: "Write documentation for a function or feature", category: "tech", difficulty: 3, proofRequired: true },
  
  // Mental Escape Tasks
  { id: "read_30min", name: "Read for 30 Minutes", description: "Read any book or article for 30 minutes", category: "mental", difficulty: 3, proofRequired: true },
  { id: "solve_puzzle", name: "Solve a Puzzle", description: "Complete a crossword, sudoku, or logic puzzle", category: "mental", difficulty: 3, proofRequired: true },
  { id: "learn_something", name: "Learn Something New", description: "Learn a new concept or skill for 20 minutes", category: "mental", difficulty: 4, proofRequired: true },
  { id: "meditate_10min", name: "Meditate for 10 Minutes", description: "Meditate or do mindfulness for 10 minutes", category: "mental", difficulty: 3, proofRequired: true },
  
  // Creative Escape Tasks
  { id: "draw_something", name: "Draw Something", description: "Create a drawing or sketch", category: "creative", difficulty: 3, proofRequired: true },
  { id: "write_poem", name: "Write a Poem", description: "Write a 4-line poem", category: "creative", difficulty: 3, proofRequired: true },
  { id: "cook_meal", name: "Cook a Meal", description: "Cook a complete meal from scratch", category: "creative", difficulty: 4, proofRequired: true },
  { id: "music_practice", name: "Practice Music", description: "Practice an instrument or sing for 15 minutes", category: "creative", difficulty: 3, proofRequired: true },
  
  // Social Escape Tasks
  { id: "help_someone", name: "Help Someone", description: "Help someone with a task or problem", category: "social", difficulty: 3, proofRequired: true },
  { id: "call_family", name: "Call Family/Friend", description: "Call a family member or friend", category: "social", difficulty: 2, proofRequired: true },
  { id: "compliment_3", name: "Give 3 Compliments", description: "Give genuine compliments to 3 different people", category: "social", difficulty: 3, proofRequired: true },
  { id: "volunteer", name: "Do Volunteer Work", description: "Do any form of volunteer work", category: "social", difficulty: 5, proofRequired: true },
];

// Get random escape tasks for a user under sabotage
export const getSabotageEscapeTasks = query({
  args: { 
    warId: v.id("challengeWars"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.count || 3;
    
    // Get random escape tasks
    const shuffled = SABOTAGE_ESCAPE_TASKS.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(task => ({
      ...task,
      warId: args.warId,
    }));
  },
});

// Complete an escape task to break sabotage
export const completeEscapeTask = mutation({
  args: {
    warId: v.id("challengeWars"),
    taskId: v.string(),
    proof: v.string(),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    // Find the escape task
    const task = SABOTAGE_ESCAPE_TASKS.find(t => t.id === args.taskId);
    if (!task) {
      throw new Error("Escape task not found");
    }

    // Record the escape task completion
    const completionId = await ctx.db.insert("sabotageChallengeCompletions", {
      warId: args.warId,
      challengeId: `escape_${args.taskId}`,
      challengerId: war.defenderId, // Defender is trying to escape
      sabotagePower: 0, // No sabotage power for escape tasks
      proof: args.proof,
      completedAt: Date.now(),
    });

    // Check if this was the final escape task needed - count ALL escape task completions
    const escapeCompletions = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war", (q) => q.eq("warId", args.warId))
      .filter((q) => q.eq(q.field("challengerId"), war.defenderId)) // All completions by the defender
      .collect();

    // Filter to only escape tasks (challengeId starts with "escape_")
    const escapeTaskCompletions = escapeCompletions.filter(completion => 
      completion.challengeId.startsWith("escape_")
    );

    console.log(`🔍 Escape task completions: ${escapeTaskCompletions.length}/3`);
    console.log(`📋 All completions by defender: ${escapeCompletions.length}`);
    console.log(`🎯 Escape tasks: ${escapeTaskCompletions.map(c => c.challengeId).join(', ')}`);

    // If this is the 3rd escape task completion, break the sabotage
    if (escapeTaskCompletions.length >= 3) {
      await ctx.db.patch(args.warId, {
        sabotageActive: false,
        sabotageIntensity: 0,
        sabotagePenaltiesApplied: 0,
      });

      return {
        success: true,
        message: `🎉 SABOTAGE BROKEN! You completed ${escapeTaskCompletions.length} escape tasks and are free!`,
        sabotageBroken: true,
        task: task,
        completions: escapeTaskCompletions.length,
      };
    }

    return {
      success: true,
      message: `✅ Escape task completed! ${3 - escapeTaskCompletions.length} more tasks needed to break sabotage.`,
      sabotageBroken: false,
      task: task,
      completions: escapeTaskCompletions.length,
      remaining: 3 - escapeTaskCompletions.length,
    };
  },
});

// Check if user is under sabotage
export const isUnderSabotage = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db
      .query("challengeWars")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => 
        q.and(
          q.eq(q.field("defenderId"), args.userId),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("sabotageActive"), true)
        )
      )
      .first();

    return war ? {
      isUnderSabotage: true,
      warId: war._id,
      intensity: war.sabotageIntensity || 0,
      penaltiesApplied: war.sabotagePenaltiesApplied || 0,
    } : {
      isUnderSabotage: false,
    };
  },
});

// Get sabotage effects for UI
export const getSabotageEffects = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Find war where user is defender and under sabotage
    const war = await ctx.db
      .query("challengeWars")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => 
        q.and(
          q.eq(q.field("defenderId"), args.userId),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("sabotageActive"), true)
        )
      )
      .first();

    if (!war) {
      return {
        isUnderSabotage: false,
        effects: [],
      };
    }

    // Generate random UI effects based on intensity
    const intensity = war.sabotageIntensity || 0;
    const effects = [];

    if (intensity >= 3) {
      effects.push("gloomy_ui");
    }
    if (intensity >= 5) {
      effects.push("button_malfunctions");
    }
    if (intensity >= 7) {
      effects.push("habit_blocking");
    }
    if (intensity >= 9) {
      effects.push("extreme_effects");
    }

    return {
      isUnderSabotage: true,
      warId: war._id,
      intensity: intensity,
      effects: effects,
      penaltiesApplied: war.sabotagePenaltiesApplied || 0,
    };
  },
});

// Counter-sabotage: Even more intense sabotage
export const launchCounterSabotage = mutation({
  args: {
    warId: v.id("challengeWars"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    // Check if defender has completed any escape tasks (reduced requirement)
    const escapeCompletions = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war", (q) => q.eq("warId", args.warId))
      .filter((q) => q.eq(q.field("challengerId"), war.defenderId))
      .collect();

    // Filter to only escape tasks (challengeId starts with "escape_")
    const escapeTaskCompletions = escapeCompletions.filter(completion => 
      completion.challengeId.startsWith("escape_")
    );

    // Allow counter-sabotage after just 1 escape task (easier to fight back)
    if (escapeTaskCompletions.length < 1) {
      throw new Error("Complete at least 1 escape task to launch counter-sabotage!");
    }

    // Launch counter-sabotage with maximum intensity
    await ctx.db.patch(args.warId, {
      sabotageActive: true,
      sabotageIntensity: 10, // Maximum intensity
      sabotagePenaltiesApplied: (war.sabotagePenaltiesApplied || 0) + 5,
      sabotagePower: 0, // Reset sabotage power
    });

    // Apply severe penalties to the original challenger
    const challenger = await ctx.db.get(war.challengerId);
    if (challenger) {
      const penaltyAmount = 500; // Heavy penalty
      const newBalance = Math.max(0, (challenger.rewardsBalance || 0) - penaltyAmount);
      await ctx.db.patch(war.challengerId, {
        rewardsBalance: newBalance,
      });

      // Record penalty transaction
      await ctx.db.insert("rewardsTransactions", {
        userId: war.challengerId,
        amount: -penaltyAmount,
        type: "counter_sabotage_penalty",
        description: `Counter-sabotage penalty: ${penaltyAmount} coins lost`,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      message: `💀 COUNTER-SABOTAGE LAUNCHED! Maximum intensity activated! Your opponent is now under extreme pressure!`,
      intensity: 10,
      penaltyAmount: 500,
    };
  },
});

// Immediate counter-sabotage - no escape tasks required
export const launchImmediateCounterSabotage = mutation({
  args: {
    warId: v.id("challengeWars"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    // Launch immediate counter-sabotage - no requirements
    await ctx.db.patch(args.warId, {
      sabotageActive: true,
      sabotageIntensity: 8, // High but not maximum intensity
      sabotagePenaltiesApplied: (war.sabotagePenaltiesApplied || 0) + 3,
      sabotagePower: 0, // Reset sabotage power
    });

    // Apply moderate penalties to the original challenger
    const challenger = await ctx.db.get(war.challengerId);
    if (challenger) {
      const penaltyAmount = 200; // Moderate penalty
      const newBalance = Math.max(0, (challenger.rewardsBalance || 0) - penaltyAmount);
      await ctx.db.patch(war.challengerId, {
        rewardsBalance: newBalance,
      });

      // Record penalty transaction
      await ctx.db.insert("rewardsTransactions", {
        userId: war.challengerId,
        amount: -penaltyAmount,
        type: "immediate_counter_sabotage_penalty",
        description: `Immediate counter-sabotage penalty: ${penaltyAmount} coins lost`,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      message: `💀 IMMEDIATE COUNTER-SABOTAGE! High intensity activated! Your opponent is now under pressure!`,
      intensity: 8,
      penaltyAmount: 200,
    };
  },
});
