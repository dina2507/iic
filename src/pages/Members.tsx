import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Linkedin, MessageCircle, Loader2, GraduationCap, Users, Mail, Github, Twitter, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

interface MemberRow {
  id: string;
  member_type: string;
  name: string;
  role: string | null;
  domain: string | null;
  is_core_member: boolean | null;
  designation: string | null;
  domain_role: string | null;
  about: string | null;
  department: string | null;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
}

const STUDENT_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face";
const FACULTY_FALLBACK = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face";

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

/** Renders the visible social buttons for a member (already masked by the DB view). */
function SocialButtons({ member }: { member: MemberRow }) {
  const links: { href: string; label: string; icon: typeof Linkedin; external?: boolean }[] = [];
  if (member.email) links.push({ href: `mailto:${member.email}`, label: "Email", icon: Mail });
  if (member.linkedin_url) links.push({ href: member.linkedin_url, label: "LinkedIn", icon: Linkedin, external: true });
  if (member.github_url) links.push({ href: member.github_url, label: "GitHub", icon: Github, external: true });
  if (member.twitter_url) links.push({ href: member.twitter_url, label: "Twitter", icon: Twitter, external: true });
  if (member.instagram_url) links.push({ href: member.instagram_url, label: "Instagram", icon: Instagram, external: true });
  if (member.whatsapp_url) links.push({ href: member.whatsapp_url, label: "WhatsApp", icon: MessageCircle, external: true });

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {links.map(({ href, label, icon: Icon, external }) => (
        <a
          key={label}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={`${label} link`}
        >
          <Button size="sm" variant="outline"><Icon className="w-4 h-4" /></Button>
        </a>
      ))}
    </div>
  );
}

const Members = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members = [], isLoading, isError } = useQuery({
    queryKey: ["member-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_directory")
        .select(
          "id, member_type, name, role, domain, is_core_member, designation, department, image_url, email, linkedin_url, whatsapp_url, github_url, twitter_url, instagram_url, about, domain_role"
        )
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MemberRow[];
    },
  });

  const q = searchQuery.toLowerCase();
  const studentMembers = members.filter((m) => m.member_type === "student");
  const facultyMembers = members.filter((m) => m.member_type === "faculty");

  const filteredStudents = studentMembers.filter((m) =>
    m.name.toLowerCase().includes(q) ||
    (m.role?.toLowerCase().includes(q) ?? false) ||
    (m.domain?.toLowerCase().includes(q) ?? false)
  ).sort((a, b) => {
    const roleWeight = { head: 1, coordinator: 2, member: 3 };
    const weightA = roleWeight[(a.domain_role as keyof typeof roleWeight) || "member"] || 3;
    const weightB = roleWeight[(b.domain_role as keyof typeof roleWeight) || "member"] || 3;
    if (weightA !== weightB) return weightA - weightB;
    return a.name.localeCompare(b.name);
  });

  const filteredFaculty = facultyMembers.filter((m) =>
    m.name.toLowerCase().includes(q) ||
    (m.designation?.toLowerCase().includes(q) ?? false) ||
    (m.department?.toLowerCase().includes(q) ?? false)
  );

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Our Team"
        description="Meet the faculty and student members of the Institution's Innovation Council."
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">Our Team</span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Meet Our <span className="text-accent">Members</span></h1>
            <p className="text-muted-foreground text-lg">Connect with the passionate innovators driving IIC forward.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Couldn't load members right now. Please try again later.</p>
            </div>
          ) : (
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="students" className="gap-2">
                  <Users className="w-4 h-4" />
                  Students ({filteredStudents.length})
                </TabsTrigger>
                <TabsTrigger value="faculty" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Faculty ({filteredFaculty.length})
                </TabsTrigger>
              </TabsList>

              {/* Students Tab */}
              <TabsContent value="students">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No student members found.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredStudents.map((member) => (
                      <div key={member.id} className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                          <img
                            src={member.image_url || STUDENT_FALLBACK}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover border-4 border-secondary group-hover:border-accent/50 transition-colors"
                          />
                          {member.is_core_member && (
                            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center border-2 border-card">
                              <span className="text-xs font-bold text-white">★</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                        {member.role && <p className="text-accent font-medium text-sm">{member.role}</p>}
                        {member.domain && (
                          <Badge className={`${getDomainColor(member.domain)} text-white border-0 text-xs mt-2`}>
                            {member.domain}
                          </Badge>
                        )}
                        {member.about && (
                          <p className="text-muted-foreground text-sm mt-3 line-clamp-3">
                            {member.about}
                          </p>
                        )}
                        <SocialButtons member={member} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Faculty Tab */}
              <TabsContent value="faculty">
                {filteredFaculty.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No faculty members found.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredFaculty.map((faculty) => (
                      <div key={faculty.id} className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                          <img
                            src={faculty.image_url || FACULTY_FALLBACK}
                            alt={faculty.name}
                            className="w-full h-full rounded-full object-cover border-4 border-secondary group-hover:border-primary/50 transition-colors"
                          />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">{faculty.name}</h3>
                        {faculty.designation && <p className="text-primary font-medium text-sm">{faculty.designation}</p>}
                        {faculty.department && <p className="text-muted-foreground text-sm mb-3">{faculty.department}</p>}
                        <SocialButtons member={faculty} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Members;
