import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Submit verification for a habit completion
export const submitHabitVerification = mutation({
  args: {
    completionId: v.id("habitCompletions"),
    verificationType: v.union(v.literal("photo"), v.literal("reading")),
    verificationData: v.object({
      // For photo verification
      imageUrl: v.optional(v.string()),
      // For reading verification
      bookName: v.optional(v.string()),
      pageRange: v.optional(v.string()),
      summary: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<string> => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    const habit = await ctx.db.get(completion.habitId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    // Update completion with verification data
    await ctx.db.patch(args.completionId, {
      verificationStatus: "pending",
      verificationType: args.verificationType,
      verificationData: args.verificationData,
    });

    // Trigger Groq verification using action
    await ctx.scheduler.runAfter(0, api.groqVerificationActions.verifyHabitWithGroqAction, {
      habitId: completion.habitId,
      userId: completion.userId,
      verificationType: args.verificationType,
      inputData: args.verificationData,
      habitName: habit.name,
      completionId: args.completionId,
    });

    return "Verification submitted successfully";
  },
});

// Get verification status for a completion
export const getVerificationStatus = query({
  args: { completionId: v.id("habitCompletions") },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    return {
      verificationStatus: completion.verificationStatus || "none",
      verificationType: completion.verificationType,
      verificationData: completion.verificationData,
      verificationResult: completion.verificationResult,
      requiresVerification: completion.requiresVerification || false,
      auditReason: completion.auditReason,
    };
  },
});

// Get all completions requiring verification for a user
export const getCompletionsRequiringVerification = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_requires_verification", (q) => 
        q.eq("requiresVerification", true)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Get habit details for each completion
    const completionsWithHabits = await Promise.all(
      completions.map(async (completion) => {
        const habit = await ctx.db.get(completion.habitId);
        return {
          ...completion,
          habit,
        };
      })
    );

    return completionsWithHabits;
  },
});

// Process verification result (called by internal Groq verification)
export const processVerificationResult = mutation({
  args: {
    completionId: v.id("habitCompletions"),
    verificationResult: v.object({
      verified: v.boolean(),
      confidence: v.number(),
      reason: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    const now = Date.now();
    const newStatus = args.verificationResult.verified ? "verified" : "rejected";

    // Update completion with verification result
    await ctx.db.patch(args.completionId, {
      verificationStatus: newStatus,
      verificationResult: {
        ...args.verificationResult,
        verifiedAt: now,
      },
      requiresVerification: false, // Clear the requirement
    });

    // Create notification for the user
    const habit = await ctx.db.get(completion.habitId);
    if (habit) {
      await ctx.db.insert("notifications", {
        userId: completion.userId,
        type: "verification_complete",
        title: `Habit Verification ${newStatus === "verified" ? "Approved" : "Rejected"}`,
        message: `Your "${habit.name}" completion has been ${newStatus === "verified" ? "verified" : "rejected"}. ${args.verificationResult.reason}`,
        isRead: false,
        data: { 
          completionId: args.completionId,
          habitId: habit._id,
          habitName: habit.name,
          verificationResult: args.verificationResult 
        },
        createdAt: now,
      });
    }

    return { success: true, status: newStatus };
  },
});

// Trigger audit verification (for challenge disputes)
export const triggerAuditVerification = mutation({
  args: {
    completionId: v.id("habitCompletions"),
    auditReason: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const completion = await ctx.db.get(args.completionId);
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    const habit = await ctx.db.get(completion.habitId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    // Mark completion as requiring verification
    await ctx.db.patch(args.completionId, {
      requiresVerification: true,
      auditReason: args.auditReason,
      verificationStatus: "pending",
    });

    // Create notification for the user
    await ctx.db.insert("notifications", {
      userId: completion.userId,
      type: "verification_required",
      title: "Habit Verification Required",
      message: `Your "${habit.name}" completion has been flagged for verification. Please provide evidence.`,
      isRead: false,
      data: { 
        completionId: args.completionId,
        habitId: habit._id,
        habitName: habit.name,
        auditReason: args.auditReason 
      },
      createdAt: Date.now(),
    });

    return "Audit verification triggered";
  },
});

// Get verification statistics for a user
export const getVerificationStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      totalCompletions: completions.length,
      verifiedCompletions: 0,
      rejectedCompletions: 0,
      pendingVerifications: 0,
      averageConfidence: 0,
      requiresVerification: 0,
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const completion of completions) {
      if (completion.verificationStatus === "verified") {
        stats.verifiedCompletions++;
        if (completion.verificationResult?.confidence) {
          totalConfidence += completion.verificationResult.confidence;
          confidenceCount++;
        }
      } else if (completion.verificationStatus === "rejected") {
        stats.rejectedCompletions++;
      } else if (completion.verificationStatus === "pending") {
        stats.pendingVerifications++;
      }

      if (completion.requiresVerification) {
        stats.requiresVerification++;
      }
    }

    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return stats;
  },
});
