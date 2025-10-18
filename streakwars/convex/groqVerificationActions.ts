import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Groq from "groq-sdk";

// Initialize Groq only if API key is available
const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  reason: string;
}

// Verify habit with photo upload (Action)
export const verifyHabitWithPhotoAction = action({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    imageUrl: v.string(),
    habitName: v.string(),
    completionId: v.id("habitCompletions"),
  },
  handler: async (ctx, args): Promise<VerificationResult> => {
    // Check if Groq is available
    if (!groq) {
      return {
        verified: false,
        confidence: 0,
        reason: "AI verification service not configured"
      };
    }

    try {
      const prompt = `You are a habit verification AI. Analyze the provided image to verify if it shows the user performing their habit: "${args.habitName}".

INSTRUCTIONS:
- Be lenient in your assessment
- If the image shows ANY evidence of the habit being performed, even partially or indirectly, consider it verified
- Look for visual indications, related equipment, tools, or environment
- Only reject if the image is completely unrelated to the habit

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any other text, explanations, or formatting.

Required JSON format:
{
  "verified": true,
  "confidence": 0.8,
  "reason": "Brief explanation"
}

Respond now with ONLY the JSON object:`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: args.imageUrl,
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq API");
      }

      // Parse JSON response (handle markdown formatting)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      let result: VerificationResult;
      try {
        result = JSON.parse(jsonString) as VerificationResult;
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", jsonString);
        return {
          verified: false,
          confidence: 0,
          reason: "Unable to parse AI response. Please try again."
        };
      }
      
      // Validate response format
      if (typeof result.verified !== 'boolean' || 
          typeof result.confidence !== 'number' || 
          typeof result.reason !== 'string') {
        throw new Error("Invalid response format from Groq API");
      }

      // Clamp confidence to 0-1 range
      result.confidence = Math.max(0, Math.min(1, result.confidence));

      // Update the completion with the verification result
      await ctx.runMutation(api.habitVerification.processVerificationResult, {
        completionId: args.completionId,
        verificationResult: result,
      });

      return result;
    } catch (error) {
      console.error("Error verifying habit with photo:", error);
      const errorResult = {
        verified: false,
        confidence: 0,
        reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      
      // Update the completion with the error result
      await ctx.runMutation(api.habitVerification.processVerificationResult, {
        completionId: args.completionId,
        verificationResult: errorResult,
      });
      
      return errorResult;
    }
  },
});

// Verify habit with reading summary (Action)
export const verifyHabitWithReadingAction = action({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    bookName: v.string(),
    pageRange: v.string(),
    summary: v.string(),
    habitName: v.string(),
    completionId: v.id("habitCompletions"),
  },
  handler: async (ctx, args): Promise<VerificationResult> => {
    // Check if Groq is available
    if (!groq) {
      return {
        verified: false,
        confidence: 0,
        reason: "AI verification service not configured"
      };
    }

    try {
      const prompt = `You are a reading verification AI. Analyze this reading summary to verify if it's legitimate for the habit: "${args.habitName}".

BOOK DETAILS:
- Book: ${args.bookName}
- Pages: ${args.pageRange}
- Summary: ${args.summary}

INSTRUCTIONS:
- Be lenient in your assessment
- Accept if it shows ANY indication of actual reading, even minimal detail
- Look for specific details about book content, understanding of material, or reasonable content for the page range
- Only reject if completely generic, copied, or shows no understanding

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any other text, explanations, or formatting.

Required JSON format:
{
  "verified": true,
  "confidence": 0.8,
  "reason": "Brief explanation"
}

Respond now with ONLY the JSON object:`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq API");
      }

      // Parse JSON response (handle markdown formatting)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      let result: VerificationResult;
      try {
        result = JSON.parse(jsonString) as VerificationResult;
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", jsonString);
        return {
          verified: false,
          confidence: 0,
          reason: "Unable to parse AI response. Please try again."
        };
      }
      
      // Validate response format
      if (typeof result.verified !== 'boolean' || 
          typeof result.confidence !== 'number' || 
          typeof result.reason !== 'string') {
        throw new Error("Invalid response format from Groq API");
      }

      // Clamp confidence to 0-1 range
      result.confidence = Math.max(0, Math.min(1, result.confidence));

      // Update the completion with the verification result
      await ctx.runMutation(api.habitVerification.processVerificationResult, {
        completionId: args.completionId,
        verificationResult: result,
      });

      return result;
    } catch (error) {
      console.error("Error verifying habit with reading:", error);
      const errorResult = {
        verified: false,
        confidence: 0,
        reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      
      // Update the completion with the error result
      await ctx.runMutation(api.habitVerification.processVerificationResult, {
        completionId: args.completionId,
        verificationResult: errorResult,
      });
      
      return errorResult;
    }
  },
});

// Generic verification function that routes to appropriate method (Action)
export const verifyHabitWithGroqAction = action({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    verificationType: v.union(v.literal("photo"), v.literal("reading")),
    inputData: v.object({
      // For photo verification
      imageUrl: v.optional(v.string()),
      // For reading verification
      bookName: v.optional(v.string()),
      pageRange: v.optional(v.string()),
      summary: v.optional(v.string()),
    }),
    habitName: v.string(),
    completionId: v.id("habitCompletions"),
  },
  handler: async (ctx, args): Promise<VerificationResult> => {
    // Check if Groq is available
    if (!groq) {
      return {
        verified: false,
        confidence: 0,
        reason: "AI verification service not configured"
      };
    }

    switch (args.verificationType) {
      case "photo":
        if (!args.inputData.imageUrl) {
          throw new Error("Image URL is required for photo verification");
        }
        return await ctx.runAction(api.groqVerificationActions.verifyHabitWithPhotoAction, {
          habitId: args.habitId,
          userId: args.userId,
          imageUrl: args.inputData.imageUrl,
          habitName: args.habitName,
          completionId: args.completionId,
        });
      
      case "reading":
        if (!args.inputData.bookName || !args.inputData.pageRange || !args.inputData.summary) {
          throw new Error("Book name, page range, and summary are required for reading verification");
        }
        return await ctx.runAction(api.groqVerificationActions.verifyHabitWithReadingAction, {
          habitId: args.habitId,
          userId: args.userId,
          bookName: args.inputData.bookName,
          pageRange: args.inputData.pageRange,
          summary: args.inputData.summary,
          habitName: args.habitName,
          completionId: args.completionId,
        });
      
      default:
        throw new Error(`Unsupported verification type: ${args.verificationType}`);
    }
  },
});
