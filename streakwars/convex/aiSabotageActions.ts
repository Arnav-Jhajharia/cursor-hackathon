import { action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Initialize Groq only if API key is available
const groq = process.env.GROQ_API_KEY ? new (require("groq-sdk")).Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

interface AISabotageResult {
  success: boolean;
  result?: string;
  error?: string;
  sabotagePower?: number;
}

// Generate AI poem for sabotage challenge
export const generateAIPoem = action({
  args: {
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      const topic = args.topic || "coding";
      const prompt = `Write a 4-line poem about ${topic}. Make it creative and engaging.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.8,
        max_tokens: 150,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      return {
        success: true,
        result: result.trim(),
        sabotagePower: 2,
      };
    } catch (error) {
      console.error("Error generating AI poem:", error);
      return {
        success: false,
        error: "Failed to generate poem"
      };
    }
  },
});

// Generate programming joke
export const generateProgrammingJoke = action({
  args: {},
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      const prompt = "Tell me a funny programming joke. Keep it clean and make it about coding, bugs, or developers.";

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.9,
        max_tokens: 100,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      return {
        success: true,
        result: result.trim(),
        sabotagePower: 1,
      };
    } catch (error) {
      console.error("Error generating programming joke:", error);
      return {
        success: false,
        error: "Failed to generate joke"
      };
    }
  },
});

// Generate tech haiku
export const generateTechHaiku = action({
  args: {},
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      const prompt = "Write a haiku (5-7-5 syllables) about technology, coding, or programming. Make it creative and tech-focused.";

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.7,
        max_tokens: 50,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      return {
        success: true,
        result: result.trim(),
        sabotagePower: 2,
      };
    } catch (error) {
      console.error("Error generating tech haiku:", error);
      return {
        success: false,
        error: "Failed to generate haiku"
      };
    }
  },
});

// Get AI life advice
export const getAILifeAdvice = action({
  args: {},
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      const prompt = "Give me one piece of practical life advice in 1-2 sentences. Make it helpful and actionable.";

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.6,
        max_tokens: 80,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      return {
        success: true,
        result: result.trim(),
        sabotagePower: 1,
      };
    } catch (error) {
      console.error("Error getting AI life advice:", error);
      return {
        success: false,
        error: "Failed to get advice"
      };
    }
  },
});

// Generate sci-fi story starter
export const generateSciFiStory = action({
  args: {},
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      const prompt = "Write the first 2 sentences of a sci-fi story. Make it intriguing and set up an interesting premise.";

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.8,
        max_tokens: 100,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      return {
        success: true,
        result: result.trim(),
        sabotagePower: 3,
      };
    } catch (error) {
      console.error("Error generating sci-fi story:", error);
      return {
        success: false,
        error: "Failed to generate story"
      };
    }
  },
});

// Verify AI challenge completion - ROBUST VERIFICATION
export const verifyAIChallenge = action({
  args: {
    challengeId: v.string(),
    userResponse: v.string(),
    expectedType: v.string(), // "poem", "joke", "haiku", "advice", "story"
  },
  handler: async (ctx, args): Promise<AISabotageResult> => {
    if (!groq) {
      return {
        success: false,
        error: "AI service not configured"
      };
    }

    try {
      let verificationPrompt = "";
      
      switch (args.expectedType) {
        case "poem":
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for a coding poem challenge. 
          Requirements: Must be a 4-line poem about coding/programming.
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Is it actually a poem? (4 lines, poetic structure)
          - Is it about coding/programming?
          - Is it creative and original?
          - Does it meet the challenge requirements?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
          break;
        case "joke":
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for a programming joke challenge.
          Requirements: Must be a funny joke about programming/coding.
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Is it actually a joke? (has setup and punchline)
          - Is it about programming/coding?
          - Is it funny and original?
          - Does it meet the challenge requirements?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
          break;
        case "haiku":
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for a tech haiku challenge.
          Requirements: Must be a proper haiku (5-7-5 syllables) about technology.
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Is it a proper haiku? (5-7-5 syllable structure)
          - Is it about technology?
          - Is it creative and meaningful?
          - Does it meet the challenge requirements?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
          break;
        case "advice":
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for a life advice challenge.
          Requirements: Must be practical, helpful life advice.
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Is it actually advice? (actionable guidance)
          - Is it practical and helpful?
          - Is it original and thoughtful?
          - Does it meet the challenge requirements?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
          break;
        case "story":
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for a sci-fi story starter challenge.
          Requirements: Must be the beginning of a sci-fi story (2 sentences).
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Is it a story beginning? (narrative setup)
          - Does it have sci-fi elements?
          - Is it creative and engaging?
          - Does it meet the challenge requirements?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
          break;
        default:
          verificationPrompt = `ROBUST VERIFICATION: Analyze this response for quality and relevance.
          Response: "${args.userResponse}"
          
          Rate 1-10 for:
          - Does it meet the challenge requirements?
          - Is it creative and original?
          - Is it well-written and thoughtful?
          
          CRITICAL: Only accept if score is 7+ and meets ALL requirements. Be strict!
          Respond with: "SCORE: X/10 - [brief reason]"`;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: verificationPrompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1, // Lower temperature for more consistent verification
        max_tokens: 100,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from Groq API");
      }

      // Extract rating from response - look for "SCORE: X/10" pattern
      const scoreMatch = result.match(/SCORE:\s*(\d+)\/10/i);
      const rating = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      
      // STRICT VERIFICATION: Only accept if score is 7 or higher
      const isSuccess = rating >= 7;
      const sabotagePower = isSuccess ? Math.min(15, rating * 1.5) : 0; // Higher rewards for better scores

      return {
        success: isSuccess,
        result: `AI Verification: ${rating}/10 - ${result}`,
        sabotagePower: sabotagePower,
      };
    } catch (error) {
      console.error("Error verifying AI challenge:", error);
      return {
        success: false,
        error: "Failed to verify challenge"
      };
    }
  },
});
