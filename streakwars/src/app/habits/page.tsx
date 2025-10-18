    "use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import HabitList from "../../components/HabitList";
import AddHabitModal from "../../components/AddHabitModal";

export default function HabitsPage() {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Habits</h1>
          <p className="text-gray-600">Build and track your daily habits</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{currentUser.totalPoints || 0}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{currentUser.currentStreak || 0}</div>
              <div className="text-sm text-gray-500">Current Streak</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{currentUser.longestStreak || 0}</div>
              <div className="text-sm text-gray-500">Best Streak</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Habits</h2>
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
