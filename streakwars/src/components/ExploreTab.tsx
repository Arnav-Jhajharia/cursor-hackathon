"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface HabitIdea {
  title: string;
  summary: string;
  url?: string;
  source?: string;
  category: string;
}

interface ExploreTabProps {
  userId: Id<"users">;
  onAddHabit: (habitData: { name: string; description: string; category: string }) => void;
}

export default function ExploreTab({ userId, onAddHabit }: ExploreTabProps) {
  const [habitIdeas, setHabitIdeas] = useState<HabitIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingHabit, setAddingHabit] = useState<string | null>(null);

  const getHabitIdeasAction = useAction(api.habitGenerationActions.generateHabitIdeasAction);

  useEffect(() => {
    loadHabitIdeas();
  }, []);

  const loadHabitIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getHabitIdeasAction({});
      
      if (result.success) {
        setHabitIdeas(result.data);
      } else {
        setError(result.error || "Failed to load habit ideas");
      }
    } catch (err) {
      setError("Failed to load habit ideas");
      console.error("Error loading habit ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (idea: HabitIdea) => {
    try {
      setAddingHabit(idea.title);
      
      // Extract habit name from title (remove common prefixes)
      let habitName = idea.title;
      if (habitName.toLowerCase().startsWith("how to ")) {
        habitName = habitName.substring(7);
      }
      if (habitName.toLowerCase().startsWith("the ")) {
        habitName = habitName.substring(4);
      }
      
      // Capitalize first letter
      habitName = habitName.charAt(0).toUpperCase() + habitName.slice(1);
      
      // Limit length
      if (habitName.length > 50) {
        habitName = habitName.substring(0, 47) + "...";
      }

      await onAddHabit({
        name: habitName,
        description: idea.summary,
        category: idea.category,
      });

      // Remove the idea from the list after adding
      setHabitIdeas(prev => prev.filter(item => item.title !== idea.title));
    } catch (err) {
      console.error("Error adding habit:", err);
    } finally {
      setAddingHabit(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Energy: "bg-yellow-100 text-yellow-800",
      Productivity: "bg-blue-100 text-blue-800",
      Wellness: "bg-green-100 text-green-800",
      Mindfulness: "bg-purple-100 text-purple-800",
      General: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis = {
      Energy: "⚡",
      Productivity: "🚀",
      Wellness: "🌱",
      Mindfulness: "🧘",
      General: "✨",
    };
    return emojis[category as keyof typeof emojis] || emojis.General;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Discovering habit ideas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Ideas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadHabitIdeas}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (habitIdeas.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ideas Found</h3>
          <p className="text-gray-600 mb-4">Try refreshing to discover new habit ideas.</p>
          <button
            onClick={loadHabitIdeas}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Discover New Habits</h2>
          <button
            onClick={loadHabitIdeas}
            disabled={loading}
            className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating..." : "✨ Auto-Generate"}
          </button>
        </div>
        <p className="text-gray-600">Explore habit ideas powered by the latest research and insights.</p>
      </div>

      <div className="space-y-4">
        {habitIdeas.map((idea, index) => (
          <div
            key={`${idea.title}-${index}`}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(idea.category)}`}>
                    {getCategoryEmoji(idea.category)} {idea.category}
                  </span>
                  {idea.source && (
                    <span className="text-xs text-gray-500">via {idea.source}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{idea.summary}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {idea.url && (
                  <a
                    href={idea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View Source →
                  </a>
                )}
              </div>
              
              <button
                onClick={() => handleAddHabit(idea)}
                disabled={addingHabit === idea.title}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {addingHabit === idea.title ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </div>
                ) : (
                  "Add to My Habits"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={loadHabitIdeas}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Discover More Ideas
        </button>
      </div>
    </div>
  );
}
