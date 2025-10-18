import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user profile information
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    totalPoints: v.number(), // Total points earned
    currentStreak: v.number(), // Current active streak
    longestStreak: v.number(), // Longest streak ever achieved
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Habits table - stores user habits
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // e.g., "health", "productivity", "learning"
    targetFrequency: v.string(), // "daily", "weekly", "custom"
    customFrequency: v.optional(v.string()), // For custom frequencies
    pointsPerCompletion: v.number(), // Points awarded per completion
    isActive: v.boolean(),
    isPublic: v.optional(v.boolean()), // Whether this habit can be remixed by others
    originalHabitId: v.optional(v.id("habits")), // If this is a remix, reference to original
    remixCount: v.optional(v.number()), // How many times this habit has been remixed
    integrations: v.optional(v.array(v.string())), // API integrations like "strava", "apple_health", "llm", etc.
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_public", ["isPublic"])
    .index("by_original", ["originalHabitId"]),

  // Habit completions table - tracks when habits are completed
  habitCompletions: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    completedAt: v.number(), // Timestamp of completion
    pointsEarned: v.number(),
    notes: v.optional(v.string()),
    // Verification fields
    verificationStatus: v.optional(v.union(v.literal("none"), v.literal("pending"), v.literal("verified"), v.literal("rejected"))),
    verificationType: v.optional(v.union(v.literal("photo"), v.literal("reading"))),
    verificationData: v.optional(v.object({
      // For photo verification
      imageUrl: v.optional(v.string()),
      // For reading verification
      bookName: v.optional(v.string()),
      pageRange: v.optional(v.string()),
      summary: v.optional(v.string()),
    })),
    verificationResult: v.optional(v.object({
      verified: v.boolean(),
      confidence: v.number(),
      reason: v.string(),
      verifiedAt: v.number(),
    })),
    requiresVerification: v.optional(v.boolean()),
    auditReason: v.optional(v.string()),
  })
    .index("by_habit", ["habitId"])
    .index("by_user", ["userId"])
    .index("by_habit_date", ["habitId", "completedAt"])
    .index("by_user_date", ["userId", "completedAt"])
    .index("by_verification_status", ["verificationStatus"])
    .index("by_requires_verification", ["requiresVerification"]),

  // Habit challenges table - tracks challenges to habit completions
  habitChallenges: defineTable({
    completionId: v.id("habitCompletions"),
    challengerId: v.id("users"),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("upheld"), v.literal("dismissed")),
    resolvedAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_completion", ["completionId"])
    .index("by_challenger", ["challengerId"])
    .index("by_status", ["status"]),

  // Challenges table - stores monthly challenges
  challenges: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.number(), // Start of the month
    endDate: v.number(), // End of the month
    targetHabits: v.array(v.string()), // Habits that count for this challenge
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_date_range", ["startDate", "endDate"]),

  // Challenge participants table - tracks who's participating in challenges
  challengeParticipants: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    joinedAt: v.number(),
    totalPoints: v.number(), // Points earned in this challenge
    streakCount: v.number(), // Current streak in this challenge
    isActive: v.boolean(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_user", ["challengeId", "userId"])
    .index("by_challenge_active", ["challengeId", "isActive"]),

  // Challenge completions table - tracks completions within challenges
  challengeCompletions: defineTable({
    challengeId: v.id("challenges"),
    habitId: v.id("habits"),
    userId: v.id("users"),
    completedAt: v.number(),
    pointsEarned: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_user", ["challengeId", "userId"])
    .index("by_challenge_date", ["challengeId", "completedAt"]),

  // Friends table - stores friend relationships
  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.string(), // "pending", "accepted", "blocked"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_friend", ["userId", "friendId"])
    .index("by_status", ["status"]),

  // Notifications table - stores user notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "friend_request", "challenge_invite", "streak_milestone", etc.
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    data: v.optional(v.any()), // Additional data for the notification
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_type", ["type"]),

  // Streak milestones table - tracks streak achievements
  streakMilestones: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    streakLength: v.number(),
    achievedAt: v.number(),
    pointsAwarded: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_habit", ["habitId"])
    .index("by_streak_length", ["streakLength"]),

  // Pending invitations table - stores invitations to non-users
  pendingInvitations: defineTable({
    fromUserId: v.id("users"),
    toEmail: v.string(),
    status: v.string(), // "pending", "accepted", "expired"
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_email", ["toEmail"])
    .index("by_status", ["status"]),
});
