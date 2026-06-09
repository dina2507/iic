import { Link } from "react-router-dom";
import { 
  Calendar, 
  Palette, 
  FileText, 
  Shield, 
  Briefcase, 
  Building2, 
  Rocket, 
  Zap,
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const domains = [
  {
    id: "events",
    name: "Events",
    description: "Organizing workshops, hackathons, and innovation summits",
    icon: Calendar,
    color: "bg-domain-events",
  },
  {
    id: "design",
    name: "Design",
    description: "Creating visual identities and user experiences",
    icon: Palette,
    color: "bg-domain-design",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Crafting compelling content and publications",
    icon: FileText,
    color: "bg-domain-editorial",
  },
  {
    id: "ipr",
    name: "IPR",
    description: "Guiding intellectual property rights and patents",
    icon: Shield,
    color: "bg-domain-ipr",
  },
  {
    id: "internships",
    name: "Internships",
    description: "Connecting students with industry opportunities",
    icon: Briefcase,
    color: "bg-domain-internships",
  },
  {
    id: "industry-connect",
    name: "Industry Connect",
    description: "Building bridges with corporate partners",
    icon: Building2,
    color: "bg-domain-industry",
  },
  {
    id: "startups",
    name: "Startups",
    description: "Nurturing entrepreneurial ventures",
    icon: Rocket,
    color: "bg-domain-startups",
  },
  {
    id: "innovations",
    name: "Innovations",
    description: "Driving cutting-edge research and development",
    icon: Zap,
    color: "bg-domain-innovations",
  },
];

export function DomainsSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Our Domains
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            8 Specialized Teams, One <span className="text-accent">Vision</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Each domain brings unique expertise to drive innovation across different dimensions of the entrepreneurial ecosystem.
          </p>
        </div>

        {/* Domains Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((domain, index) => (
            <Link
              key={domain.id}
              to={`/domains#${domain.id}`}
              className="group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl ${domain.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <domain.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
                  {domain.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {domain.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/domains">
            <Button variant="outline" size="lg" className="group">
              Explore All Domains
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
