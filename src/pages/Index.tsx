import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { DomainsSection } from "@/components/home/DomainsSection";
import { FacultySection } from "@/components/home/FacultySection";
import { StudentMembersSection } from "@/components/home/StudentMembersSection";
import { CTASection } from "@/components/home/CTASection";
import { Seo } from "@/components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Seo 
        title="Home"
        description="IIC VIT fosters innovation and entrepreneurship at VIT University."
      />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <DomainsSection />
        <FacultySection />
        <StudentMembersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
