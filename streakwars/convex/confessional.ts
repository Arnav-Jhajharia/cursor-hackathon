import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Confessional scenarios for deepfake videos
const CONFESSIONAL_SCENARIOS = [
  {
    id: "skydiving",
    name: "Skydiving Confession",
    description: "Confessing while free-falling from 10,000 feet",
    backgroundVideo: "https://example.com/skydiving.mp4", // Placeholder
    intensity: "extreme"
  },
  {
    id: "courtroom",
    name: "Courtroom Drama",
    description: "Standing trial for your broken habit",
    backgroundVideo: "https://example.com/courtroom.mp4", // Placeholder
    intensity: "dramatic"
  },
  {
    id: "soap_opera",
    name: "Soap Opera Scene",
    description: "Dramatic confession on a daytime soap",
    backgroundVideo: "https://example.com/soap_opera.mp4", // Placeholder
    intensity: "melodramatic"
  },
  {
    id: "space_station",
    name: "Space Station Confession",
    description: "Confessing while floating in zero gravity",
    backgroundVideo: "https://example.com/space.mp4", // Placeholder
    intensity: "cosmic"
  },
  {
    id: "medieval_castle",
    name: "Medieval Confession",
    description: "Confessing in a medieval castle throne room",
    backgroundVideo: "https://example.com/medieval.mp4", // Placeholder
    intensity: "historical"
  },
  {
    id: "underwater",
    name: "Underwater Confession",
    description: "Confessing while scuba diving with sharks",
    backgroundVideo: "https://example.com/underwater.mp4", // Placeholder
    intensity: "aquatic"
  },
  {
    id: "zombie_apocalypse",
    name: "Zombie Apocalypse",
    description: "Confessing while running from zombies",
    backgroundVideo: "https://example.com/zombie.mp4", // Placeholder
    intensity: "apocalyptic"
  },
  {
    id: "superhero",
    name: "Superhero Confession",
    description: "Confessing while flying through the city",
    backgroundVideo: "https://example.com/superhero.mp4", // Placeholder
    intensity: "heroic"
  }
];

// Anti-confessional scenarios (for maintaining streaks)
const ANTI_CONFESSIONAL_SCENARIOS = [
  {
    id: "victory_parade",
    name: "Victory Parade",
    description: "Celebrating your streak in a victory parade",
    backgroundVideo: "https://example.com/victory.mp4", // Placeholder
    intensity: "triumphant"
  },
  {
    id: "mountain_summit",
    name: "Mountain Summit",
    description: "Declaring your success from a mountain peak",
    backgroundVideo: "https://example.com/mountain.mp4", // Placeholder
    intensity: "achievement"
  },
  {
    id: "red_carpet",
    name: "Red Carpet",
    description: "Walking the red carpet for your success",
    backgroundVideo: "https://example.com/red_carpet.mp4", // Placeholder
    intensity: "glamorous"
  },
  {
    id: "press_conference",
    name: "Press Conference",
    description: "Announcing your achievement to the world",
    backgroundVideo: "https://example.com/press.mp4", // Placeholder
    intensity: "official"
  }
];

// Create a confessional record when a streak is broken
export const createConfessional = mutation({
  args: {
    userId: v.id("users"),
    habitId: v.id("habits"),
    habitName: v.string(),
    streakLength: v.number(),
    confessionVideo: v.optional(v.string()), // URL to the recorded confession
    scenarioId: v.string(),
    isAntiConfessional: v.optional(v.boolean()), // true for anti-confessional
    friendId: v.optional(v.id("users")), // Friend to send the video to
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const confessionalId = await ctx.db.insert("confessionals", {
      userId: args.userId,
      habitId: args.habitId,
      habitName: args.habitName,
      streakLength: args.streakLength,
      confessionVideo: args.confessionVideo,
      scenarioId: args.scenarioId,
      isAntiConfessional: args.isAntiConfessional || false,
      friendId: args.friendId,
      status: "pending", // pending, processing, completed, failed
      createdAt: now,
      updatedAt: now,
    });

    return { confessionalId };
  },
});

// Get confessionals for a user
export const getUserConfessionals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("confessionals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get pending confessionals that need processing
export const getPendingConfessionals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("confessionals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Update confessional status
export const updateConfessionalStatus = mutation({
  args: {
    confessionalId: v.id("confessionals"),
    status: v.string(), // pending, processing, completed, failed
    processedVideoUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.confessionalId, {
      status: args.status,
      processedVideoUrl: args.processedVideoUrl,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

// Get available confessional scenarios
export const getConfessionalScenarios = query({
  args: { isAntiConfessional: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.isAntiConfessional) {
      return ANTI_CONFESSIONAL_SCENARIOS;
    }
    return CONFESSIONAL_SCENARIOS;
  },
});

// Get a random confessional scenario
export const getRandomConfessionalScenario = query({
  args: { isAntiConfessional: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const scenarios = args.isAntiConfessional ? ANTI_CONFESSIONAL_SCENARIOS : CONFESSIONAL_SCENARIOS;
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex];
  },
});

// Get confessional by ID
export const getConfessionalById = query({
  args: { confessionalId: v.id("confessionals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.confessionalId);
  },
});

// Trigger confessional when streak is broken
export const triggerConfessional = mutation({
  args: {
    userId: v.id("users"),
    habitId: v.id("habits"),
    habitName: v.string(),
    streakLength: v.number(),
    friendId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get a random confessional scenario
    const scenarios = CONFESSIONAL_SCENARIOS;
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    const scenario = scenarios[randomIndex];

    // Create the confessional record
    const confessionalId = await ctx.db.insert("confessionals", {
      userId: args.userId,
      habitId: args.habitId,
      habitName: args.habitName,
      streakLength: args.streakLength,
      scenarioId: scenario.id,
      isAntiConfessional: false,
      friendId: args.friendId,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { 
      confessionalId, 
      scenario,
      message: `Your ${args.streakLength}-day streak for "${args.habitName}" has been broken! Time for a confessional video.`
    };
  },
});

// Trigger anti-confessional when achieving a milestone
export const triggerAntiConfessional = mutation({
  args: {
    userId: v.id("users"),
    habitId: v.id("habits"),
    habitName: v.string(),
    streakLength: v.number(),
    milestone: v.string(), // e.g., "7 days", "30 days", "100 days"
  },
  handler: async (ctx, args) => {
    // Get a random anti-confessional scenario
    const scenarios = ANTI_CONFESSIONAL_SCENARIOS;
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    const scenario = scenarios[randomIndex];

    // Create the anti-confessional record
    const confessionalId = await ctx.db.insert("confessionals", {
      userId: args.userId,
      habitId: args.habitId,
      habitName: args.habitName,
      streakLength: args.streakLength,
      scenarioId: scenario.id,
      isAntiConfessional: true,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { 
      confessionalId, 
      scenario,
      message: `🎉 Congratulations! You've reached ${args.milestone} for "${args.habitName}"! Time for a victory video.`
    };
  },
});
