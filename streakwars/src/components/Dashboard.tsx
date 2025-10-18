"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import HabitList from "./HabitList";
import ChallengeList from "./ChallengeList";
import StatsOverview from "./StatsOverview";
import AddHabitModal from "./AddHabitModal";
import FriendsList from "./FriendsList";
import ChallengesPage from "./ChallengesPage";

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("habits");
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

        {/* Stats Overview */}
        <div className="stats-section">
          <StatsOverview userId={currentUser._id} />
        </div>

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
