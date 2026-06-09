import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GallerySection } from "@/components/home/GallerySection";
import { Target, Eye, History, Award, Users, Rocket, BookOpen, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-50" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                About IIC VIT
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Empowering Innovation at{" "}
                <span className="text-gradient">VIT Vellore</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                The Institution's Innovation Council (IIC) at VIT Vellore is dedicated to fostering 
                a culture of innovation, entrepreneurship, and creative problem-solving among students.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Mission */}
              <div className="glass-card p-8 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl gradient-innovation flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To create a vibrant ecosystem that nurtures innovative thinking and entrepreneurial 
                  mindset among students, faculty, and staff of VIT Vellore.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Promote innovation-driven activities and workshops
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Bridge the gap between academia and industry
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Support student startups and innovative projects
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Foster collaboration and knowledge sharing
                  </li>
                </ul>
              </div>

              {/* Vision */}
              <div className="glass-card p-8 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl gradient-institutional flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To be the leading innovation hub that transforms ideas into impactful solutions, 
                  creating a generation of innovators and entrepreneurs who drive positive change.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    Establish VIT Vellore as a center of innovation excellence
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    Create successful student entrepreneurs and innovators
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    Build strong industry-academia partnerships
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    Develop sustainable innovation practices
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                  <History className="w-4 h-4" />
                  Our Journey
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">The IIC Story</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  From humble beginnings to becoming a thriving innovation ecosystem at VIT Vellore.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full gradient-innovation flex items-center justify-center text-accent-foreground font-bold">
                      2018
                    </div>
                    <div className="w-0.5 h-full bg-border mt-4" />
                  </div>
                  <div className="glass-card p-6 rounded-xl flex-1">
                    <h3 className="text-xl font-bold mb-2">Foundation</h3>
                    <p className="text-muted-foreground">
                      IIC VIT Vellore was established under the Ministry of Education's Innovation Cell 
                      initiative to promote innovation and entrepreneurship among students. The council 
                      began with a small team of dedicated faculty and student volunteers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full gradient-institutional flex items-center justify-center text-accent-foreground font-bold">
                      2020
                    </div>
                    <div className="w-0.5 h-full bg-border mt-4" />
                  </div>
                  <div className="glass-card p-6 rounded-xl flex-1">
                    <h3 className="text-xl font-bold mb-2">Growth & Recognition</h3>
                    <p className="text-muted-foreground">
                      Despite the pandemic challenges, IIC VIT Vellore pivoted to virtual events and 
                      workshops, reaching a wider audience. The council received recognition for its 
                      innovative approach to online engagement and student development.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full gradient-innovation flex items-center justify-center text-accent-foreground font-bold">
                      2022
                    </div>
                    <div className="w-0.5 h-full bg-border mt-4" />
                  </div>
                  <div className="glass-card p-6 rounded-xl flex-1">
                    <h3 className="text-xl font-bold mb-2">Expansion</h3>
                    <p className="text-muted-foreground">
                      The council expanded its domains and activities, introducing new verticals like 
                      AI/ML, Cybersecurity, and Content Creation. Partnerships with industry leaders 
                      and successful alumni networks were established.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full gradient-institutional flex items-center justify-center text-accent-foreground font-bold">
                      Now
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-xl flex-1 border-2 border-primary/20">
                    <h3 className="text-xl font-bold mb-2">Present Day</h3>
                    <p className="text-muted-foreground">
                      Today, IIC VIT Vellore stands as a thriving community of innovators, with 8 
                      specialized domains, regular events, and a strong network of mentors and 
                      industry connections. We continue to inspire and support the next generation 
                      of innovators and entrepreneurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do at IIC VIT Vellore.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="glass-card p-6 rounded-xl text-center group hover:scale-105 transition-transform">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Encouraging creative thinking and novel solutions to real-world problems.
                </p>
              </div>

              <div className="glass-card p-6 rounded-xl text-center group hover:scale-105 transition-transform">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <Users className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold mb-2">Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Working together across disciplines to achieve greater impact.
                </p>
              </div>

              <div className="glass-card p-6 rounded-xl text-center group hover:scale-105 transition-transform">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Continuous growth through workshops, mentorship, and hands-on experience.
                </p>
              </div>

              <div className="glass-card p-6 rounded-xl text-center group hover:scale-105 transition-transform">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <Globe className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold mb-2">Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Creating solutions that make a meaningful difference in society.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <GallerySection />
      </main>
      <Footer />
    </div>
  );
};

export default About;
