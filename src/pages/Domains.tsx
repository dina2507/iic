import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Calendar,
  Palette,
  FileText,
  Shield,
  Briefcase,
  Building2,
  Rocket,
  Zap,
  User,
  Users,
  ArrowRight,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Calendar,
  Palette,
  FileText,
  Shield,
  Briefcase,
  Building2,
  Rocket,
  Zap,
};

// Domains that have a dedicated webpage. Add an entry here when a new
// domain page is built (slug -> route).
const domainRoutes: Record<string, string> = {
  startups: "/startup",
};

interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  responsibilities: string[] | null;
  display_order: number;
}

interface DomainTeamMember {
  id: string;
  name: string;
  role: string;
  domain: string | null;
  domain_role: string;
  image_url: string | null;
}

export default function Domains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [teamMembers, setTeamMembers] = useState<DomainTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [domainsRes, membersRes] = await Promise.all([
      supabase.from("domains").select("*").order("display_order", { ascending: true }),
      supabase
        .from("student_members")
        .select("id, name, role, domain, domain_role, image_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    if (domainsRes.error) {
      console.error("Error fetching domains:", domainsRes.error);
    } else {
      setDomains(domainsRes.data || []);
    }
    if (!membersRes.error && membersRes.data) {
      setTeamMembers(membersRes.data);
    }
    setLoading(false);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Zap;
  };

  const getDomainLeads = (domainName: string) => {
    const inDomain = teamMembers.filter((m) => m.domain === domainName);
    return {
      head: inDomain.find((m) => m.domain_role === "head") || null,
      coordinator: inDomain.find((m) => m.domain_role === "coordinator") || null,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title="Our Domains"
        description="Explore the 8 specialized domains of IIC VIT driving innovation."
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 gradient-institutional">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-4">
              Our Domains
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              8 Specialized Teams, One <span className="text-accent">Vision</span>
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Each domain brings unique expertise to drive innovation across different dimensions of the entrepreneurial ecosystem at VIT.
            </p>
          </div>
        </div>
      </section>

      {/* Domains List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {domains.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No domains found.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {domains.map((domain, index) => {
                const IconComponent = getIcon(domain.icon);
                const { head, coordinator } = getDomainLeads(domain.name);
                const domainPage = domainRoutes[domain.slug];
                return (
                  <div 
                    key={domain.id} 
                    id={domain.slug}
                    className="scroll-mt-24 rounded-2xl border bg-card overflow-hidden shadow-lg"
                    style={{ borderColor: `hsl(${domain.color})` }}
                  >
                    <div className="grid md:grid-cols-3 gap-0">
                      {/* Left Column - Domain Info */}
                      <div 
                        className="p-8 flex flex-col justify-center"
                        style={{ backgroundColor: `hsl(${domain.color})` }}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-background/20 flex items-center justify-center mb-6">
                          <IconComponent className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-3xl font-bold text-primary-foreground mb-2">
                          {domain.name}
                        </h2>
                        <p className="text-primary-foreground/80 text-sm">
                          Domain {String(index + 1).padStart(2, '0')} of {String(domains.length).padStart(2, '0')}
                        </p>
                      </div>

                      {/* Right Column - Details */}
                      <div className="md:col-span-2 p-8">
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {domain.description}
                        </p>

                        {/* Responsibilities */}
                        {domain.responsibilities && domain.responsibilities.length > 0 && (
                          <div className="mb-8">
                            <h3 className="font-semibold text-foreground mb-3">Key Responsibilities</h3>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {domain.responsibilities.map((resp, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: `hsl(${domain.color})` }}
                                  />
                                  {resp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Team — derived from the student_members list */}
                        <div className="flex flex-wrap gap-6">
                          {head && (
                            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: `hsl(${domain.color})` }}
                              >
                                {head.image_url ? (
                                  <img src={head.image_url} alt={head.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{head.name}</p>
                                <p className="text-xs text-muted-foreground">{head.role || "Domain Head"}</p>
                              </div>
                            </div>
                          )}
                          {coordinator && (
                            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden opacity-90"
                                style={{ backgroundColor: `hsl(${domain.color})` }}
                              >
                                {coordinator.image_url ? (
                                  <img src={coordinator.image_url} alt={coordinator.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="w-5 h-5 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{coordinator.name}</p>
                                <p className="text-xs text-muted-foreground">{coordinator.role || "Domain Coordinator"}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Link to the dedicated domain page when one exists */}
                        {domainPage && (
                          <Link
                            to={domainPage}
                            className="inline-flex items-center gap-2 mt-6 text-sm font-medium hover:gap-3 transition-all"
                            style={{ color: `hsl(${domain.color})` }}
                          >
                            Explore the {domain.name} domain
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
