"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

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
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createHabit = useMutation(api.habits.createHabit);

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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Add New Habit</h2>
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
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                Habit Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., Exercise for 30 minutes"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                placeholder="Optional details about your habit"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="targetFrequency" className="block text-sm font-semibold text-slate-700 mb-2">
                Frequency
              </label>
              <select
                id="targetFrequency"
                name="targetFrequency"
                value={formData.targetFrequency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
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
                <label htmlFor="customFrequency" className="block text-sm font-semibold text-slate-700 mb-2">
                  Custom Frequency
                </label>
                <input
                  type="text"
                  id="customFrequency"
                  name="customFrequency"
                  value={formData.customFrequency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., 3 times per week"
                />
              </div>
            )}

            <div>
              <label htmlFor="pointsPerCompletion" className="block text-sm font-semibold text-slate-700 mb-2">
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-all"
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
    </div>
  );
}

