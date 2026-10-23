// Fallback responses for when the API is unavailable
const fallbackResponses = {
  dailyLog: `Based on your check-in today, I notice you've shared some important feelings. Remember that tracking your emotions regularly is a powerful step toward self-awareness.

Consider taking a few moments today for a brief mindfulness practice - even 5 minutes of focused breathing can help create mental space and reduce stress.

This is a preview mode response. With the full version, you'll receive personalized insights based on your specific mood patterns and journal entries.`,

  assessment: `Thank you for completing your assessment. This gives us valuable information about your current mental well-being.

Focus areas you might consider:
1. Building regular self-care routines
2. Exploring stress management techniques

This is a preview mode response. With the full version, you'll receive personalized insights based on your specific assessment results.`,

  tips: JSON.stringify({
    tips: [
      {
        category: "mindfulness",
        title: "Mindful Breathing Break",
        description: "A short breathing exercise can quickly reset your nervous system when feeling overwhelmed.",
        action: "Take 5 deep breaths, counting to 4 on inhale and 6 on exhale.",
      },
      {
        category: "physical",
        title: "Desk-Side Stretch Routine",
        description: "Regular stretching improves circulation and reduces tension from sitting.",
        action: "Stand up and do 2 minutes of gentle neck, shoulder and back stretches.",
      },
      {
        category: "social",
        title: "Meaningful Connection Moment",
        description: "Brief, quality interactions can significantly boost your mood and sense of belonging.",
        action: "Send a thoughtful message to someone you care about but haven't connected with recently.",
      },
      {
        category: "creative",
        title: "Quick Creativity Spark",
        description: "Brief creative activities can shift your perspective and stimulate different thinking patterns.",
        action: "Spend 5 minutes doodling, writing, or arranging objects in a pleasing way.",
      },
    ],
  }),
}

export async function getAIInsights(prompt: string, data: any, type: "dailyLog" | "assessment" | "tips" = "dailyLog") {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        data,
      }),
    })

    if (!response.ok) {
      console.error("API response not OK:", response.status)
      return fallbackResponses[type]
    }

    const result = await response.json()

    // If the API returned an error but with a fallback result
    if (result.error && result.result) {
      console.warn("API returned an error with fallback:", result.error)
      return result.result
    }

    return result.result || fallbackResponses[type]
  } catch (error) {
    console.error("Error getting AI insights:", error)
    return fallbackResponses[type]
  }
}

export function generateDailyLogPrompt(logData: any) {
  return `As an empathetic and supportive mental health assistant, analyze the following daily wellness check-in data holistically, combining emotional intelligence with psychological sensitivity. Incorporate the user's demographic context for a more personalized, culturally aware response:

USER CONTEXT:
• Age: ${logData.age || 'Not specified'}
• Gender: ${logData.gender || 'Not specified'}
• Occupation: ${logData.occupation || 'Not specified'}
• Country: ${logData.country || 'Not specified'}

DAILY WELLNESS CHECK-IN DATA:
Date: ${new Date(logData.date).toLocaleDateString()}
• Mood Rating: ${logData.mood}/100
• Energy Level: ${logData.energy}/100
• Stress Level: ${logData.stress}/100

EMOTIONAL STATE:
• Reported Emotions: ${logData.emotions.join(", ")}
• Personal Reflection: "${logData.journalEntry}"

ANALYSIS FRAMEWORK:
1. Insight & Pattern Recognition:
   - Explore the relationship between mood, energy, and stress levels.
   - Note emotional combinations (e.g., feeling calm and grateful alongside sadness and fatigue).
   - Use the journal entry to give emotional context to the metrics.
   - Consider life context and relevant stressors (e.g., work pressure, cultural expectations).

2. Supportive Reflection:
   - Assess emotional balance and energy-stress dynamic.
   - Reflect on potential situational stressors based on user's context.
   - Empathize with how low energy and high stress may affect clarity and purpose.
   - Consider cultural and environmental factors that might influence well-being.

3. Actionable Recommendations:
   - Offer 2–3 supportive self-care actions, tailored to user's context and culture.
   - Include one immediate action (within the next hour) and one longer-term suggestion.
   - Ensure suggestions are accessible, culturally relevant, and appropriate for user's situation.
   - Consider time of day, energy levels, and available resources.

4. Positive Reinforcement & Gentle Guidance:
   - Highlight one strength or positive trait (e.g., emotional awareness, gratitude despite challenges).
   - Gently suggest one area for mindful growth or reflection.
   - Encourage agency and self-compassion within cultural context.

RESPONSE GUIDELINES:
• Keep total response between 160-180 words.
• Use a warm, non-judgmental, and motivational tone.
• Avoid clinical jargon or diagnostic terms.
• Emphasize achievable steps, self-awareness, and resilience.
• Be specific with timeframes (e.g., "within the next hour," "this evening," "over the next week").
• Consider cultural sensitivity and contextual appropriateness.

Format your response in clear paragraphs:
1. Insight & Pattern Recognition
2. Supportive Reflection
3. Actionable Recommendations
4. Positive Reinforcement & Gentle Guidance`
}

export function generateAssessmentPrompt(assessmentData: any) {
  return `As a supportive mental wellness assistant, provide a comprehensive analysis of this mental health assessment with a person-centered approach:

ASSESSMENT OVERVIEW:
• Total Score: ${assessmentData.totalScore}/${assessmentData.maxScore}
• Key Areas of Concern: ${assessmentData.concerns.join(", ")}
• Assessment Date: ${new Date().toLocaleDateString()}

ANALYSIS REQUIREMENTS:

1. Score Interpretation (Non-Diagnostic):
   - Contextualize the total score within the assessment range
   - Identify patterns across different areas of concern
   - Note areas of strength alongside challenges
   - Consider the interconnections between different concern areas

2. Priority Focus Areas:
   - Identify 2-3 key areas for immediate attention
   - Explain why these areas are prioritized
   - Consider both severity and potential impact
   - Note how these areas might influence each other

3. Personalized Growth Path:
   - Suggest specific, achievable steps for each focus area
   - Include both short-term (1 week) and medium-term (1 month) goals
   - Emphasize building on existing strengths
   - Consider lifestyle factors and daily routines

4. Follow-Up Framework:
   Generate 5 relevant follow-up questions focusing on:
   - Deeper understanding of key concerns
   - Current coping strategies
   - Support systems and resources
   - Daily habits and routines
   - Personal goals and aspirations

RESPONSE GUIDELINES:
• Maintain a supportive, empowering tone
• Avoid clinical or diagnostic language
• Focus on practical, actionable insights
• Emphasize personal agency and growth potential
• Balance addressing concerns with highlighting strengths
• Keep total response between 160-200 words

FORMAT YOUR RESPONSE IN SECTIONS:
1. Score Context & Initial Insights
2. Key Focus Areas & Rationale
3. Practical Next Steps
4. Follow-Up Questions

IMPORTANT CONSIDERATIONS:
• Emphasize this is a wellness tool, not a diagnostic instrument
• Acknowledge that well-being is dynamic and changeable
• Highlight the value of seeking professional support when needed
• Encourage regular self-reflection and progress tracking

Remember to maintain a hopeful, growth-oriented perspective while acknowledging current challenges.`
}

export function generateTipsPrompt(
  userData: {
    moodTrend: string
    moodPattern?: string
    energyTrend: string
    energyPattern?: string
    stressTrend: string
    stressPattern?: string
    emotionBalance?: string
    commonEmotions: string[]
    dataPoints?: number
    assessmentSummary: string
  },
  timestamp = Date.now()
) {
  // Add a timestamp to ensure unique responses on each refresh
  const now = new Date().toISOString()
  
  return `
GOAL: Generate 4 highly personalized, specific, and diverse self-care recommendations based on the user's emotional patterns and data.

USER DATA (${now}):
- Mood trend: ${userData.moodTrend}
- Mood pattern: ${userData.moodPattern || "Not enough data"}
- Energy trend: ${userData.energyTrend}
- Energy pattern: ${userData.energyPattern || "Not enough data"}
- Stress trend: ${userData.stressTrend}
- Stress pattern: ${userData.stressPattern || "Not enough data"}
- Emotion balance: ${userData.emotionBalance || "Not enough data"}
- Common emotions: ${userData.commonEmotions.join(", ")}
- Data points analyzed: ${userData.dataPoints || "Unknown"}
- Assessment summary: ${userData.assessmentSummary}
- Timestamp: ${timestamp} (Used to ensure unique responses)

SELF-CARE RECOMMENDATIONS FORMAT:
You must provide exactly 1 recommendation for each of these 4 categories:
1. Mindfulness and Mental Wellbeing: ${getMindfulnessPrompt(userData)}
2. Physical Wellbeing: ${getPhysicalPrompt(userData)}
3. Social Connection: ${getSocialPrompt(userData)}
4. Creative Expression: ${getCreativePrompt(userData)}

FORMAT SPECIFICATIONS:
Your response must ONLY contain a valid JSON object with this exact structure:
\`\`\`
{
  "tips": [
    {
      "category": "mindfulness",
      "title": "Unique and specific title here",
      "description": "Detailed and personalized description here",
      "action": "A specific, actionable step the user can take"
    },
    {
      "category": "physical",
      "title": "Unique and specific title here",
      "description": "Detailed and personalized description here",
      "action": "A specific, actionable step the user can take"
    },
    {
      "category": "social",
      "title": "Unique and specific title here",
      "description": "Detailed and personalized description here",
      "action": "A specific, actionable step the user can take"
    },
    {
      "category": "creative",
      "title": "Unique and specific title here",
      "description": "Detailed and personalized description here",
      "action": "A specific, actionable step the user can take"
    }
  ]
}
\`\`\`

IMPORTANT GUIDELINES:
- Ensure each recommendation is specific, actionable, and tailored to the user's emotional patterns
- Include exactly 1 recommendation per category (4 total)
- Every recommendation must have a unique title, detailed description, and a concrete action step
- Focus on addressing the user's most frequent emotions and patterns
- Recommendations should match the user's current energy levels
- Never suggest generic advice - be specific and personalized
- If the user shows a pattern of declining mood/energy or increasing stress, prioritize gentle, restorative activities
- If the user shows improvement, offer activities that build on this positive momentum
- For predominantly negative emotions, focus on soothing and supportive activities
- For predominantly positive emotions, suggest activities that maintain and enhance wellbeing
- The action field should contain a clear, concrete step the user can take immediately
`
}

// Helper functions to generate specialized prompts for each category
function getMindfulnessPrompt(userData: any) {
  // Extract mood pattern and emotional balance
  const moodPattern = userData.moodPattern || "No clear pattern";
  const emotionBalance = userData.emotionBalance || "No data";
  const isNegativeDominant = emotionBalance.includes("negative") && 
    parseFloat(emotionBalance.split("%")[0]) > 50;
  
  // Tailor prompt based on patterns
  if (moodPattern.includes("declining") || isNegativeDominant) {
    return "Focus on gentle, grounding practices that help stabilize mood and provide emotional regulation.";
  } else if (moodPattern.includes("improving")) {
    return "Suggest practices that build on positive momentum while maintaining emotional awareness.";
  } else if (moodPattern.includes("fluctuating")) {
    return "Recommend stabilizing practices that help maintain emotional equilibrium throughout changing mental states.";
  }
  
  return "Suggest a mindfulness practice specifically tailored to the user's emotional needs, avoiding generic meditation suggestions.";
}

function getPhysicalPrompt(userData: any) {
  // Extract energy pattern and stress pattern
  const energyPattern = userData.energyPattern || "No clear pattern";
  const stressPattern = userData.stressPattern || "No clear pattern";
  
  // Tailor prompt based on patterns
  if (energyPattern.includes("declining")) {
    return "Recommend gentle, restorative movement that won't deplete limited energy reserves.";
  } else if (stressPattern.includes("increasing")) {
    return "Suggest physical activities specifically designed to reduce stress and tension in the body.";
  } else if (energyPattern.includes("improving")) {
    return "Offer activities that build on increasing energy levels while maintaining balance.";
  }
  
  return "Recommend a physical activity matched to current energy levels - avoid generic advice like 'go for a walk'.";
}

function getSocialPrompt(userData: any) {
  // Extract common emotions
  const commonEmotions = userData.commonEmotions.join("").toLowerCase();
  const hasLoneliness = commonEmotions.includes("lonely");
  const hasOverwhelm = commonEmotions.includes("overwhelm") || commonEmotions.includes("stress");
  
  // Tailor prompt based on emotional needs
  if (hasLoneliness) {
    return "Suggest a meaningful social connection opportunity that addresses feelings of loneliness without being overwhelming.";
  } else if (hasOverwhelm) {
    return "Recommend a low-pressure social interaction that provides support without adding stress.";
  }
  
  return "Provide a social connection activity aligned with the user's emotional capacity - avoid generic advice like 'call a friend'.";
}

function getCreativePrompt(userData: any) {
  // Extract stress and energy information
  const stressTrend = userData.stressTrend;
  const energyTrend = userData.energyTrend;
  
  // Parse average values if available
  let stressLevel = 50;
  let energyLevel = 50;
  
  if (stressTrend.includes("Average:")) {
    stressLevel = parseFloat(stressTrend.split("Average:")[1]);
  }
  
  if (energyTrend.includes("Average:")) {
    energyLevel = parseFloat(energyTrend.split("Average:")[1]);
  }
  
  // Tailor prompt based on stress and energy levels
  if (stressLevel > 70) {
    return "Suggest a calming creative activity that serves as a stress relief outlet.";
  } else if (energyLevel < 40) {
    return "Recommend a low-energy creative expression that still provides satisfaction and accomplishment.";
  } else if (energyLevel > 70) {
    return "Offer an engaging creative activity that channels high energy in a productive way.";
  }
  
  return "Suggest a creative expression activity matched to the user's current emotional state - be specific and avoid generic suggestions."
}
