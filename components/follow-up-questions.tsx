"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getAIInsights } from "@/utils/ai-helpers"
import { useToast } from "@/hooks/use-toast"

interface FollowUpQuestionsProps {
  aiInsights: string
}

export function FollowUpQuestions({ aiInsights }: FollowUpQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>(() => {
    // Extract questions from AI insights
    // Look for numbered list format like "1. What specific situations..."
    const questionRegex = /\d+\.\s+(.*?)\?/g
    const matches = [...aiInsights.matchAll(questionRegex)]
    return matches.map(match => match[1] + "?")
  })
  
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [followUpInsight, setFollowUpInsight] = useState<string | null>(null)
  const { toast } = useToast()

  // No questions found or already submitted follow-up
  if (questions.length === 0) {
    return null
  }

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [index]: value
    }))
  }

  const handleSubmit = async () => {
    // Check if all questions have been answered
    const answeredCount = Object.keys(answers).length
    if (answeredCount < Math.min(3, questions.length)) {
      toast({
        title: "Please answer more questions",
        description: `Answer at least ${Math.min(3, questions.length)} questions to get personalized insights.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format questions and answers for the AI
      const questionsWithAnswers = questions.map((question, index) => ({
        question,
        answer: answers[index] || "No answer provided"
      }))

      // Create prompt for follow-up
      const prompt = `
        Based on our previous assessment, I've answered some follow-up questions:
        
        ${questionsWithAnswers.map(qa => 
          `Question: ${qa.question}\nMy answer: ${answers[questions.indexOf(qa.question)] || "No answer provided"}`
        ).join('\n\n')}
        
        Based on these additional answers, please provide:
        1. One or two key insights about my mental well-being
        2. One specific, practical recommendation I can try immediately
        
        Keep your response concise, supportive, and free of asterisks or special formatting.
      `

      const data = { questionsWithAnswers }
      const result = await getAIInsights(prompt, data, "dailyLog")
      
      setFollowUpInsight(result)
    } catch (error) {
      console.error("Error getting follow-up insights:", error)
      toast({
        title: "Something went wrong",
        description: "Unable to process your answers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isExpanded) {
    return (
      <div className="mt-4">
        <Button 
          variant="secondary" 
          className="w-full" 
          onClick={() => setIsExpanded(true)}
        >
          Answer follow-up questions
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Card className="border-secondary">
        <CardHeader>
          <CardTitle className="text-sm">Answer follow-up questions for more insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.slice(0, 5).map((question, index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm font-medium">{index + 1}. {question}</p>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[index] || ""}
                  onChange={e => handleAnswerChange(index, e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            ))}
            
            {followUpInsight && (
              <div className="bg-primary/10 p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-2">Additional Insights</h4>
                <p className="text-sm whitespace-pre-line">{followUpInsight}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < 1}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Get additional insights"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
