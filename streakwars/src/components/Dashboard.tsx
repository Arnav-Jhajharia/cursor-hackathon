"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import HabitList from "./HabitList";
import ChallengeList from "./ChallengeList";
import StatsOverview from "./StatsOverview";
import RewardsBalance from "./RewardsBalance";
import ChallengeInvitations from "./ChallengeInvitations";
import AddHabitModal from "./AddHabitModal";
import FriendsList from "./FriendsList";
import ChallengesPage from "./ChallengesPage";
import ExploreTab from "./ExploreTab";
import KnowledgeQuest from "./KnowledgeQuest";

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("habits");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20">
      <style jsx>{`
        .dashboard-container {
          max-width: 56rem;
          margin: 0 auto;
          min-height: 100vh;
          position: relative;
          padding: 2rem 1rem;
        }

        .welcome-section {
          background: #6366f1;
          color: white;
          padding: 2rem 1.5rem;
          border-radius: 1rem;
          position: relative;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .welcome-content {
          position: relative;
          z-index: 1;
        }

        .welcome-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .welcome-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 400;
        }

        .stats-section {
          margin-bottom: 2rem;
        }

        .tab-navigation {
          display: flex;
          background: white;
          border-radius: 1rem;
          padding: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(100, 116, 139, 0.1);
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .tab-button.active {
          background: #6366f1;
          color: white;
        }

        .tab-button:hover:not(.active) {
          background: #f8fafc;
          color: #475569;
        }

        .content-section {
          padding-bottom: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .add-button {
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .add-button:hover {
          background: #4f46e5;
        }

        .content-card {
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(100, 116, 139, 0.1);
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .dashboard-container {
            padding: 3rem 2rem;
          }

          .welcome-section {
            padding: 3rem 2.5rem;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, {currentUser.name}
            </h1>
            <p className="welcome-subtitle">
              Keep building those habits
            </p>
          </div>
        </div>

        {/* INLINE CLEANUP PANEL - SUPER VISIBLE - COMMENTED OUT */}
        {/* 
        <div style={{
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
                  const result = await clearAllChallenges({});
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
                  const result = await clearAllHabits({});
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
                  const result = await clearEverything({});
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
        </div>
        */}

        {/* Stats Overview */}
        <div className="stats-section">
          <StatsOverview userId={currentUser._id} />
        </div>

        {/* Rewards Balance */}
        <div className="mb-8">
          <RewardsBalance userId={currentUser._id} />
        </div>

        {/* Challenge Invitations */}
        {currentUser && <ChallengeInvitations userId={currentUser._id} />}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab("habits")}
            className={`tab-button ${activeTab === "habits" ? "active" : ""}`}
          >
            Habits
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`tab-button ${activeTab === "challenges" ? "active" : ""}`}
          >
            Challenges
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`tab-button ${activeTab === "explore" ? "active" : ""}`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`tab-button ${activeTab === "friends" ? "active" : ""}`}
          >
            Friends
          </button>
        </div>

        {/* Content Section */}
        <div className="content-section">
          {activeTab === "habits" && (
            <div>
              <div className="section-header">
                <h2 className="section-title">My Habits</h2>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="add-button"
                >
                  + Add
                </button>
              </div>
              <div className="content-card">
                <HabitList userId={currentUser._id} />
              </div>
            </div>
          )}

          {activeTab === "challenges" && (
            <ChallengesPage userId={currentUser._id} />
          )}

          {activeTab === "explore" && (
            <div>
              <div className="section-header">
                <h2 className="section-title">Explore</h2>
              </div>
              <div className="content-card">
                <div className="space-y-6">
                  <ExploreTab 
                    userId={currentUser._id} 
                    onAddHabit={(habitData) => {
                      // Handle adding habit from explore tab
                      setShowAddHabit(true);
                      // You could pre-populate the form here
                    }}
                  />
                  <div className="border-t pt-6">
                    <KnowledgeQuest 
                      userId={currentUser._id}
                      onCreateChallenge={(challengeData) => {
                        // Handle creating challenge from knowledge quest
                        // This would integrate with the existing challenge creation flow
                        console.log("Creating challenge:", challengeData);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "friends" && (
            <div>
              <div className="section-header">
                <h2 className="section-title">Friends</h2>
              </div>
              <div className="content-card">
                <FriendsList userId={currentUser._id} />
              </div>
            </div>
          )}
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
