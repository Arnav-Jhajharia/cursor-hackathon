import { action } from "./_generated/server";
import { v } from "convex/values";

// Import habit generation functions
import { 
  getHabitSuggestions, 
  generateHabitDescription, 
  generateHabitIdeas 
} from "../lib/habitGeneration";

// Action to get habit suggestions using Groq
export const getHabitSuggestionsAction = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const suggestions = await getHabitSuggestions(args.query);
      return {
        success: true,
        data: suggestions,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in getHabitSuggestionsAction:", error);
      return {
        success: false,
        error: "Failed to fetch habit suggestions",
        data: [],
        timestamp: Date.now(),
      };
    }
  },
});

// Action to generate habit description using Exa
export const generateHabitDescriptionAction = action({
  args: {
    habitName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const description = await generateHabitDescription(args.habitName);
      return {
        success: true,
        data: description,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in generateHabitDescriptionAction:", error);
      return {
        success: false,
        error: "Failed to generate habit description",
        data: `A ${args.habitName.toLowerCase()} habit to improve your daily routine.`,
        timestamp: Date.now(),
      };
    }
  },
});

// Action to generate habit ideas using Exa
export const generateHabitIdeasAction = action({
  args: {
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const ideas = await generateHabitIdeas(args.topic);
      return {
        success: true,
        data: ideas,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in generateHabitIdeasAction:", error);
      return {
        success: false,
        error: "Failed to generate habit ideas",
        data: [],
        timestamp: Date.now(),
      };
    }
  },
});
