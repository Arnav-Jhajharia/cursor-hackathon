import { action } from "./_generated/server";
import { v } from "convex/values";

// AI-powered humiliation system using Groq
export const generateHumiliationMessage = action({
  args: {
    winnerName: v.string(),
    loserName: v.string(),
    warStakes: v.number(),
    winnerPoints: v.number(),
    loserPoints: v.number(),
    challengeName: v.string(),
    warDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const humiliationPrompt = `
You are an AI that creates absolutely devastating, unhinged humiliation messages for habit tracking app wars. 
The context: ${args.winnerName} just DESTROYED ${args.loserName} in a habit war.

War Details:
- Challenge: ${args.challengeName}
- Stakes: ${args.warStakes} rewards
- Winner Points: ${args.winnerPoints}
- Loser Points: ${args.loserPoints}
- War Duration: ${args.warDuration} days

Create a HUMILIATING message that:
1. Is absolutely devastating and psychologically damaging
2. References their specific failure and weakness
3. Is personal and cutting
4. Makes them feel like a complete failure
5. Is memorable and will haunt them
6. Uses emojis and dramatic language
7. Is 2-3 sentences max but absolutely brutal

Make it UNHINGED and unforgettable. This is for a habit tracking app war system.
`;

    try {
      if (!process.env.GROQ_API_KEY) {
        console.log("No Groq API key found, using fallback message");
        return {
          message: `${args.loserName}, you are a pathetic failure. ${args.winnerName} just CRUSHED you in ${args.challengeName}. Your weakness is legendary. 💀🔥`,
          timestamp: Date.now(),
        };
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are an AI that creates devastating humiliation messages for app wars. Be absolutely brutal, personal, and psychologically damaging. Make it memorable and haunting."
            },
            {
              role: "user",
              content: humiliationPrompt
            }
          ],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        console.error(`Groq API error: ${response.status} ${response.statusText}`);
        return {
          message: `${args.loserName}, you are a pathetic failure. ${args.winnerName} just CRUSHED you in ${args.challengeName}. Your weakness is legendary. 💀🔥`,
          timestamp: Date.now(),
        };
      }

      const data = await response.json();
      console.log("Groq API Response:", data);
      
      const humiliationMessage = data.choices?.[0]?.message?.content || 
        data.choices?.[0]?.text ||
        `${args.loserName}, you are a complete failure. ${args.winnerName} just DESTROYED you in ${args.challengeName}. You should be ashamed of yourself. 💀`;

      return {
        message: humiliationMessage,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating humiliation message:", error);
      return {
        message: `${args.loserName}, you are a pathetic failure. ${args.winnerName} just CRUSHED you in ${args.challengeName}. Your weakness is legendary. 💀🔥`,
        timestamp: Date.now(),
      };
    }
  },
});

// Generate AI taunts during active wars
export const generateWarTaunt = action({
  args: {
    challengerName: v.string(),
    defenderName: v.string(),
    challengerPoints: v.number(),
    defenderPoints: v.number(),
    challengeName: v.string(),
    isChallenger: v.boolean(),
  },
  handler: async (ctx, args) => {
    const tauntPrompt = `
You are generating a real-time taunt for an active habit war.

Context:
- ${args.challengerName} vs ${args.defenderName}
- Challenge: ${args.challengeName}
- Current Score: ${args.challengerName} (${args.challengerPoints}) vs ${args.defenderName} (${args.defenderPoints})
- This taunt is from: ${args.isChallenger ? args.challengerName : args.defenderName}

Generate a DEVASTATING taunt that:
1. Is psychologically damaging
2. References their current performance
3. Is personal and cutting
4. Uses dramatic language and emojis
5. Is 1-2 sentences max
6. Is absolutely brutal

Make it UNHINGED and memorable.
`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are an AI that creates devastating real-time taunts for app wars. Be absolutely brutal, personal, and psychologically damaging."
            },
            {
              role: "user",
              content: tauntPrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      console.log("Groq Taunt API Response:", data);
      
      const taunt = data.choices?.[0]?.message?.content || 
        data.choices?.[0]?.text ||
        `${args.isChallenger ? args.challengerName : args.defenderName}: "You're getting DESTROYED! Give up already! 💀🔥"`;

      return {
        taunt,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating taunt:", error);
      return {
        taunt: `${args.isChallenger ? args.challengerName : args.defenderName}: "You're pathetic! I'm crushing you! 💀🔥"`,
        timestamp: Date.now(),
      };
    }
  },
});

// Generate AI voice humiliation using ElevenLabs
export const generateVoiceHumiliation = action({
  args: {
    humiliationText: v.string(),
    voiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const voiceId = args.voiceId || "pNInz6obpgDQGcFmaJgB"; // Default evil voice
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: args.humiliationText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.8, // More dramatic
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      return {
        audioData: audioBase64,
        voiceId,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating voice humiliation:", error);
      return {
        audioData: null,
        error: "Failed to generate voice humiliation",
        timestamp: Date.now(),
      };
    }
  },
});
