"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import HabitList from "../../components/HabitList";
import AddHabitModal from "../../components/AddHabitModal";

export default function HabitsPage() {
  const { user } = useUser();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-habits" | "challenge-habits" | "discover">("my-habits");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get or create user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  // Get public habits for discovery
  const publicHabits = useQuery(api.habits.getPublicHabits, { limit: 20 });
  const challengeHabits = useQuery(api.challenges.getUserChallengeHabits, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const remixHabit = useMutation(api.habits.remixHabit);
  const createSampleHabits = useMutation(api.seedHabits.createSimpleSampleHabits);
  const completeHabit = useMutation(api.habitCompletions.completeHabit);
  const completeChallengeHabit = useMutation(api.challenges.completeChallengeHabit);
  const verifyChallengeHabitCompletion = useMutation(api.challenges.verifyChallengeHabitCompletion);
  const unverifiedCompletions = useQuery(api.challenges.getUnverifiedChallengeCompletions, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const completionsNeedingVerification = useQuery(api.challenges.getCompletionsNeedingVerification, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const categories = [
    { value: "all", label: "All Categories", icon: "🏠" },
    { value: "health", label: "Health", icon: "🏥" },
    { value: "fitness", label: "Fitness", icon: "💪" },
    { value: "mindfulness", label: "Mindfulness", icon: "🧘" },
    { value: "learning", label: "Learning", icon: "📚" },
    { value: "productivity", label: "Productivity", icon: "⚡" },
    { value: "creative", label: "Creative", icon: "🎨" },
    { value: "social", label: "Social", icon: "👥" },
  ];

  // Filter public habits by category
  const filteredPublicHabits = publicHabits?.filter(habit => 
    selectedCategory === "all" || habit.category === selectedCategory
  ) || [];

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

  const handleRemixHabit = async (originalHabitId: Id<"habits">) => {
    if (!currentUser) return;
    try {
      await remixHabit({
        userId: currentUser._id,
        originalHabitId,
      });
      alert("Habit remixed successfully! Check your habits list.");
    } catch (error) {
      console.error("Error remixing habit:", error);
      alert("Error remixing habit");
    }
  };

  const handleCompleteChallengeHabit = async (habitName: string) => {
    if (!currentUser) return;
    try {
      const result = await completeChallengeHabit({
        userId: currentUser._id,
        habitName,
      });
      
      alert(`✅ Completed "${habitName}" for ${result.completionsCreated} challenge(s)! Earned ${result.pointsEarned} points.`);
    } catch (error) {
      console.error("Error completing challenge habit:", error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes("already completed")) {
        alert(`🔥 You've already completed "${habitName}" today!`);
      } else {
        alert("Error completing challenge habit: " + errorMessage);
      }
    }
  };

  const handleVerifyCompletion = async (completionId: string) => {
    if (!currentUser) return;
    try {
      const result = await verifyChallengeHabitCompletion({
        completionId: completionId as any,
        verifierId: currentUser._id,
        verificationNotes: "Verified by peer",
      });
      
      alert(`✅ Verified completion! Earned ${result.bonusPoints} bonus points.`);
    } catch (error) {
      console.error("Error verifying completion:", error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes("already been verified")) {
        alert(`🔥 This completion has already been verified!`);
      } else {
        alert("Error verifying completion: " + errorMessage);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Habits</h1>
          <p className="text-gray-600">Build, track, and discover amazing habits</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("my-habits")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "my-habits"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Habits
          </button>
          <button
            onClick={() => setActiveTab("challenge-habits")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "challenge-habits"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Challenge Habits
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "discover"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Discover
          </button>
        </div>

        {/* My Habits Tab */}
        {activeTab === "my-habits" && (
          <>
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
          </>
        )}

        {/* Challenge Habits Tab */}
        {activeTab === "challenge-habits" && (
          <div className="space-y-6">
            {/* Challenge Habits Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Challenge Habits</h2>
                <p className="text-gray-600 text-sm mt-1">Complete habits from your active challenges</p>
              </div>
            <div className="p-6">
              {!challengeHabits || challengeHabits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">🏆</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Challenge Habits</h3>
                  <p className="text-gray-500 text-sm mb-6">Join some challenges to see their habits here!</p>
                  <button
                    onClick={() => window.location.href = "/challenges"}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Showing {challengeHabits.length} challenge habits
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {challengeHabits.map((habit: any, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">🏆</span>
                              <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              From {habit.challenges.length} challenge{habit.challenges.length > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Points</div>
                            <div className="font-bold text-blue-600">{habit.pointsPerCompletion}</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Related Challenges:</div>
                          <div className="space-y-1">
                            {habit.challenges.slice(0, 2).map((challenge: any) => (
                              <div key={challenge.id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 truncate">{challenge.name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  challenge.isActive 
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {challenge.isActive ? "active" : "inactive"}
                                </span>
                              </div>
                            ))}
                            {habit.challenges.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{habit.challenges.length - 2} more challenges
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                🏆 Challenge Habit
                              </span>
                              <span className="text-xs text-gray-500">{habit.targetFrequency}</span>
                            </div>
                            <button
                              onClick={() => handleCompleteChallengeHabit(habit.name)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Unverified Completions Section */}
            {unverifiedCompletions && unverifiedCompletions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Pending Verification</h2>
                  <p className="text-gray-600 text-sm mt-1">Your completions waiting for verification</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {unverifiedCompletions.map((completion: any) => (
                      <div key={completion._id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{completion.habitName}</div>
                            <div className="text-sm text-gray-600">
                              Challenge: {completion.challenge?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Completed: {new Date(completion.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-yellow-600 font-medium">Pending</div>
                            <div className="text-xs text-gray-500">Awaiting verification</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Completions Needing Verification Section */}
            {completionsNeedingVerification && completionsNeedingVerification.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Verify Others</h2>
                  <p className="text-gray-600 text-sm mt-1">Help verify completions from other participants</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {completionsNeedingVerification.map((completion: any) => (
                      <div key={completion._id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{completion.habitName}</div>
                            <div className="text-sm text-gray-600">
                              By: {completion.user?.name} • Challenge: {completion.challenge?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Completed: {new Date(completion.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleVerifyCompletion(completion._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                          >
                            ✅ Verify
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Discover Public Habits</h2>
              <p className="text-gray-600 text-sm mt-1">Find and remix habits created by the community</p>
              
              {/* Category Filter */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                        selectedCategory === category.value
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6">
              {!publicHabits || publicHabits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No public habits yet</h3>
                  <p className="text-gray-500 text-sm mb-6">Be the first to create a public habit for others to discover!</p>
                  <button
                    onClick={async () => {
                      try {
                        const result = await createSampleHabits({ userId: currentUser._id });
                        console.log("Sample habits result:", result);
                        if (result.message) {
                          alert(result.message);
                        } else {
                          alert("Sample public habits created! Refresh to see them.");
                        }
                      } catch (error) {
                        console.error("Error creating sample habits:", error);
                        alert(`Error creating sample habits: ${error}`);
                      }
                    }}
                    className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
                  >
                    Create Sample Public Habits
                  </button>
                </div>
              ) : filteredPublicHabits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">🏷️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {selectedCategory === "all" ? "" : categories.find(c => c.value === selectedCategory)?.label} habits found
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {selectedCategory === "all" 
                      ? "Try creating some public habits or check back later!"
                      : `No public habits in the ${categories.find(c => c.value === selectedCategory)?.label} category yet.`
                    }
                  </p>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    View All Categories
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results count */}
                  <div className="text-sm text-gray-600">
                    Showing {filteredPublicHabits.length} {selectedCategory === "all" ? "public habits" : `${categories.find(c => c.value === selectedCategory)?.label} habits`}
                  </div>
                  
                  {/* Habits grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPublicHabits.map((habit: any) => (
                      <div key={habit._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">
                                {categories.find(c => c.value === habit.category)?.icon || "📝"}
                              </span>
                              <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                            </div>
                            {habit.description && (
                              <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Points</div>
                            <div className="font-bold text-gray-800">{habit.pointsPerCompletion}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {habit.user?.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{habit.user?.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {habit.remixCount || 0} remixes
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                {categories.find(c => c.value === habit.category)?.icon} {categories.find(c => c.value === habit.category)?.label}
                              </span>
                              <span className="text-xs text-gray-500">{habit.targetFrequency}</span>
                            </div>
                            <button
                              onClick={() => handleRemixHabit(habit._id)}
                              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg font-semibold text-xs hover:bg-gray-700 transition-colors"
                            >
                              Remix
                            </button>
                          </div>
                          
                          {habit.integrations && habit.integrations.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {habit.integrations.slice(0, 3).map((integration: string) => (
                                <span
                                  key={integration}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                                >
                                  {integration.replace('_', ' ')}
                                </span>
                              ))}
                              {habit.integrations.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{habit.integrations.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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