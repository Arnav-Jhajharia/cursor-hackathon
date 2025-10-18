import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create sample public habits with integrations
export const createSamplePublicHabits = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if sample public habits already exist
    const existingPublicHabits = await ctx.db
      .query("habits")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    if (existingPublicHabits.length > 0) {
      return { message: "Sample public habits already exist" };
    }

    // Use provided userId or find/create a system user
    let systemUserId = args.userId;
    
    if (!systemUserId) {
      const existingUsers = await ctx.db.query("users").collect();
      if (existingUsers.length > 0) {
        systemUserId = existingUsers[0]._id;
      } else {
        // Create a system user
        systemUserId = await ctx.db.insert("users", {
          clerkId: "system_user_" + now,
          name: "Habit Community",
          email: "community@habituate.app",
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const sampleHabits = [
      {
        name: "Daily 10K Steps",
        description: "Track your daily step count and maintain an active lifestyle. Perfect for building consistent movement habits.",
        category: "fitness",
        targetFrequency: "daily",
        pointsPerCompletion: 15,
        isPublic: true,
        integrations: ["apple_health", "google_fit", "strava"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Morning Meditation",
        description: "Start your day with mindfulness and mental clarity. Even 10 minutes can transform your mindset.",
        category: "mindfulness",
        targetFrequency: "daily",
        pointsPerCompletion: 20,
        isPublic: true,
        integrations: ["headspace", "calm", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "LeetCode Daily",
        description: "Solve one coding problem daily to improve your programming skills and prepare for technical interviews.",
        category: "learning",
        targetFrequency: "daily",
        pointsPerCompletion: 25,
        isPublic: true,
        integrations: ["leetcode_api", "github", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Read 30 Minutes",
        description: "Dedicate time daily to reading books, articles, or educational content to expand your knowledge.",
        category: "learning",
        targetFrequency: "daily",
        pointsPerCompletion: 18,
        isPublic: true,
        integrations: ["goodreads", "kindle", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Gym Workout",
        description: "Hit the gym for strength training, cardio, or any structured workout to build physical fitness.",
        category: "fitness",
        targetFrequency: "daily",
        pointsPerCompletion: 30,
        isPublic: true,
        integrations: ["strava", "myfitnesspal", "apple_health"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Drink 8 Glasses Water",
        description: "Stay hydrated throughout the day by drinking at least 8 glasses of water for optimal health.",
        category: "health",
        targetFrequency: "daily",
        pointsPerCompletion: 12,
        isPublic: true,
        integrations: ["apple_health", "google_fit", "water_reminder"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Write in Journal",
        description: "Reflect on your day, express gratitude, or work through thoughts by writing in a journal.",
        category: "mindfulness",
        targetFrequency: "daily",
        pointsPerCompletion: 15,
        isPublic: true,
        integrations: ["notion", "obsidian", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Practice Guitar",
        description: "Spend time practicing your guitar skills, learning new songs, or improving your technique.",
        category: "creative",
        targetFrequency: "daily",
        pointsPerCompletion: 22,
        isPublic: true,
        integrations: ["yousician", "spotify", "youtube"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "No Social Media Before Noon",
        description: "Avoid social media in the morning to start your day with focus and intention.",
        category: "productivity",
        targetFrequency: "daily",
        pointsPerCompletion: 20,
        isPublic: true,
        integrations: ["screen_time", "rescuetime", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Learn Spanish",
        description: "Practice Spanish daily through apps, conversations, or lessons to build language skills.",
        category: "learning",
        targetFrequency: "daily",
        pointsPerCompletion: 20,
        isPublic: true,
        integrations: ["duolingo", "babbel", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Evening Stretch",
        description: "Wind down with gentle stretching to improve flexibility and reduce muscle tension.",
        category: "health",
        targetFrequency: "daily",
        pointsPerCompletion: 15,
        isPublic: true,
        integrations: ["apple_health", "yoga_app", "fitbit"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Code Side Project",
        description: "Work on your personal coding projects to build skills and create something meaningful.",
        category: "productivity",
        targetFrequency: "daily",
        pointsPerCompletion: 35,
        isPublic: true,
        integrations: ["github", "vscode", "llm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const createdHabits = [];
    for (const habit of sampleHabits) {
      const habitId = await ctx.db.insert("habits", {
        userId: systemUserId,
        ...habit,
        isActive: true,
      });
      createdHabits.push(habitId);
    }

    return { 
      message: `Created ${createdHabits.length} sample public habits with integrations`,
      habitIds: createdHabits 
    };
  },
});

// Simple function to create a few sample habits for testing
export const createSimpleSampleHabits = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const simpleHabits = [
      {
        name: "Daily 10K Steps",
        description: "Track your daily step count and maintain an active lifestyle.",
        category: "fitness",
        targetFrequency: "daily",
        pointsPerCompletion: 15,
        isPublic: true,
        integrations: ["apple_health", "strava"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Morning Meditation",
        description: "Start your day with mindfulness and mental clarity.",
        category: "mindfulness",
        targetFrequency: "daily",
        pointsPerCompletion: 20,
        isPublic: true,
        integrations: ["headspace", "calm"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "LeetCode Daily",
        description: "Solve one coding problem daily to improve your programming skills.",
        category: "learning",
        targetFrequency: "daily",
        pointsPerCompletion: 25,
        isPublic: true,
        integrations: ["leetcode_api", "github"],
        remixCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const createdHabits = [];
    for (const habit of simpleHabits) {
      const habitId = await ctx.db.insert("habits", {
        userId: args.userId,
        ...habit,
        isActive: true,
      });
      createdHabits.push(habitId);
    }

    return { 
      message: `Created ${createdHabits.length} sample public habits`,
      habitIds: createdHabits 
    };
  },
});
