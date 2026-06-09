import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Calendar, MapPin, Clock, Search, Filter, Loader2, CheckCircle, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Seo } from "@/components/Seo";

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch upcoming events (date >= today)
  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('date', today)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch past events (date < today) - show all events regardless of is_active status
  const { data: pastEvents, isLoading: isLoadingPast } = useQuery({
    queryKey: ['past-events'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
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
      toast.success('Successfully registered for event!');
      // Redirect to registration link if available
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

  const filteredUpcomingEvents = upcomingEvents?.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastEvents = pastEvents?.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isRegistered = (eventId: string) => registrations?.includes(eventId);

  const handleRegister = (eventId: string, registrationLink: string | null) => {
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/auth');
      return;
    }
    registerMutation.mutate({ eventId, registrationLink });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const EventCard = ({ event, isPast = false }: { event: any; isPast?: boolean }) => (
    <article className="rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all group">
      <Link to={`/events/${event.id}`} className="block">
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={event.image_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop"} 
            alt={event.title} 
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale-[30%]' : ''}`}
          />
          <Badge className="absolute top-4 left-4 bg-domain-ipr text-white border-0">
            {event.eligibility === 'internal' ? 'VIT Only' : 'Open for All'}
          </Badge>
          {event.mode && (
            <Badge className="absolute top-4 right-4 bg-background/80 text-foreground border-0">
              {event.mode === 'online' ? 'Online' : 'Offline'}
            </Badge>
          )}
          {isPast && (
            <div className="absolute inset-0 bg-background/20 flex items-center justify-center">
              <Badge className="bg-muted text-muted-foreground border-0 text-sm">
                <History className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link to={`/events/${event.id}`}>
          <h3 className="font-semibold text-xl text-foreground mb-2 hover:text-accent transition-colors">{event.title}</h3>
        </Link>
        <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-accent" />
            {new Date(event.date).toLocaleDateString()}
          </span>
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-accent" />
              {event.time}
            </span>
          )}
          {event.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-accent" />
              {event.venue}
            </span>
          )}
        </div>
        {!isPast && (
          isRegistered(event.id) ? (
            <Button className="w-full mt-6" variant="outline" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Registered
            </Button>
          ) : (
            <Button 
              className="w-full mt-6 gradient-innovation text-accent-foreground border-0"
              onClick={() => handleRegister(event.id, event.registration_link)}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Register Now
            </Button>
          )
        )}
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title="Events"
        description="Discover upcoming workshops, hackathons, and innovation summits at IIC VIT."
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">Events</span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our <span className="text-accent">Events</span></h1>
            <p className="text-muted-foreground text-lg">Discover workshops, hackathons, and innovation summits.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {isLoadingUpcoming ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : filteredUpcomingEvents?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No upcoming events found.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredUpcomingEvents?.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {isLoadingPast ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : filteredPastEvents?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No past events found.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredPastEvents?.map((event) => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;