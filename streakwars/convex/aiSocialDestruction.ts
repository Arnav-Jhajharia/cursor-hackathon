import { action } from "./_generated/server";
import { v } from "convex/values";

// Exa.ai integration for social media destruction
export const generateSocialDestruction = action({
  args: {
    loserName: v.string(),
    winnerName: v.string(),
    challengeName: v.string(),
    warStakes: v.number(),
    humiliationMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Search for embarrassing content about the loser
    const searchQuery = `${args.loserName} embarrassing failure habit tracking`;
    
    try {
      const searchResponse = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.EXA_API_KEY || "",
        },
        body: JSON.stringify({
          query: searchQuery,
          numResults: 3,
          type: "search",
          useAutoprompt: true,
        }),
      });

      const searchData = await searchResponse.json();
      const embarrassingContent = searchData.results || [];

      // Generate social media destruction posts
      const socialPosts = await generateSocialMediaPosts(args, embarrassingContent);
      
      return {
        embarrassingContent,
        socialPosts,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error with Exa.ai search:", error);
      // Fallback social media posts
      const fallbackPosts = generateFallbackSocialPosts(args);
      return {
        embarrassingContent: [],
        socialPosts: fallbackPosts,
        timestamp: Date.now(),
      };
    }
  },
});

// Generate devastating social media posts
async function generateSocialMediaPosts(args: any, embarrassingContent: any[]) {
  const postPrompts = [
    {
      platform: "Twitter",
      prompt: `Generate a devastating Twitter post about someone's humiliating defeat in a habit tracking app war.

Context:
- Loser: ${args.loserName}
- Winner: ${args.winnerName}
- Challenge: ${args.challengeName}
- Stakes: ${args.warStakes} rewards
- Humiliation: ${args.humiliationMessage}

Create a brutal Twitter post that:
1. Is 280 characters or less
2. Is absolutely devastating
3. Uses hashtags
4. Is shareable and viral
5. Embarrasses the loser publicly

Make it UNHINGED and memorable.`
    },
    {
      platform: "LinkedIn",
      prompt: `Generate a professional but devastating LinkedIn post about someone's failure in a habit tracking app.

Context:
- Loser: ${args.loserName}
- Winner: ${args.winnerName}
- Challenge: ${args.challengeName}

Create a LinkedIn post that:
1. Sounds professional but is actually humiliating
2. References their "lack of commitment" and "poor performance"
3. Is subtle but devastating
4. Makes them look unprofessional
5. Is 1-2 sentences max

Make it sound like a professional critique but be absolutely brutal.`
    },
    {
      platform: "Instagram",
      prompt: `Generate a devastating Instagram story/caption about someone's humiliating defeat.

Context:
- Loser: ${args.loserName}
- Winner: ${args.winnerName}
- Challenge: ${args.challengeName}
- Humiliation: ${args.humiliationMessage}

Create an Instagram post that:
1. Is visually dramatic
2. Uses emojis and dramatic language
3. Is shareable and embarrassing
4. References their failure
5. Is 1-2 sentences max

Make it absolutely devastating and shareable.`
    }
  ];

  const posts = [];
  
  for (const postPrompt of postPrompts) {
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
              content: `You are an AI that creates devastating social media posts for app wars. Be absolutely brutal, viral, and embarrassing. Make it shareable and memorable.`
            },
            {
              role: "user",
              content: postPrompt.prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      console.log(`Groq ${postPrompt.platform} API Response:`, data);
      
      const post = data.choices?.[0]?.message?.content || 
        data.choices?.[0]?.text ||
        `${postPrompt.platform}: "Just witnessed ${args.loserName} get absolutely DESTROYED by ${args.winnerName} in ${args.challengeName}! 💀🔥"`;

      posts.push({
        platform: postPrompt.platform,
        content: post,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Error generating ${postPrompt.platform} post:`, error);
      posts.push({
        platform: postPrompt.platform,
        content: `${postPrompt.platform}: "Just witnessed ${args.loserName} get absolutely DESTROYED by ${args.winnerName} in ${args.challengeName}! 💀🔥"`,
        timestamp: Date.now(),
      });
    }
  }

  return posts;
}

// Fallback social media posts if Exa.ai fails
function generateFallbackSocialPosts(args: any) {
  return [
    {
      platform: "Twitter",
      content: `Just witnessed ${args.loserName} get absolutely DESTROYED by ${args.winnerName} in ${args.challengeName}! ${args.humiliationMessage} #HabitWars #Humiliation #Defeat 💀🔥`,
      timestamp: Date.now(),
    },
    {
      platform: "LinkedIn",
      content: `Professional observation: ${args.loserName} demonstrated a complete lack of commitment and consistency in ${args.challengeName}. Their performance was... disappointing.`,
      timestamp: Date.now(),
    },
    {
      platform: "Instagram",
      content: `💀 ${args.loserName} just got CRUSHED by ${args.winnerName} in ${args.challengeName}! ${args.humiliationMessage} 🔥 #HabitWars #Defeat`,
      timestamp: Date.now(),
    }
  ];
}

// Generate AI-powered memes about the defeat
export const generateDefeatMeme = action({
  args: {
    loserName: v.string(),
    winnerName: v.string(),
    challengeName: v.string(),
    humiliationMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const memePrompt = `
Generate a devastating meme caption about someone's humiliating defeat in a habit tracking app war.

Context:
- Loser: ${args.loserName}
- Winner: ${args.winnerName}
- Challenge: ${args.challengeName}
- Humiliation: ${args.humiliationMessage}

Create a meme caption that:
1. Is absolutely brutal and funny
2. References popular meme formats
3. Is shareable and viral
4. Embarrasses the loser
5. Is 1-2 sentences max

Make it UNHINGED and memorable. Use meme language and references.
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
              content: "You are an AI that creates devastating meme captions for app wars. Be absolutely brutal, funny, and viral. Use meme language and references."
            },
            {
              role: "user",
              content: memePrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      console.log("Groq Meme API Response:", data);
      
      const memeCaption = data.choices?.[0]?.message?.content || 
        data.choices?.[0]?.text ||
        `When ${args.loserName} tries to win a habit war but gets absolutely DESTROYED by ${args.winnerName} 💀🔥`;

      return {
        memeCaption,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error generating meme:", error);
      return {
        memeCaption: `When ${args.loserName} tries to win a habit war but gets absolutely DESTROYED by ${args.winnerName} 💀🔥`,
        timestamp: Date.now(),
      };
    }
  },
});
