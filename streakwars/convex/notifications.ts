import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user notifications
export const getUserNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get unread notifications
export const getUnreadNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .order("desc")
      .collect();
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
  },
});

// Mark all notifications as read
export const markAllNotificationsAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Create notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      data: args.data,
      createdAt: now,
    });
  },
});

