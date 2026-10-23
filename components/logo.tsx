"use client"

import Link from "next/link"
import { Brain } from "lucide-react"

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 py-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
        <Brain className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        PsychPort
      </span>
    </Link>
  )
} 