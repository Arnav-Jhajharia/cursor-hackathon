import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Quick 5-minute sabotage challenges perfect for hackathon demos
const SABOTAGE_CHALLENGES = [
  // AI-Powered Quick Tasks (5 minutes or less) - HIGH SABOTAGE POWER
  { id: "ai_poem", name: "Write an AI Poem", description: "Use Groq to generate a 4-line poem about coding", category: "ai", difficulty: 1, sabotagePower: 50, requiresAI: true },
  { id: "ai_joke", name: "Generate a Programming Joke", description: "Ask Groq to create a funny programming joke", category: "ai", difficulty: 1, sabotagePower: 8, requiresAI: true },
  { id: "ai_haiku", name: "Create a Tech Haiku", description: "Generate a 5-7-5 haiku about technology using AI", category: "ai", difficulty: 1, sabotagePower: 50, requiresAI: true },
  { id: "ai_advice", name: "Get AI Life Advice", description: "Ask Groq for one piece of life advice and share it", category: "ai", difficulty: 1, sabotagePower: 8, requiresAI: true },
  { id: "ai_story", name: "AI Story Starter", description: "Generate the first 2 sentences of a sci-fi story", category: "ai", difficulty: 2, sabotagePower: 55, requiresAI: true },
  
  // Quick Physical Tasks
  { id: "jumping_jacks", name: "20 Jumping Jacks", description: "Do 20 jumping jacks right now", category: "physical", difficulty: 1, sabotagePower: 5 },
  { id: "wall_sit", name: "30-Second Wall Sit", description: "Hold a wall sit for 30 seconds", category: "physical", difficulty: 2, sabotagePower: 8 },
  { id: "stretch", name: "2-Minute Stretch", description: "Do a full body stretch for 2 minutes", category: "physical", difficulty: 1, sabotagePower: 5 },
  { id: "dance_break", name: "Dance Break", description: "Dance to your favorite song for 1 minute", category: "physical", difficulty: 1, sabotagePower: 5 },
  
  // Quick Mental Tasks
  { id: "countdown", name: "Count Backwards", description: "Count backwards from 100 to 0", category: "mental", difficulty: 1, sabotagePower: 5 },
  { id: "alphabet", name: "Alphabet Game", description: "Name 5 things that start with each letter A-E", category: "mental", difficulty: 2, sabotagePower: 8 },
  { id: "memory", name: "Memory Test", description: "Memorize and recite a 10-digit number", category: "mental", difficulty: 2, sabotagePower: 8 },
  { id: "riddle", name: "Solve a Riddle", description: "Find and solve one riddle online", category: "mental", difficulty: 2, sabotagePower: 8 },
  
  // Quick Creative Tasks
  { id: "doodle", name: "Quick Doodle", description: "Draw a simple doodle in 2 minutes", category: "creative", difficulty: 1, sabotagePower: 5 },
  { id: "rhyme", name: "Make a Rhyme", description: "Create a 4-line rhyme about coding", category: "creative", difficulty: 2, sabotagePower: 8 },
  { id: "emoji_story", name: "Emoji Story", description: "Tell a story using only 5 emojis", category: "creative", difficulty: 1, sabotagePower: 5 },
  { id: "acronym", name: "Create an Acronym", description: "Make an acronym for 'HACKATHON'", category: "creative", difficulty: 1, sabotagePower: 5 },
  
  // Quick Social Tasks
  { id: "compliment", name: "Give a Compliment", description: "Give a genuine compliment to someone nearby", category: "social", difficulty: 1, sabotagePower: 5 },
  { id: "high_five", name: "High Five Someone", description: "Give a high five to 3 different people", category: "social", difficulty: 1, sabotagePower: 5 },
  { id: "joke_share", name: "Share a Joke", description: "Tell a joke to someone and make them laugh", category: "social", difficulty: 2, sabotagePower: 8 },
  { id: "help_offer", name: "Offer Help", description: "Offer to help someone with their current task", category: "social", difficulty: 2, sabotagePower: 8 },
  
  // Quick Tech Tasks
  { id: "google_fact", name: "Learn a Tech Fact", description: "Google and learn one interesting tech fact", category: "tech", difficulty: 1, sabotagePower: 5 },
  { id: "code_snippet", name: "Write a One-Liner", description: "Write a useful one-line code snippet", category: "tech", difficulty: 2, sabotagePower: 8 },
  { id: "debug_thought", name: "Debug Thought Process", description: "Explain how you would debug a common bug", category: "tech", difficulty: 2, sabotagePower: 8 },
  { id: "tech_trend", name: "Name a Tech Trend", description: "Name and briefly explain one current tech trend", category: "tech", difficulty: 1, sabotagePower: 5 },
];

// Get sabotage challenges based on user's existing habits
export const getPersonalizedSabotageChallenges = query({
  args: { 
    warId: v.id("challengeWars"),
    userId: v.id("users"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.count || 5;
    
    // Get user's existing habits
    const userHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Generate personalized challenges based on existing habits
    const personalizedChallenges = [];
    
    for (const habit of userHabits) {
      // Create "extra" versions of their existing habits
      const baseChallenge = {
        id: `extra_${habit._id}`,
        name: `Extra ${habit.name}`,
        description: `Complete an extra session of: ${habit.name}`,
        category: habit.category,
        difficulty: Math.min(5, (habit.pointsPerCompletion || 1) + 1),
        sabotagePower: Math.min(5, (habit.pointsPerCompletion || 1) + 1),
        originalHabitId: habit._id,
        isPersonalized: true,
      };
      personalizedChallenges.push(baseChallenge);
    }
    
    // Add some random challenges if we don't have enough personalized ones
    const remainingCount = count - personalizedChallenges.length;
    if (remainingCount > 0) {
      const shuffled = [...SABOTAGE_CHALLENGES].sort(() => Math.random() - 0.5);
      const randomChallenges = shuffled.slice(0, remainingCount).map(challenge => ({
        ...challenge,
        isPersonalized: false,
      }));
      personalizedChallenges.push(...randomChallenges);
    }
    
    // Shuffle and return
    return personalizedChallenges
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(challenge => ({
        ...challenge,
        warId: args.warId,
      }));
  },
});

// Get random sabotage challenges for a war (fallback)
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
      isPersonalized: false,
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

    let challenge;
    let sabotagePower = 1;

    // Check if it's a personalized challenge (extra habit)
    if (args.challengeId.startsWith('extra_')) {
      const habitId = args.challengeId.replace('extra_', '') as Id<"habits">;
      const habit = await ctx.db.get(habitId);
      
      if (!habit) {
        throw new Error("Original habit not found");
      }

      // Create a habit completion for the extra session
      const habitCompletionId = await ctx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: war.challengerId,
        completedAt: Date.now(),
        pointsEarned: (habit.pointsPerCompletion || 1) * 2, // Double points for extra session
        verificationStatus: "verified", // Auto-verify sabotage challenges
        notes: args.proof ? `Sabotage challenge proof: ${args.proof}` : "Sabotage challenge completion",
      });

      challenge = {
        id: args.challengeId,
        name: `Extra ${habit.name}`,
        description: `Completed extra session of: ${habit.name}`,
        category: habit.category,
        difficulty: Math.min(5, (habit.pointsPerCompletion || 1) + 1),
        sabotagePower: Math.min(5, (habit.pointsPerCompletion || 1) + 1),
        isPersonalized: true,
      };
      sabotagePower = challenge.sabotagePower;
    } else {
      // Regular sabotage challenge
      challenge = SABOTAGE_CHALLENGES.find(c => c.id === args.challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }
      sabotagePower = challenge.sabotagePower;
    }

    // Record the sabotage challenge completion
    const completionId = await ctx.db.insert("sabotageChallengeCompletions", {
      warId: args.warId,
      challengeId: args.challengeId,
      challengerId: war.challengerId,
      sabotagePower: sabotagePower,
      proof: args.proof,
      completedAt: Date.now(),
    });

    // Update war with sabotage power and activate sabotage
    const currentSabotagePower = war.sabotagePower || 0;
    const newSabotagePower = currentSabotagePower + sabotagePower;
    
    console.log(`🔥 Updating war ${args.warId}: ${currentSabotagePower} + ${sabotagePower} = ${newSabotagePower}`);
    
    await ctx.db.patch(args.warId, {
      sabotagePower: newSabotagePower,
      sabotageActive: true, // Activate sabotage when challenges are completed
    });

    console.log(`✅ War updated successfully with ${newSabotagePower} sabotage power`);

    return {
      message: `🔥 CHALLENGE COMPLETED! +${sabotagePower} Sabotage Power!`,
      challenge: challenge,
      sabotagePowerEarned: sabotagePower,
      totalSabotagePower: newSabotagePower,
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
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "accepted") {
      throw new Error("War not found or not active");
    }

    const currentPower = war.sabotagePower || 0;
    
    // Fixed sabotage threshold - need 20 points to sabotage
    const SABOTAGE_THRESHOLD = 20;
    
    if (currentPower < SABOTAGE_THRESHOLD) {
      throw new Error(`You need ${SABOTAGE_THRESHOLD} sabotage power to sabotage! You have ${currentPower}. Complete more challenges!`);
    }

    // Apply maximum sabotage - use all available power
    const penaltiesToApply = Math.floor(currentPower / 2); // 2 power = 1 penalty
    
    // Update war - reset sabotage power after use
    await ctx.db.patch(args.warId, {
      sabotagePower: 0,
      sabotagePenaltiesApplied: (war.sabotagePenaltiesApplied || 0) + penaltiesToApply,
      sabotageIntensity: 10, // Maximum intensity
    });

    // Apply penalties to defender
    const penaltyAmount = currentPower * 25; // 25 coins per power point
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
        description: `SABOTAGE ACTIVATED! ${currentPower} power used`,
        createdAt: Date.now(),
      });
    }

    return {
      message: `💀 SABOTAGE ACTIVATED! You used ${currentPower} sabotage power to destroy your opponent! Applied ${penaltiesToApply} penalties! 💀`,
      powerUsed: currentPower,
      penaltiesApplied: penaltiesToApply,
      remainingPower: 0,
      penaltyAmount: penaltyAmount,
    };
  },
});
