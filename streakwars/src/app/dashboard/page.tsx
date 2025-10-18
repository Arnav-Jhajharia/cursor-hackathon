"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import HabitList from "../../components/HabitList";
import StatsOverview from "../../components/StatsOverview";
import AddHabitModal from "../../components/AddHabitModal";

export default function DashboardPage() {
  const { user } = useUser();
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (user && !currentUser) {
      createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "User",
        avatar: user.imageUrl,
      });
    }
  }, [user, currentUser, createOrUpdateUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.name}! 👋
          </h1>
          <p className="text-gray-600">Ready to build some amazing habits today?</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview userId={currentUser._id} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🎯</div>
              <div className="text-sm font-semibold text-blue-700">Habits</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Your Habits</h3>
            <p className="text-sm text-gray-600 mb-4">Build and maintain your daily routines</p>
            <a
              href="/habits"
              className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Manage Habits →
            </a>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🏆</div>
              <div className="text-sm font-semibold text-green-700">Challenges</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Challenges</h3>
            <p className="text-sm text-gray-600 mb-4">Compete with friends and win prizes</p>
            <a
              href="/challenges"
              className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View Challenges →
            </a>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">👥</div>
              <div className="text-sm font-semibold text-purple-700">Friends</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect & Compete</h3>
            <p className="text-sm text-gray-600 mb-4">Add friends and stay motivated together</p>
            <a
              href="/friends"
              className="inline-flex items-center text-sm font-semibold text-purple-700 hover:text-purple-800"
            >
              Manage Friends →
            </a>
          </div>
        </div>

        {/* Today's Habits */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Habits</h2>
              <button
                onClick={() => setShowAddHabit(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors"
              >
                + Add Habit
              </button>
            </div>
          </div>
          <div className="p-6">
            <HabitList userId={currentUser._id} />
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <AddHabitModal
          userId={currentUser._id}
          onClose={() => setShowAddHabit(false)}
        />
      )}
    </div>
  );
}
