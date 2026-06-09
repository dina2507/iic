import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Calendar, MapPin, Clock, ArrowLeft, Loader2, CheckCircle, ExternalLink, Users, Globe, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: facultyCoordinators } = useQuery({
    queryKey: ['event-faculty-coordinators', event?.faculty_coordinator_ids],
    queryFn: async () => {
      if (!event?.faculty_coordinator_ids || event.faculty_coordinator_ids.length === 0) return [];
      const { data, error } = await supabase
        .from('faculty_members')
        .select('name, designation, phone_number, email')
        .in('user_id', event.faculty_coordinator_ids);
      if (error) throw error;
      return data;
    },
    enabled: !!event?.faculty_coordinator_ids?.length,
  });

  const { data: studentCoordinators } = useQuery({
    queryKey: ['event-student-coordinators', event?.student_coordinator_ids],
    queryFn: async () => {
      if (!event?.student_coordinator_ids || event.student_coordinator_ids.length === 0) return [];
      const { data, error } = await supabase
        .from('student_members')
        .select('name, role, phone_number')
        .in('user_id', event.student_coordinator_ids);
      if (error) throw error;
      return data;
    },
    enabled: !!event?.student_coordinator_ids?.length,
  });

  const { data: registrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(r => r.event_id);
    },
    enabled: !!user,
  });

  const { data: registrationCount } = useQuery({
    queryKey: ['event-registration-count', id],
    queryFn: async () => {
      // Use the SECURITY DEFINER RPC: RLS hides registration rows from
      // non-staff, so a direct count would (wrongly) return 0 for visitors.
      const { data, error } = await supabase
        .rpc('get_event_registration_count', { p_event_id: id });
      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: async ({ eventId, registrationLink }: { eventId: string; registrationLink: string | null }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_registrations')
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
      return { registrationLink };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', id] });
      toast.success('Successfully registered for event!');
      if (data.registrationLink) {
        window.open(data.registrationLink, '_blank');
      }
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Already registered for this event');
      } else {
        toast.error('Failed to register');
      }
    },
  });

  const isRegistered = registrations?.includes(id || '');
  const isPastEvent = event ? new Date(event.date) < new Date(new Date().toDateString()) : false;

  const handleRegister = () => {
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/auth');
      return;
    }
    if (event) {
      registerMutation.mutate({ eventId: event.id, registrationLink: event.registration_link });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  if (isEventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Event Not Found" description="The requested event does not exist." />
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-8">The event you're looking for doesn't exist or has been removed.</p>
            <Link to="/events">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description || "No description provided.",
    "startDate": new Date(`${event.date}T${event.time || '00:00'}`).toISOString(),
    "location": {
      "@type": "Place",
      "name": event.venue || "VIT University, Vellore",
      "address": "VIT University, Vellore, Tamil Nadu 632014"
    },
    "image": event.image_url ? [event.image_url] : []
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title={event.title}
        description={event.description?.substring(0, 160) || `Join us for ${event.title} at IIC VIT.`}
        ogImage={event.image_url || undefined}
        jsonLd={eventJsonLd}
      />
      <Navbar />
      <main className="pt-16">
        {/* Hero Image Section */}
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img 
            src={event.image_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&h=1080&fit=crop"} 
            alt={event.title} 
            className={`w-full h-full object-cover ${isPastEvent ? 'grayscale-[30%]' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Back Button */}
          <Link 
            to="/events" 
            className="absolute top-24 left-4 md:left-8 z-10"
          >
            <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>

          {/* Badges */}
          <div className="absolute bottom-8 left-4 md:left-8 flex flex-wrap gap-3">
            <Badge className="bg-domain-ipr text-white border-0 text-sm px-4 py-1">
              {event.eligibility === 'internal' ? 'VIT Only' : event.eligibility === 'external' ? 'External' : 'Open for All'}
            </Badge>
            {event.mode && (
              <Badge className={`text-white border-0 text-sm px-4 py-1 ${event.mode === 'online' ? 'bg-green-500' : event.mode === 'hybrid' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {event.mode === 'online' ? 'Online' : event.mode === 'hybrid' ? 'Hybrid' : 'Offline'}
              </Badge>
            )}
            {isPastEvent && (
              <Badge className="bg-muted text-muted-foreground border-0 text-sm px-4 py-1">
                Completed
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {event.title}
              </h1>
              
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                  {event.description || 'No description available for this event.'}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Event Details Card */}
                <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
                  <h3 className="font-semibold text-lg text-foreground">Event Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                      </div>
                    </div>

                    {event.time && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="font-medium text-foreground">{event.time}</p>
                        </div>
                      </div>
                    )}

                    {event.venue && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Venue</p>
                          <p className="font-medium text-foreground">{event.venue}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {event.mode === 'online' ? (
                          <Globe className="w-5 h-5 text-accent" />
                        ) : (
                          <Building className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <p className="font-medium text-foreground capitalize">{event.mode || 'Offline'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registrations</p>
                        <p className="font-medium text-foreground">{registrationCount} registered</p>
                      </div>
                    </div>

                    {(facultyCoordinators?.length > 0 || studentCoordinators?.length > 0) && (
                      <div className="pt-4 mt-4 border-t border-border space-y-4">
                        <h4 className="font-semibold text-foreground text-sm">Event Coordinators</h4>
                        
                        {facultyCoordinators?.map((coord, idx) => (
                          <div key={`fac-${idx}`} className="flex flex-col">
                            <span className="font-medium text-sm">{coord.name}</span>
                            <span className="text-xs text-muted-foreground">{coord.designation}</span>
                            {isRegistered && coord.phone_number && (
                              <span className="text-xs text-accent mt-1 flex items-center gap-1">
                                📞 {coord.phone_number}
                              </span>
                            )}
                            {isRegistered && coord.email && (
                              <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                ✉️ {coord.email}
                              </span>
                            )}
                          </div>
                        ))}

                        {studentCoordinators?.map((coord, idx) => (
                          <div key={`stu-${idx}`} className="flex flex-col">
                            <span className="font-medium text-sm">{coord.name}</span>
                            <span className="text-xs text-muted-foreground">{coord.role}</span>
                            {isRegistered && coord.phone_number && (
                              <span className="text-xs text-accent mt-1 flex items-center gap-1">
                                📞 {coord.phone_number}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registration Button */}
                  {!isPastEvent && (
                    <div className="pt-4 border-t border-border">
                      {isRegistered ? (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Registered
                        </Button>
                      ) : (
                        <Button 
                          className="w-full gradient-innovation text-accent-foreground border-0"
                          onClick={handleRegister}
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Register Now
                        </Button>
                      )}
                      
                      {event.registration_link && isRegistered && (
                        <a 
                          href={event.registration_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block mt-3"
                        >
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Registration Form
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;