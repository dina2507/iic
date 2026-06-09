import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Calendar, 
  Settings, 
  LogOut, 
  Loader2, 
  Save, 
  X,
  CalendarDays,
  MapPin,
  Clock,
  ExternalLink,
  Phone,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  FileText,
  Upload
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MemberProfileForm } from "@/components/member/MemberProfileForm";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone_number: z.string().max(15, "Phone number is too long").optional(),
  about: z.string().max(500, "About section must be 500 characters or less").optional(),
  social_links: z.object({
    linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
    github: z.string().url("Invalid URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid URL").optional().or(z.literal("")),
    instagram: z.string().url("Invalid URL").optional().or(z.literal("")),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
}

const getSocialLinks = (value: unknown): SocialLinks =>
  value && typeof value === "object" ? (value as SocialLinks) : {};

interface EventRegistration {
  id: string;
  event_id: string;
  registered_at: string;
  status: string;
  events: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    time: string | null;
    venue: string | null;
    mode: string | null;
    image_url: string | null;
    registration_link: string | null;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, signOut, isStudentMember } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, and WebP images are allowed", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const newAvatarUrl = urlData.publicUrl;

    // Update the account profile avatar. (The public member-card photo is managed
    // separately in the Member Profile tab / member portal.)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", user.id);

    if (!profileError) {
      toast({ title: "Success", description: "Avatar updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Also invalidate team members query if it exists somewhere else
    }

    setIsUploading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch registered events
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ["registrations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          registered_at,
          status,
          events (
            id,
            title,
            description,
            date,
            time,
            venue,
            mode,
            image_url,
            registration_link
          )
        `)
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data as EventRegistration[];
    },
    enabled: !!user?.id,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      avatar_url: profile?.avatar_url || "",
      phone_number: profile?.phone_number || "",
      about: profile?.about || "",
      social_links: {
        linkedin: getSocialLinks(profile?.social_links).linkedin || "",
        github: getSocialLinks(profile?.social_links).github || "",
        twitter: getSocialLinks(profile?.social_links).twitter || "",
        instagram: getSocialLinks(profile?.social_links).instagram || "",
      }
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        phone_number: profile.phone_number || "",
        about: profile.about || "",
        social_links: {
          linkedin: getSocialLinks(profile.social_links).linkedin || "",
          github: getSocialLinks(profile.social_links).github || "",
          twitter: getSocialLinks(profile.social_links).twitter || "",
          instagram: getSocialLinks(profile.social_links).instagram || "",
        }
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url || null,
          phone_number: data.phone_number || null,
          about: data.about || null,
          social_links: data.social_links as Json,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast({ title: "Registration cancelled", description: "You have been unregistered from the event." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isEventPast = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const upcomingEvents = registrations?.filter(r => !isEventPast(r.events.date)) || [];
  const pastEvents = registrations?.filter(r => isEventPast(r.events.date)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative group rounded-full overflow-hidden w-16 h-16 border-2 border-accent flex-shrink-0">
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || ""} alt={profile?.full_name || ""} className="object-cover" />
                  <AvatarFallback className="text-lg bg-accent/20 rounded-none">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isStudentMember && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Upload Avatar">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile?.full_name || "User"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="w-4 h-4" />
                My Events
              </TabsTrigger>
              <TabsTrigger value="member" className="gap-2">
                <User className="w-4 h-4" />
                Member Profile
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Settings className="w-4 h-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Member Profile Tab */}
            <TabsContent value="member" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    Member Profile
                  </CardTitle>
                  <CardDescription>
                    Your public team-card details. Changes appear on the Members page once approved.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-accent" />
                    Upcoming Events
                  </CardTitle>
                  <CardDescription>
                    Events you're registered for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registrationsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>You haven't registered for any upcoming events.</p>
                      <Button variant="link" onClick={() => navigate("/events")} className="mt-2">
                        Browse Events
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.map((reg) => (
                        <div key={reg.id} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          {reg.events.image_url && (
                            <img
                              src={reg.events.image_url}
                              alt={reg.events.title}
                              className="w-24 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{reg.events.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {formatDate(reg.events.date)}
                              </span>
                              {reg.events.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {reg.events.time}
                                </span>
                              )}
                              {reg.events.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {reg.events.venue}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                              Registered
                            </Badge>
                            {reg.events.registration_link && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={reg.events.registration_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <X className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel your registration for "{reg.events.title}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelRegistrationMutation.mutate(reg.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Cancel Registration
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Past Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pastEvents.map((reg) => (
                        <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{reg.events.title}</h4>
                            <p className="text-xs text-muted-foreground">{formatDate(reg.events.date)}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {reg.status === "attended" ? "Attended" : "Completed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your profile information
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          {...form.register("full_name")}
                          placeholder="Your full name"
                        />
                        {form.formState.errors.full_name && (
                          <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                        )}
                      </div>



                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          {...form.register("phone_number")}
                          placeholder="+1 234 567 890"
                        />
                        {form.formState.errors.phone_number && (
                          <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="about">About You</Label>
                          <span className="text-xs text-muted-foreground">
                            {form.watch("about")?.length || 0}/500
                          </span>
                        </div>
                        <Textarea
                          id="about"
                          {...form.register("about")}
                          placeholder="Tell us a bit about yourself..."
                          className="resize-none h-24"
                        />
                        {form.formState.errors.about && (
                          <p className="text-sm text-destructive">{form.formState.errors.about.message}</p>
                        )}
                      </div>

                      <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Social Profiles
                        </h4>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="linkedin" className="flex items-center gap-2">
                              <Linkedin className="w-3 h-3" /> LinkedIn
                            </Label>
                            <Input id="linkedin" {...form.register("social_links.linkedin")} placeholder="https://linkedin.com/in/..." />
                            {form.formState.errors.social_links?.linkedin && (
                              <p className="text-xs text-destructive">{form.formState.errors.social_links.linkedin.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="github" className="flex items-center gap-2">
                              <Github className="w-3 h-3" /> GitHub
                            </Label>
                            <Input id="github" {...form.register("social_links.github")} placeholder="https://github.com/..." />
                            {form.formState.errors.social_links?.github && (
                              <p className="text-xs text-destructive">{form.formState.errors.social_links.github.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="twitter" className="flex items-center gap-2">
                              <Twitter className="w-3 h-3" /> Twitter
                            </Label>
                            <Input id="twitter" {...form.register("social_links.twitter")} placeholder="https://twitter.com/..." />
                            {form.formState.errors.social_links?.twitter && (
                              <p className="text-xs text-destructive">{form.formState.errors.social_links.twitter.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="flex items-center gap-2">
                              <Instagram className="w-3 h-3" /> Instagram
                            </Label>
                            <Input id="instagram" {...form.register("social_links.instagram")} placeholder="https://instagram.com/..." />
                            {form.formState.errors.social_links?.instagram && (
                              <p className="text-xs text-destructive">{form.formState.errors.social_links.instagram.message}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user.email || ""} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="gradient-innovation" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">Full Name</Label>
                            <p className="text-lg">{profile?.full_name || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="text-lg">{user.email}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Phone Number</Label>
                            <p className="text-lg flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {profile?.phone_number || "Not set"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Member Since</Label>
                            <p className="text-lg flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {profile?.created_at ? formatDate(profile.created_at) : "Unknown"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4 border-l pl-6">
                          <div>
                            <Label className="text-muted-foreground">About</Label>
                            <p className="text-base whitespace-pre-wrap mt-1">
                              {profile?.about || "No description provided."}
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-muted-foreground mb-2 block">Social Profiles</Label>
                            {(() => {
                              const social = getSocialLinks(profile?.social_links);
                              const hasAny = social.linkedin || social.github || social.twitter || social.instagram;
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {social.linkedin && (
                                    <Button size="sm" variant="outline" asChild className="gap-2">
                                      <a href={social.linkedin} target="_blank" rel="noreferrer">
                                        <Linkedin className="w-3 h-3" /> LinkedIn
                                      </a>
                                    </Button>
                                  )}
                                  {social.github && (
                                    <Button size="sm" variant="outline" asChild className="gap-2">
                                      <a href={social.github} target="_blank" rel="noreferrer">
                                        <Github className="w-3 h-3" /> GitHub
                                      </a>
                                    </Button>
                                  )}
                                  {social.twitter && (
                                    <Button size="sm" variant="outline" asChild className="gap-2">
                                      <a href={social.twitter} target="_blank" rel="noreferrer">
                                        <Twitter className="w-3 h-3" /> Twitter
                                      </a>
                                    </Button>
                                  )}
                                  {social.instagram && (
                                    <Button size="sm" variant="outline" asChild className="gap-2">
                                      <a href={social.instagram} target="_blank" rel="noreferrer">
                                        <Instagram className="w-3 h-3" /> Instagram
                                      </a>
                                    </Button>
                                  )}
                                  {!hasAny && (
                                    <p className="text-sm text-muted-foreground italic">No social links added.</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}