import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Linkedin, MessageCircle, Loader2, GraduationCap, Users, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
}

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

const Members = () => {
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [studentMembers, setStudentMembers] = useState<StudentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const [facultyRes, studentsRes] = await Promise.all([
        supabase
          .from("faculty_members")
          .select("id, name, designation, department, image_url, email, linkedin_url")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("student_members")
          .select("id, name, role, domain, image_url, linkedin_url, whatsapp_url, is_core_member")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

      if (!facultyRes.error && facultyRes.data) {
        setFacultyMembers(facultyRes.data);
      }
      if (!studentsRes.error && studentsRes.data) {
        setStudentMembers(studentsRes.data);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const filteredFaculty = facultyMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = studentMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen bg-background">
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

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
                            src={member.image_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face"} 
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
                        <p className="text-accent font-medium text-sm">{member.role}</p>
                        {member.domain && (
                          <Badge className={`${getDomainColor(member.domain)} text-white border-0 text-xs mt-2`}>
                            {member.domain}
                          </Badge>
                        )}
                        <div className="flex justify-center gap-2 mt-4">
                          {member.linkedin_url && (
                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline"><Linkedin className="w-4 h-4" /></Button>
                            </a>
                          )}
                          {member.whatsapp_url && (
                            <a href={member.whatsapp_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline"><MessageCircle className="w-4 h-4" /></Button>
                            </a>
                          )}
                        </div>
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
                            src={faculty.image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"} 
                            alt={faculty.name} 
                            className="w-full h-full rounded-full object-cover border-4 border-secondary group-hover:border-primary/50 transition-colors" 
                          />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">{faculty.name}</h3>
                        <p className="text-primary font-medium text-sm">{faculty.designation}</p>
                        <p className="text-muted-foreground text-sm mb-3">{faculty.department}</p>
                        <div className="flex justify-center gap-2">
                          {faculty.email && (
                            <a href={`mailto:${faculty.email}`}>
                              <Button size="sm" variant="outline"><Mail className="w-4 h-4" /></Button>
                            </a>
                          )}
                          {faculty.linkedin_url && (
                            <a href={faculty.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline"><Linkedin className="w-4 h-4" /></Button>
                            </a>
                          )}
                        </div>
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
