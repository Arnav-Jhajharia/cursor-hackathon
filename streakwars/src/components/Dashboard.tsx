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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .dashboard-container {
          max-width: 480px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          position: relative;
        }
        
        .welcome-section {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          color: white;
          padding: 2rem 1.5rem 3rem;
          border-radius: 0 0 2rem 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .welcome-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        
        .welcome-content {
          position: relative;
          z-index: 1;
        }
        
        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .welcome-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }
        
        .stats-section {
          margin: -1.5rem 1.5rem 2rem;
          position: relative;
          z-index: 2;
        }
        
        .tab-navigation {
          display: flex;
          background: #f8f8f8;
          border-radius: 1rem;
          padding: 0.5rem;
          margin: 0 1.5rem 2rem;
          position: relative;
        }
        
        .tab-button {
          flex: 1;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: transparent;
          color: #666;
          position: relative;
        }
        
        .tab-button.active {
          background: white;
          color: #1a1a1a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .content-section {
          padding: 0 1.5rem 2rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }
        
        .add-button {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          color: white;
          border: none;
          border-radius: 1rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .add-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        
        .content-card {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #666;
        }
        
        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .empty-state-text {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .empty-state-subtext {
          font-size: 0.9rem;
          color: #999;
        }
        
        @media (min-width: 640px) {
          .dashboard-container {
            max-width: 600px;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Hey {currentUser.name}! 👋
            </h1>
            <p className="welcome-subtitle">
              Ready to crush your habits today?
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
            <div>
              <div className="section-header">
                <h2 className="section-title">Challenges</h2>
              </div>
              <div className="content-card">
                <ChallengeList userId={currentUser._id} />
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
