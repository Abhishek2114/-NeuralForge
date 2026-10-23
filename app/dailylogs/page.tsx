'use client';

import { Navigation } from "@/components/navigation"
import { DailyLog } from "@/components/daily-log"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"

export default function DailyLogsPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-[72px] pb-[76px]">
        <Header />
        <Navigation />
        <div className="container max-w-md mx-auto px-4 py-10 space-y-8">
          <DailyLog />
        </div>
      </main>
    </AuthGuard>
  )
} 