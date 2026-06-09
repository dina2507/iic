import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
}

// Fallback events when no events in database
const fallbackEvents: Event[] = [{
  id: "1",
  title: "Innovation Hackathon 2024",
  description: "48-hour intensive hackathon focused on solving real-world problems with technology. Join teams, build prototypes, and win exciting prizes.",
  date: "2024-02-15",
  time: "09:00 AM",
  venue: "Tech Park, VIT",
  mode: "offline",
  eligibility: "both",
  image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&h=1080&fit=crop",
  registration_link: null
}, {
  id: "2",
  title: "Startup Pitch Night",
  description: "Present your startup idea to industry experts and angel investors. Get valuable feedback and potential funding opportunities.",
  date: "2024-02-20",
  time: "06:00 PM",
  venue: "Online (Zoom)",
  mode: "online",
  eligibility: "internal",
  image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1920&h=1080&fit=crop",
  registration_link: null
}, {
  id: "3",
  title: "Design Thinking Workshop",
  description: "Learn the fundamentals of design thinking and apply it to innovation challenges. Hands-on sessions with industry mentors.",
  date: "2024-02-25",
  time: "02:00 PM",
  venue: "Design Lab, AB1",
  mode: "offline",
  eligibility: "both",
  image_url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1920&h=1080&fit=crop",
  registration_link: null
}];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const getEligibilityBadge = (eligibility: string | null) => {
  switch (eligibility) {
    case "internal":
      return <Badge className="bg-domain-editorial/90 text-white border-0 backdrop-blur-sm">VIT Only</Badge>;
    case "external":
      return <Badge className="bg-domain-startups/90 text-white border-0 backdrop-blur-sm">External</Badge>;
    default:
      return <Badge className="bg-domain-ipr/90 text-white border-0 backdrop-blur-sm">Open for All</Badge>;
  }
};

const getModeBadge = (mode: string | null) => {
  return mode === "online" ? <Badge className="bg-green-500/80 text-white border-0 backdrop-blur-sm">Online</Badge> : <Badge className="bg-blue-500/80 text-white border-0 backdrop-blur-sm">Offline</Badge>;
};

export function HeroSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      if (data.registrationLink) {
        window.open(data.registrationLink, '_blank');
      }
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Already registered for this event');
      } else {
        toast.error('Failed to register');
      }
    },
  });

  const isRegistered = (eventId: string) => registrations?.includes(eventId);

  const handleRegister = (eventId: string, registrationLink: string | null) => {
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/auth');
      return;
    }
    registerMutation.mutate({ eventId, registrationLink });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const {
        data,
        error
      } = await supabase.from("events").select("*").eq("is_active", true).eq("is_featured", true).order("display_order", {
        ascending: true
      }).order("date", {
        ascending: true
      });
      if (!error && data && data.length > 0) {
        setEvents(data);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  return <section className="relative min-h-screen w-full overflow-hidden">
      {/* IIC Badge - Fixed Position */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/20 backdrop-blur-md border border-foreground/10 shadow-lg">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-foreground/90 text-sm font-medium">IIC-VIT </span>
        </div>
      </div>

      <Carousel setApi={setApi} opts={{
      align: "start",
      loop: true
    }} plugins={[Autoplay({
      delay: 6000,
      stopOnInteraction: true,
      stopOnMouseEnter: true
    })]} className="w-full h-full">
        <CarouselContent className="ml-0">
          {events.map((event, index) => <CarouselItem key={event.id} className="pl-0 relative min-h-screen">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img src={event.image_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1920&h=1080&fit=crop"} alt={event.title} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out" style={{
              transform: current === index ? "scale(1.05)" : "scale(1)"
            }} />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
              </div>

              {/* Content */}
              <div className="relative z-10 min-h-screen flex items-center">
                <div className="container mx-auto px-4 py-24">
                  <div className="max-w-2xl">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-3 mb-6 transition-all duration-700" style={{
                  opacity: current === index ? 1 : 0,
                  transform: current === index ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: "200ms"
                }}>
                      {getEligibilityBadge(event.eligibility)}
                      {getModeBadge(event.mode)}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight transition-all duration-700" style={{
                  opacity: current === index ? 1 : 0,
                  transform: current === index ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: "300ms"
                }}>
                      {event.title}
                    </h1>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl transition-all duration-700" style={{
                  opacity: current === index ? 1 : 0,
                  transform: current === index ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: "400ms"
                }}>
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="flex flex-wrap gap-6 mb-10 text-foreground/80 transition-all duration-700" style={{
                  opacity: current === index ? 1 : 0,
                  transform: current === index ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: "500ms"
                }}>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-sm">
                          <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-medium">{formatDate(event.date)}</span>
                      </div>
                      {event.time && <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-sm">
                            <Clock className="w-5 h-5 text-accent" />
                          </div>
                          <span className="font-medium">{event.time}</span>
                        </div>}
                      {event.venue && <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-sm">
                            <MapPin className="w-5 h-5 text-accent" />
                          </div>
                          <span className="font-medium">{event.venue}</span>
                        </div>}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4 transition-all duration-700" style={{
                  opacity: current === index ? 1 : 0,
                  transform: current === index ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: "600ms"
                }}>
                      {isRegistered(event.id) ? (
                        <Button size="lg" variant="outline" disabled className="px-8">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Registered
                        </Button>
                      ) : (
                        <Button 
                          size="lg" 
                          className="gradient-innovation text-accent-foreground border-0 shadow-lg hover:shadow-xl transition-all group px-8"
                          onClick={() => handleRegister(event.id, event.registration_link)}
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Register Now
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                      <Link to="/events">
                        <Button size="lg" variant="outline" className="bg-background/10 border-foreground/30 hover:bg-background/20 backdrop-blur-sm px-8">
                          View All Events
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>)}
        </CarouselContent>
      </Carousel>

      {/* Navigation Arrows */}
      <Button variant="ghost" size="icon" className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-background/20 backdrop-blur-md border border-foreground/10 hover:bg-background/40 text-foreground shadow-lg z-20 transition-all duration-300 hover:scale-110" onClick={scrollPrev}>
        <ChevronLeft className="h-7 w-7" />
      </Button>
      <Button variant="ghost" size="icon" className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-background/20 backdrop-blur-md border border-foreground/10 hover:bg-background/40 text-foreground shadow-lg z-20 transition-all duration-300 hover:scale-110" onClick={scrollNext}>
        <ChevronRight className="h-7 w-7" />
      </Button>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {Array.from({
        length: count
      }).map((_, index) => <button key={index} onClick={() => scrollTo(index)} className={`relative h-3 rounded-full transition-all duration-500 overflow-hidden ${index === current ? "w-12 bg-accent" : "w-3 bg-foreground/30 hover:bg-foreground/50"}`} aria-label={`Go to slide ${index + 1}`}>
            {index === current && <span className="absolute inset-0 bg-accent-foreground/30 origin-left" style={{
          animation: "progress 6s linear"
        }} />}
          </button>)}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-4 md:right-8 z-20 text-foreground/60 font-medium">
        <span className="text-2xl text-foreground">{String(current + 1).padStart(2, '0')}</span>
        <span className="mx-2">/</span>
        <span>{String(count).padStart(2, '0')}</span>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-4 md:left-8 z-20 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 rounded-full bg-foreground/50" />
        </div>
      </div>
    </section>;
}