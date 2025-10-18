import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    leaderId: v.id("users"),
    isPublic: v.optional(v.boolean()),
    maxMembers: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create the group
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      leaderId: args.leaderId,
      isPublic: args.isPublic || false,
      maxMembers: args.maxMembers || 10,
      category: args.category || "general",
      inviteCode,
      createdAt: now,
      updatedAt: now,
    });

    // Add the leader as the first member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: args.leaderId,
      role: "leader",
      joinedAt: now,
      status: "active",
    });

    return { groupId, inviteCode };
  },
});

// Get all groups a user is part of
export const getUserGroups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        const memberCount = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", membership.groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        return {
          ...group,
          userRole: membership.role,
          memberCount: memberCount.length,
        };
      })
    );

    return groups.filter(Boolean);
  },
});

// Get group details with members
export const getGroupDetails = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    return {
      ...group,
      members: membersWithDetails,
      memberCount: members.length,
    };
  },
});

// Join a group by invite code
export const joinGroupByCode = mutation({
  args: {
    inviteCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find group by invite code
    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!group) {
      throw new Error("Invalid invite code");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", group._id).eq("userId", args.userId)
      )
      .first();

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new Error("You are already a member of this group");
      } else {
        // Reactivate membership
        await ctx.db.patch(existingMembership._id, {
          status: "active",
          joinedAt: Date.now(),
        });
        return { groupId: group._id, message: "Rejoined group successfully" };
      }
    }

    // Check if group is full
    const currentMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (currentMembers.length >= (group.maxMembers || 10)) {
      throw new Error("Group is full");
    }

    // Add user to group
    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
      status: "active",
    });

    return { groupId: group._id, message: "Joined group successfully" };
  },
});

// Leave a group
export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    if (membership.role === "leader") {
      // If leader is leaving, promote another member or delete group
      const otherMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) => 
          q.and(
            q.eq(q.field("status"), "active"),
            q.neq(q.field("userId"), args.userId)
          )
        )
        .collect();

      if (otherMembers.length > 0) {
        // Promote the first admin or member to leader
        const newLeader = otherMembers.find(m => m.role === "admin") || otherMembers[0];
        await ctx.db.patch(newLeader._id, { role: "leader" });
      } else {
        // No other members, delete the group
        await ctx.db.delete(args.groupId);
        return { message: "Group deleted as you were the only member" };
      }
    }

    // Remove membership
    await ctx.db.patch(membership._id, { status: "inactive" });

    return { message: "Left group successfully" };
  },
});

// Get public groups to browse
export const getPublicGroups = query({
  args: { 
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let groups;
    
    if (args.category) {
      groups = await ctx.db
        .query("groups")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else {
      groups = await ctx.db
        .query("groups")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();
    }
    
    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        return {
          ...group,
          memberCount: memberCount.length,
        };
      })
    );

    return groupsWithCounts
      .filter(group => group.isPublic)
      .slice(0, args.limit || 20);
  },
});

// Update group settings (leader only)
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    maxMembers: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // Check if user is the leader
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership || membership.role !== "leader") {
      throw new Error("Only the group leader can update group settings");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.maxMembers !== undefined) updates.maxMembers = args.maxMembers;
    if (args.category !== undefined) updates.category = args.category;

    await ctx.db.patch(args.groupId, updates);

    return { message: "Group updated successfully" };
  },
});

// Remove member from group (leader/admin only)
export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    leaderId: v.id("users"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if leader has permission
    const leaderMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.leaderId)
      )
      .first();

    if (!leaderMembership || !["leader", "admin"].includes(leaderMembership.role)) {
      throw new Error("You don't have permission to remove members");
    }

    // Find member to remove
    const memberMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => 
        q.eq("groupId", args.groupId).eq("userId", args.memberId)
      )
      .first();

    if (!memberMembership) {
      throw new Error("Member not found in group");
    }

    // Can't remove the leader
    if (memberMembership.role === "leader") {
      throw new Error("Cannot remove the group leader");
    }

    // Remove member
    await ctx.db.patch(memberMembership._id, { status: "inactive" });

    return { message: "Member removed successfully" };
  },
});
