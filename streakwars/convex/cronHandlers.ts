import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Check daily streaks and reset if broken
export const checkDailyStreaks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);
    const startOfYesterday = yesterday.getTime();
    
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);
    const endOfYesterday = today.getTime();

    // Get all active habits
    const habits = await ctx.db
      .query("habits")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const habit of habits) {
      // Check if habit was completed yesterday
      const yesterdayCompletion = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit_date", (q) => 
          q.eq("habitId", habit._id)
           .gte("completedAt", startOfYesterday)
           .lt("completedAt", endOfYesterday)
        )
        .first();

      if (!yesterdayCompletion) {
        // Streak broken - reset user's current streak if this was their longest
        const user = await ctx.db.get(habit.userId);
        if (user && user.currentStreak > 0) {
          await ctx.db.patch(habit.userId, {
            currentStreak: 0,
            updatedAt: now,
          });

          // Create notification about broken streak
          await ctx.db.insert("notifications", {
            userId: habit.userId,
            type: "streak_broken",
            title: "Streak Broken",
            message: `Your streak for "${habit.name}" has been broken`,
            isRead: false,
            data: { habitId: habit._id, habitName: habit.name },
            createdAt: now,
          });
        }
      }
    }
  },
});

// Settle monthly challenges and create new ones
export const settleMonthlyChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    const startOfLastMonth = lastMonth.getTime();
    
    const endOfLastMonth = new Date(lastMonth);
    endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
    endOfLastMonth.setHours(0, 0, 0, 0);
    const endOfLastMonthTime = endOfLastMonth.getTime();

    // Get or create system user
    let systemUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "system_user"))
      .first();
    
    let systemUserId;
    if (!systemUser) {
      systemUserId = await ctx.db.insert("users", {
        clerkId: "system_user",
        name: "System",
        email: "system@habituate.app",
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        rewardsBalance: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      systemUserId = systemUser._id;
    }

    // Get challenges that ended last month
    const endedChallenges = await ctx.db
      .query("challenges")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("endDate"), endOfLastMonthTime)
        )
      )
      .collect();

    for (const challenge of endedChallenges) {
      // Mark challenge as inactive
      await ctx.db.patch(challenge._id, {
        isActive: false,
      });

      // Get final leaderboard
      const participants = await ctx.db
        .query("challengeParticipants")
        .withIndex("by_challenge_active", (q) => 
          q.eq("challengeId", challenge._id).eq("isActive", true)
        )
        .collect();

      // Sort by points
      const sortedParticipants = participants.sort((a, b) => b.totalPoints - a.totalPoints);

      // Award prizes and create notifications
      for (let i = 0; i < Math.min(3, sortedParticipants.length); i++) {
        const participant = sortedParticipants[i];
        const position = i + 1;
        let prizePoints = 0;
        let positionText = "";

        switch (position) {
          case 1:
            prizePoints = 100;
            positionText = "1st place";
            break;
          case 2:
            prizePoints = 50;
            positionText = "2nd place";
            break;
          case 3:
            prizePoints = 25;
            positionText = "3rd place";
            break;
        }

        if (prizePoints > 0) {
          // Award bonus points
          const user = await ctx.db.get(participant.userId);
          if (user) {
            await ctx.db.patch(participant.userId, {
              totalPoints: user.totalPoints + prizePoints,
              updatedAt: now,
            });
          }

          // Create notification
          await ctx.db.insert("notifications", {
            userId: participant.userId,
            type: "challenge_prize",
            title: "Challenge Prize!",
            message: `Congratulations! You finished ${positionText} in "${challenge.name}" and earned ${prizePoints} bonus points!`,
            isRead: false,
            data: { 
              challengeId: challenge._id, 
              challengeName: challenge.name,
              position,
              prizePoints 
            },
            createdAt: now,
          });
        }
      }

      // Notify all participants about challenge end
      for (const participant of participants) {
        await ctx.db.insert("notifications", {
          userId: participant.userId,
          type: "challenge_ended",
          title: "Challenge Ended",
          message: `The "${challenge.name}" challenge has ended. Check the leaderboard to see final results!`,
          isRead: false,
          data: { challengeId: challenge._id, challengeName: challenge.name },
          createdAt: now,
        });
      }
    }

    // Create new monthly challenge
    const newChallengeStart = new Date(now);
    newChallengeStart.setDate(1);
    newChallengeStart.setHours(0, 0, 0, 0);
    const newChallengeStartTime = newChallengeStart.getTime();

    const newChallengeEnd = new Date(newChallengeStart);
    newChallengeEnd.setMonth(newChallengeEnd.getMonth() + 1);
    newChallengeEnd.setHours(0, 0, 0, 0);
    const newChallengeEndTime = newChallengeEnd.getTime();

    // Get popular habits from last month to include in new challenge
    const popularHabits = await ctx.db
      .query("habits")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // For now, include all active habits in the new challenge
    // In a real app, you might want to select based on popularity or user preferences
    const targetHabits = popularHabits.slice(0, 10).map(habit => habit._id);

    if (targetHabits.length > 0) {
      const newChallenge = await ctx.db.insert("challenges", {
        name: `Monthly Challenge - ${newChallengeStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        description: "Complete your habits daily to earn points and compete with friends!",
        startDate: newChallengeStartTime,
        endDate: newChallengeEndTime,
        targetHabits,
        isActive: true,
        prizeType: "none",
        createdBy: systemUserId,
        createdAt: now,
      });

      // Notify all users about the new challenge
      const allUsers = await ctx.db.query("users").collect();
      for (const user of allUsers) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "new_challenge",
          title: "New Monthly Challenge!",
          message: "A new monthly challenge has started. Join now to compete with friends!",
          isRead: false,
          data: { challengeId: newChallenge },
          createdAt: now,
        });
      }
    }
  },
});

// Check for streak milestones and award bonus points
export const checkStreakMilestones = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all users
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      // Get user's active habits
      const habits = await ctx.db
        .query("habits")
        .withIndex("by_user_active", (q) => 
          q.eq("userId", user._id).eq("isActive", true)
        )
        .collect();

      for (const habit of habits) {
        // Calculate current streak for this habit
        const completions = await ctx.db
          .query("habitCompletions")
          .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
          .order("desc")
          .collect();

        if (completions.length === 0) continue;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if completed today
        const todayCompletion = completions.find(completion => {
          const completionDate = new Date(completion.completedAt);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate.getTime() === today.getTime();
        });

        if (!todayCompletion) {
          // Check if completed yesterday
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayCompletion = completions.find(completion => {
            const completionDate = new Date(completion.completedAt);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === yesterday.getTime();
          });
          
          if (!yesterdayCompletion) continue;
        }

        // Count consecutive days
        let currentDate = new Date(today);
        for (const completion of completions) {
          const completionDate = new Date(completion.completedAt);
          completionDate.setHours(0, 0, 0, 0);
          
          if (completionDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (completionDate.getTime() < currentDate.getTime()) {
            break;
          }
        }

        // Check for milestone achievements
        const milestones = [7, 14, 30, 60, 100, 365];
        for (const milestone of milestones) {
          if (streak === milestone) {
            // Check if milestone was already achieved
            const existingMilestone = await ctx.db
              .query("streakMilestones")
              .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
              .filter((q) => q.eq(q.field("streakLength"), milestone))
              .first();

            if (!existingMilestone) {
              // Award milestone points
              const milestonePoints = milestone * 2; // 2 points per day of streak
              
              await ctx.db.patch(user._id, {
                totalPoints: user.totalPoints + milestonePoints,
                updatedAt: now,
              });

              // Record milestone
              await ctx.db.insert("streakMilestones", {
                userId: user._id,
                habitId: habit._id,
                streakLength: milestone,
                achievedAt: now,
                pointsAwarded: milestonePoints,
              });

              // Create notification
              await ctx.db.insert("notifications", {
                userId: user._id,
                type: "streak_milestone",
                title: "Streak Milestone!",
                message: `Amazing! You've reached a ${milestone}-day streak for "${habit.name}" and earned ${milestonePoints} bonus points!`,
                isRead: false,
                data: { 
                  habitId: habit._id, 
                  habitName: habit.name,
                  streakLength: milestone,
                  pointsAwarded: milestonePoints 
                },
                createdAt: now,
              });
            }
          }
        }
      }
    }
  },
});

