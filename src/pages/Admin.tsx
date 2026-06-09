import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Loader2, 
  Eye, 
  EyeOff,
  Star,
  Home,
  GripVertical,
  Layers,
  Palette,
  Image,
  MessageSquare,
  Users,
  UserCheck,
  BarChart3,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EventForm } from "@/components/admin/EventForm";
import { DomainForm } from "@/components/admin/DomainForm";
import { GalleryForm } from "@/components/admin/GalleryForm";
import UserManagement from "@/components/admin/UserManagement";
import EventRegistrations from "@/components/admin/EventRegistrations";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import MembersManagement from "@/components/admin/MembersManagement";
import SubmissionsManagement from "@/components/admin/SubmissionsManagement";

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  time: string | null;
  venue: string | null;
  mode: string | null;
  eligibility: string | null;
  registration_link: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string;
}

interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  responsibilities: string[] | null;
  head_name: string | null;
  head_role: string | null;
  coordinator_name: string | null;
  coordinator_role: string | null;
  display_order: number;
}

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_name: string | null;
  event_date: string | null;
  display_order: number;
  is_featured: boolean | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin, isModerator, signOut } = useAuth();
  const canManageContent = isAdmin || isModerator;
  const [events, setEvents] = useState<Event[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isDomainFormOpen, setIsDomainFormOpen] = useState(false);
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchDomains();
    }
  }, [user]);

  const { data: galleryImages, isLoading: galleryLoading, refetch: refetchGallery } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!user,
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("display_order", { ascending: true })
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const fetchDomains = async () => {
    setDomainsLoading(true);
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
      toast({
        title: "Error",
        description: "Failed to fetch domains",
        variant: "destructive",
      });
    } else {
      setDomains(data || []);
    }
    setDomainsLoading(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Event has been deleted",
      });
      fetchEvents();
    }
  };

  const handleDeleteDomain = async (id: string) => {
    const { error } = await supabase.from("domains").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete domain",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Domain has been deleted",
      });
      fetchDomains();
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setIsDomainFormOpen(true);
  };

  const handleEventFormSuccess = () => {
    setIsEventFormOpen(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleDomainFormSuccess = () => {
    setIsDomainFormOpen(false);
    setEditingDomain(null);
    fetchDomains();
  };

  const handleEditGallery = (image: GalleryImage) => {
    setEditingGallery(image);
    setIsGalleryFormOpen(true);
  };

  const handleDeleteGallery = async (id: string) => {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Image has been deleted" });
      refetchGallery();
    }
  };

  const handleGalleryFormSuccess = () => {
    setIsGalleryFormOpen(false);
    setEditingGallery(null);
    refetchGallery();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-innovation flex items-center justify-center">
              <Layers className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Role Status Info */}
        {!canManageContent && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ You don't have privileges to manage content. Contact an administrator to get access.
              </p>
            </CardContent>
          </Card>
        )}
        {isModerator && !isAdmin && (
          <Card className="mb-6 border-blue-500/50 bg-blue-500/10">
            <CardContent className="pt-6">
              <p className="text-blue-600 dark:text-blue-400">
                ℹ️ You are a moderator. You can manage Events and Gallery but not Domains or Users.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Events, Domains, and Gallery */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="flex flex-wrap w-full max-w-5xl gap-1">
            {(isAdmin || isModerator) && (
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            )}
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Members
            </TabsTrigger>
            {(isAdmin || isModerator) && (
              <>
                <TabsTrigger value="domains" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Domains
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <Image className="w-4 h-4" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Submissions
                </TabsTrigger>
              </>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Roles & Access
              </TabsTrigger>
            )}
          </TabsList>

          {/* Analytics Tab */}
          {(isAdmin || isModerator) && (
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Overview of site statistics and registration trends.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsDashboard />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Events Management
                  </CardTitle>
                  <CardDescription>
                    Manage events displayed on the website. Featured events appear in the hero carousel.
                  </CardDescription>
                </div>
                {canManageContent && (
                  <Button onClick={() => setIsEventFormOpen(true)} className="gradient-innovation">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events found. Create your first event!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                        
                        {/* Image */}
                        <div className="w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {event.image_url ? (
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{event.title}</h3>
                            {event.is_featured && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{formatDate(event.date)}</span>
                            {event.time && <span>• {event.time}</span>}
                            {event.venue && <span>• {event.venue}</span>}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2">
                          <Badge variant={event.is_active ? "default" : "secondary"}>
                            {event.is_active ? (
                              <><Eye className="w-3 h-3 mr-1" /> Active</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" /> Hidden</>
                            )}
                          </Badge>
                          <Badge variant="outline">
                            {event.mode === "online" ? "Online" : event.mode === "hybrid" ? "Hybrid" : "Offline"}
                          </Badge>
                        </div>

                        {/* Actions */}
                        {canManageContent && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{event.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Event Registrations
                </CardTitle>
                <CardDescription>
                  View and manage user registrations for events. Export data as CSV.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventRegistrations />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Members Management
                </CardTitle>
                <CardDescription>
                  Manage faculty mentors and student team members. These will appear on the homepage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembersManagement canManageContent={canManageContent} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domains Tab */}
          {(isAdmin || isModerator) && (
            <TabsContent value="domains">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Domains Management
                    </CardTitle>
                    <CardDescription>
                      Manage IIC domains, their descriptions, and team members.
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setIsDomainFormOpen(true)} className="gradient-innovation">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {domainsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No domains found. Create your first domain!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                        
                        {/* Icon */}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(${domain.color})` }}
                        >
                          <span className="text-primary-foreground text-lg font-bold">
                            {domain.name.charAt(0)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{domain.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              /{domain.slug}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {domain.description}
                          </p>
                        </div>

                        {/* Team */}
                        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                          {domain.head_name && (
                            <span>Head: {domain.head_name}</span>
                          )}
                          {domain.coordinator_name && (
                            <span>Coord: {domain.coordinator_name}</span>
                          )}
                        </div>

                        {/* Actions */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDomain(domain)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{domain.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDomain(domain.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Gallery Tab */}
          {(isAdmin || isModerator) && (
            <TabsContent value="gallery">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Gallery Management
                    </CardTitle>
                    <CardDescription>
                      Manage photos from IIC events and activities.
                    </CardDescription>
                  </div>
                  {canManageContent && (
                    <Button onClick={() => setIsGalleryFormOpen(true)} className="gradient-innovation">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {galleryLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                  ) : !galleryImages || galleryImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No gallery images found. Add your first image!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <p className="text-sm font-medium text-center line-clamp-2">{image.title}</p>
                          {image.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" /> Featured
                            </Badge>
                          )}
                          {canManageContent && (
                            <div className="flex items-center gap-1 mt-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditGallery(image)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{image.title}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteGallery(image.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Submissions Tab */}
          {(isAdmin || isModerator) && (
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Submissions & Requests
                  </CardTitle>
                  <CardDescription>
                    Review and manage team join requests, idea submissions, and contact messages.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmissionsManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Users Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Roles & Access
                  </CardTitle>
                  <CardDescription>
                    Manage user roles and permissions. Assign admin or moderator access to VIT accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Event Form Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={(open) => {
        setIsEventFormOpen(open);
        if (!open) setEditingEvent(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={editingEvent || undefined}
            onSuccess={handleEventFormSuccess}
            onCancel={() => {
              setIsEventFormOpen(false);
              setEditingEvent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Domain Form Dialog */}
      <Dialog open={isDomainFormOpen} onOpenChange={(open) => {
        setIsDomainFormOpen(open);
        if (!open) setEditingDomain(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDomain ? "Edit Domain" : "Create New Domain"}
            </DialogTitle>
          </DialogHeader>
          <DomainForm
            domain={editingDomain || undefined}
            onSuccess={handleDomainFormSuccess}
            onCancel={() => {
              setIsDomainFormOpen(false);
              setEditingDomain(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Gallery Form Dialog */}
      <Dialog open={isGalleryFormOpen} onOpenChange={(open) => {
        setIsGalleryFormOpen(open);
        if (!open) setEditingGallery(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGallery ? "Edit Image" : "Add New Image"}
            </DialogTitle>
          </DialogHeader>
          <GalleryForm
            gallery={editingGallery || undefined}
            onSuccess={handleGalleryFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
