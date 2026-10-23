"use client"

interface EmotionTagsProps {
  selectedEmotions: string[]
  onToggle: (emotion: string) => void
}

export function EmotionTags({ selectedEmotions, onToggle }: EmotionTagsProps) {
  const emotions = [
    "Anxious",
    "Calm",
    "Grateful",
    "Sad",
    "Happy",
    "Tired",
    "Excited",
    "Frustrated",
    "Hopeful",
    "Overwhelmed",
    "Peaceful",
    "Lonely",
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map((emotion) => (
        <button
          key={emotion}
          onClick={() => onToggle(emotion)}
          className={`emotion-tag px-3 py-1 text-sm rounded-full border transition-all ${
            selectedEmotions.includes(emotion)
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
          }`}
        >
          {emotion}
        </button>
      ))}
    </div>
  )
}
