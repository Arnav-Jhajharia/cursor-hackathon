import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Mem0 integration for remembering user patterns and defeats
export const recordWarDefeat = mutation({
  args: {
    userId: v.id("users"),
    opponentId: v.id("users"),
    challengeId: v.id("challenges"),
    warStakes: v.number(),
    defeatReason: v.string(), // "low_points", "streak_broken", "gave_up", etc.
    warDuration: v.number(),
    humiliationMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Store defeat in Mem0 for AI memory
    const defeatMemory = {
      userId: args.userId,
      opponentId: args.opponentId,
      challengeId: args.challengeId,
      warStakes: args.warStakes,
      defeatReason: args.defeatReason,
      warDuration: args.warDuration,
      humiliationMessage: args.humiliationMessage,
      timestamp: Date.now(),
    };

    // Store in local database for now (we'll integrate Mem0 API later)
    await ctx.db.insert("warMemories", defeatMemory);
    
    return defeatMemory;
  },
});

export const recordWarVictory = mutation({
  args: {
    userId: v.id("users"),
    opponentId: v.id("users"),
    challengeId: v.id("challenges"),
    warStakes: v.number(),
    victoryMethod: v.string(), // "domination", "comeback", "consistency", etc.
    warDuration: v.number(),
    humiliationDelivered: v.string(),
  },
  handler: async (ctx, args) => {
    const victoryMemory = {
      userId: args.userId,
      opponentId: args.opponentId,
      challengeId: args.challengeId,
      warStakes: args.warStakes,
      victoryMethod: args.victoryMethod,
      warDuration: args.warDuration,
      humiliationDelivered: args.humiliationDelivered,
      timestamp: Date.now(),
    };

    await ctx.db.insert("warMemories", victoryMemory);
    
    return victoryMemory;
  },
});

// Get AI-generated psychological profile based on war history
export const getPsychologicalProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const warHistory = await ctx.db
      .query("warMemories")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const defeats = warHistory.filter(w => w.defeatReason);
    const victories = warHistory.filter(w => w.victoryMethod);

    // Calculate psychological patterns
    const totalWars = warHistory.length;
    const defeatRate = defeats.length / totalWars;
    const averageWarDuration = warHistory.reduce((sum, w) => sum + w.warDuration, 0) / totalWars;
    
    // Find common defeat reasons
    const defeatReasons = defeats.reduce((acc, d) => {
      if (d.defeatReason) {
        acc[d.defeatReason] = (acc[d.defeatReason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const weakness = Object.keys(defeatReasons).reduce((a, b) => 
      defeatReasons[a] > defeatReasons[b] ? a : b, "unknown"
    );

    return {
      userId: args.userId,
      totalWars,
      defeatRate,
      averageWarDuration,
      primaryWeakness: weakness,
      defeatReasons,
      psychologicalProfile: {
        isQuitter: defeatReasons["gave_up"] > defeats.length * 0.3,
        isStreakBreaker: defeatReasons["streak_broken"] > defeats.length * 0.4,
        isLowPerformer: defeatReasons["low_points"] > defeats.length * 0.5,
        isInconsistent: averageWarDuration < 2, // Gives up quickly
        isWeak: defeatRate > 0.7,
      }
    };
  },
});

// Generate AI taunt based on psychological profile
export const generatePersonalizedTaunt = action({
  args: {
    targetUserId: v.id("users"),
    challengerName: v.string(),
    currentContext: v.string(),
  },
  handler: async (ctx, args): Promise<{taunt: string, psychologicalProfile?: any, timestamp: number}> => {
    // Get psychological profile
    const profile: any = await ctx.runQuery(api.aiMemory.getPsychologicalProfile, { 
      userId: args.targetUserId 
    });

    if (!profile) {
      return {
        taunt: `${args.challengerName}: "You're going down! 💀"`,
        timestamp: Date.now(),
      };
    }

    const { psychologicalProfile, primaryWeakness, defeatRate }: any = profile;

    // Generate personalized taunt based on their weaknesses
    let personalizedInsult = "";
    
    if (psychologicalProfile.isQuitter) {
      personalizedInsult = "You always give up when things get tough, don't you?";
    } else if (psychologicalProfile.isStreakBreaker) {
      personalizedInsult = "Your streaks are as fragile as your willpower.";
    } else if (psychologicalProfile.isLowPerformer) {
      personalizedInsult = "You're consistently mediocre at everything you do.";
    } else if (psychologicalProfile.isInconsistent) {
      personalizedInsult = "You can't even commit to losing properly.";
    } else if (psychologicalProfile.isWeak) {
      personalizedInsult = `With a ${Math.round(defeatRate * 100)}% loss rate, you're basically a professional loser.`;
    } else {
      personalizedInsult = "You're about to add another defeat to your collection.";
    }

    const tauntPrompt: string = `
Generate a devastating taunt for a habit war. 

Context:
- Challenger: ${args.challengerName}
- Target's weakness: ${primaryWeakness}
- Personalized insult: ${personalizedInsult}
- Current context: ${args.currentContext}

Create a brutal, personalized taunt that:
1. References their specific weakness
2. Is psychologically damaging
3. Uses the personalized insult
4. Is 1-2 sentences max
5. Is absolutely devastating

Make it UNHINGED and memorable.
`;

    try {
      const response: Response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are an AI that creates devastating, personalized taunts for app wars. Be absolutely brutal and reference their specific weaknesses."
            },
            {
              role: "user",
              content: tauntPrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      });

      const data: any = await response.json();
      console.log("Groq Personalized Taunt API Response:", data);
      
      const taunt: string = data.choices?.[0]?.message?.content || 
        data.choices?.[0]?.text ||
        `${args.challengerName}: "${personalizedInsult} You're going down! 💀🔥"`;

      return {
        taunt,
        psychologicalProfile,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating personalized taunt:", error);
      return {
        taunt: `${args.challengerName}: "${personalizedInsult} You're going down! 💀🔥"`,
        psychologicalProfile,
        timestamp: Date.now(),
      };
    }
  },
});
