import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily streak check at midnight UTC
crons.daily(
  "check daily streaks",
  { hourUTC: 0, minuteUTC: 0 }, // Run at midnight UTC
  internal.cronHandlers.checkDailyStreaks
);

// Monthly challenge settlement on the 1st of each month
crons.monthly(
  "settle monthly challenges",
  { day: 1, hourUTC: 0, minuteUTC: 0 }, // Run on the 1st at midnight UTC
  internal.cronHandlers.settleMonthlyChallenges
);

// Weekly streak milestone check on Sundays
crons.weekly(
  "check streak milestones",
  { dayOfWeek: "sunday", hourUTC: 0, minuteUTC: 0 }, // Run on Sundays at midnight UTC
  internal.cronHandlers.checkStreakMilestones
);

export default crons;
