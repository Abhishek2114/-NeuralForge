'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseClient();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!isAuthenticated || !user) return;

      try {
        console.log("Checking profile completion for user:", user.sub);
        
        // Use direct table access since RLS is disabled
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.sub)
          .maybeSingle();
          
        console.log("Profile check result:", { profile, error });

        if (!profile && pathname !== '/complete-profile') {
          console.log("No profile found, redirecting to /complete-profile");
          router.push('/complete-profile');
          return;
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    if (!isLoading) {
      checkProfileCompletion();
    }
  }, [isLoading, isAuthenticated, user, router, pathname, supabase]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login' && pathname !== '/signup') {
      loginWithRedirect({
        appState: {
          returnTo: pathname,
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, pathname]);

  if (isLoading || (isAuthenticated && isCheckingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E1D8F0] to-[#A0D2EB]">
        <div className="text-2xl font-semibold text-[#A0D2EB]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated && (pathname !== '/login' && pathname !== '/signup')) {
    return null;
  }

  return <>{children}</>;
} 