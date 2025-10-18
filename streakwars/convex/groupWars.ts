import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Group War schema additions (we'll add these to schema.ts)
// groupWars: defineTable({
//   challengerGroupId: v.id("groups"),
//   defenderGroupId: v.id("groups"),
//   challengeId: v.id("challenges"),
//   stakes: v.number(), // Total stakes for the war
//   status: v.string(), // "pending", "accepted", "declined", "active", "completed"
//   warStartedAt: v.optional(v.number()),
//   warEndedAt: v.optional(v.number()),
//   winnerGroupId: v.optional(v.id("groups")),
//   challengerPoints: v.optional(v.number()),
//   defenderPoints: v.optional(v.number()),
//   taunt: v.optional(v.string()),
//   createdAt: v.number(),
// })

// Declare war between groups
export const declareGroupWar = mutation({
  args: {
    challengerGroupId: v.id("groups"),
    defenderGroupId: v.id("groups"),
    challengeId: v.id("challenges"),
    stakes: v.number(),
    leaderId: v.id("users"),
    taunt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify the user is the leader of the challenging group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.challengerGroupId).eq("userId", args.leaderId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can declare war");
    }

    // Check if both groups are participating in the challenge
    const challengerParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.challengerGroupId).eq("challengeId", args.challengeId)
      )
      .first();

    const defenderParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", args.defenderGroupId).eq("challengeId", args.challengeId)
      )
      .first();

    if (!challengerParticipation || !defenderParticipation) {
      throw new Error("Both groups must be participating in the challenge");
    }

    // Check if there's already a pending war
    const existingWar = await ctx.db
      .query("groupWars")
      .withIndex("by_challenger_group", (q) => q.eq("challengerGroupId", args.challengerGroupId))
      .filter((q) => 
        q.and(
          q.eq(q.field("defenderGroupId"), args.defenderGroupId),
          q.eq(q.field("challengeId"), args.challengeId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingWar) {
      throw new Error("War already declared against this group");
    }

    // Get group details for rewards calculation
    const challengerGroup = await ctx.db.get(args.challengerGroupId);
    const defenderGroup = await ctx.db.get(args.defenderGroupId);

    if (!challengerGroup || !defenderGroup) {
      throw new Error("Group not found");
    }

    // Calculate total stakes per group member
    const challengerMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.challengerGroupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const defenderMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.defenderGroupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const stakesPerMember = Math.ceil(args.stakes / Math.max(challengerMembers.length, defenderMembers.length));

    // Ensure all group members have enough rewards
    const now = Date.now();
    for (const member of [...challengerMembers, ...defenderMembers]) {
      const user = await ctx.db.get(member.userId);
      if (user) {
        const currentBalance = user.rewardsBalance || 0;
        if (currentBalance < stakesPerMember) {
          const neededRewards = stakesPerMember + 50; // Give them 50 extra rewards
          await ctx.db.patch(member.userId, {
            rewardsBalance: neededRewards,
          });
          await ctx.db.insert("rewardsTransactions", {
            userId: member.userId,
            amount: neededRewards - currentBalance,
            type: "bonus",
            description: "Group war bonus rewards",
            createdAt: now,
          });
        }
      }
    }

    // Create the group war
    const warId = await ctx.db.insert("groupWars", {
      challengerGroupId: args.challengerGroupId,
      defenderGroupId: args.defenderGroupId,
      challengeId: args.challengeId,
      stakes: args.stakes,
      status: "pending",
      taunt: args.taunt || `${challengerGroup.name} declares WAR on ${defenderGroup.name}! 💀⚔️`,
      createdAt: now,
    });

    return { warId, stakesPerMember };
  },
});

// Accept a group war
export const acceptGroupWar = mutation({
  args: {
    warId: v.id("groupWars"),
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "pending") {
      throw new Error("War not found or not pending");
    }

    // Verify the user is the leader of the defending group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", war.defenderGroupId).eq("userId", args.leaderId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can accept war");
    }

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "active",
      warStartedAt: Date.now(),
    });

    return { message: "Group war accepted! The battle begins! ⚔️🔥" };
  },
});

// Decline a group war
export const declineGroupWar = mutation({
  args: {
    warId: v.id("groupWars"),
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "pending") {
      throw new Error("War not found or not pending");
    }

    // Verify the user is the leader of the defending group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", war.defenderGroupId).eq("userId", args.leaderId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can decline war");
    }

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "declined",
    });

    return { message: "Group war declined. Cowards! 😤" };
  },
});

// Get pending group wars for a group
export const getPendingGroupWars = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const pendingWars = await ctx.db
      .query("groupWars")
      .withIndex("by_defender_group", (q) => q.eq("defenderGroupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const warsWithDetails = await Promise.all(
      pendingWars.map(async (war) => {
        const challengerGroup = await ctx.db.get(war.challengerGroupId);
        const challenge = await ctx.db.get(war.challengeId);
        return {
          ...war,
          challengerGroup,
          challenge,
        };
      })
    );

    return warsWithDetails.filter(w => w.challengerGroup && w.challenge);
  },
});

// Get active group wars for a group
export const getActiveGroupWars = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const activeWars = await ctx.db
      .query("groupWars")
      .withIndex("by_challenger_group", (q) => q.eq("challengerGroupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const defenderWars = await ctx.db
      .query("groupWars")
      .withIndex("by_defender_group", (q) => q.eq("defenderGroupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const allWars = [...activeWars, ...defenderWars];

    const warsWithDetails = await Promise.all(
      allWars.map(async (war) => {
        const challengerGroup = await ctx.db.get(war.challengerGroupId);
        const defenderGroup = await ctx.db.get(war.defenderGroupId);
        const challenge = await ctx.db.get(war.challengeId);
        return {
          ...war,
          challengerGroup,
          defenderGroup,
          challenge,
        };
      })
    );

    return warsWithDetails.filter(w => w.challengerGroup && w.defenderGroup && w.challenge);
  },
});

// Get group war targets (other groups in the same challenge)
export const getGroupWarTargets = query({
  args: { 
    groupId: v.id("groups"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Get all groups participating in the challenge
    const allGroupParticipants = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const warTargets = [];

    // Check each group to see if they can be war targets
    for (const participation of allGroupParticipants) {
      const targetGroupId = participation.groupId;
      
      // Skip your own group
      if (targetGroupId === args.groupId) {
        continue;
      }

      const targetGroup = await ctx.db.get(targetGroupId);
      if (targetGroup) {
        // Check if there's already a pending war
        const existingWar = await ctx.db
          .query("groupWars")
          .withIndex("by_challenger_group", (q) => q.eq("challengerGroupId", args.groupId))
          .filter((q) => 
            q.and(
              q.eq(q.field("defenderGroupId"), targetGroupId),
              q.eq(q.field("challengeId"), args.challengeId),
              q.eq(q.field("status"), "pending")
            )
          )
          .first();

        if (!existingWar) {
          // Get member count
          const memberCount = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", targetGroupId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

          warTargets.push({
            ...targetGroup,
            currentPoints: participation.totalPoints,
            memberCount: memberCount.length,
          });
        }
      }
    }

    return warTargets;
  },
});

// Resolve a group war (called when challenge ends)
export const resolveGroupWar = mutation({
  args: { warId: v.id("groupWars") },
  handler: async (ctx, args) => {
    const war = await ctx.db.get(args.warId);
    if (!war || war.status !== "active") {
      throw new Error("War not found or not active");
    }

    // Get final points for both groups
    const challengerParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", war.challengerGroupId).eq("challengeId", war.challengeId)
      )
      .first();

    const defenderParticipation = await ctx.db
      .query("groupChallengeParticipants")
      .withIndex("by_group_challenge", (q) => 
        q.eq("groupId", war.defenderGroupId).eq("challengeId", war.challengeId)
      )
      .first();

    if (!challengerParticipation || !defenderParticipation) {
      throw new Error("Group participation not found");
    }

    const challengerPoints = challengerParticipation.totalPoints;
    const defenderPoints = defenderParticipation.totalPoints;
    const winnerGroupId = challengerPoints > defenderPoints ? war.challengerGroupId : war.defenderGroupId;
    const loserGroupId = challengerPoints > defenderPoints ? war.defenderGroupId : war.challengerGroupId;

    // Get group details
    const winnerGroup = await ctx.db.get(winnerGroupId);
    const loserGroup = await ctx.db.get(loserGroupId);
    const challenge = await ctx.db.get(war.challengeId);

    if (!winnerGroup || !loserGroup || !challenge) {
      throw new Error("Group or challenge not found");
    }

    // Calculate stakes per member
    const winnerMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", winnerGroupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const loserMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", loserGroupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const stakesPerMember = Math.ceil(war.stakes / Math.max(winnerMembers.length, loserMembers.length));

    // Transfer rewards from losers to winners
    const now = Date.now();
    for (const loserMember of loserMembers) {
      const loserUser = await ctx.db.get(loserMember.userId);
      if (loserUser) {
        await ctx.db.patch(loserMember.userId, {
          rewardsBalance: (loserUser.rewardsBalance || 0) - stakesPerMember,
        });
        await ctx.db.insert("rewardsTransactions", {
          userId: loserMember.userId,
          amount: -stakesPerMember,
          type: "war_loss",
          description: `Lost group war against ${winnerGroup.name}`,
          createdAt: now,
        });
      }
    }

    for (const winnerMember of winnerMembers) {
      const winnerUser = await ctx.db.get(winnerMember.userId);
      if (winnerUser) {
        await ctx.db.patch(winnerMember.userId, {
          rewardsBalance: (winnerUser.rewardsBalance || 0) + stakesPerMember,
        });
        await ctx.db.insert("rewardsTransactions", {
          userId: winnerMember.userId,
          amount: stakesPerMember,
          type: "war_win",
          description: `Won group war against ${loserGroup.name}`,
          createdAt: now,
        });
      }
    }

    // Generate humiliation message for the losing group
    const humiliationMessage = `${loserGroup.name}, your team is a complete failure! ${winnerGroup.name} just DESTROYED your entire group in ${challenge.name}. You should all be ashamed of yourselves! 💀⚔️`;

    // Update war status
    await ctx.db.patch(args.warId, {
      status: "completed",
      warEndedAt: now,
      winnerGroupId,
      challengerPoints,
      defenderPoints,
    });

    return {
      winner: winnerGroup.name,
      loser: loserGroup.name,
      winnerPoints: challengerPoints,
      loserPoints: defenderPoints,
      stakesPerMember,
      humiliationMessage: humiliationMessage,
    };
  },
});

// Get group war history
export const getGroupWarHistory = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const wars = await ctx.db
      .query("groupWars")
      .withIndex("by_challenger_group", (q) => q.eq("challengerGroupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const defenderWars = await ctx.db
      .query("groupWars")
      .withIndex("by_defender_group", (q) => q.eq("defenderGroupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const allWars = [...wars, ...defenderWars];

    const historyWithDetails = await Promise.all(
      allWars.map(async (war) => {
        const challengerGroup = await ctx.db.get(war.challengerGroupId);
        const defenderGroup = await ctx.db.get(war.defenderGroupId);
        const challenge = await ctx.db.get(war.challengeId);
        
        return {
          ...war,
          challengerGroup,
          defenderGroup,
          challenge,
          isWinner: war.winnerGroupId === args.groupId,
        };
      })
    );

    return historyWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});
