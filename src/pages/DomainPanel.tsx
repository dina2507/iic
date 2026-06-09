import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  UserCheck,
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldOff,
  UserCog,
  Check,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EventForm } from "@/components/admin/EventForm";
import EventRegistrations from "@/components/admin/EventRegistrations";

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

interface DomainInfo {
  id: string;
  name: string;
  slug: string;
}

interface DomainTeamMember {
  id: string;
  user_id: string;
  domain_id: string;
  role: "head" | "coordinator" | "member";
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function DomainPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    loading: authLoading,
    isAdmin,
    isDomainHead,
    isDomainCoordinator,
    isDomainMember,
    userDomainRoles,
    signOut,
  } = useAuth();

  const canCreateEvents = isDomainHead || isDomainCoordinator || isAdmin;
  const canManageForms = isDomainHead || isDomainCoordinator || isAdmin;
  const canManageTeam = isDomainHead || isAdmin;

  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | "all">(
    "all"
  );
  const [teamSearchEmail, setTeamSearchEmail] = useState("");
  const [teamSearching, setTeamSearching] = useState(false);
  const [teamSearchResult, setTeamSearchResult] = useState<{
    id: string;
    full_name: string | null;
    email: string | null;
  } | null>(null);
  const [addMemberRole, setAddMemberRole] = useState<
    "coordinator" | "member"
  >("member");
  const [addMemberDomainId, setAddMemberDomainId] = useState<string>("");
  const [managingRegistrationsId, setManagingRegistrationsId] = useState<string | null>(null);

  // Get the user's domain IDs
  const myDomainIds = useMemo(
    () => userDomainRoles.map((r) => r.domain_id),
    [userDomainRoles]
  );

  // Get the domain IDs where user is head
  const headDomainIds = useMemo(
    () =>
      userDomainRoles
        .filter((r) => r.role === "head")
        .map((r) => r.domain_id),
    [userDomainRoles]
  );

  // Fetch domain info for the user's domains
  const { data: myDomains } = useQuery({
    queryKey: ["my-domains", myDomainIds],
    queryFn: async () => {
      if (myDomainIds.length === 0) return [];
      const { data, error } = await supabase
        .from("domains")
        .select("id, name, slug")
        .in("id", myDomainIds)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as DomainInfo[];
    },
    enabled: myDomainIds.length > 0,
  });

  // Fetch events for user's domains via event_domains join
  const { data: domainEvents, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["domain-events", myDomainIds, selectedDomainId],
    queryFn: async () => {
      const targetDomains =
        selectedDomainId === "all" ? myDomainIds : [selectedDomainId];
      if (targetDomains.length === 0) return [];

      // Get event IDs linked to user's domains
      const { data: eventDomainLinks, error: linkError } = await supabase
        .from("event_domains")
        .select("event_id")
        .in("domain_id", targetDomains);

      if (linkError) throw linkError;
      if (!eventDomainLinks || eventDomainLinks.length === 0) return [];

      const eventIds = [
        ...new Set(eventDomainLinks.map((l) => l.event_id)),
      ];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
    enabled: myDomainIds.length > 0,
  });

  // Fetch assigned events for coordinators (personal assignment)
  const { data: assignedEvents, isLoading: assignedEventsLoading } = useQuery({
    queryKey: ["assigned-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("events")
        .select('*')
        .or(`faculty_coordinator_ids.cs.{${user.id}},student_coordinator_ids.cs.{${user.id}}`)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user?.id,
  });

  // Fetch team members for the user's domains
  const { data: teamMembers, isLoading: teamLoading, refetch: refetchTeam } = useQuery({
    queryKey: ["domain-team", myDomainIds],
    queryFn: async () => {
      if (myDomainIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_domain_roles")
        .select("id, user_id, domain_id, role, created_at")
        .in("domain_id", myDomainIds);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles for all team members
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return data.map((d) => ({
        ...d,
        profile: profileMap.get(d.user_id) || undefined,
      })) as DomainTeamMember[];
    },
    enabled: myDomainIds.length > 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Set default addMemberDomainId
  useEffect(() => {
    if (headDomainIds.length > 0 && !addMemberDomainId) {
      setAddMemberDomainId(headDomainIds[0]);
    }
  }, [headDomainIds, addMemberDomainId]);

  const handleDeleteEvent = async (id: string) => {
    // Also delete event_domains links
    await supabase.from("event_domains").delete().eq("event_id", id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Event has been deleted" });
      refetchEvents();
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleEventFormSuccess = () => {
    setIsEventFormOpen(false);
    setEditingEvent(null);
    refetchEvents();
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

  // Get domain name by id
  const getDomainName = (domainId: string) => {
    return myDomains?.find((d) => d.id === domainId)?.name || "Unknown";
  };

  // Determine the user's highest role for display
  const getUserRoleLabel = () => {
    if (isAdmin) return "Admin";
    if (isDomainHead) return "Domain Head";
    if (isDomainCoordinator) return "Domain Coordinator";
    if (isDomainMember) return "Domain Member";
    return "Member";
  };

  // --- Team Management ---
  const searchTeamUser = async () => {
    if (!teamSearchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    setTeamSearching(true);
    setTeamSearchResult(null);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", teamSearchEmail.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (!profile) {
        toast({
          title: "User Not Found",
          description:
            "No user found with that email. Make sure they have signed up.",
          variant: "destructive",
        });
      } else {
        setTeamSearchResult(profile);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive",
      });
    }
    setTeamSearching(false);
  };

  const addTeamMember = async () => {
    if (!teamSearchResult || !addMemberDomainId) return;

    // Check if user already has a role in this domain
    const { data: existing } = await supabase
      .from("user_domain_roles")
      .select("id")
      .eq("user_id", teamSearchResult.id)
      .eq("domain_id", addMemberDomainId)
      .maybeSingle();

    if (existing) {
      toast({
        title: "Already a member",
        description: "This user already has a role in this domain.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("user_domain_roles").insert({
      user_id: teamSearchResult.id,
      domain_id: addMemberDomainId,
      role: addMemberRole,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${teamSearchResult.full_name || teamSearchResult.email} added as ${addMemberRole} to ${getDomainName(addMemberDomainId)}`,
      });
      setTeamSearchResult(null);
      setTeamSearchEmail("");
      refetchTeam();
    }
  };

  const updateTeamMemberRole = async (
    memberId: string,
    newRole: "coordinator" | "member"
  ) => {
    const { error } = await supabase
      .from("user_domain_roles")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Role updated to ${newRole}`,
      });
      refetchTeam();
    }
  };

  const removeTeamMember = async (memberId: string) => {
    const { error } = await supabase
      .from("user_domain_roles")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: "Member has been removed from the domain",
      });
      refetchTeam();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "head":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            Head
          </Badge>
        );
      case "coordinator":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            Coordinator
          </Badge>
        );
      case "member":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            Member
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

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
              <h1 className="text-xl font-bold">Domain Panel</h1>
              <p className="text-sm text-muted-foreground">
                {getUserRoleLabel()} • {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
            >
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
        {/* Domain Selector */}
        {myDomains && myDomains.length > 1 && (
          <div className="mb-6">
            <Select
              value={selectedDomainId}
              onValueChange={setSelectedDomainId}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All My Domains</SelectItem>
                {myDomains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Role Info Banners */}
        {isDomainMember && !isDomainHead && !isDomainCoordinator && (
          <Card className="mb-6 border-blue-500/50 bg-blue-500/10">
            <CardContent className="pt-6">
              <p className="text-blue-600 dark:text-blue-400">
                ℹ️ You are a Domain Member. You can view events and team
                rosters for your domain.
              </p>
            </CardContent>
          </Card>
        )}
        {isDomainCoordinator && !isDomainHead && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <p className="text-amber-600 dark:text-amber-400">
                ℹ️ You are a Domain Coordinator. You can create events and
                manage registrations for your domain.
              </p>
            </CardContent>
          </Card>
        )}

        {/* My Domains badges */}
        {myDomains && myDomains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {myDomains.map((d) => {
              const myRole = userDomainRoles.find(
                (r) => r.domain_id === d.id
              );
              return (
                <Badge
                  key={d.id}
                  variant="outline"
                  className="text-sm py-1.5 px-3"
                >
                  {d.name}{" "}
                  <span className="ml-1 capitalize text-muted-foreground">
                    ({myRole?.role})
                  </span>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="flex flex-wrap w-full max-w-3xl gap-1">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Domain Events
            </TabsTrigger>
            {assignedEvents && assignedEvents.length > 0 && (
              <TabsTrigger value="assigned-events" className="gap-2 bg-accent/10 text-accent data-[state=active]:bg-accent data-[state=active]:text-white transition-colors">
                <User className="w-4 h-4" />
                Assigned Events
              </TabsTrigger>
            )}
            {canManageForms && (
              <TabsTrigger value="registrations" className="gap-2">
                <UserCheck className="w-4 h-4" />
                Domain Registrations
              </TabsTrigger>
            )}
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Domain Events
                  </CardTitle>
                  <CardDescription>
                    Events associated with your domain(s).
                  </CardDescription>
                </div>
                {canCreateEvents && (
                  <Button
                    onClick={() => setIsEventFormOpen(true)}
                    className="gradient-innovation"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : !domainEvents || domainEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events found for your domain(s).</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {domainEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
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
                            <h3 className="font-medium truncate">
                              {event.title}
                            </h3>
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
                        <div className="hidden sm:flex items-center gap-2">
                          <Badge
                            variant={
                              event.is_active ? "default" : "secondary"
                            }
                          >
                            {event.is_active ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" /> Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" /> Hidden
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Actions */}
                        {canCreateEvents && (
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Event
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {event.title}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteEvent(event.id)
                                    }
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

          {/* Assigned Events Tab */}
          {assignedEvents && assignedEvents.length > 0 && (
            <TabsContent value="assigned-events">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    Assigned Events
                  </CardTitle>
                  <CardDescription>
                    Events where you are assigned as a coordinator. You can edit the event details and manage registrations here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedEvents.map((event) => (
                      <div key={event.id} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        {event.image_url && (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-24 h-16 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                            Edit Event
                          </Button>
                          <Button size="sm" variant="default" onClick={() => setManagingRegistrationsId(event.id)}>
                            Manage Registrations
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Registrations Tab */}
          {canManageForms && (
            <TabsContent value="registrations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Event Registrations
                  </CardTitle>
                  <CardDescription>
                    View and manage registrations for events in your
                    domain(s).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventRegistrations />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Management
                </CardTitle>
                <CardDescription>
                  {canManageTeam
                    ? "View and manage your domain team. Add members, assign roles."
                    : "View your domain team roster."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Add Team Member — Heads only */}
                {canManageTeam && (
                  <div className="bg-card rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Add Team Member
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Search by email and assign a role in your domain. You
                      can assign Coordinator or Member roles.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter user email..."
                          value={teamSearchEmail}
                          onChange={(e) =>
                            setTeamSearchEmail(e.target.value)
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && searchTeamUser()
                          }
                          className="pl-9"
                        />
                      </div>
                      <Button
                        onClick={searchTeamUser}
                        disabled={teamSearching}
                      >
                        {teamSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        Search
                      </Button>
                    </div>

                    {/* Search result */}
                    {teamSearchResult && (
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {teamSearchResult.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {teamSearchResult.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Domain selector (if head of multiple) */}
                            {headDomainIds.length > 1 && (
                              <Select
                                value={addMemberDomainId}
                                onValueChange={setAddMemberDomainId}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Domain" />
                                </SelectTrigger>
                                <SelectContent>
                                  {myDomains
                                    ?.filter((d) =>
                                      headDomainIds.includes(d.id)
                                    )
                                    .map((d) => (
                                      <SelectItem
                                        key={d.id}
                                        value={d.id}
                                      >
                                        {d.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Select
                              value={addMemberRole}
                              onValueChange={(v) =>
                                setAddMemberRole(
                                  v as "coordinator" | "member"
                                )
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="coordinator">
                                  Coordinator
                                </SelectItem>
                                <SelectItem value="member">
                                  Member
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={addTeamMember}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Roster */}
                {teamLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : !teamMembers || teamMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No team members found for your domain(s).</p>
                  </div>
                ) : (
                  <>
                    {/* Group by domain */}
                    {myDomains?.map((domain) => {
                      const members = teamMembers.filter(
                        (m) => m.domain_id === domain.id
                      );
                      if (members.length === 0) return null;

                      // Sort: head > coordinator > member
                      const roleWeight = {
                        head: 1,
                        coordinator: 2,
                        member: 3,
                      };
                      const sorted = [...members].sort(
                        (a, b) =>
                          (roleWeight[a.role] || 3) -
                            (roleWeight[b.role] || 3) ||
                          (a.profile?.full_name || "").localeCompare(
                            b.profile?.full_name || ""
                          )
                      );

                      const isHeadOfThis = headDomainIds.includes(
                        domain.id
                      );

                      return (
                        <div key={domain.id}>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {domain.name} Team
                          </h3>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Joined</TableHead>
                                  {(isHeadOfThis || isAdmin) && (
                                    <TableHead className="text-right">
                                      Actions
                                    </TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sorted.map((member) => (
                                  <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                      {member.profile?.full_name ||
                                        "Unknown"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {member.profile?.email ||
                                        "No email"}
                                    </TableCell>
                                    <TableCell>
                                      {getRoleBadge(member.role)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {formatDate(member.created_at)}
                                    </TableCell>
                                    {(isHeadOfThis || isAdmin) && (
                                      <TableCell className="text-right">
                                        {member.role !== "head" && (
                                          <div className="flex justify-end gap-1">
                                            {member.role === "member" && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  updateTeamMemberRole(
                                                    member.id,
                                                    "coordinator"
                                                  )
                                                }
                                                className="gap-1"
                                              >
                                                <UserCog className="w-3 h-3" />
                                                Promote
                                              </Button>
                                            )}
                                            {member.role ===
                                              "coordinator" && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  updateTeamMemberRole(
                                                    member.id,
                                                    "member"
                                                  )
                                                }
                                                className="gap-1"
                                              >
                                                <UserCog className="w-3 h-3" />
                                                Demote
                                              </Button>
                                            )}
                                            <AlertDialog>
                                              <AlertDialogTrigger
                                                asChild
                                              >
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="gap-1 text-destructive hover:text-destructive"
                                                >
                                                  <ShieldOff className="w-3 h-3" />
                                                  Remove
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>
                                                    Remove Team
                                                    Member
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Are you sure you
                                                    want to remove{" "}
                                                    {member.profile
                                                      ?.full_name ||
                                                      "this user"}{" "}
                                                    from{" "}
                                                    {domain.name}?
                                                    They will lose
                                                    all domain
                                                    privileges and
                                                    revert to general
                                                    user access.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() =>
                                                      removeTeamMember(
                                                        member.id
                                                      )
                                                    }
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  >
                                                    Remove
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Event Form Dialog */}
      <Dialog
        open={isEventFormOpen}
        onOpenChange={(open) => {
          setIsEventFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            domainIds={
              selectedDomainId !== "all"
                ? [selectedDomainId]
                : myDomainIds
            }
          />
        </DialogContent>
      </Dialog>

      {/* Manage Registrations Dialog */}
      <Dialog open={!!managingRegistrationsId} onOpenChange={(open) => !open && setManagingRegistrationsId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Registrations</DialogTitle>
            <DialogDescription>
              Viewing registrations for {assignedEvents?.find(e => e.id === managingRegistrationsId)?.title}
            </DialogDescription>
          </DialogHeader>
          {managingRegistrationsId && (
            <EventRegistrations eventId={managingRegistrationsId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
