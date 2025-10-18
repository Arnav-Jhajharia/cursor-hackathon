import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Send friend request
export const sendFriendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Find friend by email
    const friend = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.friendEmail))
      .first();

    if (!friend) {
      // User not found - create a pending invitation
      const now = Date.now();
      const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Check if invitation already exists
      const existingInvitation = await ctx.db
        .query("pendingInvitations")
        .withIndex("by_to_email", (q) => q.eq("toEmail", args.friendEmail))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (existingInvitation) {
        throw new Error("Invitation already sent to this email");
      }

      // Create pending invitation
      const invitationId = await ctx.db.insert("pendingInvitations", {
        fromUserId: args.userId,
        toEmail: args.friendEmail,
        status: "pending",
        createdAt: now,
        expiresAt: expiresAt,
      });

      // Get sender info for email
      const sender = await ctx.db.get(args.userId);
      if (!sender) {
        throw new Error("Sender not found");
      }

      // Send email invitation via Convex action
      try {
        await ctx.scheduler.runAfter(0, internal.email.sendInvitationEmail, {
          toEmail: args.friendEmail,
          fromUserName: sender.name,
          fromUserEmail: sender.email,
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole operation if email fails
      }

      return { type: "invitation", message: "Invitation created! (Email sending is in test mode - only works to your own email address)" };
    }

    if (friend._id === args.userId) {
      throw new Error("Cannot add yourself as a friend");
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.userId).eq("friendId", friend._id)
      )
      .first();

    if (existingFriendship) {
      throw new Error("Friendship already exists");
    }

    const now = Date.now();
    
    // Create friend request
    await ctx.db.insert("friends", {
      userId: args.userId,
      friendId: friend._id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Create notification for friend
    await ctx.db.insert("notifications", {
      userId: friend._id,
      type: "friend_request",
      title: "New Friend Request",
      message: "You have received a friend request",
      isRead: false,
      data: { fromUserId: args.userId },
      createdAt: now,
    });

    return { type: "friend_request", friendId: friend._id };
  },
});

// Accept friend request
export const acceptFriendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find the friend request where the friend sent a request to the current user
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.friendId).eq("friendId", args.userId)
      )
      .first();

    if (!friendship || friendship.status !== "pending") {
      throw new Error("Friend request not found");
    }

    const now = Date.now();

    // Update friendship status
    await ctx.db.patch(friendship._id, {
      status: "accepted",
      updatedAt: now,
    });

    // Create reverse friendship
    await ctx.db.insert("friends", {
      userId: args.userId,
      friendId: args.friendId,
      status: "accepted",
      createdAt: now,
      updatedAt: now,
    });

    // Create notification for friend
    await ctx.db.insert("notifications", {
      userId: args.friendId,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      message: "Your friend request has been accepted",
      isRead: false,
      data: { userId: args.userId },
      createdAt: now,
    });
  },
});

// Cancel outgoing friend request
export const cancelFriendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship || friendship.status !== "pending") {
      throw new Error("Friend request not found");
    }

    await ctx.db.delete(friendship._id);
  },
});

// Reject friend request
export const rejectFriendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.friendId).eq("friendId", args.userId)
      )
      .first();

    if (friendship) {
      await ctx.db.delete(friendship._id);
    }
  },
});

// Remove friend
export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Remove both directions of friendship
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.userId).eq("friendId", args.friendId)
      )
      .collect();

    for (const friendship of friendships) {
      await ctx.db.delete(friendship._id);
    }

    const reverseFriendships = await ctx.db
      .query("friends")
      .withIndex("by_user_friend", (q) => 
        q.eq("userId", args.friendId).eq("friendId", args.userId)
      )
      .collect();

    for (const friendship of reverseFriendships) {
      await ctx.db.delete(friendship._id);
    }
  },
});

// Get user's friends
export const getUserFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        return {
          ...friendship,
          friend,
        };
      })
    );

    return friends;
  },
});

// Get pending friend requests
export const getPendingFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friends")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        return {
          ...request,
          user,
        };
      })
    );

    return requestsWithUsers;
  },
});

// Debug function to check all friends data
export const debugFriendsData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allFriends = await ctx.db
      .query("friends")
      .collect();
    
    const userFriends = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const pendingRequests = await ctx.db
      .query("friends")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    return {
      allFriends: allFriends.length,
      userFriends: userFriends.length,
      pendingRequests: pendingRequests.length,
      userFriendsData: userFriends,
      pendingRequestsData: pendingRequests,
      allFriendsData: allFriends,
      userFriendsAccepted: userFriends.filter(f => f.status === "accepted").length,
      userFriendsPending: userFriends.filter(f => f.status === "pending").length,
    };
  },
});

// Clear all friends data (for debugging)
export const clearAllFriendsData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all friends records
    const allFriends = await ctx.db.query("friends").collect();
    for (const friend of allFriends) {
      await ctx.db.delete(friend._id);
    }
    
    // Delete all pending invitations
    const allInvitations = await ctx.db.query("pendingInvitations").collect();
    for (const invitation of allInvitations) {
      await ctx.db.delete(invitation._id);
    }
    
    return { 
      deletedFriends: allFriends.length, 
      deletedInvitations: allInvitations.length 
    };
  },
});

// Get friend suggestions (users with similar habits)
export const getFriendSuggestions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's habits
    const userHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const userCategories = new Set(userHabits.map(habit => habit.category));

    // Get all users with similar habit categories
    const allUsers = await ctx.db.query("users").collect();
    const suggestions = [];

    for (const user of allUsers) {
      if (user._id === args.userId) continue;

      // Check if already friends
      const existingFriendship = await ctx.db
        .query("friends")
        .withIndex("by_user_friend", (q) => 
          q.eq("userId", args.userId).eq("friendId", user._id)
        )
        .first();

      if (existingFriendship) continue;

      // Get user's habits
      const userHabits = await ctx.db
        .query("habits")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const userCategories = new Set(userHabits.map(habit => habit.category));
      const commonCategories = [...userCategories].filter(cat => userCategories.has(cat));

      if (commonCategories.length > 0) {
        suggestions.push({
          user,
          commonCategories,
          score: commonCategories.length,
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  },
});

// Get pending friend requests sent by user (outgoing requests)
export const getOutgoingFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const friend = await ctx.db.get(request.friendId);
        return {
          ...request,
          friend,
        };
      })
    );

    return requestsWithUsers;
  },
});

// Get pending invitations sent by user
export const getPendingInvitations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return invitations;
  },
});

// Get accepted friends for a user
export const getAcceptedFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .collect();

    const friendsWithDetails = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        return friend;
      })
    );

    return friendsWithDetails.filter(Boolean);
  },
});
