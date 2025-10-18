"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import HabitVerificationSystem from "../../../components/HabitVerificationSystem";

export default function HabitDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const habitId = params.id as Id<"habits">;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "Health",
    targetFrequency: "daily",
    pointsPerCompletion: 10,
  });

  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const habit = useQuery(api.habits.getHabit, { habitId });
  const habitCompletions = useQuery(api.habits.getAllHabitCompletions, { habitId });
  const habitChallenges = useQuery(api.habits.getHabitChallenges, { habitId });

  const updateHabit = useMutation(api.habits.updateHabit);
  const deleteHabit = useMutation(api.habits.deleteHabit);

  useEffect(() => {
    if (habit) {
      setEditForm({
        name: habit.name,
        description: habit.description || "",
        category: habit.category,
        targetFrequency: habit.targetFrequency,
        pointsPerCompletion: habit.pointsPerCompletion,
      });
    }
  }, [habit]);

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view habit details</p>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Habit Not Found</h1>
          <p className="text-gray-600">This habit doesn't exist or you don't have access to it</p>
          <button
            onClick={() => router.push("/habits")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Habits
          </button>
        </div>
      </div>
    );
  }

  const isOwner = habit.userId === currentUser._id;
  const totalCompletions = habitCompletions?.length || 0;
  const currentStreak = calculateCurrentStreak(habitCompletions || []);
  const weeklyCompletions = getWeeklyCompletions(habitCompletions || []);
  const monthlyCompletions = getMonthlyCompletions(habitCompletions || []);


  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHabit({
        habitId,
        name: editForm.name,
        description: editForm.description,
        category: editForm.category,
        targetFrequency: editForm.targetFrequency,
        pointsPerCompletion: editForm.pointsPerCompletion,
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating habit:", error);
      alert("Failed to update habit: " + (error as Error).message);
    }
  };

  const handleDeleteHabit = async () => {
    if (!confirm("Are you sure you want to delete this habit? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteHabit({ habitId });
      router.push("/habits");
    } catch (error) {
      console.error("Error deleting habit:", error);
      alert("Failed to delete habit: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/habits")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Habits
            </button>
            
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Habit
                </button>
                <button
                  onClick={handleDeleteHabit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{habit.name}</h1>
                {habit.description && (
                  <p className="text-gray-600 text-lg">{habit.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {habit.category}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                    {habit.targetFrequency}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {habit.pointsPerCompletion} pts
                  </span>
                </div>
              </div>
              
              <HabitVerificationSystem
                habitId={habitId}
                userId={currentUser._id}
                habitName={habit.name}
                habitCategory={habit.category}
                onVerificationComplete={() => {
                  // Refresh the page data
                  window.location.reload();
                }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalCompletions}</div>
                <div className="text-sm text-gray-600">Total Completions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{currentStreak}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{weeklyCompletions}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{monthlyCompletions}</div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
            </div>

            {/* Recent Completions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Completions</h3>
              {habitCompletions && habitCompletions.length > 0 ? (
                <div className="space-y-2">
                  {habitCompletions.slice(0, 10).map((completion) => (
                    <div
                      key={completion._id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        completion.verificationStatus === "verified" 
                          ? "bg-green-50 border border-green-200" 
                          : completion.verificationStatus === "rejected"
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          completion.verificationStatus === "verified" 
                            ? "bg-green-100" 
                            : completion.verificationStatus === "rejected"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}>
                          {completion.verificationStatus === "verified" ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : completion.verificationStatus === "rejected" ? (
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(completion.completedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(completion.completedAt).toLocaleTimeString()}
                            {completion.verificationStatus === "verified" && (
                              <span className="ml-2 text-green-600 font-medium">✓ Verified</span>
                            )}
                            {completion.verificationStatus === "rejected" && (
                              <span className="ml-2 text-red-600 font-medium">✗ Rejected</span>
                            )}
                            {completion.verificationStatus === "pending" && (
                              <span className="ml-2 text-yellow-600 font-medium">⏳ Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        +{completion.pointsEarned || completion.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No completions yet. Start building your streak!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Challenge Participation */}
        {habitChallenges && habitChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Challenge Participation</h2>
            <div className="grid gap-4">
              {habitChallenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{challenge.name}</h3>
                      <p className="text-gray-600 text-sm">{challenge.description}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/challenges/${challenge._id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Challenge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Habit</h2>
            
            <form onSubmit={handleUpdateHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Learning">Learning</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={editForm.targetFrequency}
                  onChange={(e) => setEditForm({ ...editForm, targetFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points per Completion
                </label>
                <input
                  type="number"
                  value={editForm.pointsPerCompletion}
                  onChange={(e) => setEditForm({ ...editForm, pointsPerCompletion: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function calculateCurrentStreak(completions: any[]): number {
  if (completions.length === 0) return 0;
  
  const sortedCompletions = completions
    .sort((a, b) => b.completedAt - a.completedAt)
    .map(c => new Date(c.completedAt).toDateString());
  
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  // Check if completed today or yesterday
  if (sortedCompletions.includes(today) || sortedCompletions.includes(yesterday)) {
    streak = 1;
    
    // Count consecutive days
    for (let i = 1; i < sortedCompletions.length; i++) {
      const currentDate = new Date(sortedCompletions[i - 1]);
      const previousDate = new Date(sortedCompletions[i]);
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  
  return streak;
}

function getWeeklyCompletions(completions: any[]): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return completions.filter(c => c.completedAt >= oneWeekAgo).length;
}

function getMonthlyCompletions(completions: any[]): number {
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return completions.filter(c => c.completedAt >= oneMonthAgo).length;
}
