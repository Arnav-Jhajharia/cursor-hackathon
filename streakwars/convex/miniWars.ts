import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new mini war
export const createMiniWar = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    maxParticipants: v.optional(v.number()),
    stakes: v.number(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inviteCode = generateInviteCode();
    
    // Ensure invite code is unique (regenerate if collision)
    let finalInviteCode = inviteCode;
    let attempts = 0;
    while (attempts < 10) {
      const existingWar = await ctx.db
        .query("miniWars")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", finalInviteCode))
        .first();
      
      if (!existingWar) break;
      
      finalInviteCode = generateInviteCode();
      attempts++;
    }

    const miniWarId = await ctx.db.insert("miniWars", {
      name: args.name,
      description: args.description,
      creatorId: args.creatorId,
      participants: [args.creatorId], // Creator is automatically a participant
      maxParticipants: args.maxParticipants || 8,
      stakes: args.stakes,
      status: "waiting",
      isPublic: args.isPublic || false,
      inviteCode: finalInviteCode,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as participant
    await ctx.db.insert("miniWarParticipants", {
      miniWarId,
      userId: args.creatorId,
      habitsCompleted: 0,
      pointsEarned: 0,
      joinedAt: now,
    });

    return { miniWarId, inviteCode: finalInviteCode };
  },
});

// Join a mini war
export const joinMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.status !== "waiting") {
      throw new Error("Cannot join a war that's not waiting for participants");
    }

    if (miniWar.participants.includes(args.userId)) {
      throw new Error("You're already in this mini war");
    }

    if (miniWar.participants.length >= miniWar.maxParticipants) {
      throw new Error("Mini war is full");
    }

    // Add user to participants
    const updatedParticipants = [...miniWar.participants, args.userId];
    await ctx.db.patch(args.miniWarId, {
      participants: updatedParticipants,
      updatedAt: Date.now(),
    });

    // Add participant record
    await ctx.db.insert("miniWarParticipants", {
      miniWarId: args.miniWarId,
      userId: args.userId,
      habitsCompleted: 0,
      pointsEarned: 0,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// Join mini war by invite code
export const joinMiniWarByCode = mutation({
  args: {
    inviteCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db
      .query("miniWars")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!miniWar) {
      throw new Error("Invalid invite code");
    }

    // Add user to participants
    if (miniWar.participants.includes(args.userId)) {
      throw new Error("You're already in this mini war");
    }

    if (miniWar.participants.length >= miniWar.maxParticipants) {
      throw new Error("Mini war is full");
    }

    const updatedParticipants = [...miniWar.participants, args.userId];
    await ctx.db.patch(miniWar._id, {
      participants: updatedParticipants,
      updatedAt: Date.now(),
    });

    // Add participant record
    await ctx.db.insert("miniWarParticipants", {
      miniWarId: miniWar._id,
      userId: args.userId,
      habitsCompleted: 0,
      pointsEarned: 0,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// Start a mini war (creator only)
export const startMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.creatorId !== args.creatorId) {
      throw new Error("Only the creator can start the mini war");
    }

    if (miniWar.status !== "waiting") {
      throw new Error("Mini war is not in waiting status");
    }

    if (miniWar.participants.length < 2) {
      throw new Error("Need at least 2 participants to start a mini war");
    }

    const now = Date.now();
    await ctx.db.patch(args.miniWarId, {
      status: "active",
      warStartedAt: now,
      updatedAt: now,
    });

    return { success: true, warStartedAt: now };
  },
});

// Complete a habit during mini war
export const completeHabitInMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
    userId: v.id("users"),
    habitId: v.id("habits"),
    pointsEarned: v.number(),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.status !== "active") {
      throw new Error("Mini war is not active");
    }

    if (!miniWar.participants.includes(args.userId)) {
      throw new Error("You're not a participant in this mini war");
    }

    // Check if war has ended (2 hours = 2 * 60 * 60 * 1000 ms)
    const warDuration = 2 * 60 * 60 * 1000;
    if (miniWar.warStartedAt && Date.now() > miniWar.warStartedAt + warDuration) {
      // Auto-end the war
      await ctx.runMutation(api.miniWars.endMiniWar, { miniWarId: args.miniWarId });
      throw new Error("Mini war has ended");
    }

    // Update participant stats
    const participant = await ctx.db
      .query("miniWarParticipants")
      .withIndex("by_mini_war_user", (q) => 
        q.eq("miniWarId", args.miniWarId).eq("userId", args.userId)
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        habitsCompleted: participant.habitsCompleted + 1,
        pointsEarned: participant.pointsEarned + args.pointsEarned,
        lastCompletionAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// End a mini war and determine winner
export const endMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.status !== "active") {
      throw new Error("Mini war is not active");
    }

    // Get all participants with their stats
    const participants = await ctx.db
      .query("miniWarParticipants")
      .withIndex("by_mini_war", (q) => q.eq("miniWarId", args.miniWarId))
      .collect();

    // Find winner (most habits completed, then most points)
    let winner = participants[0];
    let totalHabitsCompleted = 0;

    for (const participant of participants) {
      totalHabitsCompleted += participant.habitsCompleted;
      
      if (
        participant.habitsCompleted > winner.habitsCompleted ||
        (participant.habitsCompleted === winner.habitsCompleted && 
         participant.pointsEarned > winner.pointsEarned)
      ) {
        winner = participant;
      }
    }

    const now = Date.now();
    const totalStakes = miniWar.participants.length * miniWar.stakes;

    // Update mini war
    await ctx.db.patch(args.miniWarId, {
      status: "completed",
      warEndedAt: now,
      winnerId: winner.userId,
      totalHabitsCompleted,
      updatedAt: now,
    });

    // Distribute rewards to winner
    if (winner.userId) {
      await ctx.runMutation(api.rewards.addRewards, {
        userId: winner.userId,
        amount: totalStakes,
        type: "mini_war_win",
        description: `Won mini war: ${miniWar.name}`,
      });
    }

    return { 
      success: true, 
      winnerId: winner.userId, 
      totalStakes,
      totalHabitsCompleted 
    };
  },
});

// Get mini war by ID
export const getMiniWar = query({
  args: { miniWarId: v.id("miniWars") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.miniWarId);
  },
});

// Get mini war participants with their stats
export const getMiniWarParticipants = query({
  args: { miniWarId: v.id("miniWars") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("miniWarParticipants")
      .withIndex("by_mini_war", (q) => q.eq("miniWarId", args.miniWarId))
      .collect();

    // Get user details for each participant
    const participantsWithUsers = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        return {
          ...participant,
          user,
        };
      })
    );

    // Sort by habits completed (desc), then by points (desc)
    return participantsWithUsers.sort((a, b) => {
      if (a.habitsCompleted !== b.habitsCompleted) {
        return b.habitsCompleted - a.habitsCompleted;
      }
      return b.pointsEarned - a.pointsEarned;
    });
  },
});

// Get public mini wars
export const getPublicMiniWars = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const miniWars = await ctx.db
      .query("miniWars")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .order("desc")
      .take(args.limit || 20);

    // Get creator details for each mini war
    const miniWarsWithCreators = await Promise.all(
      miniWars.map(async (miniWar) => {
        const creator = await ctx.db.get(miniWar.creatorId);
        return {
          ...miniWar,
          creator,
          participantCount: miniWar.participants.length,
        };
      })
    );

    return miniWarsWithCreators;
  },
});

// Get user's mini wars
export const getUserMiniWars = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const miniWars = await ctx.db
      .query("miniWars")
      .filter((q) => q.eq(q.field("participants"), [args.userId]))
      .order("desc")
      .collect();

    // Get creator details and participant counts
    const miniWarsWithDetails = await Promise.all(
      miniWars.map(async (miniWar) => {
        const creator = await ctx.db.get(miniWar.creatorId);
        return {
          ...miniWar,
          creator,
          participantCount: miniWar.participants.length,
          isCreator: miniWar.creatorId === args.userId,
        };
      })
    );

    return miniWarsWithDetails;
  },
});

// Leave mini war (only if waiting)
export const leaveMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.status !== "waiting") {
      throw new Error("Cannot leave an active or completed mini war");
    }

    if (miniWar.creatorId === args.userId) {
      throw new Error("Creator cannot leave the mini war. Cancel it instead.");
    }

    if (!miniWar.participants.includes(args.userId)) {
      throw new Error("You're not a participant in this mini war");
    }

    // Remove user from participants
    const updatedParticipants = miniWar.participants.filter(id => id !== args.userId);
    await ctx.db.patch(args.miniWarId, {
      participants: updatedParticipants,
      updatedAt: Date.now(),
    });

    // Remove participant record
    const participant = await ctx.db
      .query("miniWarParticipants")
      .withIndex("by_mini_war_user", (q) => 
        q.eq("miniWarId", args.miniWarId).eq("userId", args.userId)
      )
      .first();

    if (participant) {
      await ctx.db.delete(participant._id);
    }

    return { success: true };
  },
});

// Cancel mini war (creator only)
export const cancelMiniWar = mutation({
  args: {
    miniWarId: v.id("miniWars"),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const miniWar = await ctx.db.get(args.miniWarId);
    if (!miniWar) {
      throw new Error("Mini war not found");
    }

    if (miniWar.creatorId !== args.creatorId) {
      throw new Error("Only the creator can cancel the mini war");
    }

    if (miniWar.status !== "waiting") {
      throw new Error("Cannot cancel an active or completed mini war");
    }

    // Delete all participant records
    const participants = await ctx.db
      .query("miniWarParticipants")
      .withIndex("by_mini_war", (q) => q.eq("miniWarId", args.miniWarId))
      .collect();

    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Update mini war status
    await ctx.db.patch(args.miniWarId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
