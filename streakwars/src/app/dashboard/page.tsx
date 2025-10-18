"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import HabitList from "../../components/HabitList";
import StatsOverview from "../../components/StatsOverview";
import AddHabitModal from "../../components/AddHabitModal";
import AITestPanel from "../../components/AITestPanel";
import WarSystemTest from "../../components/WarSystemTest";

export default function DashboardPage() {
  const { user } = useUser();
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Cleanup mutations
  const clearAllChallenges = useMutation(api.cleanup.clearAllChallenges);
  const clearAllHabits = useMutation(api.cleanup.clearAllHabits);
  const clearEverything = useMutation(api.cleanup.clearEverything);

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

        {/* AI TEST PANEL */}
        {/* <AITestPanel /> */}

        {/* WAR SYSTEM TEST */}
        {/* <WarSystemTest /> */}

        {/* CLEANUP PANEL - SUPER VISIBLE */}
        {/* <div style={{
          backgroundColor: '#ff0000',
          border: '10px solid #000000',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 9999,
          minHeight: '200px'
        }}>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '20px',
            textShadow: '2px 2px 4px #000000'
          }}>
            🧹 CLEANUP PANEL 🧹
          </h2>
          <p style={{
            color: '#ffffff',
            fontSize: '18px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Use these buttons to clear data and start fresh.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={async () => {
                if (!confirm("Clear all challenges?")) return;
                try {
                  const result = await clearAllChallenges({ userId: currentUser._id });
                  alert(`Cleared ${result.deleted.challenges} challenges!`);
                } catch (error) {
                  alert("Error clearing challenges");
                }
              }}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#ff6600',
                color: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear All Challenges
            </button>
            
            <button
              onClick={async () => {
                if (!confirm("Clear all habits?")) return;
                try {
                  const result = await clearAllHabits({ userId: currentUser._id });
                  alert(`Cleared ${result.deleted.habits} habits!`);
                } catch (error) {
                  alert("Error clearing habits");
                }
              }}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#ffcc00',
                color: '#000000',
                border: '3px solid #000000',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear All Habits
            </button>
            
            <button
              onClick={async () => {
                if (!confirm("🚨 NUCLEAR OPTION 🚨\n\nThis will delete EVERYTHING!\n\nAre you absolutely sure?")) return;
                try {
                  const result = await clearEverything({ userId: currentUser._id });
                  alert(result.message);
                } catch (error) {
                  alert("Error clearing everything");
                }
              }}
              style={{
                width: '100%',  
                padding: '15px',
                backgroundColor: '#cc0000',
                color: '#ffffff',
                border: '5px solid #000000',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                animation: 'pulse 1s infinite'
              }}
            >
              🚨 NUCLEAR: Clear Everything 🚨
            </button>
          </div>
          
          <div style={{
            marginTop: '15px',
            fontSize: '14px',
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ⚠️ These actions cannot be undone! Use with caution.
          </div>
        </div> */}

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
