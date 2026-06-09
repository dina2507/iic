import { Mail, Linkedin, Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
}

export function FacultySection() {
  const { data: facultyMembers = [], isLoading: loading } = useQuery({
    queryKey: ['faculty-members-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_directory")
        .select("id, name, designation, department, image_url, email, linkedin_url")
        .eq("member_type", "faculty")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FacultyMember[];
    },
  });

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

        {/* Empty State */}
        {facultyMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">
              Faculty information coming soon.
            </p>
          </div>
        )}

        {/* Faculty Grid */}
        {facultyMembers.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
