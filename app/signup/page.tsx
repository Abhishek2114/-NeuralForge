"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && !isLoading) {
      router.push('/dailylogs');
    }
  }, [isAuthenticated, isLoading, router, mounted]);

  const handleSignup = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
        }
      });
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          connection: provider,
        }
      });
    } catch (err) {
      console.error(`Error signing up with ${provider}:`, err);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E1D8F0] to-[#A0D2EB]">
        <div className="text-2xl font-semibold text-[#A0D2EB]">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E1D8F0] to-[#A0D2EB] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-[#A0D2EB] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-white"
              >
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                <path d="M6 18a4 4 0 0 1-1.967-.516" />
                <path d="M19.967 17.484A4 4 0 0 1 18 18" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#A0D2EB]">PsychPort</span>
          </div>
          <CardDescription className="text-center text-lg">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSignup}
            className="w-full h-12 text-lg bg-[#A0D2EB] hover:bg-[#8BB8D0]"
          >
            Continue to Sign Up
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Already have an account? <Link href="/login" className="text-[#A0D2EB] hover:underline">Login</Link></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 