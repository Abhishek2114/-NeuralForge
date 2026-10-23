import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export async function POST(request: Request) {
  try {
    // Using environment variable for API key instead of hardcoding
    const gemini = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || ""
    })

    const { prompt, data } = await request.json()
    
    // Filter out any sensitive information like user_id or auth data
    // that might have been accidentally included
    const sanitizedData = { ...data }
    const sensitiveFields = ['user_id', 'id', 'auth', 'token', 'apiKey', 'password']
    
    sensitiveFields.forEach(field => {
      if (field in sanitizedData) {
        delete sanitizedData[field]
      }
    })

    // Determine if we're requesting tips (which requires JSON format)
    const isRequestingTips = prompt.includes('FORMAT SPECIFICATIONS:') && prompt.includes('tips');
    
    // System prompt tailored to the type of request
    const systemPrompt = isRequestingTips
      ? "You are a mental health assistant. For self-care tips, return ONLY a valid JSON object with the specified structure. Do not include markdown code blocks, text explanations, or any content outside the JSON object."
      : "You are a mental health assistant. Provide brief, clear insights without using asterisks or special formatting. Keep responses between 160 and 180 words. Focus on one key observation and one practical suggestion. Never diagnose or provide medical advice.";
    
    // Use higher temperature for tips to increase variety
    const temperature = isRequestingTips ? 0.85 : 0.7;

    const { text } = await generateText({
      model: gemini("gemini-2.0-flash-lite"),
      prompt: prompt,
      system: systemPrompt,
      temperature: temperature,
      maxTokens: 1000,
    })

    // For tips requests, try to ensure we return valid JSON
    if (isRequestingTips) {
      try {
        // First, clean any markdown formatting
        let cleanedText = text;
        
        // Remove markdown code blocks if present
        if (text.includes("```json")) {
          // Extract content between ```json and ``` markers
          const match = text.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanedText = match[1].trim();
          }
        } else if (text.includes("```")) {
          // Extract content between ``` and ``` markers (without json tag)
          const match = text.match(/```\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanedText = match[1].trim();
          }
        }
        
        // Try to parse the cleaned text
        try {
          JSON.parse(cleanedText);
          return Response.json({ result: cleanedText });
        } catch (parseError) {
          // If that doesn't work, try to extract JSON pattern
          const jsonMatch = cleanedText.match(/({[\s\S]*})/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              // Validate the extracted JSON
              const extractedJson = jsonMatch[1];
              JSON.parse(extractedJson);
              return Response.json({ result: extractedJson });
            } catch (extractError) {
              console.error("Failed to extract valid JSON:", extractError);
            }
          }
          
          // If we got here, fall back to default tips
          return Response.json({ 
            error: "Failed to generate valid JSON response",
            result: JSON.stringify({
              tips: [
                {
                  category: "mindfulness",
                  title: "Mindful Breathing Break",
                  description: "A short breathing exercise can reset your nervous system when feeling overwhelmed.",
                  action: "Take 5 deep breaths, counting to 4 on inhale and 6 on exhale."
                },
                {
                  category: "physical",
                  title: "Desk-Side Stretch Routine",
                  description: "Regular stretching improves circulation and reduces tension from sitting.",
                  action: "Stand up and do 2 minutes of gentle neck, shoulder and back stretches."
                },
                {
                  category: "social",
                  title: "Meaningful Connection Moment",
                  description: "Brief interactions can boost your mood and sense of belonging.",
                  action: "Send a thoughtful message to someone you care about but haven't connected with recently."
                },
                {
                  category: "creative",
                  title: "Quick Creativity Spark",
                  description: "Brief creative activities can shift perspective and stimulate different thinking.",
                  action: "Spend 5 minutes doodling, writing, or arranging objects in a pleasing way."
                }
              ]
            })
          });
        }
      } catch (jsonError) {
        // If not valid JSON, log the error
        console.error("Gemini response processing error:", jsonError);
        console.log("Raw text response:", text);
        
        // Return fallback
        return Response.json({ 
          error: "Failed to process response",
          result: JSON.stringify({
            tips: [
              {
                category: "mindfulness",
                title: "Mindful Breathing Break",
                description: "A short breathing exercise can reset your nervous system when feeling overwhelmed.",
                action: "Take 5 deep breaths, counting to 4 on inhale and 6 on exhale."
              },
              {
                category: "physical",
                title: "Desk-Side Stretch Routine",
                description: "Regular stretching improves circulation and reduces tension from sitting.",
                action: "Stand up and do 2 minutes of gentle neck, shoulder and back stretches."
              },
              {
                category: "social",
                title: "Meaningful Connection Moment",
                description: "Brief interactions can boost your mood and sense of belonging.",
                action: "Send a thoughtful message to someone you care about but haven't connected with recently."
              },
              {
                category: "creative",
                title: "Quick Creativity Spark",
                description: "Brief creative activities can shift perspective and stimulate different thinking.",
                action: "Spend 5 minutes doodling, writing, or arranging objects in a pleasing way."
              }
            ]
          })
        });
      }
    }

    return Response.json({ result: text })
  } catch (error) {
    console.error("Gemini API error:", error)
    // Return a more detailed error message
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        result: "I'm unable to provide AI insights right now. This is a preview mode with simulated responses.",
      },
      { status: 200 }, // Still return 200 to allow fallback behavior
    )
  }
}
