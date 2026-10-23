"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Moon, Settings, Shield, Loader2, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth0 } from '@auth0/auth0-react'
import { useAuth } from '../lib/auth'
import { toast } from 'sonner'
import { createSupabaseClient } from '@/lib/supabase/client'

export function UserProfile() {
  const { user, logout } = useAuth()
  const { user: auth0User } = useAuth0()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [dataSharing, setDataSharing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Supabase client
  const supabase = createSupabaseClient()

  // Load user data from Supabase on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      if (!auth0User?.sub) return;
      
      try {
        setIsLoading(true);
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', auth0User.sub)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          
          // Create a display name from first and last name
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          setDisplayName(fullName || auth0User.email || '');
          
          setEmail(profile.email || auth0User.email || '');
        } else {
          // Fallback to Auth0 user info
          setDisplayName(auth0User.name || auth0User.email || '');
          setEmail(auth0User.email || '');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [auth0User, supabase])

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="p-6 backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  disabled
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-lg">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Account Information</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Account created</p>
                <p className="font-medium">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last sign in</p>
                <p className="font-medium">
                  {user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-accent shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Settings</CardTitle>
              <CardDescription>Manage your app preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="notifications" className="text-base">
                      Notifications
                    </Label>
                    <p className="text-sm text-gray-500">Receive daily check-in reminders</p>
                  </div>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="dataSharing" className="text-base">
                      Data Sharing
                    </Label>
                    <p className="text-sm text-gray-500">Share anonymous data to improve the app</p>
                  </div>
                </div>
                <Switch id="dataSharing" checked={dataSharing} onCheckedChange={setDataSharing} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="link" className="w-full justify-start px-0 text-primary">
                <Settings className="h-4 w-4 mr-2" />
                FAQ & User Guide
              </Button>
              <Button variant="link" className="w-full justify-start px-0 text-primary">
                <Settings className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="link" className="w-full justify-start px-0 text-primary">
                <Settings className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent shadow-sm">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
