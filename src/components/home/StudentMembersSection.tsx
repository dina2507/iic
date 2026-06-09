import { Link } from "react-router-dom";
import { ArrowRight, Linkedin, MessageCircle, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface StudentMember {
  id: string;
  name: string;
  role: string;
  domain: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  is_core_member: boolean | null;
}

const getDomainColor = (domain: string | null) => {
  if (!domain) return "bg-accent";
  const colors: Record<string, string> = {
    Events: "bg-domain-events",
    Design: "bg-domain-design",
    Editorial: "bg-domain-editorial",
    IPR: "bg-domain-ipr",
    Internships: "bg-domain-internships",
    "Industry Connect": "bg-domain-industry",
    Startups: "bg-domain-startups",
    Innovations: "bg-domain-innovations",
  };
  return colors[domain] || "bg-accent";
};

export function StudentMembersSection() {
  const { data: studentMembers = [], isLoading: loading } = useQuery({
    queryKey: ['student-members-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_members")
        .select("id, name, role, domain, image_url, linkedin_url, whatsapp_url, is_core_member")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as StudentMember[];
    },
  });

  if (loading) {
    return (
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Student Leadership
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our <span className="text-accent">Student Leaders</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Passionate students driving innovation and fostering a culture of entrepreneurship at VIT.
          </p>
        </div>

        {/* Empty State */}
        {studentMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <p className="text-muted-foreground text-lg">
              Our team is being updated. Check back soon!
            </p>
          </div>
        )}

        {/* Members Grid */}
        {studentMembers.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {studentMembers.map((member, index) => (
              <div
                key={member.id}
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative rounded-2xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all duration-500 hover:shadow-xl hover:shadow-accent/5">
                  <div className="flex items-center gap-5 p-5">
                    {/* Image */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent/30 group-hover:border-accent transition-colors duration-300">
                        <img
                          src={member.image_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face"}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      {/* Online indicator */}
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-card" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors truncate">
                        {member.name}
                      </h3>
                      <p className="text-accent text-sm font-medium mb-2">{member.role}</p>
                      {member.domain && (
                        <Badge className={`${getDomainColor(member.domain)} text-white border-0 text-xs`}>
                          {member.domain}
                        </Badge>
                      )}
                    </div>

                    {/* Social Actions */}
                    <div className="flex flex-col gap-2">
                      {member.linkedin_url && member.linkedin_url !== "#" && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                          aria-label={`${member.name}'s LinkedIn`}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.whatsapp_url && member.whatsapp_url !== "#" && (
                        <a
                          href={member.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                          aria-label={`Chat with ${member.name}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/members">
            <Button variant="outline" size="lg" className="group">
              View All Members
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
