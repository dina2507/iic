import { useState, useEffect } from "react";
import { Mail, Linkedin, Loader2 } from "lucide-react";
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

// Fallback data when database is empty
const fallbackFaculty: FacultyMember[] = [
  {
    id: "1",
    name: "Dr. Ramesh Kumar",
    designation: "Faculty Coordinator, IIC",
    department: "School of Computer Science",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    email: "ramesh.kumar@vit.ac.in",
    linkedin_url: "#",
  },
  {
    id: "2",
    name: "Dr. Priya Sharma",
    designation: "Associate Coordinator",
    department: "School of Management",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    email: "priya.sharma@vit.ac.in",
    linkedin_url: "#",
  },
  {
    id: "3",
    name: "Prof. Anil Mehta",
    designation: "Innovation Mentor",
    department: "School of Engineering",
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    email: "anil.mehta@vit.ac.in",
    linkedin_url: "#",
  },
  {
    id: "4",
    name: "Dr. Sunita Patel",
    designation: "Startup Advisor",
    department: "School of Business",
    image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    email: "sunita.patel@vit.ac.in",
    linkedin_url: "#",
  },
];

export function FacultySection() {
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>(fallbackFaculty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      const { data, error } = await supabase
        .from("faculty_members")
        .select("id, name, designation, department, image_url, email, linkedin_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setFacultyMembers(data);
      }
      setLoading(false);
    };

    fetchFaculty();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Faculty Mentors
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Guided by <span className="text-primary">Excellence</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Our dedicated faculty members bring years of experience and expertise to mentor the next generation of innovators.
          </p>
        </div>

        {/* Faculty Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {facultyMembers.map((faculty, index) => (
            <div
              key={faculty.id}
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={faculty.image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"}
                    alt={faculty.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                  
                  {/* Overlay Social Links */}
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    {faculty.email && (
                      <a
                        href={`mailto:${faculty.email}`}
                        className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
                        aria-label={`Email ${faculty.name}`}
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                    {faculty.linkedin_url && faculty.linkedin_url !== "#" && (
                      <a
                        href={faculty.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
                        aria-label={`${faculty.name}'s LinkedIn`}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 text-center">
                  <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                    {faculty.name}
                  </h3>
                  <p className="text-accent text-sm font-medium mb-1">
                    {faculty.designation}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {faculty.department}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
