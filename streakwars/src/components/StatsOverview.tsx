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
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-lg animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Points",
      value: user.totalPoints,
      icon: "🏆",
      gradient: "from-gray-600 to-gray-800",
      bgColor: "bg-gray-50",
    },
    {
      title: "Streak",
      value: user.currentStreak,
      icon: "🔥",
      gradient: "from-gray-600 to-gray-800",
      bgColor: "bg-gray-50",
    },
    {
      title: "Best",
      value: user.longestStreak,
      icon: "⭐",
      gradient: "from-gray-600 to-gray-800",
      bgColor: "bg-gray-50",
    },
    {
      title: "Today",
      value: todayCompletions?.length || 0,
      icon: "✅",
      gradient: "from-gray-600 to-gray-800",
      bgColor: "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-2xl p-4 shadow-lg border border-white/50`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">{stat.icon}</div>
            <div className={`text-xs font-semibold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.title}
            </div>
          </div>
          <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
