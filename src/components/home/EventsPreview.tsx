import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getEligibilityBadge = (eligibility: string) => {
  switch (eligibility) {
    case "internal":
      return <Badge className="bg-domain-editorial text-white border-0">VIT Only</Badge>;
    case "external":
      return <Badge className="bg-domain-startups text-white border-0">External</Badge>;
    default:
      return <Badge className="bg-domain-ipr text-white border-0">Open for All</Badge>;
  }
};

export function EventsPreview() {
  const { data: upcomingEvents = [], isLoading } = useQuery({
    queryKey: ['upcoming-events-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              Upcoming Events
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Don't Miss Out on <span className="text-accent">Innovation</span>
            </h2>
          </div>
          <Link to="/events">
            <Button variant="outline" className="group shrink-0">
              View All Events
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border animate-pulse">
                <div className="aspect-[16/10] bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && upcomingEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-accent" />
            </div>
            <p className="text-muted-foreground text-lg">
              No upcoming events at the moment. Check back soon!
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && upcomingEvents.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event: Record<string, unknown>, index: number) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <article className="h-full rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={event.image_url || event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      {getEligibilityBadge(event.eligibility)}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.date)}</span>
                        <span className="mx-1">•</span>
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
