"use client"

import { Logo } from "@/components/logo"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="container max-w-md mx-auto px-4 flex justify-center">
        <Logo />
      </div>
    </header>
  )
} 