"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmotionTags } from "@/components/emotion-tags"
import { MoodSlider } from "@/components/mood-slider"
import { getAIInsights, generateDailyLogPrompt } from "@/utils/ai-helpers"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { createSupabaseClient } from "@/lib/supabase/client"
import { useAuth0 } from '@auth0/auth0-react'

// Add type for log entries
type LogEntry = {
  id?: string; // Added for Supabase
  user_id?: string; // Added for Supabase
  date: string; // Store date as ISO string
  mood: number;
  energy: number;
  stress: number;
  emotions: string[];
  journalEntry: string;
  insights: string | null;
}

export function DailyLog() {
  const { user: auth0User } = useAuth0()
  const [mood, setMood] = useState(50)
  const [energy, setEnergy] = useState(50)
  const [stress, setStress] = useState(50)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [journalEntry, setJournalEntry] = useState("")
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [logHistory, setLogHistory] = useState<LogEntry[]>([])
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const { toast } = useToast()

  // Initialize Supabase client
  const supabase = createSupabaseClient()

  const handleEmotionToggle = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion))
    } else {
      setSelectedEmotions([...selectedEmotions, emotion])
    }
  }

  // Function to load log history from Supabase
  const loadLogHistory = async () => {
    if (!auth0User?.sub) {
      console.error("User not authenticated");
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to view history.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Fetch logs from Supabase
      const { data: history, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', auth0User.sub)
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map database column names to component field names
      const formattedHistory = history?.map(log => ({
        id: log.id,
        user_id: log.user_id,
        date: log.date,
        mood: log.mood,
        energy: log.energy,
        stress: log.stress,
        emotions: log.emotions,
        journalEntry: log.journal_entry, // Map database column to component field
        insights: log.insights
      })) || [];
      
      setLogHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading log history:", error);
      toast({
        title: "Error loading history",
        description: "Could not retrieve previous logs.",
        variant: "destructive",
      });
      setLogHistory([]);
    }
  };

  // Load history when the component mounts or when history view is shown
  useEffect(() => {
    if (showHistory) {
      loadLogHistory();
    }
  }, [showHistory, auth0User]);

  const handleSubmit = async () => {
    if (!auth0User?.sub) {
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to save logs.",
        variant: "destructive",
      })
      return;
    }
    
    if (selectedEmotions.length === 0) {
      toast({
        title: "Please select at least one emotion",
        description: "Emotions help us understand your current state better.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Fetch user profile data from Supabase to get demographic information
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, date_of_birth, occupation, country, gender')
        .eq('user_id', auth0User.sub)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      }
      
      // Calculate age from date_of_birth if available
      let age = null;
      if (profileData?.date_of_birth) {
        const birthDate = new Date(profileData.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        // Adjust age if birthday hasn't occurred yet this year
        if (
          today.getMonth() < birthDate.getMonth() || 
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }
      
      // Format name from first and last name if available
      const name = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
        null;

      // Create log data object
      const logData: LogEntry = {
        user_id: auth0User.sub,
        date: new Date().toISOString(),
        mood,
        energy,
        stress,
        emotions: selectedEmotions,
        journalEntry,
        insights: null,
      }

      console.log("Saving log data to Supabase:", logData)

      // Create a separate data object for AI that doesn't include user_id
      const aiData = {
        date: logData.date,
        mood: logData.mood,
        energy: logData.energy,
        stress: logData.stress,
        emotions: logData.emotions,
        journalEntry: logData.journalEntry,
        // Include demographic data for more personalized insights
        age: age,
        occupation: profileData?.occupation || null,
        country: profileData?.country || null,
        gender: profileData?.gender || null
      }

      // Get AI insights with the filtered data
      const prompt = generateDailyLogPrompt(aiData)
      const insights = await getAIInsights(prompt, aiData, "dailyLog")

      logData.insights = insights
      setAiInsight(insights)
      setIsSubmitted(true)

      // Save to Supabase
      const { error } = await supabase
        .from('daily_logs')
        .insert([{
          user_id: logData.user_id,
          date: logData.date,
          mood: logData.mood,
          energy: logData.energy,
          stress: logData.stress,
          emotions: logData.emotions,
          journal_entry: logData.journalEntry,
          insights: logData.insights
        }])
        
      if (error) {
        throw error
      }

      toast({
        title: "Daily log saved",
        description: "Your check-in has been recorded successfully.",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Something went wrong",
        description: "Unable to save your check-in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setAiInsight(null)
    setMood(50)
    setEnergy(50)
    setStress(50)
    setSelectedEmotions([])
    setJournalEntry("")
    setShowHistory(false)
    setSelectedLog(null)
  }

  // Function to view a specific log
  const viewLogEntry = (log: LogEntry) => {
    setSelectedLog(log);
  };

  // Function to go back from log detail view
  const handleBackFromDetail = () => {
    setSelectedLog(null);
  };

  // Function to go back from history list view
  const handleBackFromHistory = () => {
    setShowHistory(false);
    setSelectedLog(null);
  };

  // Main Render Logic
  if (showHistory) {
    if (selectedLog) {
      return (
        <div className="page-transition">
          <Button variant="ghost" size="sm" onClick={handleBackFromDetail} className="mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Logs
          </Button>
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl text-gray-900 font-medium">Log from {format(new Date(selectedLog.date), 'PPP p')}</CardTitle>
              <CardDescription className="text-gray-500">Personalized reflections based on your check-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              {selectedLog.insights && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{selectedLog.insights}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Your Check-In Summary</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                    <div className="font-medium text-gray-900">Mood</div>
                    <div className="text-gray-600">{selectedLog.mood}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                    <div className="font-medium text-gray-900">Energy</div>
                    <div className="text-gray-600">{selectedLog.energy}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                    <div className="font-medium text-gray-900">Stress</div>
                    <div className="text-gray-600">{selectedLog.stress}%</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="font-medium text-sm text-gray-900">Emotions:</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLog.emotions.map((emotion) => (
                      <span key={emotion} className="text-xs bg-gradient-to-r from-gray-100 to-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedLog.journalEntry && (
                  <div className="mt-4">
                    <div className="font-medium text-sm text-gray-900">Journal:</div>
                    <p className="text-sm mt-2 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl text-gray-700 border border-gray-100 shadow-sm">{selectedLog.journalEntry}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="page-transition">
          <Button variant="ghost" size="sm" onClick={handleBackFromHistory} className="mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Check-In
          </Button>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 tracking-tight">Previous Logs</h2>
          {logHistory.length === 0 ? (
            <p className="text-center text-gray-500">No previous logs found.</p>
          ) : (
            <div className="space-y-3">
              {logHistory.map((log, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:bg-gray-50 transition-all duration-300 border-0 shadow-md hover:shadow-lg rounded-xl overflow-hidden"
                  onClick={() => viewLogEntry(log)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-900">{format(new Date(log.date), 'PPP p')}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Mood: {log.mood}% • Energy: {log.energy}% • Stress: {log.stress}%
                      {log.journalEntry && ` • ${log.journalEntry.substring(0, 50)}...`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }
  }

  // --- Render Check-in Form or Submitted View ---
  return (
    <div className="page-transition">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 tracking-tight">Daily Check-In</h1>

      {!isSubmitted ? (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-xl text-gray-900 font-medium">How are you feeling today?</CardTitle>
            <CardDescription className="text-gray-500">Track your mental state with a quick check-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="space-y-6">
              <MoodSlider label="Mood" value={mood} onChange={setMood} leftLabel="Low" rightLabel="High" />
              <MoodSlider
                label="Energy"
                value={energy}
                onChange={setEnergy}
                leftLabel="Drained"
                rightLabel="Energized"
              />
              <MoodSlider label="Stress" value={stress} onChange={setStress} leftLabel="Calm" rightLabel="Stressed" />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">What emotions are you experiencing?</h3>
              <EmotionTags selectedEmotions={selectedEmotions} onToggle={handleEmotionToggle} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Journal Entry (Optional)</h3>
              <Textarea
                placeholder="How was your day? What's on your mind?"
                className="min-h-[100px] border-gray-200 focus:border-gray-400 focus:ring-gray-400 rounded-xl"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 rounded-xl py-6 shadow-md hover:shadow-lg"
              onClick={handleSubmit}
              disabled={isLoading || selectedEmotions.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Save Today's Log"
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full mt-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 rounded-xl py-6"
              onClick={() => { loadLogHistory(); setShowHistory(true); }}
              disabled={isLoading}
            >
              View Previous Logs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-xl text-gray-900 font-medium">Your AI Insights</CardTitle>
            <CardDescription className="text-gray-500">Personalized reflections based on your check-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{aiInsight}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Your Check-In Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                  <div className="font-medium text-gray-900">Mood</div>
                  <div className="text-gray-600">{mood}%</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                  <div className="font-medium text-gray-900">Energy</div>
                  <div className="text-gray-600">{energy}%</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                  <div className="font-medium text-gray-900">Stress</div>
                  <div className="text-gray-600">{stress}%</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="font-medium text-sm text-gray-900">Emotions:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEmotions.map((emotion) => (
                    <span key={emotion} className="text-xs bg-gradient-to-r from-gray-100 to-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>

              {journalEntry && (
                <div className="mt-4">
                  <div className="font-medium text-sm text-gray-900">Journal:</div>
                  <p className="text-sm mt-2 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl text-gray-700 border border-gray-100 shadow-sm">{journalEntry}</p>
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 rounded-xl py-6 shadow-md hover:shadow-lg" 
              onClick={handleReset}
            >
              Complete New Check-In
            </Button>

            <Button
              variant="outline"
              className="w-full mt-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 rounded-xl py-6"
              onClick={() => { loadLogHistory(); setShowHistory(true); }}
            >
              View Previous Logs
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
