import Groq from "groq-sdk";

// Initialize Groq client
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }
  return new Groq({ apiKey });
}

// Generate habit suggestions using Groq
export async function getHabitSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return getDefaultSuggestions();
  }

  try {
    const groq = getGroqClient();
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a habit expert. Generate 3 creative, specific habit suggestions based on the user's input. Make them actionable, specific, and include emojis. Examples: 'Run 2km every morning 🌅', 'Read 10 pages before bed 📖', 'Drink 8 glasses of water 💧'"
        },
        {
          role: "user",
          content: `Generate 3 habit suggestions for: "${query}"`
        }
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultSuggestions();
    }

    // Parse the response to extract suggestions
    const suggestions = content
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0 && line.length < 100)
      .slice(0, 3);

    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
  } catch (error) {
    console.error("Error generating habit suggestions with Groq:", error);
    return getDefaultSuggestions();
  }
}

// Generate habit description using Exa
export async function generateHabitDescription(habitName: string): Promise<string> {
  try {
    const { Exa } = await import("exa-js");
    const exa = new Exa(process.env.EXA_API_KEY!);
    
    const response = await exa.searchAndContents(`${habitName} how to do`, {
      numResults: 1,
      useAutoprompt: true,
      text: true,
      highlights: true,
    });

    if (response.results.length > 0) {
      const result = response.results[0];
      const description = result.highlights?.[0] || result.text?.substring(0, 150);
      
      if (description) {
        // Clean up the description and make it actionable
        const cleanDescription = description.replace(/\s+/g, ' ').trim();
        
        // Extract actionable parts and make it specific
        let summary = cleanDescription
          .replace(/^(This is|This habit is|A habit that|The habit of|This involves|This means|This refers to|How to)/i, '')
          .replace(/^(is|involves|means|refers to|do)/i, '')
          .trim();
        
        // Make it more specific and actionable
        if (summary.toLowerCase().includes('run') || summary.toLowerCase().includes('jog')) {
          summary = 'Run for at least 1 km';
        } else if (summary.toLowerCase().includes('walk')) {
          summary = 'Walk for at least 30 minutes';
        } else if (summary.toLowerCase().includes('read')) {
          summary = 'Read for at least 10 pages';
        } else if (summary.toLowerCase().includes('meditate')) {
          summary = 'Meditate for at least 5 minutes';
        } else if (summary.toLowerCase().includes('drink') && summary.toLowerCase().includes('water')) {
          summary = 'Drink at least 8 glasses of water';
        } else if (summary.toLowerCase().includes('exercise')) {
          summary = 'Exercise for at least 30 minutes';
        } else if (summary.toLowerCase().includes('sleep')) {
          summary = 'Sleep for at least 7 hours';
        } else if (summary.toLowerCase().includes('write')) {
          summary = 'Write for at least 15 minutes';
        } else if (summary.toLowerCase().includes('study')) {
          summary = 'Study for at least 1 hour';
        } else if (summary.toLowerCase().includes('practice')) {
          summary = 'Practice for at least 20 minutes';
        }
        
        // Ensure it's a complete sentence and not too long
        if (summary.length > 0 && summary.length <= 120) {
          return summary.endsWith('.') ? summary : summary + '.';
        }
      }
    }

    return `Do ${habitName.toLowerCase()} for at least 30 minutes.`;
  } catch (error) {
    console.error("Error generating habit description:", error);
    return `Do ${habitName.toLowerCase()} for at least 30 minutes.`;
  }
}

// Generate multiple habit ideas using Exa
export async function generateHabitIdeas(topic?: string): Promise<any[]> {
  try {
    const { Exa } = await import("exa-js");
    const exa = new Exa(process.env.EXA_API_KEY!);
    
    const queries = topic ? 
      [`${topic} daily habits`, `${topic} routine ideas`, `${topic} healthy habits`] :
      [
        "unique micro habits for energy",
        "psychology-backed daily habits", 
        "interesting 5-minute rituals successful people do",
        "morning routine habits productivity",
        "evening wind-down habits wellness"
      ];

    const results = await Promise.all(
      queries.map(async (query) => {
        try {
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

    return results.flat().slice(0, 10);
  } catch (error) {
    console.error("Error generating habit ideas:", error);
    return [];
  }
}

// Helper function to categorize habits
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

// Default suggestions when API fails
function getDefaultSuggestions(): string[] {
  const suggestions = [
    "Run 2km every morning 🌅",
    "Read 10 pages before bed 📖",
    "Drink 8 glasses of water 💧",
    "Meditate for 5 minutes 🧘",
    "Write 3 things you're grateful for ✍️",
    "Take a 10-minute walk 🚶",
    "Practice deep breathing 🌬️",
    "Stretch for 5 minutes 🤸"
  ];
  
  return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
}
