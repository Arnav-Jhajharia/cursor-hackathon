import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Random sabotage challenges that challengers must complete to earn sabotage power
const SABOTAGE_CHALLENGES = [
  // Physical Challenges
  { id: "pushups", name: "Do 5 Push-ups", description: "Complete 5 push-ups to earn sabotage power", category: "physical", difficulty: 1, sabotagePower: 1 },
  { id: "squats", name: "Do 10 Squats", description: "Complete 10 squats to earn sabotage power", category: "physical", difficulty: 1, sabotagePower: 1 },
  { id: "plank", name: "Hold Plank for 30 seconds", description: "Hold a plank position for 30 seconds", category: "physical", difficulty: 2, sabotagePower: 2 },
  { id: "burpees", name: "Do 3 Burpees", description: "Complete 3 burpees (the ultimate exercise)", category: "physical", difficulty: 3, sabotagePower: 3 },
  { id: "gym", name: "Hit the Gym", description: "Go to the gym and do any workout", category: "physical", difficulty: 4, sabotagePower: 4 },
  { id: "run", name: "Run for 10 minutes", description: "Go for a 10-minute run", category: "physical", difficulty: 3, sabotagePower: 3 },
  
  // Mental Challenges
  { id: "read", name: "Read 10 Pages", description: "Read 10 pages of any book", category: "mental", difficulty: 2, sabotagePower: 2 },
  { id: "meditate", name: "Meditate for 5 minutes", description: "Meditate or do mindfulness for 5 minutes", category: "mental", difficulty: 2, sabotagePower: 2 },
  { id: "learn", name: "Learn Something New", description: "Watch a tutorial or read about something new for 15 minutes", category: "mental", difficulty: 3, sabotagePower: 3 },
  { id: "code", name: "Write Code for 20 minutes", description: "Write code for at least 20 minutes", category: "mental", difficulty: 4, sabotagePower: 4 },
  { id: "website", name: "Make a Website", description: "Create a simple website or webpage", category: "mental", difficulty: 5, sabotagePower: 5 },
  
  // Social Challenges
  { id: "call", name: "Call Someone", description: "Call a friend or family member", category: "social", difficulty: 2, sabotagePower: 2 },
  { id: "compliment", name: "Give 3 Compliments", description: "Give genuine compliments to 3 different people", category: "social", difficulty: 3, sabotagePower: 3 },
  { id: "help", name: "Help Someone", description: "Help someone with a task or problem", category: "social", difficulty: 4, sabotagePower: 4 },
  
  // Creative Challenges
  { id: "draw", name: "Draw Something", description: "Draw or sketch something creative", category: "creative", difficulty: 2, sabotagePower: 2 },
  { id: "write", name: "Write 100 Words", description: "Write 100 words about anything", category: "creative", difficulty: 2, sabotagePower: 2 },
  { id: "music", name: "Listen to New Music", description: "Listen to 3 songs you've never heard before", category: "creative", difficulty: 1, sabotagePower: 1 },
  { id: "cook", name: "Cook Something", description: "Cook a meal or snack", category: "creative", difficulty: 3, sabotagePower: 3 },
  
  // Random/Weird Challenges
  { id: "dance", name: "Dance for 2 minutes", description: "Dance to your favorite song for 2 minutes", category: "random", difficulty: 1, sabotagePower: 1 },
  { id: "sing", name: "Sing Out Loud", description: "Sing your favorite song out loud", category: "random", difficulty: 2, sabotagePower: 2 },
  { id: "joke", name: "Tell a Joke", description: "Tell a joke to someone (or yourself)", category: "random", difficulty: 1, sabotagePower: 1 },
  { id: "photo", name: "Take a Creative Photo", description: "Take a creative or artistic photo", category: "random", difficulty: 2, sabotagePower: 2 },
  { id: "clean", name: "Clean Something", description: "Clean or organize something in your space", category: "random", difficulty: 2, sabotagePower: 2 },
];

// Get random sabotage challenges for a war
export const getRandomSabotageChallenges = query({
  args: { 
    warId: v.id("challengeWars"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.count || 5;
    
    // Shuffle the challenges array
    const shuffled = [...SABOTAGE_CHALLENGES].sort(() => Math.random() - 0.5);
    
    // Return random challenges
    return shuffled.slice(0, count).map(challenge => ({
      ...challenge,
      warId: args.warId,
    }));
  },
});

// Complete a sabotage challenge
export const completeSabotageChallenge = mutation({
  args: {
    warId: v.id("challengeWars"),
    challengeId: v.string(),
    proof: v.optional(v.string()), // Optional proof (photo, description, etc.)
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    // Find the challenge
    const challenge = SABOTAGE_CHALLENGES.find(c => c.id === args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Check if challenge was already completed
    const existingCompletion = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war_challenge", (q) => 
        q.eq("warId", args.warId).eq("challengeId", args.challengeId)
      )
      .first();

    if (existingCompletion) {
      throw new Error("Challenge already completed");
    }

    // Record the completion
    const completionId = await ctx.db.insert("sabotageChallengeCompletions", {
      warId: args.warId,
      challengeId: args.challengeId,
      challengerId: war.challengerId,
      sabotagePower: challenge.sabotagePower,
      proof: args.proof,
      completedAt: Date.now(),
    });

    // Update war with sabotage power
    const currentSabotagePower = war.sabotagePower || 0;
    await ctx.db.patch(args.warId, {
      sabotagePower: currentSabotagePower + challenge.sabotagePower,
    });

    return {
      message: `🔥 CHALLENGE COMPLETED! +${challenge.sabotagePower} Sabotage Power!`,
      challenge: challenge,
      sabotagePowerEarned: challenge.sabotagePower,
      totalSabotagePower: currentSabotagePower + challenge.sabotagePower,
    };
  },
});

// Get completed sabotage challenges for a war
export const getCompletedSabotageChallenges = query({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war", (q) => q.eq("warId", args.warId))
      .collect();

    return completions.map(completion => {
      const challenge = SABOTAGE_CHALLENGES.find(c => c.id === completion.challengeId);
      return {
        ...completion,
        challenge: challenge,
      };
    });
  },
});

// Get available sabotage challenges (not completed yet)
export const getAvailableSabotageChallenges = query({
  args: { warId: v.id("challengeWars") },
  handler: async (ctx, args) => {
    const completed = await ctx.db
      .query("sabotageChallengeCompletions")
      .withIndex("by_war", (q) => q.eq("warId", args.warId))
      .collect();

    const completedIds = completed.map(c => c.challengeId);
    const available = SABOTAGE_CHALLENGES.filter(c => !completedIds.includes(c.id));

    // Return 5 random available challenges
    return available.sort(() => Math.random() - 0.5).slice(0, 5);
  },
});

// Use sabotage power to apply penalties
export const useSabotagePower = mutation({
  args: {
    warId: v.id("challengeWars"),
    powerToUse: v.number(),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    const currentPower = war.sabotagePower || 0;
    if (currentPower < args.powerToUse) {
      throw new Error("Not enough sabotage power");
    }

    // Calculate penalties based on power used
    const penaltiesToApply = Math.floor(args.powerToUse / 2); // 2 power = 1 penalty
    
    // Update war
    await ctx.db.patch(args.warId, {
      sabotagePower: currentPower - args.powerToUse,
      sabotagePenaltiesApplied: (war.sabotagePenaltiesApplied || 0) + penaltiesToApply,
    });

    // Apply penalties to defender
    const penaltyAmount = args.powerToUse * 25; // 25 coins per power point
    const defender = await ctx.db.get(war.defenderId);
    if (defender) {
      const newBalance = Math.max(0, (defender.rewardsBalance || 0) - penaltyAmount);
      await ctx.db.patch(war.defenderId, {
        rewardsBalance: newBalance,
      });

      // Record penalty transaction
      await ctx.db.insert("rewardsTransactions", {
        userId: war.defenderId,
        amount: -penaltyAmount,
        type: "sabotage_power_penalty",
        description: `Sabotage power penalty: ${args.powerToUse} power used`,
        createdAt: Date.now(),
      });
    }

    return {
      message: `💀 SABOTAGE POWER USED! ${args.powerToUse} power → ${penaltiesToApply} penalties!`,
      powerUsed: args.powerToUse,
      penaltiesApplied: penaltiesToApply,
      remainingPower: currentPower - args.powerToUse,
      penaltyAmount: penaltyAmount,
    };
  },
});
