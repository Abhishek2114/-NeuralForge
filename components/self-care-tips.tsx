"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Brain, Leaf, Users, RefreshCw, Loader2 } from "lucide-react"
import { getAIInsights, generateTipsPrompt } from "@/utils/ai-helpers"
import { useToast } from "@/hooks/use-toast"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useAuth0 } from '@auth0/auth0-react'

type Tip = {
  id: string
  category: string
  title: string
  description: string
  action: string
}

interface AssessmentData {
  date?: string;
  totalScore?: number;
  maxScore?: number;
  concerns?: string[];
}

// Sample default tips
const defaultTips: Tip[] = [
  {
    id: "tip1",
    category: "mindfulness",
    title: "5-Minute Breathing Exercise",
    description: "Taking just a few minutes to focus on your breath can reduce stress and increase mental clarity.",
    action: "Find a quiet spot, close your eyes, and focus on your breath for 5 minutes.",
  },
  {
    id: "tip2",
    category: "physical",
    title: "Desk Stretches",
    description: "Simple stretches can relieve tension and improve focus during long periods of sitting.",
    action: "Try neck rolls, shoulder stretches, and gentle twists while sitting at your desk.",
  },
  {
    id: "tip3",
    category: "social",
    title: "Meaningful Connection",
    description: "Quality social interactions are vital for mental health and emotional well-being.",
    action: "Reach out to a friend or family member you haven't spoken to in a while.",
  },
  {
    id: "tip4",
    category: "creative",
    title: "5-Minute Journaling",
    description: "Brief journaling sessions can help process emotions and gain perspective.",
    action: "Write down three things you're grateful for and one challenge you're facing.",
  },
  {
    id: "tip5",
    category: "mindfulness",
    title: "Body Scan Meditation",
    description: "A body scan helps bring awareness to physical sensations and reduces mental chatter.",
    action: "Lie down comfortably and mentally scan from head to toe, noticing sensations without judgment.",
  },
  {
    id: "tip6",
    category: "physical",
    title: "Hydration Reminder",
    description: "Proper hydration improves energy, cognition, and overall physical wellbeing.",
    action: "Drink a full glass of water and set reminders to stay hydrated throughout the day.",
  },
  {
    id: "tip7",
    category: "social",
    title: "Active Listening Practice",
    description: "Improving listening skills strengthens relationships and deepens connections.",
    action: "In your next conversation, focus entirely on what the other person is saying without planning your response.",
  },
  {
    id: "tip8",
    category: "creative",
    title: "Mindful Photography",
    description: "Photography can shift perspective and help you notice beauty in everyday surroundings.",
    action: "Take 5 photos of interesting or beautiful things you normally overlook in your daily environment.",
  },
  {
    id: "tip9",
    category: "mindfulness",
    title: "Grounding Exercise",
    description: "Grounding techniques can quickly reduce anxiety and bring you back to the present moment.",
    action: "Practice the 5-4-3-2-1 technique: notice 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste.",
  },
  {
    id: "tip10",
    category: "physical",
    title: "Posture Reset",
    description: "Good posture reduces strain on muscles and joints while improving breathing and energy levels.",
    action: "Set an hourly reminder to check and reset your posture - align your spine, relax your shoulders, and position your screen at eye level.",
  },
  {
    id: "tip11",
    category: "social",
    title: "Boundaries Check-In",
    description: "Healthy boundaries support mental health and strengthen relationships over time.",
    action: "Identify one situation where you need stronger boundaries and plan a gentle but clear way to communicate your needs.",
  },
  {
    id: "tip12",
    category: "creative",
    title: "Sensory Art Experience",
    description: "Engaging multiple senses in creative activities can be deeply therapeutic and relaxing.",
    action: "Spend 10 minutes creating something with your hands - clay, dough, fabric, or any tactile material you have available.",
  },
];

export function SelfCareTips() {
  const { user: auth0User } = useAuth0()
  const [savedTips, setSavedTips] = useState<string[]>([])
  const [tips, setTips] = useState<Tip[]>(defaultTips)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Initialize Supabase client
  const supabase = createSupabaseClient()

  // Load saved tips from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("psychport-saved-tips")
      if (saved) {
        setSavedTips(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading saved tips:", error)
    }

    // Load default tips initially
    setTips(defaultTips)

    // Generate personalized tips if user data exists
    if (auth0User?.sub) {
      generatePersonalizedTips()
    }
  }, [auth0User])

  const toggleSaveTip = (id: string) => {
    let newSavedTips: string[]

    if (savedTips.includes(id)) {
      newSavedTips = savedTips.filter((tipId) => tipId !== id)
    } else {
      newSavedTips = [...savedTips, id]
    }

    setSavedTips(newSavedTips)
    try {
      localStorage.setItem("psychport-saved-tips", JSON.stringify(newSavedTips))
    } catch (error) {
      console.error("Error saving tips:", error)
    }
  }

  const generatePersonalizedTips = async () => {
    if (!auth0User?.sub) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to get personalized tips.",
        variant: "destructive",
      })
      return
    }
    
    setIsGenerating(true)

    try {
      // Get user data from Supabase for daily logs
      let logs: any[] = []
      let assessment: AssessmentData = {}

      try {
        // Fetch logs from Supabase - fetch more logs for better pattern analysis
        const { data: logsData, error: logsError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', auth0User.sub)
          .order('date', { ascending: false })
          .limit(10); // Increased to get more data for pattern recognition
        
        if (logsError) {
          throw logsError;
        }
        
        // Transform logs data to match expected format
        logs = logsData.map(log => ({
          date: log.date,
          mood: log.mood,
          energy: log.energy,
          stress: log.stress,
          emotions: log.emotions,
          journalEntry: log.journal_entry,
          insights: log.insights
        }));
        
        // We still use localStorage for assessment data for now
        assessment = JSON.parse(localStorage.getItem("psychport-assessment") || "{}")
      } catch (error) {
        console.error("Error fetching data:", error)
      }

      // If we don't have enough data, use default tips
      if (logs.length === 0 && !assessment.date) {
        setTips(defaultTips)
        setIsGenerating(false)
        return
      }

      // Prepare user data for AI
      const recentLogs = logs.slice(0, 10)  // Use up to 10 logs for better pattern recognition

      // Calculate detailed statistics
      const calculateAverage = (property: string) => {
        if (recentLogs.length === 0) return "No data";
        const avg = recentLogs.reduce((sum: number, log: any) => sum + log[property], 0) / recentLogs.length;
        return `Average: ${avg.toFixed(1)}%`;
      };
      
      const moodTrend = calculateAverage('mood');
      const energyTrend = calculateAverage('energy');
      const stressTrend = calculateAverage('stress');
      
      // Detect patterns in mood, energy, and stress
      let moodPattern = "No clear pattern";
      let energyPattern = "No clear pattern";
      let stressPattern = "No clear pattern";
      
      if (recentLogs.length >= 3) {
        // Check for consistent increase, decrease, or fluctuation in mood
        const moodDiffs = [];
        const energyDiffs = [];
        const stressDiffs = [];
        
        for (let i = 0; i < recentLogs.length - 1; i++) {
          moodDiffs.push(recentLogs[i].mood - recentLogs[i + 1].mood);
          energyDiffs.push(recentLogs[i].energy - recentLogs[i + 1].energy);
          stressDiffs.push(recentLogs[i].stress - recentLogs[i + 1].stress);
        }
        
        const allPositive = (arr: number[]) => arr.every(n => n > 0);
        const allNegative = (arr: number[]) => arr.every(n => n < 0);
        const mostlyPositive = (arr: number[]) => arr.filter(n => n > 0).length > arr.length / 2;
        const mostlyNegative = (arr: number[]) => arr.filter(n => n < 0).length > arr.length / 2;
        
        if (allPositive(moodDiffs)) moodPattern = "Consistently improving";
        else if (allNegative(moodDiffs)) moodPattern = "Consistently declining";
        else if (mostlyPositive(moodDiffs)) moodPattern = "Generally improving with some setbacks";
        else if (mostlyNegative(moodDiffs)) moodPattern = "Generally declining with some improvements";
        else moodPattern = "Fluctuating";
        
        if (allPositive(energyDiffs)) energyPattern = "Consistently improving";
        else if (allNegative(energyDiffs)) energyPattern = "Consistently declining";
        else if (mostlyPositive(energyDiffs)) energyPattern = "Generally improving with some setbacks";
        else if (mostlyNegative(energyDiffs)) energyPattern = "Generally declining with some improvements";
        else energyPattern = "Fluctuating";
        
        if (allPositive(stressDiffs)) stressPattern = "Consistently increasing (negative)";
        else if (allNegative(stressDiffs)) stressPattern = "Consistently decreasing (positive)";
        else if (mostlyPositive(stressDiffs)) stressPattern = "Generally increasing with some relief (negative)";
        else if (mostlyNegative(stressDiffs)) stressPattern = "Generally decreasing with some spikes (positive)";
        else stressPattern = "Fluctuating";
      }

      // Count emotions
      const emotionCounts: Record<string, number> = {}
      recentLogs.forEach((log: any) => {
        if (Array.isArray(log.emotions)) {
          log.emotions.forEach((emotion: string) => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
          })
        }
      })

      // Calculate emotion frequency as percentages
      const totalEmotions = Object.values(emotionCounts).reduce((sum: number, count: number) => sum + count, 0);
      const emotionFrequencies = Object.entries(emotionCounts)
        .map(([emotion, count]) => ({ 
          emotion, 
          count, 
          percentage: totalEmotions > 0 ? ((count / totalEmotions) * 100).toFixed(1) + '%' : '0%' 
        }))
        .sort((a, b) => b.count - a.count);
      
      // Get top emotions with their percentages
      const commonEmotions = emotionFrequencies
        .slice(0, 5)
        .map(item => `${item.emotion} (${item.percentage})`);
        
      // Group emotions by type
      const positiveEmotions = ['happy', 'grateful', 'relaxed', 'content', 'hopeful', 'calm', 'excited', 'confident', 'proud'];
      const negativeEmotions = ['sad', 'anxious', 'stressed', 'angry', 'frustrated', 'overwhelmed', 'lonely', 'tired', 'fearful', 'worried'];
      
      const emotionTypes = emotionFrequencies.reduce((acc: any, {emotion, count}) => {
        if (positiveEmotions.includes(emotion.toLowerCase())) {
          acc.positive += count;
        } else if (negativeEmotions.includes(emotion.toLowerCase())) {
          acc.negative += count;
        } else {
          acc.neutral += count;
        }
        return acc;
      }, {positive: 0, negative: 0, neutral: 0});
      
      const totalCount = emotionTypes.positive + emotionTypes.negative + emotionTypes.neutral;
      const emotionBalance = totalCount > 0 
        ? `${((emotionTypes.positive / totalCount) * 100).toFixed(1)}% positive, ${((emotionTypes.negative / totalCount) * 100).toFixed(1)}% negative`
        : 'No data';

      const userData = {
        moodTrend,
        moodPattern,
        energyTrend,
        energyPattern,
        stressTrend,
        stressPattern,
        emotionBalance,
        commonEmotions: commonEmotions.length > 0 ? commonEmotions : ["No data"],
        dataPoints: recentLogs.length,
        assessmentSummary: assessment.date
          ? `Score: ${assessment.totalScore}/${assessment.maxScore}, Concerns: ${assessment.concerns?.join(", ") || "None"}`
          : "No assessment data",
      }

      // Generate personalized tips
      const prompt = generateTipsPrompt(userData)
      const result = await getAIInsights(prompt, userData, "tips")

      try {
        // Improved JSON parsing logic
        let parsedResult;
        
        // First try direct parsing
        try {
          parsedResult = JSON.parse(result);
        } catch (directParseError) {
          // If direct parsing fails, try cleaning the string
          try {
            // Remove markdown code blocks
            const cleanedResult = result.replace(/```json\n?|\n?```/g, "").trim();
            parsedResult = JSON.parse(cleanedResult);
          } catch (cleanedParseError) {
            // If that fails, try to extract JSON from the text
            console.log("Failed to parse JSON after cleaning, trying to extract JSON");
            const jsonMatch = result.match(/({[\s\S]*})/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                parsedResult = JSON.parse(jsonMatch[1]);
              } catch (extractedParseError) {
                throw new Error("Could not parse JSON from response");
              }
            } else {
              throw new Error("Could not extract JSON from response");
            }
          }
        }
        
        console.log("Parsed AI response:", parsedResult);

        if (parsedResult && parsedResult.tips && Array.isArray(parsedResult.tips)) {
          // Add IDs to the tips
          const tipsWithIds = parsedResult.tips.map((tip: Omit<Tip, "id">, index: number) => ({
            ...tip,
            id: `ai-tip-${index}`,
          }))
          
          console.log("Tips with IDs:", tipsWithIds);
          console.log("Categories:", tipsWithIds.map((tip: Tip) => tip.category));

          // Check if we have tips for all categories
          const categories = ["mindfulness", "physical", "social", "creative"]
          const missingCategories = categories.filter(
            category => !tipsWithIds.some((tip: Tip) => tip.category === category)
          )
          
          if (missingCategories.length > 0) {
            console.warn("Missing tips for categories:", missingCategories)
            // Add default tips for missing categories
            const defaultTipsForMissingCategories = defaultTips.filter(
              (tip: Tip) => missingCategories.includes(tip.category)
            )
            
            setTips([...tipsWithIds, ...defaultTipsForMissingCategories])
          } else {
            setTips(tipsWithIds)
          }
        } else {
          // Fallback to default tips if parsing fails
          console.warn("Invalid tips format, using defaults")
          setTips(defaultTips)
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        console.log("Raw AI response:", result)
        setTips(defaultTips)
      }
    } catch (error) {
      console.error("Error generating personalized tips:", error)
      toast({
        title: "Could not generate personalized tips",
        description: "Using default recommendations instead.",
        variant: "destructive",
      })
      setTips(defaultTips)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Self-Care Tips</h1>
        <p className="text-muted-foreground">Personalized recommendations for your well-being</p>
      </div>

      <Card className="backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Tips</CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={generatePersonalizedTips}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription>
            Tips are personalized based on your mood logs and assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mindfulness" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-4">
              <TabsTrigger value="mindfulness" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Mind</span>
              </TabsTrigger>
              <TabsTrigger value="physical" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Body</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="creative" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">Creative</span>
              </TabsTrigger>
            </TabsList>

            {["mindfulness", "physical", "social", "creative"].map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {tips
                  .filter((tip) => tip.category === category)
                  .map((tip) => (
                    <TipCard
                      key={tip.id}
                      tip={tip}
                      isSaved={savedTips.includes(tip.id)}
                      onToggleSave={() => toggleSaveTip(tip.id)}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface TipCardProps {
  tip: Tip
  isSaved: boolean
  onToggleSave: () => void
}

function TipCard({ tip, isSaved, onToggleSave }: TipCardProps) {
  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-white/80 border border-gray-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{tip.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSave}
            className={isSaved ? "text-primary" : "text-gray-400"}
          >
            <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
        <CardDescription className="mt-1.5">{tip.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="font-medium">Try this:</div>
          <div>{tip.action}</div>
        </div>
      </CardContent>
    </Card>
  )
}
