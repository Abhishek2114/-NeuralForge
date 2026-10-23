'use client';

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Get the current origin (domain) for the redirect URI
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Define allowed callback URLs
  const allowedCallbackUrls = [
    origin,
    `${origin}/dailylogs`,
    `${origin}/login`,
    `${origin}/signup`,
    // Add your Vercel deployment URL here
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '',
  ].filter(Boolean); // Remove empty strings

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""}
      authorizationParams={{
        redirect_uri: origin,
        scope: 'openid profile email',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        if (appState?.returnTo) {
          router.push(appState.returnTo);
        } else {
          router.push('/dailylogs');
        }
      }}
    >
      <AuthProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false} 
          disableTransitionOnChange
          forcedTheme="light"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </Auth0Provider>
  );
} 