import { action } from "./_generated/server";
import { v } from "convex/values";

// Import Exa functions (these will run server-side)
import { 
  getHabitIdeas, 
  generateChallenge, 
  getAutocompleteSuggestions 
} from "../lib/exa";

// Action to get habit ideas for the discovery feed
export const getHabitIdeasAction = action({
  args: {},
  handler: async (ctx) => {
    try {
      const ideas = await getHabitIdeas();
      return {
        success: true,
        data: ideas,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in getHabitIdeasAction:", error);
      return {
        success: false,
        error: "Failed to fetch habit ideas",
        data: [],
        timestamp: Date.now(),
      };
    }
  },
});

// Action to generate a weekly challenge
export const generateChallengeAction = action({
  args: {},
  handler: async (ctx) => {
    try {
      const challenge = await generateChallenge();
      return {
        success: true,
        data: challenge,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in generateChallengeAction:", error);
      return {
        success: false,
        error: "Failed to generate challenge",
        data: null,
        timestamp: Date.now(),
      };
    }
  },
});

// Action to get autocomplete suggestions
export const getAutocompleteSuggestionsAction = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const suggestions = await getAutocompleteSuggestions(args.query);
      return {
        success: true,
        data: suggestions,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error in getAutocompleteSuggestionsAction:", error);
      return {
        success: false,
        error: "Failed to fetch suggestions",
        data: [],
        timestamp: Date.now(),
      };
    }
  },
});
