"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { ProfileCompletionForm } from "@/components/profile-completion-form"
import { Header } from "@/components/header"
import { useAuth0 } from "@auth0/auth0-react"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user: auth0User } = useAuth0()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      if (!auth0User) {
        router.push("/login")
        return
      }

      try {
        console.log("Checking if profile already exists:", auth0User.sub)
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", auth0User.sub)
          .maybeSingle();
          
        console.log("Profile check result:", { profile, error })

        if (profile) {
          // Profile already completed, redirect to dailylogs
          console.log("Profile already exists, redirecting to /dailylogs")
          router.push("/dailylogs")
        }
      } catch (error) {
        console.error("Error checking profile:", error)
      } finally {
        setLoading(false)
      }
    }

    checkProfile()
  }, [auth0User, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E1D8F0] to-[#A0D2EB]">
        <div className="text-2xl font-semibold text-[#A0D2EB]">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <ProfileCompletionForm />
      </div>
    </main>
  )
} 