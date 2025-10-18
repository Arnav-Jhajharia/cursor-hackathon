"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function CleanupPanel() {
  const [isClearing, setIsClearing] = useState(false);
  const clearAllChallenges = useMutation(api.cleanup.clearAllChallenges);
  const clearAllHabits = useMutation(api.cleanup.clearAllHabits);
  const clearEverything = useMutation(api.cleanup.clearEverything);

  const handleClearChallenges = async () => {
    if (!confirm("Are you sure you want to delete ALL challenges? This cannot be undone!")) {
      return;
    }
    
    setIsClearing(true);
    try {
      const result = await clearAllChallenges({});
      alert(`Cleared ${result.deleted.challenges} challenges and related data! 🧹`);
    } catch (error) {
      console.error("Error clearing challenges:", error);
      alert("Error clearing challenges");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearHabits = async () => {
    if (!confirm("Are you sure you want to delete ALL habits? This cannot be undone!")) {
      return;
    }
    
    setIsClearing(true);
    try {
      const result = await clearAllHabits({});
      alert(`Cleared ${result.deleted.habits} habits and completions! 🧹`);
    } catch (error) {
      console.error("Error clearing habits:", error);
      alert("Error clearing habits");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearEverything = async () => {
    if (!confirm("🚨 NUCLEAR OPTION 🚨\n\nThis will delete EVERYTHING:\n- All challenges\n- All habits\n- All friends\n- All data\n\nAre you absolutely sure? This cannot be undone!")) {
      return;
    }
    
    setIsClearing(true);
    try {
      const result = await clearEverything({});
      alert(result.message);
    } catch (error) {
      console.error("Error clearing everything:", error);
      alert("Error clearing everything");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-8 mb-8 shadow-lg">
      <h2 className="text-2xl font-bold text-red-900 mb-4">🧹 CLEANUP PANEL 🧹</h2>
      <p className="text-red-800 mb-6 text-lg">Use these buttons to clear data and start fresh.</p>
      
      <div className="space-y-4">
        <button
          onClick={handleClearChallenges}
          disabled={isClearing}
          className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          {isClearing ? "Clearing..." : "🗑️ Clear All Challenges"}
        </button>
        
        <button
          onClick={handleClearHabits}
          disabled={isClearing}
          className="w-full py-4 bg-yellow-600 text-white rounded-xl font-bold text-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          {isClearing ? "Clearing..." : "🗑️ Clear All Habits"}
        </button>
        
        <button
          onClick={handleClearEverything}
          disabled={isClearing}
          className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg animate-pulse"
        >
          {isClearing ? "Clearing..." : "🚨 NUCLEAR: Clear Everything 🚨"}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-red-600">
        ⚠️ These actions cannot be undone! Use with caution.
      </div>
    </div>
  );
}
