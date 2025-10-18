"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface StatsOverviewProps {
  userId: Id<"users">;
}

export default function StatsOverview({ userId }: StatsOverviewProps) {
  const user = useQuery(api.users.getUser, { userId });
  const completionStats = useQuery(api.habitCompletions.getUserCompletionStats, { userId });
  const todayCompletions = useQuery(api.habitCompletions.getTodayCompletions, { userId });

  if (!user || !completionStats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-3/4 mb-3"></div>
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Points",
      value: user.totalPoints,
    },
    {
      title: "Current Streak",
      value: `${user.currentStreak} days`,
    },
    {
      title: "Best Streak",
      value: `${user.longestStreak} days`,
    },
    {
      title: "Today",
      value: `${todayCompletions?.length || 0} done`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm"
        >
          <div className="text-xs font-medium text-slate-500 mb-1">
            {stat.title}
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
