"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface KnowledgeQuest {
  title: string;
  topic: string;
  snippet: string;
  url?: string;
  source?: string;
  generatedAt: string;
}

interface KnowledgeQuestProps {
  userId: Id<"users">;
  onCreateChallenge: (challengeData: { name: string; description: string; targetHabits: string[] }) => void;
}

export default function KnowledgeQuest({ userId, onCreateChallenge }: KnowledgeQuestProps) {
  const [quest, setQuest] = useState<KnowledgeQuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  const generateChallengeAction = useAction(api.exaActions.generateChallengeAction);

  useEffect(() => {
    loadKnowledgeQuest();
  }, []);

  const loadKnowledgeQuest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await generateChallengeAction({});
      
      if (result.success && result.data) {
        setQuest(result.data);
      } else {
        setError(result.error || "Failed to generate knowledge quest");
      }
    } catch (err) {
      setError("Failed to generate knowledge quest");
      console.error("Error generating knowledge quest:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!quest) return;

    try {
      setCreatingChallenge(true);
      
      // Extract key concepts from the snippet to create habit suggestions
      const snippet = quest.snippet.toLowerCase();
      const habitSuggestions = [];
      
      // Look for actionable items in the text
      if (snippet.includes("exercise") || snippet.includes("workout")) {
        habitSuggestions.push("Exercise for 30 minutes");
      }
      if (snippet.includes("meditation") || snippet.includes("mindfulness")) {
        habitSuggestions.push("Meditate for 10 minutes");
      }
      if (snippet.includes("sleep") || snippet.includes("rest")) {
        habitSuggestions.push("Get 8 hours of sleep");
      }
      if (snippet.includes("read") || snippet.includes("learning")) {
        habitSuggestions.push("Read for 20 minutes");
      }
      if (snippet.includes("journal") || snippet.includes("write")) {
        habitSuggestions.push("Write in journal");
      }
      
      // Default habits if none found
      if (habitSuggestions.length === 0) {
        habitSuggestions.push("Apply learnings from research", "Reflect on insights", "Share knowledge with others");
      }

      await onCreateChallenge({
        name: quest.title,
        description: `Based on research: ${quest.snippet}`,
        targetHabits: habitSuggestions.slice(0, 3), // Limit to 3 habits
      });

    } catch (err) {
      console.error("Error creating challenge:", err);
    } finally {
      setCreatingChallenge(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Generating knowledge quest...</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Generate Quest</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadKnowledgeQuest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quest Available</h3>
          <p className="text-gray-600 mb-4">Try generating a new knowledge quest.</p>
          <button
            onClick={loadKnowledgeQuest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate Quest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Quest</h2>
        <p className="text-gray-600">Weekly challenge based on the latest research and insights.</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                🧠 Research-Based
              </span>
              {quest.source && (
                <span className="text-sm text-gray-600">via {quest.source}</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{quest.title}</h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">{quest.snippet}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {quest.url && (
              <a
                href={quest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Read Full Article →
              </a>
            )}
            <span className="text-xs text-gray-500">
              Generated {new Date(quest.generatedAt).toLocaleDateString()}
            </span>
          </div>
          
          <button
            onClick={handleCreateChallenge}
            disabled={creatingChallenge}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {creatingChallenge ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Challenge...
              </div>
            ) : (
              "Create Challenge"
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={loadKnowledgeQuest}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Generate New Quest
        </button>
      </div>
    </div>
  );
}
