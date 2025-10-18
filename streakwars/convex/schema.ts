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
    rewardsBalance: v.optional(v.number()), // App coins/rewards balance
    splitwiseUserId: v.optional(v.string()), // Splitwise user ID for money challenges
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_splitwise_user", ["splitwiseUserId"]),

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
    prizeType: v.optional(v.string()), // "rewards", "money", "none"
    prizeAmount: v.optional(v.number()), // Amount in rewards coins or cents
    currency: v.optional(v.string()), // "USD", "EUR", etc. for money challenges
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    isPublic: v.optional(v.boolean()), // true = anyone can join, false = invite only
    inviteCode: v.optional(v.string()), // unique code for joining via link/QR
  })
    .index("by_active", ["isActive"])
    .index("by_date_range", ["startDate", "endDate"])
    .index("by_creator", ["createdBy"])
    .index("by_prize_type", ["prizeType"])
    .index("by_public", ["isPublic"])
    .index("by_invite_code", ["inviteCode"]),

  // Challenge participants table - tracks who's participating in challenges
  challengeParticipants: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    joinedAt: v.number(),
    totalPoints: v.number(), // Points earned in this challenge
    streakCount: v.number(), // Current streak in this challenge
    isActive: v.boolean(),
    customHabits: v.optional(v.array(v.string())), // User's custom habits for this challenge
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

  // Challenge invitations table - tracks friend invitations to challenges
  challengeInvitations: defineTable({
    challengeId: v.id("challenges"),
    inviterId: v.id("users"), // User who sent the invitation
    inviteeId: v.id("users"), // User who was invited
    status: v.string(), // "pending", "accepted", "declined"
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_inviter", ["inviterId"])
    .index("by_invitee", ["inviteeId"])
    .index("by_invitee_status", ["inviteeId", "status"])
    .index("by_challenge_invitee", ["challengeId", "inviteeId"]),

  // Challenge Wars table - tracks direct 1v1 challenges
  challengeWars: defineTable({
    challengerId: v.id("users"), // Person who declared war
    defenderId: v.id("users"), // Person being challenged
    challengeId: v.id("challenges"), // The challenge they're fighting over
    status: v.string(), // "pending", "accepted", "completed", "declined"
    stakes: v.number(), // Amount of rewards at stake
    taunt: v.optional(v.string()), // Custom taunt message
    warStartedAt: v.optional(v.number()),
    warEndedAt: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    loserId: v.optional(v.id("users")),
    createdAt: v.number(),
    expiresAt: v.number(), // 24 hours to accept
  })
    .index("by_challenger", ["challengerId"])
    .index("by_defender", ["defenderId"])
    .index("by_status", ["status"])
    .index("by_challenge", ["challengeId"])
    .index("by_defender_status", ["defenderId", "status"]),

  // War History table - tracks all war outcomes
  warHistory: defineTable({
    warId: v.id("challengeWars"),
    winnerId: v.id("users"),
    loserId: v.id("users"),
    challengeId: v.id("challenges"),
    stakes: v.number(),
    winnerPoints: v.number(),
    loserPoints: v.number(),
    warDuration: v.number(), // Days the war lasted
    completedAt: v.number(),
  })
    .index("by_winner", ["winnerId"])
    .index("by_loser", ["loserId"])
    .index("by_challenge", ["challengeId"])
    .index("by_date", ["completedAt"]),

  // AI Memory System
  warMemories: defineTable({
    userId: v.id("users"),
    opponentId: v.id("users"),
    challengeId: v.id("challenges"),
    warStakes: v.number(),
    defeatReason: v.optional(v.string()), // "low_points", "streak_broken", "gave_up", etc.
    victoryMethod: v.optional(v.string()), // "domination", "comeback", "consistency", etc.
    warDuration: v.number(),
    humiliationMessage: v.optional(v.string()),
    humiliationDelivered: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_opponent", ["opponentId"])
    .index("by_challenge", ["challengeId"])
    .index("by_timestamp", ["timestamp"]),

  // AI Humiliation System
  aiHumiliations: defineTable({
    warId: v.id("challengeWars"),
    winnerId: v.id("users"),
    loserId: v.id("users"),
    humiliationMessage: v.string(),
    voiceAudioData: v.optional(v.string()), // Base64 encoded audio
    voiceId: v.optional(v.string()),
    socialMediaPosts: v.optional(v.array(v.string())), // Generated social media posts
    memeCaption: v.optional(v.string()),
    psychologicalProfile: v.optional(v.string()), // JSON string of psychological analysis
    timestamp: v.number(),
  })
    .index("by_war", ["warId"])
    .index("by_winner", ["winnerId"])
    .index("by_loser", ["loserId"])
    .index("by_timestamp", ["timestamp"]),

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
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

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

  // Rewards transactions table - tracks app coin transactions
  rewardsTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "earned", "spent", "bonus", "challenge_win", "challenge_loss"
    amount: v.number(), // Positive for earned, negative for spent
    description: v.string(),
    challengeId: v.optional(v.id("challenges")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_challenge", ["challengeId"]),

  // Prize pools table - tracks money challenges and settlements
  prizePools: defineTable({
    challengeId: v.id("challenges"),
    totalAmount: v.number(), // Total prize pool amount in cents
    currency: v.string(), // "USD", "EUR", etc.
    splitwiseGroupId: v.optional(v.string()), // Splitwise group ID
    status: v.string(), // "active", "completed", "settled"
    winnerId: v.optional(v.id("users")),
    settlementId: v.optional(v.string()), // Splitwise settlement ID
    createdAt: v.number(),
    settledAt: v.optional(v.number()),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_status", ["status"])
    .index("by_winner", ["winnerId"]),
});
