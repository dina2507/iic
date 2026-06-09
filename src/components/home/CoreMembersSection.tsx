import { Link } from "react-router-dom";
import { ArrowRight, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample core members data
const coreMembers = [
  {
    id: "1",
    name: "Dr. Rajesh Kumar",
    role: "Faculty Advisor",
    domain: "Leadership",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    linkedin: "#",
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "President",
    domain: "Events",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    linkedin: "#",
  },
  {
    id: "3",
    name: "Arjun Mehta",
    role: "Vice President",
    domain: "Startups",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    linkedin: "#",
  },
  {
    id: "4",
    name: "Ananya Reddy",
    role: "Secretary",
    domain: "Editorial",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    linkedin: "#",
  },
];

export function CoreMembersSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Our Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet the <span className="text-accent">Core Members</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Passionate leaders driving innovation and fostering a culture of entrepreneurship at VIT.
          </p>
        </div>

        {/* Members Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {coreMembers.map((member, index) => (
            <div
              key={member.id}
              className="group text-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative mb-6">
                {/* Image Container */}
                <div className="relative w-40 h-40 mx-auto">
                  <div className="absolute inset-0 rounded-full gradient-innovation opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-card shadow-xl group-hover:border-accent/50 transition-colors">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <a
                    href={member.linkedin}
                    className="w-10 h-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <button className="w-10 h-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-domain-ipr hover:text-white hover:border-domain-ipr transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-lg text-foreground mb-1">{member.name}</h3>
              <p className="text-accent font-medium text-sm mb-1">{member.role}</p>
              <p className="text-muted-foreground text-sm">{member.domain}</p>
            </div>
          ))}
        </div>

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
