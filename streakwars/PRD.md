# Product Requirements Document: Habit Streak Challenge

## 1. Product Overview

### 1.1 Product Name
**StreakWars** - Competitive Habit Tracker with Stakes

### 1.2 Vision
A gamified, competitive habit tracking app where users challenge each other to maintain daily streaks, earn coins through consistency, and settle monthly challenges with real money stakes.

### 1.3 Core Value Proposition
Transform habit building into a social, competitive experience with financial accountability. Users maintain motivation through peer competition and monetary stakes while building lasting habits.

---

## 2. Technical Architecture

### 2.1 Technology Stack
- **Backend**: Convex.dev
  - Real-time reactive database
  - TypeScript server functions
  - Built-in authentication
  - Scheduled functions & cron jobs
- **Frontend**: React with Convex React Client
- **Authentication**: Clerk (recommended for simplicity)
- **Deployment**: Convex hosting

### 2.2 Why Convex?
- **Real-time Sync**: Automatic updates when opponents complete habits
- **TypeScript Everywhere**: Type-safe queries and mutations
- **Built-in Scheduling**: Perfect for daily habit checks and monthly settlements
- **Reactive Queries**: UI updates automatically when data changes
- **No Infrastructure Management**: Focus on features, not DevOps

---

## 3. User Flows

### 3.1 Authentication Flow
1. User signs up/logs in via Clerk
2. Create profile with username and payment info placeholder
3. Land on dashboard showing active challenges

### 3.2 Challenge Creation Flow
1. User initiates challenge with another user
2. Select shared habits from predefined list or create custom
3. Set challenge parameters:
   - Duration (default: 1 month)
   - Coin value per completed habit
   - Stake amount per coin difference
4. Opponent accepts/rejects challenge
5. Challenge starts at midnight UTC

### 3.3 Daily Habit Tracking Flow
1. User views daily habit checklist
2. Mark habits as complete (with timestamp)
3. See real-time updates of opponent's progress
4. Earn coins for each completed habit
5. View current streak and coin differential

### 3.4 Monthly Settlement Flow
1. Cron job runs on last day of month
2. Calculate total coins for each user
3. Determine winner and amount owed
4. Generate settlement notification
5. Users confirm payment outside app

---

## 4. Data Schema (Convex)

### 4.1 Users Table
```typescript
users: {
  _id: Id<"users">,
  clerkId: string,  // From Clerk authentication
  username: string,
  email: string,
  profilePicture?: string,
  createdAt: number,
  totalChallengesWon: number,
  totalChallengesLost: number,
  currentStreak: number,
  longestStreak: number,
}
```

### 4.2 Challenges Table
```typescript
challenges: {
  _id: Id<"challenges">,
  participants: Id<"users">[],  // Array of 2 user IDs
  status: "pending" | "active" | "completed" | "cancelled",
  habitIds: Id<"habits">[],
  startDate: number,
  endDate: number,
  coinsPerHabit: number,
  stakePerCoin: number,  // in dollars/rupees
  winnerId?: Id<"users">,
  finalScores?: {
    [userId: string]: number  // total coins
  },
  createdAt: number,
  settledAt?: number,
}
```

### 4.3 Habits Table
```typescript
habits: {
  _id: Id<"habits">,
  name: string,
  description: string,
  category: "health" | "productivity" | "learning" | "social" | "custom",
  icon: string,
  isCustom: boolean,
  createdBy?: Id<"users">,
}
```

### 4.4 HabitCompletions Table
```typescript
habitCompletions: {
  _id: Id<"habitCompletions">,
  userId: Id<"users">,
  habitId: Id<"habits">,
  challengeId: Id<"challenges">,
  completedAt: number,
  date: string,  // YYYY-MM-DD for querying
  coinsEarned: number,
}
```

### 4.5 DailyStreaks Table
```typescript
dailyStreaks: {
  _id: Id<"dailyStreaks">,
  userId: Id<"users">,
  challengeId: Id<"challenges">,
  date: string,  // YYYY-MM-DD
  habitsCompleted: number,
  totalHabits: number,
  allCompleted: boolean,
  currentStreak: number,
}
```

### 4.6 Notifications Table
```typescript
notifications: {
  _id: Id<"notifications">,
  userId: Id<"users">,
  type: "challenge_invite" | "challenge_accepted" | "streak_lost" | "monthly_settlement" | "opponent_completed",
  title: string,
  message: string,
  data?: object,  // Context-specific data
  read: boolean,
  createdAt: number,
}
```

---

## 5. Core Features

### 5.1 Habit Management
**Priority**: P0 (MVP)

#### Queries
```typescript
// Get predefined habits
getDefaultHabits(ctx, args)
// Get user's custom habits
getUserHabits(ctx, args)
```

#### Mutations
```typescript
// Create custom habit
createCustomHabit(ctx, { name, description, category, icon })
// Edit custom habit (only if not used in active challenges)
updateCustomHabit(ctx, { habitId, ... })
```

#### Features
- Predefined habit library (50+ habits)
- Custom habit creation
- Habit categorization
- Icon selection

---

### 5.2 Challenge System
**Priority**: P0 (MVP)

#### Queries
```typescript
// Get user's active challenges
getActiveChallenges(ctx, args)
// Get challenge details
getChallenge(ctx, { challengeId })
// Get pending invitations
getPendingChallengeInvites(ctx, args)
// Get challenge leaderboard
getChallengeLeaderboard(ctx, { challengeId })
```

#### Mutations
```typescript
// Create challenge
createChallenge(ctx, {
  opponentId,
  habitIds,
  coinsPerHabit,
  stakePerCoin,
  startDate,
  endDate
})

// Accept/reject challenge
respondToChallenge(ctx, { challengeId, accept: boolean })

// Cancel challenge (before it starts)
cancelChallenge(ctx, { challengeId })
```

#### Features
- 1v1 challenge creation
- Multi-habit selection (3-10 habits per challenge)
- Customizable coin values
- Customizable stake amounts
- Challenge acceptance/rejection flow
- Challenge history

---

### 5.3 Daily Habit Tracking
**Priority**: P0 (MVP)

#### Queries
```typescript
// Get today's habits for a challenge
getTodaysHabits(ctx, { challengeId })
// Get habit completion history
getHabitCompletionHistory(ctx, { challengeId, startDate, endDate })
// Get current streak
getCurrentStreak(ctx, { challengeId })
```

#### Mutations
```typescript
// Mark habit as complete
completeHabit(ctx, { habitId, challengeId })
// Undo habit completion (within 1 hour)
undoHabitCompletion(ctx, { completionId })
```

#### Scheduled Functions
```typescript
// Runs daily at midnight UTC
internal.dailyStreakCheck(ctx, {})
// Checks all active challenges
// Updates streak counts
// Sends notifications for broken streaks
```

#### Features
- Simple checkbox interface
- Timestamp recording
- Undo functionality (1-hour window)
- Real-time opponent progress visibility
- Daily streak tracking
- Push notifications for reminders

---

### 5.4 Scoring & Coins System
**Priority**: P0 (MVP)

#### Queries
```typescript
// Get current coin standings
getChallengeScores(ctx, { challengeId })
// Get coin differential
getCoinDifferential(ctx, { challengeId })
// Get daily coin breakdown
getDailyCoinBreakdown(ctx, { challengeId, date })
```

#### Internal Mutations
```typescript
// Award coins (called by completeHabit)
internal.awardCoins(ctx, { userId, challengeId, amount })
```

#### Scoring Rules
- 1 coin per completed habit (default, customizable)
- Bonus coins for perfect days (all habits completed)
- Streak multipliers (optional, future feature)

---

### 5.5 Monthly Settlement
**Priority**: P0 (MVP)

#### Cron Job
```typescript
// Runs on last day of each month at 11:59 PM UTC
crons.monthly(
  "Monthly Settlement",
  { dayOfMonth: "L", hourUTC: 23, minuteUTC: 59 },
  internal.settlements.processMonthlySettlements
)
```

#### Internal Mutations
```typescript
internal.settlements.processMonthlySettlements(ctx, {})
// For each active challenge:
// 1. Calculate final coin counts
// 2. Determine winner
// 3. Calculate amount owed (coins × stake)
// 4. Mark challenge as completed
// 5. Send notifications to both users
// 6. Create new challenge offer (optional)

internal.settlements.settleChallenge(ctx, { challengeId })
```

#### Queries
```typescript
// Get settlement history
getSettlementHistory(ctx, args)
// Get current month's standings
getCurrentMonthStandings(ctx, { challengeId })
```

#### Features
- Automatic monthly calculations
- Clear settlement notifications
- Payment amount display
- Settlement confirmation tracking
- Automatic archive of completed challenges

---

### 5.6 Real-time Updates
**Priority**: P0 (MVP)

#### Leveraging Convex Reactivity
All queries automatically subscribe to data changes:
- Opponent completes habit → UI updates instantly
- Coin counts change → Leaderboard updates
- Challenge invite received → Notification appears
- Streak broken → Alert shows immediately

#### Implementation
Uses Convex's built-in sync engine:
```typescript
// In React component
const habits = useQuery(api.habits.getTodaysHabits, { challengeId });
// Automatically updates when data changes, no manual refresh needed
```

---

### 5.7 Notifications
**Priority**: P1 (Post-MVP)

#### Queries
```typescript
getNotifications(ctx, { limit, offset })
getUnreadNotificationCount(ctx, args)
```

#### Mutations
```typescript
markNotificationAsRead(ctx, { notificationId })
markAllNotificationsAsRead(ctx, args)
```

#### Notification Types
- Challenge invitation received
- Challenge accepted/rejected
- Opponent completed a habit
- Daily reminder (8 PM local time)
- Streak broken
- Monthly settlement due
- You're behind/ahead alert

---

## 6. UI/UX Screens

### 6.1 Dashboard
- Active challenges list
- Quick stats (streak, coins, position)
- "Create Challenge" CTA
- Pending invitations

### 6.2 Challenge Detail View
- Habit checklist for today
- Opponent's completion status (real-time)
- Current standings (coins and streak)
- Calendar view with completion history
- Challenge info (duration, stakes, participants)

### 6.3 Challenge Creation
- Friend selector
- Habit selection (multi-select)
- Parameters (coins per habit, stake amount)
- Duration picker
- Summary and confirm

### 6.4 Profile
- User stats (total challenges, win rate, longest streak)
- Active challenges overview
- Settlement history
- Custom habits management

### 6.5 Leaderboard (Future)
- Global rankings
- Friend rankings
- Challenge-specific rankings

---

## 7. Convex Implementation Details

### 7.1 Authentication Setup

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
```

```typescript
// React app wrapper
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.VITE_CONVEX_URL);

function App() {
  return (
    <ClerkProvider publishableKey={process.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AppContent />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### 7.2 Sample Query Implementation

```typescript
// convex/challenges.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveChallenges = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) throw new Error("User not found");
    
    const challenges = await ctx.db
      .query("challenges")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.or(
            q.eq(q.field("participants")[0], user._id),
            q.eq(q.field("participants")[1], user._id)
          )
        )
      )
      .collect();
    
    return challenges;
  },
});
```

### 7.3 Sample Mutation Implementation

```typescript
// convex/habits.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) throw new Error("User not found");
    
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "active") {
      throw new Error("Invalid challenge");
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user_habit_date", (q) =>
        q.eq("userId", user._id)
         .eq("habitId", args.habitId)
         .eq("date", today)
      )
      .unique();
    
    if (existing) {
      throw new Error("Habit already completed today");
    }
    
    // Create completion record
    const completionId = await ctx.db.insert("habitCompletions", {
      userId: user._id,
      habitId: args.habitId,
      challengeId: args.challengeId,
      completedAt: Date.now(),
      date: today,
      coinsEarned: challenge.coinsPerHabit,
    });
    
    // Update daily streak
    await ctx.scheduler.runAfter(0, internal.streaks.updateDailyStreak, {
      userId: user._id,
      challengeId: args.challengeId,
      date: today,
    });
    
    // Notify opponent
    const opponentId = challenge.participants.find(id => id !== user._id);
    if (opponentId) {
      await ctx.db.insert("notifications", {
        userId: opponentId,
        type: "opponent_completed",
        title: "Opponent completed a habit!",
        message: `${user.username} just completed a habit`,
        data: { habitId: args.habitId, challengeId: args.challengeId },
        read: false,
        createdAt: Date.now(),
      });
    }
    
    return completionId;
  },
});
```

### 7.4 Cron Job Implementation

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily streak check at midnight UTC
crons.daily(
  "Daily Streak Check",
  { hourUTC: 0, minuteUTC: 0 },
  internal.streaks.checkDailyStreaks
);

// Monthly settlement on last day of month
crons.monthly(
  "Monthly Settlement",
  { dayOfMonth: "L", hourUTC: 23, minuteUTC: 59 },
  internal.settlements.processMonthlySettlements
);

export default crons;
```

### 7.5 Scheduled Function Implementation

```typescript
// convex/streaks.ts
import { internalMutation } from "./_generated/server";

export const checkDailyStreaks = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const activeChallenges = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    for (const challenge of activeChallenges) {
      for (const userId of challenge.participants) {
        const streak = await ctx.db
          .query("dailyStreaks")
          .withIndex("by_user_challenge_date", (q) =>
            q.eq("userId", userId)
             .eq("challengeId", challenge._id)
             .eq("date", yesterdayStr)
          )
          .unique();
        
        // If no streak record for yesterday, user broke their streak
        if (!streak || !streak.allCompleted) {
          await ctx.db.insert("notifications", {
            userId: userId,
            type: "streak_lost",
            title: "Streak Broken!",
            message: "You didn't complete all habits yesterday",
            data: { challengeId: challenge._id },
            read: false,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});
```

---

## 8. Success Metrics

### 8.1 User Engagement
- Daily Active Users (DAU)
- Average habits completed per day
- Challenge completion rate
- Average challenge duration

### 8.2 Retention
- Day 7 retention
- Day 30 retention
- Monthly active challenges per user

### 8.3 Growth
- Invite acceptance rate
- New challenges created per month
- User referral rate

---

## 9. MVP Scope

### Phase 1 (MVP - 4 weeks)
**Week 1-2:**
- Authentication with Clerk
- User profile creation
- Basic database schema implementation
- Habit library (50 predefined habits)

**Week 3:**
- Challenge creation and acceptance flow
- Daily habit tracking (mark complete/incomplete)
- Real-time sync of opponent progress
- Basic coin calculation

**Week 4:**
- Monthly settlement cron job
- Settlement notification system
- Challenge history view
- Basic UI polish

### Phase 2 (Post-MVP - 2-4 weeks)
- Custom habit creation
- Push notifications
- Calendar view with completion history
- Undo functionality
- Profile statistics
- Settlement confirmation tracking

### Phase 3 (Future Features)
- Streak multipliers
- Perfect day bonuses
- Group challenges (3+ people)
- Global leaderboard
- In-app payment integration
- Habit templates and recommendations
- Weekly/bi-weekly challenges
- Challenge chat/comments

---

## 10. Technical Considerations

### 10.1 Timezone Handling
- Store all dates in UTC
- Convert to user's local timezone in UI
- Cron jobs run on UTC schedule

### 10.2 Scalability
- Convex handles scaling automatically
- Index optimization for queries
- Pagination for large datasets (history, notifications)

### 10.3 Data Integrity
- Transaction guarantees via Convex mutations
- Validation in mutations to prevent double-completions
- No direct database access from client

### 10.4 Security
- All mutations require authentication
- User can only access their own data and shared challenge data
- Input validation on all mutations
- Rate limiting (future consideration)

---

## 11. Design Principles

### 11.1 Simplicity First
- One-tap habit completion
- Clear visual indicators of progress
- Minimal setup friction

### 11.2 Transparency
- Always show opponent's progress
- Clear coin calculations
- Visible settlement amounts

### 11.3 Motivation
- Real-time competition
- Streak visualizations
- Achievement celebrations

### 11.4 Accountability
- Financial stakes
- Public commitment (to opponent)
- Automated settlements

---

## 12. Open Questions

1. **Payment Processing**: How do users settle payments? (External initially, PayPal/Venmo links, future in-app?)
2. **Timezone Conflicts**: How to handle users in different timezones? (Default to challenge creator's timezone?)
3. **Missed Days**: Can users make up missed habits? (No for MVP - creates complexity)
4. **Challenge Modifications**: Can parameters change mid-challenge? (No for MVP)
5. **Dispute Resolution**: What if users disagree on completion? (Manual resolution initially)

---

## 13. Resources

### 13.1 Convex Documentation
- [Getting Started](https://docs.convex.dev/get-started)
- [Authentication](https://docs.convex.dev/auth)
- [Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions)

### 13.2 Clerk Documentation
- [Convex Integration](https://docs.convex.dev/auth/clerk)
- [React Setup](https://clerk.com/docs)

---

## 14. Appendix

### 14.1 Sample Habit Categories

**Health (15 habits)**
- Drink 8 glasses of water
- Exercise for 30 minutes
- Meditate for 10 minutes
- Sleep 8 hours
- Eat 5 servings of fruits/vegetables

**Productivity (15 habits)**
- Complete daily to-do list
- Zero inbox
- No social media before noon
- Deep work session (2 hours)
- Plan tomorrow

**Learning (10 habits)**
- Read for 30 minutes
- Practice a language
- Watch educational video
- Complete online course module
- Write in journal

**Social (5 habits)**
- Call a friend/family
- Express gratitude to someone
- Practice active listening
- No phone during meals

**Custom (5 habits)**
- User-defined habits

### 14.2 Notification Copy Examples
- "🔥 Alex just completed 'Exercise for 30 min' - They're ahead by 2 coins!"
- "⚡ Challenge Accepted! Your habit duel with Sam starts tomorrow"
- "💰 Monthly Settlement: You won! Sam owes you ₹450"
- "😱 Streak broken! You missed 'Meditate' yesterday"
- "🎯 Perfect day! All habits completed. +5 bonus coins!"

---

*Last Updated: October 2025*
*Version: 1.0*