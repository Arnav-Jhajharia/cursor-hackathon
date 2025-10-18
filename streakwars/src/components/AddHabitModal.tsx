"use client";

import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import SmartAutocomplete from "./SmartAutocomplete";

interface AddHabitModalProps {
  userId: Id<"users">;
  onClose: () => void;
}

export default function AddHabitModal({ userId, onClose }: AddHabitModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "health",
    targetFrequency: "daily",
    customFrequency: "",
    pointsPerCompletion: 10,
    isPublic: false,
    integrations: [] as string[],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingHabits, setIsGeneratingHabits] = useState(false);
  const [generatedHabits, setGeneratedHabits] = useState<any[]>([]);
  const [showGeneratedHabits, setShowGeneratedHabits] = useState(false);
  
  const createHabit = useMutation(api.habits.createHabit);
  const generateHabitDescriptionAction = useAction(api.habitGenerationActions.generateHabitDescriptionAction);
  const generateHabitIdeasAction = useAction(api.habitGenerationActions.generateHabitIdeasAction);

  const categories = [
    "health",
    "productivity",
    "learning",
    "fitness",
    "mindfulness",
    "social",
    "creative",
    "other",
  ];

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "custom", label: "Custom" },
  ];

  const availableIntegrations = [
    { value: "apple_health", label: "Apple Health" },
    { value: "google_fit", label: "Google Fit" },
    { value: "strava", label: "Strava" },
    { value: "myfitnesspal", label: "MyFitnessPal" },
    { value: "fitbit", label: "Fitbit" },
    { value: "headspace", label: "Headspace" },
    { value: "calm", label: "Calm" },
    { value: "duolingo", label: "Duolingo" },
    { value: "babbel", label: "Babbel" },
    { value: "leetcode_api", label: "LeetCode API" },
    { value: "github", label: "GitHub" },
    { value: "goodreads", label: "Goodreads" },
    { value: "kindle", label: "Kindle" },
    { value: "notion", label: "Notion" },
    { value: "obsidian", label: "Obsidian" },
    { value: "spotify", label: "Spotify" },
    { value: "youtube", label: "YouTube" },
    { value: "yousician", label: "Yousician" },
    { value: "screen_time", label: "Screen Time" },
    { value: "rescuetime", label: "RescueTime" },
    { value: "water_reminder", label: "Water Reminder" },
    { value: "yoga_app", label: "Yoga App" },
    { value: "vscode", label: "VS Code" },
    { value: "llm", label: "AI Assistant" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createHabit({
        userId,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        targetFrequency: formData.targetFrequency,
        customFrequency: formData.targetFrequency === "custom" ? formData.customFrequency : undefined,
        pointsPerCompletion: formData.pointsPerCompletion,
        isPublic: formData.isPublic,
        integrations: formData.integrations,
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating habit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "pointsPerCompletion" ? parseInt(value) || 0 : value,
    }));
  };

  // Auto-generate description when name field loses focus
  const handleNameBlur = async () => {
    if (formData.name.trim() && !formData.description.trim()) {
      setIsGeneratingDescription(true);
      try {
        const result = await generateHabitDescriptionAction({ habitName: formData.name });
        if (result.success) {
          setFormData(prev => ({ ...prev, description: result.data }));
        }
      } catch (error) {
        console.error("Error generating description:", error);
      } finally {
        setIsGeneratingDescription(false);
      }
    }
  };

  // Generate habit ideas
  const handleGenerateHabits = async () => {
    setIsGeneratingHabits(true);
    try {
      const result = await generateHabitIdeasAction({});
      if (result.success && result.data.length > 0) {
        setGeneratedHabits(result.data);
        setShowGeneratedHabits(true);
      }
    } catch (error) {
      console.error("Error generating habits:", error);
    } finally {
      setIsGeneratingHabits(false);
    }
  };

  // Add generated habit to form
  const handleAddGeneratedHabit = (habit: any) => {
    setFormData(prev => ({
      ...prev,
      name: habit.title,
      description: habit.summary,
    }));
    setShowGeneratedHabits(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Add New Habit</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Generate Habits Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-black">Create New Habit</h3>
              <button
                type="button"
                onClick={handleGenerateHabits}
                disabled={isGeneratingHabits}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
              >
                {isGeneratingHabits ? "Generating..." : "✨ Generate Ideas"}
              </button>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                Habit Name
              </label>
              <SmartAutocomplete
                value={formData.name}
                onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                onBlur={handleNameBlur}
                placeholder="e.g., Exercise for 30 minutes"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-black mb-2">
                Description
                {isGeneratingDescription && (
                  <span className="ml-2 text-xs text-indigo-600">Auto-generating...</span>
                )}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-black"
                placeholder="Optional details about your habit"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-black mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-black"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="targetFrequency" className="block text-sm font-semibold text-black mb-2">
                Frequency
              </label>
              <select
                id="targetFrequency"
                name="targetFrequency"
                value={formData.targetFrequency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-black"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.targetFrequency === "custom" && (
              <div>
                <label htmlFor="customFrequency" className="block text-sm font-semibold text-black mb-2">
                  Custom Frequency
                </label>
                <input
                  type="text"
                  id="customFrequency"
                  name="customFrequency"
                  value={formData.customFrequency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
                  placeholder="e.g., 3 times per week"
                />
              </div>
            )}

            <div>
              <label htmlFor="pointsPerCompletion" className="block text-sm font-semibold text-black mb-2">
                Points per Completion
              </label>
              <input
                type="number"
                id="pointsPerCompletion"
                name="pointsPerCompletion"
                value={formData.pointsPerCompletion}
                onChange={handleChange}
                required
                min="1"
                max="100"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Integrations (optional)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-3">
                {availableIntegrations.map((integration) => (
                  <label key={integration.value} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.integrations.includes(integration.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            integrations: [...formData.integrations, integration.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            integrations: formData.integrations.filter(i => i !== integration.value),
                          });
                        }
                      }}
                      className="w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-black">{integration.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-black">
                Make this habit public (others can discover and remix it)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-black font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Creating..." : "Create Habit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Generated Habits Modal */}
      {showGeneratedHabits && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-black">Generated Habit Ideas</h3>
                <button
                  onClick={() => setShowGeneratedHabits(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {generatedHabits.map((habit, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    onClick={() => handleAddGeneratedHabit(habit)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-black mb-1">{habit.title}</h4>
                        <p className="text-sm text-black mb-2">{habit.summary}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {habit.category}
                          </span>
                          <span className="text-xs text-gray-400">{habit.source}</span>
                        </div>
                      </div>
                      <button className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors">
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowGeneratedHabits(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black font-medium hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateHabits}
                  disabled={isGeneratingHabits}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {isGeneratingHabits ? "Generating..." : "Generate More"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

