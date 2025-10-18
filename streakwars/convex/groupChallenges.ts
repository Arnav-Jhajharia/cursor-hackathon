import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Join a challenge as a group
export const joinChallengeAsGroup = mutation({
  args: {
    groupId: v.id("groups"),
    challengeId: v.id("challenges"),
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the user is the group leader
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.leaderId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can join challenges");
    }

    // Check if group is already participating
    const existingParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.groupId).eq("challengeId", args.challengeId)
      )
      .first();

    if (existingParticipation) {
      throw new Error("Group is already participating in this challenge");
    }

    // Get challenge details
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Check if challenge allows group participation
    if (!challenge.allowGroups) {
      throw new Error("This challenge does not allow group participation");
    }

    // Add group to challenge
    await ctx.db.insert("groupChallengeParticipants", {
      groupId: args.groupId,
      challengeId: args.challengeId,
      totalPoints: 0,
      isActive: true,
      joinedAt: Date.now(),
    });

    return { message: "Group joined challenge successfully" };
  },
});

// Leave a challenge as a group
export const leaveChallengeAsGroup = mutation({
  args: {
    groupId: v.id("groups"),
    challengeId: v.id("challenges"),
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the user is the group leader
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.leaderId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can leave challenges");
    }

    // Find group participation
    const participation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.groupId).eq("challengeId", args.challengeId)
      )
      .first();

    if (!participation) {
      throw new Error("Group is not participating in this challenge");
    }

    // Remove group from challenge
    await ctx.db.patch(participation._id, { isActive: false });

    return { message: "Group left challenge successfully" };
  },
});

// Get group's challenge participation
export const getGroupChallengeParticipation = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const challengesWithDetails = await Promise.all(
      participations.map(async (participation) => {
        const challenge = await ctx.db.get(participation.challengeId);
        return {
          ...participation,
          challenge,
        };
      })
    );

    return challengesWithDetails.filter(p => p.challenge);
  },
});

// Get all groups participating in a challenge
export const getChallengeGroups = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const groupsWithDetails = await Promise.all(
      participations.map(async (participation) => {
        const group = await ctx.db.get(participation.groupId);
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", participation.groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          ...participation,
          group,
          memberCount: members.length,
        };
      })
    );

    return groupsWithDetails.filter(p => p.group);
  },
});

// Update group's total points in a challenge
export const updateGroupChallengePoints = mutation({
  args: {
    groupId: v.id("groups"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Get all group members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Calculate total points from all members' individual participation
    let totalPoints = 0;
    for (const member of members) {
      const individualParticipation = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge_user", (q) => 
          q.eq("challengeId", args.challengeId).eq("userId", member.userId)
        )
        .first();

      if (individualParticipation) {
        totalPoints += individualParticipation.totalPoints;
      }
    }

    // Update group participation
    const groupParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.groupId).eq("challengeId", args.challengeId)
      )
      .first();

    if (groupParticipation) {
      await ctx.db.patch(groupParticipation._id, { totalPoints });
    }

    return { totalPoints };
  },
});

// Get group leaderboard for a challenge
export const getGroupLeaderboard = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const leaderboard = await Promise.all(
      participations.map(async (participation) => {
        const group = await ctx.db.get(participation.groupId);
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", participation.groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          groupId: participation.groupId,
          groupName: group?.name,
          totalPoints: participation.totalPoints,
          memberCount: members.length,
          joinedAt: participation.joinedAt,
        };
      })
    );

    // Sort by total points (descending)
    return leaderboard
      .filter(item => item.groupName)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

// Check if a group can join a challenge
export const canGroupJoinChallenge = query({
  args: {
    groupId: v.id("groups"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      return { canJoin: false, reason: "Challenge not found" };
    }

    if (!challenge.allowGroups) {
      return { canJoin: false, reason: "Challenge does not allow group participation" };
    }

    const existingParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.groupId).eq("challengeId", args.challengeId)
      )
      .first();

    if (existingParticipation && existingParticipation.isActive) {
      return { canJoin: false, reason: "Group is already participating" };
    }

    return { canJoin: true };
  },
});
