"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createSupabaseClient } from "@/lib/supabase/client"
import { countries } from "@/lib/countries"
import { useAuth0 } from "@auth0/auth0-react"

export function ProfileCompletionForm() {
  const router = useRouter()
  const { user: auth0User } = useAuth0()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    country: "",
    occupation: "",
    gender: "",
  })
  
  // Initialize Supabase client
  const supabase = createSupabaseClient()
  
  useEffect(() => {
    // Log environment variables in client side
    console.log("Auth0 User:", auth0User)
    
    // Try to pre-populate form data from Auth0 user object
    if (auth0User) {
      // Extract data from Auth0 user object
      const userData = {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
      };
      
      // Check if user_metadata contains profile information (common with social logins)
      const userMetadata = auth0User.user_metadata || {};
      
      // Try to get name information
      if (auth0User.given_name) {
        userData.firstName = auth0User.given_name;
      } else if (userMetadata.given_name) {
        userData.firstName = userMetadata.given_name;
      } else if (auth0User.name) {
        // Try to split full name if given_name is not available
        const nameParts = auth0User.name.split(' ');
        if (nameParts.length > 0) {
          userData.firstName = nameParts[0];
        }
      }
      
      if (auth0User.family_name) {
        userData.lastName = auth0User.family_name;
      } else if (userMetadata.family_name) {
        userData.lastName = userMetadata.family_name;
      } else if (auth0User.name) {
        // Try to extract last name from full name
        const nameParts = auth0User.name.split(' ');
        if (nameParts.length > 1) {
          userData.lastName = nameParts[nameParts.length - 1];
        }
      }
      
      // Try to get date of birth if available
      if (userMetadata.birthdate) {
        userData.dateOfBirth = userMetadata.birthdate;
      }
      
      console.log("Pre-populated data from Google login:", userData);
      
      // Update form with available data
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || prev.firstName,
        lastName: userData.lastName || prev.lastName,
        dateOfBirth: userData.dateOfBirth || prev.dateOfBirth,
      }));
    }
  }, [auth0User])
  
  const [isLoading, setIsLoading] = useState(false)

  // Calculate max date (14 years ago from today)
  const getMaxDate = (): string => {
    const today = new Date();
    const fourteenYearsAgo = new Date(
      today.getFullYear() - 14,
      today.getMonth(),
      today.getDate()
    );
    return fourteenYearsAgo.toISOString().split('T')[0];
  };
  
  const maxDateString = getMaxDate();

  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false;
    
    const birthDate = new Date(dateOfBirth);
    const fourteenYearsAgo = new Date();
    fourteenYearsAgo.setFullYear(fourteenYearsAgo.getFullYear() - 14);
    
    // Ensure the selected date is on or before 14 years ago
    return birthDate <= fourteenYearsAgo;
  }

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    setIsLoading(true)

    try {
      // Validate minimum age
      if (!validateAge(formData.dateOfBirth)) {
        console.log("Age validation failed")
        toast.error("You must be at least 14 years old to use this service.")
        setIsLoading(false)
        return
      }

      // Validate phone number if provided
      if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
        console.log("Phone validation failed")
        toast.error("Phone number must be exactly 10 digits.")
        setIsLoading(false)
        return
      }

      console.log("Submitting to Supabase with user_id:", auth0User?.sub)
      
      if (!auth0User?.sub) {
        console.error("No auth0User.sub available")
        toast.error("Authentication error. Please try logging in again.")
        setIsLoading(false)
        return
      }
      
      // Ensure date format is correct and meets the minimum age requirement
      if (new Date(formData.dateOfBirth) > new Date(maxDateString)) {
        console.log("Date validation failed on server-side check");
        toast.error("You must be at least 14 years old to use this service.");
        setIsLoading(false);
        return;
      }
      
      const dateOfBirth = formData.dateOfBirth;
      console.log("Formatted date of birth:", dateOfBirth);

      // Get user email from Auth0
      const userEmail = auth0User.email || "";
      console.log("User email:", userEmail);

      // First check if a profile already exists for this user
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", auth0User.sub)
        .maybeSingle();
      
      console.log("Existing profile check:", existingProfile);
      
      if (checkError) {
        console.error("Error checking existing profile:", checkError);
        toast.error(`Error checking profile: ${checkError.message}`);
        setIsLoading(false);
        return;
      }
      
      let error = null;
      
      if (existingProfile) {
        // Update existing profile
        console.log("Updating existing profile");
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber || null,
            date_of_birth: dateOfBirth,
            country: formData.country,
            occupation: formData.occupation,
            email: userEmail,
            gender: formData.gender || null
          })
          .eq("user_id", auth0User.sub);
           
        error = updateError;
      } else {
        // Insert new profile
        console.log("Inserting new profile");
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: auth0User.sub,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber || null,
            date_of_birth: dateOfBirth,
            country: formData.country,
            occupation: formData.occupation,
            email: userEmail,
            gender: formData.gender || null
          });
           
        error = insertError;
      }
      
      console.log("Supabase operation result:", { error });

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "An error occurred while saving your profile");
      }

      console.log("Profile completed successfully, redirecting to /dailylogs");
      toast.success("Profile completed successfully!");
      
      // Small delay before redirecting to ensure toast is visible
      setTimeout(() => {
        router.push("/dailylogs");
      }, 1000);
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // For phone number, only allow digits and limit to 10 characters
    if (name === 'phoneNumber') {
      const numbersOnly = value.replace(/\D/g, '')
      setFormData((prev) => ({ ...prev, [name]: numbersOnly.slice(0, 10) }))
      return
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Please provide your information to complete your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={auth0User?.email || ""}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-muted-foreground">
              Email is automatically set from your login account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="1234567890"
              pattern="\d{10}"
              title="Please enter exactly 10 digits"
              maxLength={10}
            />
            <p className="text-sm text-muted-foreground">
              Enter exactly 10 digits without spaces or special characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              max={maxDateString}
            />
            <p className="text-sm text-muted-foreground">
              You must be at least 14 years old
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, country: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation *</Label>
            <Input
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              required
              placeholder="Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 