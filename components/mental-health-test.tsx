"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft } from "lucide-react"
import { getAIInsights, generateAssessmentPrompt } from "@/utils/ai-helpers"
import { useToast } from "@/hooks/use-toast"
import { FollowUpQuestions } from "@/components/follow-up-questions"
import { format } from 'date-fns'

// Add type for assessment entries
type AssessmentEntry = {
  date: string;
  totalScore: number;
  maxScore: number;
  concerns: string[];
  insights: string;
}

type Question = {
  id: number
  text: string
  category: string
  options: {
    value: number
    label: string
  }[]
}

export function MentalHealthTest() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<Question[]>([])
  const [nextQuestions, setNextQuestions] = useState<Question[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentEntry[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentEntry | null>(null)
  const { toast } = useToast()

  // Base questions - in a real app, these would be more extensive
  const baseQuestions: Question[] = [
    {
      id: 1,
      text: "Over the past two weeks, how often have you felt down, depressed, or hopeless?",
      category: "mood",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Several days" },
        { value: 2, label: "More than half the days" },
        { value: 3, label: "Nearly every day" },
      ],
    },
    {
      id: 2,
      text: "Over the past two weeks, how often have you felt nervous, anxious, or on edge?",
      category: "anxiety",
      options: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Several days" },
        { value: 2, label: "More than half the days" },
        { value: 3, label: "Nearly every day" },
      ],
    },
    {
      id: 3,
      text: "How would you rate your overall sleep quality during the past month?",
      category: "sleep",
      options: [
        { value: 0, label: "Very good" },
        { value: 1, label: "Fairly good" },
        { value: 2, label: "Fairly bad" },
        { value: 3, label: "Very bad" },
      ],
    },
  ]

  // Additional question pools by category
  const additionalQuestions: Record<string, Question[]> = {
    mood: [
      {
        id: 101,
        text: "How often have you had little interest or pleasure in doing things you usually enjoy?",
        category: "mood",
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" },
        ],
      },
      {
        id: 102,
        text: "How often do you feel good about yourself and your accomplishments?",
        category: "mood",
        options: [
          { value: 3, label: "Nearly every day" },
          { value: 2, label: "More than half the days" },
          { value: 1, label: "Several days" },
          { value: 0, label: "Not at all" },
        ],
      },
    ],
    anxiety: [
      {
        id: 201,
        text: "How often do you find yourself unable to control worrying?",
        category: "anxiety",
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" },
        ],
      },
      {
        id: 202,
        text: "How often do you experience physical symptoms of anxiety (racing heart, sweating, etc.)?",
        category: "anxiety",
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" },
        ],
      },
    ],
    sleep: [
      {
        id: 301,
        text: "How often do you have trouble falling asleep or staying asleep?",
        category: "sleep",
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" },
        ],
      },
      {
        id: 302,
        text: "How often do you feel rested after sleeping?",
        category: "sleep",
        options: [
          { value: 3, label: "Nearly every day" },
          { value: 2, label: "More than half the days" },
          { value: 1, label: "Several days" },
          { value: 0, label: "Not at all" },
        ],
      },
    ],
    burnout: [
      {
        id: 401,
        text: "How often do you feel emotionally drained from your work or daily responsibilities?",
        category: "burnout",
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" },
        ],
      },
      {
        id: 402,
        text: "How often do you feel you have a good work-life balance?",
        category: "burnout",
        options: [
          { value: 3, label: "Nearly every day" },
          { value: 2, label: "More than half the days" },
          { value: 1, label: "Several days" },
          { value: 0, label: "Not at all" },
        ],
      },
    ],
  }

  // Initialize with base questions
  useEffect(() => {
    setAdaptiveQuestions([...baseQuestions])
  }, [])

  const currentQuestion = adaptiveQuestions[currentQuestionIndex]
  const progress = adaptiveQuestions.length > 0 ? (currentQuestionIndex / adaptiveQuestions.length) * 100 : 0

  // Determine next questions based on answers
  const determineNextQuestions = () => {
    if (!currentQuestion) return

    // Simple adaptive logic - add follow-up questions based on high scores in categories
    const currentCategory = currentQuestion.category
    const currentValue = currentAnswer || 0

    // If user scores high on a question, add more questions from that category
    if (currentValue >= 2 && additionalQuestions[currentCategory]) {
      const newQuestions = additionalQuestions[currentCategory].filter(
        (q) => !adaptiveQuestions.some((existing) => existing.id === q.id),
      )

      if (newQuestions.length > 0) {
        // Add one new question from this category
        setNextQuestions((prev) => [...prev, newQuestions[0]])
      }
    }
  }

  const handleNext = () => {
    if (currentAnswer === null) return

    // Save the answer
    setAnswers({
      ...answers,
      [currentQuestion.id]: currentAnswer,
    })

    // Determine if we need to add more questions
    determineNextQuestions()

    // Move to next question or complete
    if (currentQuestionIndex < adaptiveQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer(null)
    } else {
      // If we have next questions, add them to the assessment
      if (nextQuestions.length > 0) {
        setAdaptiveQuestions([...adaptiveQuestions, ...nextQuestions])
        setNextQuestions([])
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer(null)
      } else {
        // Complete the assessment
        completeAssessment()
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setCurrentAnswer(answers[adaptiveQuestions[currentQuestionIndex - 1].id] || null)
    }
  }

  // Function to load assessment history
  const loadAssessmentHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem("psychport-assessments") || "[]") as AssessmentEntry[];
      // Sort history by date, newest first
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAssessmentHistory(history);
    } catch (error) {
      console.error("Error loading assessment history:", error);
      toast({
        title: "Error loading history",
        description: "Could not retrieve previous assessments.",
        variant: "destructive",
      });
      setAssessmentHistory([]);
    }
  };

  // Load history when the component mounts or when history view is shown
  useEffect(() => {
    if (showHistory) {
      loadAssessmentHistory();
    }
  }, [showHistory]);

  const completeAssessment = async () => {
    setIsLoading(true)

    try {
      // Calculate results
      const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0)
      const maxScore = adaptiveQuestions.length * 3

      // Identify areas of concern
      const categoryConcerns: Record<string, number> = {}
      adaptiveQuestions.forEach((q) => {
        const score = answers[q.id] || 0
        categoryConcerns[q.category] = (categoryConcerns[q.category] || 0) + score
      })

      const concerns = Object.entries(categoryConcerns)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category)

      // Get AI insights
      const assessmentData = {
        totalScore,
        maxScore,
        concerns,
        answers,
        questions: adaptiveQuestions,
      }

      const prompt = generateAssessmentPrompt(assessmentData)
      const insights = await getAIInsights(prompt, assessmentData, "assessment")

      setAiInsights(insights)
      setIsComplete(true)

      // Save to local storage
      try {
        // Save current assessment
        const currentAssessment = {
          date: new Date().toISOString(),
          totalScore,
          maxScore,
          concerns,
          insights,
        }
        
        localStorage.setItem(
          "psychport-assessment",
          JSON.stringify(currentAssessment)
        )
        
        // Save to history
        const history = JSON.parse(localStorage.getItem("psychport-assessments") || "[]")
        history.push(currentAssessment)
        localStorage.setItem("psychport-assessments", JSON.stringify(history))
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError)
      }
    } catch (error) {
      console.error("Error completing assessment:", error)
      toast({
        title: "Something went wrong",
        description: "Unable to complete your assessment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateResults = () => {
    // Simple calculation - in a real app, this would be more sophisticated
    const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0)
    const maxScore = adaptiveQuestions.length * 3
    const percentage = (totalScore / maxScore) * 100

    if (percentage < 25) {
      return {
        status: "Doing Well",
        description: "Your responses suggest you're managing well. Keep up your self-care practices!",
        color: "bg-secondary",
      }
    } else if (percentage < 50) {
      return {
        status: "Mild Concerns",
        description:
          "You may be experiencing some mild stress or mood changes. Consider adding more self-care to your routine.",
        color: "bg-accent",
      }
    } else if (percentage < 75) {
      return {
        status: "Moderate Concerns",
        description:
          "Your responses suggest moderate levels of distress. Consider speaking with a mental health professional.",
        color: "bg-primary",
      }
    } else {
      return {
        status: "Significant Concerns",
        description:
          "Your responses indicate significant distress. We recommend consulting with a mental health professional soon.",
        color: "bg-primary",
      }
    }
  }

  const results = isComplete ? calculateResults() : null

  // Function to view a specific assessment
  const viewAssessment = (assessment: AssessmentEntry) => {
    setSelectedAssessment(assessment);
  };

  // Function to go back from assessment detail view
  const handleBackFromDetail = () => {
    setSelectedAssessment(null);
  };

  // Function to go back from history list view
  const handleBackFromHistory = () => {
    setShowHistory(false);
    setSelectedAssessment(null);
  };

  // Main Render Logic
  if (showHistory) {
    if (selectedAssessment) {
      return (
        <div className="page-transition">
          <Button variant="ghost" size="sm" onClick={handleBackFromDetail} className="mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
          </Button>
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl text-gray-900 font-medium">Assessment from {format(new Date(selectedAssessment.date), 'PPP p')}</CardTitle>
              <CardDescription className="text-gray-500">Your assessment results and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className={`inline-flex rounded-full w-24 h-24 ${
                    selectedAssessment.totalScore / selectedAssessment.maxScore < 0.25
                      ? 'bg-green-500'
                      : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.5
                      ? 'bg-yellow-500'
                      : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.75
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  } items-center justify-center shadow-lg`}>
                    <span className="text-white text-2xl font-bold">
                      {selectedAssessment.totalScore}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedAssessment.totalScore / selectedAssessment.maxScore < 0.25
                    ? "Doing Well"
                    : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.5
                    ? "Mild Concerns"
                    : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.75
                    ? "Moderate Concerns"
                    : "Significant Concerns"}
                </h3>
                <p className="text-gray-600 mt-2">
                  {selectedAssessment.totalScore / selectedAssessment.maxScore < 0.25
                    ? "Your responses suggest you're managing well. Keep up your self-care practices!"
                    : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.5
                    ? "You may be experiencing some mild stress or mood changes. Consider adding more self-care to your routine."
                    : selectedAssessment.totalScore / selectedAssessment.maxScore < 0.75
                    ? "Your responses suggest moderate levels of distress. Consider speaking with a mental health professional."
                    : "Your responses indicate significant distress. We recommend consulting with a mental health professional soon."}
                </p>
              </div>

              {selectedAssessment.insights && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-3">AI-Generated Insights</h4>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{selectedAssessment.insights}</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Areas of Concern</h4>
                {selectedAssessment.concerns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAssessment.concerns.map((concern) => (
                      <span key={concern} className="text-xs bg-gradient-to-r from-gray-100 to-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        {concern}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No specific areas of concern identified.</p>
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessment
          </Button>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 tracking-tight">Previous Assessments</h2>
          {assessmentHistory.length === 0 ? (
            <p className="text-center text-gray-500">No previous assessments found.</p>
          ) : (
            <div className="space-y-3">
              {assessmentHistory.map((assessment, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:bg-gray-50 transition-all duration-300 border-0 shadow-md hover:shadow-lg rounded-xl overflow-hidden"
                  onClick={() => viewAssessment(assessment)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-900">{format(new Date(assessment.date), 'PPP p')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        assessment.totalScore / assessment.maxScore < 0.25
                          ? 'bg-green-500'
                          : assessment.totalScore / assessment.maxScore < 0.5
                          ? 'bg-yellow-500'
                          : assessment.totalScore / assessment.maxScore < 0.75
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`} />
                      <p className="text-sm text-gray-600">
                        Score: {assessment.totalScore}/{assessment.maxScore}
                        {assessment.concerns.length > 0 && ` • Concerns: ${assessment.concerns.join(", ")}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }
  }

  // --- Render Assessment Form or Results View ---
  return (
    <div className="page-transition">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 tracking-tight">Mental Health Assessment</h1>

      {!isComplete ? (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-xl text-gray-900 font-medium">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <CardDescription className="text-gray-500">This assessment adapts to your responses for personalized insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="mb-6">
              <Progress value={progress} className="h-2 bg-gray-100" />
            </div>

            {currentQuestion && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">{currentQuestion.text}</h3>

                <RadioGroup
                  value={currentAnswer?.toString() || ""}
                  onValueChange={(value) => setCurrentAnswer(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                      <Label htmlFor={`option-${option.value}`} className="cursor-pointer flex-grow">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleNext}
                disabled={currentAnswer === null || isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 rounded-xl py-6 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentQuestionIndex === adaptiveQuestions.length - 1 && nextQuestions.length === 0 ? (
                  "Complete Assessment"
                ) : (
                  "Next Question"
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentQuestionIndex === 0}
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 rounded-xl py-6"
              >
                Previous Question
              </Button>

              <Button
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 rounded-xl py-6"
                onClick={() => { loadAssessmentHistory(); setShowHistory(true); }}
                disabled={isLoading}
              >
                View Previous Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-xl text-gray-900 font-medium">Assessment Complete</CardTitle>
            <CardDescription className="text-gray-500">Your personalized insights are ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div
                  className={`inline-flex rounded-full w-24 h-24 ${
                    Object.values(answers).reduce((sum, value) => sum + value, 0) / (adaptiveQuestions.length * 3) < 0.25
                      ? 'bg-green-500'
                      : Object.values(answers).reduce((sum, value) => sum + value, 0) / (adaptiveQuestions.length * 3) < 0.5
                      ? 'bg-yellow-500'
                      : Object.values(answers).reduce((sum, value) => sum + value, 0) / (adaptiveQuestions.length * 3) < 0.75
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  } items-center justify-center shadow-lg`}
                >
                  <span className="text-white text-2xl font-bold">
                    {Object.values(answers).reduce((sum, value) => sum + value, 0)}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{results?.status}</h3>
              <p className="text-gray-600 mt-2">{results?.description}</p>
            </div>

            {aiInsights && (
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">AI-Generated Insights</h4>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{aiInsights}</p>
                
                <FollowUpQuestions aiInsights={aiInsights} />
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">What does this mean?</h4>
              <p className="text-sm leading-relaxed text-gray-700">
                This assessment provides a snapshot of your current mental well-being. Remember that these results are
                not a diagnosis, but they can help guide your self-care journey.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 rounded-xl py-6 shadow-md hover:shadow-lg"
                onClick={() => {
                  setIsComplete(false)
                  setCurrentQuestionIndex(0)
                  setAnswers({})
                  setCurrentAnswer(null)
                  setAiInsights(null)
                  setAdaptiveQuestions([...baseQuestions])
                  setNextQuestions([])
                }}
              >
                Retake Assessment
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-300 rounded-xl py-6"
                onClick={() => { loadAssessmentHistory(); setShowHistory(true); }}
              >
                View Previous Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
