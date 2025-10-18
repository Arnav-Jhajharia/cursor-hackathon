import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Connect user's Splitwise account
export const connectSplitwiseAccount = mutation({
  args: {
    userId: v.id("users"),
    splitwiseUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      splitwiseUserId: args.splitwiseUserId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Create Splitwise group for money challenge
export const createSplitwiseGroup = action({
  args: {
    challengeId: v.id("challenges"),
    groupName: v.string(),
    participants: v.array(v.object({
      userId: v.id("users"),
      email: v.string(),
      amount: v.number(), // Amount in cents
    })),
  },
  handler: async (ctx, args) => {
    // Splitwise OAuth 1.0 integration
    const consumerKey = process.env.SPLITWISE_CONSUMER_KEY;
    const consumerSecret = process.env.SPLITWISE_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error("Splitwise OAuth credentials not configured");
    }

    // Create group in Splitwise
    const groupData = {
      name: args.groupName,
      group_type: "apartment",
      simplify_by_default: true,
      members: args.participants.map(p => ({
        email: p.email,
        first_name: p.email.split('@')[0],
      })),
    };

    try {
      // For OAuth 1.0, we need to implement proper OAuth signing
      // For now, we'll use a simplified approach with the API key
      const apiKey = process.env.SPLITWISE_API_KEY;
      if (!apiKey) {
        throw new Error("Splitwise API key not configured");
      }
      
      const response = await fetch("https://secure.splitwise.com/api/v3.0/create_group", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`Splitwise API error: ${response.statusText}`);
      }

      const result = await response.json();
      const groupId = result.group.id;

      // Create prize pool record
      const totalAmount = args.participants.reduce((sum, p) => sum + p.amount, 0);
      
      await ctx.runMutation(api.splitwise.createPrizePool, {
        challengeId: args.challengeId,
        totalAmount,
        currency: "USD",
        splitwiseGroupId: groupId.toString(),
        status: "active",
      });

      return { 
        success: true, 
        groupId: groupId.toString(),
        totalAmount 
      };
    } catch (error) {
      console.error("Splitwise API error:", error);
      throw new Error("Failed to create Splitwise group");
    }
  },
});

// Create prize pool record
export const createPrizePool = mutation({
  args: {
    challengeId: v.id("challenges"),
    totalAmount: v.number(),
    currency: v.string(),
    splitwiseGroupId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("prizePools", {
      challengeId: args.challengeId,
      totalAmount: args.totalAmount,
      currency: args.currency,
      splitwiseGroupId: args.splitwiseGroupId,
      status: args.status,
      createdAt: now,
    });
  },
});

// Settle money challenge via Splitwise
export const settleMoneyChallenge = action({
  args: {
    challengeId: v.id("challenges"),
    winnerId: v.id("users"),
    participants: v.array(v.object({
      userId: v.id("users"),
      email: v.string(),
      amount: v.number(),
      splitwiseUserId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args): Promise<{ success: boolean; settlementId: string; totalAmount: number }> => {
    const splitwiseApiKey = process.env.SPLITWISE_API_KEY;
    if (!splitwiseApiKey) {
      throw new Error("Splitwise API key not configured");
    }

    // Get prize pool
    const prizePool: any = await ctx.runQuery(api.splitwise.getPrizePool, { 
      challengeId: args.challengeId 
    });
    
    if (!prizePool || !prizePool.splitwiseGroupId) {
      throw new Error("Prize pool not found or not connected to Splitwise");
    }

    // Create expense in Splitwise group
    const winner = args.participants.find(p => p.userId === args.winnerId);
    if (!winner) {
      throw new Error("Winner not found in participants");
    }

    const expenseData: any = {
      group_id: prizePool.splitwiseGroupId,
      description: `Challenge Winner: ${winner.email}`,
      cost: (prizePool.totalAmount / 100).toFixed(2), // Convert cents to dollars
      currency_code: prizePool.currency,
      split_equally: false,
      users__0__user_id: winner.splitwiseUserId,
      users__0__paid_share: (prizePool.totalAmount / 100).toFixed(2),
      users__0__owed_share: "0.00",
    };

    // Add other participants as debtors
    args.participants.forEach((participant, index) => {
      if (participant.userId !== args.winnerId && participant.splitwiseUserId) {
        const share = (participant.amount / 100).toFixed(2);
        (expenseData as any)[`users__${index + 1}__user_id`] = participant.splitwiseUserId;
        (expenseData as any)[`users__${index + 1}__paid_share`] = "0.00";
        (expenseData as any)[`users__${index + 1}__owed_share`] = share;
      }
    });

    try {
      const response: Response = await fetch("https://secure.splitwise.com/api/v3.0/create_expense", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${splitwiseApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error(`Splitwise API error: ${response.statusText}`);
      }

      const result: any = await response.json();
      const settlementId: string = result.expense.id;

      // Update prize pool status
      await ctx.runMutation(api.splitwise.updatePrizePoolStatus, {
        challengeId: args.challengeId,
        winnerId: args.winnerId,
        settlementId: settlementId.toString(),
        status: "settled",
      });

      return { 
        success: true, 
        settlementId: settlementId.toString(),
        totalAmount: prizePool.totalAmount 
      };
    } catch (error) {
      console.error("Splitwise settlement error:", error);
      throw new Error("Failed to settle challenge via Splitwise");
    }
  },
});

// Get prize pool for challenge
export const getPrizePool = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prizePools")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .first();
  },
});

// Update prize pool status
export const updatePrizePoolStatus = mutation({
  args: {
    challengeId: v.id("challenges"),
    winnerId: v.id("users"),
    settlementId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const prizePool = await ctx.db
      .query("prizePools")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .first();

    if (!prizePool) {
      throw new Error("Prize pool not found");
    }

    await ctx.db.patch(prizePool._id, {
      winnerId: args.winnerId,
      settlementId: args.settlementId,
      status: args.status,
      settledAt: Date.now(),
    });

    return { success: true };
  },
});
