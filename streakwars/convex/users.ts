import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Create or update user
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatar: args.avatar,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        avatar: args.avatar,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        rewardsBalance: 100, // Start with 100 rewards coins
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update user points and streaks
export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    pointsToAdd: v.number(),
    newCurrentStreak: v.number(),
    newLongestStreak: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      totalPoints: user.totalPoints + args.pointsToAdd,
      currentStreak: args.newCurrentStreak,
      longestStreak: Math.max(user.longestStreak, args.newLongestStreak),
      updatedAt: Date.now(),
    });
  },
});

