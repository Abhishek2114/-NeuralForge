"use client"

interface MoodSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  leftLabel?: string
  rightLabel?: string
}

export function MoodSlider({ label, value, onChange, leftLabel = "Low", rightLabel = "High" }: MoodSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-gray-500">{value}%</span>
      </div>
      <div className="mood-slider-track">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number.parseInt(e.target.value))}
          className="mood-slider w-full h-8 appearance-none bg-transparent focus:outline-none"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
