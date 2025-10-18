"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface RewardsBalanceProps {
  userId: Id<"users">;
}

export default function RewardsBalance({ userId }: RewardsBalanceProps) {
  const rewardsBalance = useQuery(api.rewards.getUserRewardsBalance, { userId });
  const recentTransactions = useQuery(api.rewards.getUserRewardsTransactions, { 
    userId, 
    limit: 5 
  });

  if (rewardsBalance === undefined) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Rewards Balance</h3>
        <div className="text-2xl">🪙</div>
      </div>
      
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {rewardsBalance.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">App Coins</div>
      </div>

      {recentTransactions && recentTransactions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-gray-600">{transaction.description}</span>
                </div>
                <span className={`font-medium ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Earn coins by completing habits and winning challenges
        </div>
      </div>
    </div>
  );
}
