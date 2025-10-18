import { Exa } from "exa-js";

// Initialize Exa client - will be done per function call
function getExaClient(): Exa {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }
  return new Exa(apiKey);
}

// Cache interface for storing results
interface CachedResult {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Simple in-memory cache (in production, use Redis or database)
const cache = new Map<string, CachedResult>();

// Cache duration: 7 days for habit ideas, 1 week for challenges
const CACHE_DURATION = {
  HABIT_IDEAS: 7 * 24 * 60 * 60 * 1000, // 7 days
  CHALLENGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  AUTOCOMPLETE: 24 * 60 * 60 * 1000, // 1 day
};

// Helper function to get cached data
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

// Helper function to set cached data
function setCachedData(key: string, data: any, duration: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + duration,
  });
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 1. Habit Discovery Feed
export async function getHabitIdeas(): Promise<any[]> {
  const cacheKey = "habit-ideas";
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const queries = [
      "unique micro habits for energy",
      "psychology-backed daily habits",
      "interesting 5-minute rituals successful people do",
      "morning routine habits productivity",
      "evening wind-down habits wellness"
    ];

    const results = await Promise.all(
      queries.map(async (query) => {
        try {
          const exa = getExaClient();
          const response = await exa.searchAndContents(query, {
            numResults: 2,
            useAutoprompt: true,
            text: true,
            highlights: true,
          });
          return response.results.map((result: any) => ({
            title: result.title,
            summary: result.highlights?.[0] || result.text?.substring(0, 150) + "...",
            url: result.url,
            source: result.url ? new URL(result.url).hostname : "Unknown",
            category: getHabitCategory(query),
          }));
        } catch (error) {
          console.error(`Error fetching habit ideas for query "${query}":`, error);
          return [];
        }
      })
    );

    const allResults = results.flat().slice(0, 10); // Top 10 results
    
    // Cache the results
    setCachedData(cacheKey, allResults, CACHE_DURATION.HABIT_IDEAS);
    
    return allResults;
  } catch (error) {
    console.error("Error fetching habit ideas:", error);
    return [];
  }
}

// 2. Challenge Generation
export async function generateChallenge(): Promise<any | null> {
  const cacheKey = "weekly-challenge";
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const topics = [
      "latest research on motivation",
      "neuroscience of habit formation",
      "behavioral psychology studies",
      "productivity research findings",
      "wellness and mindfulness studies"
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const exa = getExaClient();
    const response = await exa.searchAndContents(randomTopic, {
      numResults: 1,
      useAutoprompt: true,
      text: true,
      highlights: true,
    });

    if (response.results.length > 0) {
      const result = response.results[0];
      const challenge = {
        title: `Knowledge Quest: ${result.title}`,
        topic: randomTopic,
        snippet: result.highlights?.[0] || result.text?.substring(0, 300) + "...",
        url: result.url,
        source: result.url ? new URL(result.url).hostname : "Unknown",
        generatedAt: new Date().toISOString(),
      };

      // Cache the challenge
      setCachedData(cacheKey, challenge, CACHE_DURATION.CHALLENGES);
      
      return challenge;
    }

    return null;
  } catch (error) {
    console.error("Error generating challenge:", error);
    return null;
  }
}

// 3. Smart Autocomplete
export async function getAutocompleteSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return getDefaultSuggestions();
  }

  const cacheKey = `autocomplete-${query.toLowerCase()}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const searchQuery = `${query} daily habits routine`;
    
    const exa = getExaClient();
    const response = await exa.searchAndContents(searchQuery, {
      numResults: 3,
      useAutoprompt: true,
      text: true,
    });

    const suggestions = response.results.map((result: any) => {
      // Extract habit-like phrases from the content
      const text = result.text || "";
      const sentences = text.split(/[.!?]+/);
      
      // Find sentences that contain habit-like language
      const habitSentences = sentences.filter((sentence: string) => 
        sentence.toLowerCase().includes(query.toLowerCase()) &&
        (sentence.includes("daily") || sentence.includes("every day") || 
         sentence.includes("morning") || sentence.includes("evening") ||
         sentence.includes("routine") || sentence.includes("habit"))
      );

      if (habitSentences.length > 0) {
        return habitSentences[0].trim().substring(0, 50) + "...";
      }

      // Fallback to title
      return result.title;
    });

    // Cache the suggestions
    setCachedData(cacheKey, suggestions, CACHE_DURATION.AUTOCOMPLETE);
    
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return getDefaultSuggestions();
  }
}

// Helper function to categorize habits based on query
function getHabitCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("energy") || lowerQuery.includes("morning")) {
    return "Energy";
  } else if (lowerQuery.includes("productivity") || lowerQuery.includes("focus")) {
    return "Productivity";
  } else if (lowerQuery.includes("wellness") || lowerQuery.includes("evening")) {
    return "Wellness";
  } else if (lowerQuery.includes("psychology") || lowerQuery.includes("mindfulness")) {
    return "Mindfulness";
  } else {
    return "General";
  }
}

// Default suggestions when no query or API fails
function getDefaultSuggestions(): string[] {
  const suggestions = [
    "run 2km every morning 🌅",
    "read 10 pages before bed 📖",
    "drink 8 glasses of water 💧",
    "meditate for 5 minutes 🧘",
    "write 3 things you're grateful for ✍️",
    "take a 10-minute walk 🚶",
    "practice deep breathing 🌬️",
    "stretch for 5 minutes 🤸"
  ];
  
  // Return 3 random suggestions
  return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Export cache management functions for debugging
export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
