import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create pre-made challenge sets
export const createDefaultChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // Check if challenges already exist
    const existingChallenges = await ctx.db.query("challenges").collect();
    if (existingChallenges.length > 0) {
      return { message: "Challenges already exist" };
    }

    // Get or create system user
    let systemUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "system_user"))
      .first();
    
    let systemUserId;
    if (!systemUser) {
      systemUserId = await ctx.db.insert("users", {
        clerkId: "system_user",
        name: "System",
        email: "system@habituate.app",
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        rewardsBalance: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      systemUserId = systemUser._id;
    }

    const challenges = [
      {
        name: "30-Day Reading Challenge",
        description: "Read an excerpt or article daily for 30 days. Build a consistent reading habit and expand your knowledge.",
        startDate: now,
        endDate: now + thirtyDays,
        targetHabits: ["Read for 15 minutes", "Read one article", "Read a book chapter"],
        isActive: true,
        createdAt: now,
      },
      {
        name: "30-Day Fitness Challenge",
        description: "Hit the gym or do a workout daily for 30 days. Build strength, endurance, and a consistent fitness routine.",
        startDate: now,
        endDate: now + thirtyDays,
        targetHabits: ["Go to gym", "Do 30 minutes cardio", "Strength training"],
        isActive: true,
        createdAt: now,
      },
      {
        name: "Weekly Coding Challenge",
        description: "Solve LeetCode problems weekly. Improve your coding skills and prepare for technical interviews.",
        startDate: now,
        endDate: now + (4 * sevenDays), // 4 weeks
        targetHabits: ["Solve 3 LeetCode problems", "Complete coding challenge", "Review algorithms"],
        isActive: true,
        createdAt: now,
      },
      {
        name: "Mindfulness & Meditation",
        description: "Practice mindfulness and meditation daily. Reduce stress and improve mental well-being.",
        startDate: now,
        endDate: now + thirtyDays,
        targetHabits: ["10 minutes meditation", "Mindfulness practice", "Deep breathing exercises"],
        isActive: true,
        createdAt: now,
      },
      {
        name: "Healthy Eating Challenge",
        description: "Eat healthy meals and avoid junk food for 30 days. Build better eating habits.",
        startDate: now,
        endDate: now + thirtyDays,
        targetHabits: ["Eat 5 servings vegetables", "Drink 8 glasses water", "Avoid processed food"],
        isActive: true,
        createdAt: now,
      },
      {
        name: "Early Bird Challenge",
        description: "Wake up early and start your day with purpose. Build a productive morning routine.",
        startDate: now,
        endDate: now + thirtyDays,
        targetHabits: ["Wake up before 7 AM", "Morning exercise", "Plan your day"],
        isActive: true,
        createdAt: now,
      },
    ];

    const createdChallenges = [];
    for (const challenge of challenges) {
      const challengeId = await ctx.db.insert("challenges", {
        ...challenge,
        prizeType: "none",
        createdBy: systemUserId,
      });
      createdChallenges.push(challengeId);
    }

    return { 
      message: `Created ${createdChallenges.length} default challenges`,
      challengeIds: createdChallenges 
    };
  },
});

// Get challenge sets (pre-made challenges)
export const getChallengeSets = mutation({
  args: {},
  handler: async (ctx) => {
    // Return all challenges
    return await ctx.db.query("challenges").collect();
  },
});
