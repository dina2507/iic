import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StartupContent } from "@/components/startup/StartupContent";
import { Seo } from "@/components/Seo";

export default function Startup() {
  return (
    <div className="min-h-screen">
      <Seo 
        title="Startups Domain"
        description="Where student ideas become real startups. Learn more about the Startups domain at IIC VIT."
      />
      <Navbar />
      <main className="pt-16">
        <StartupContent domainName="Startups" slug="startups" />
      </main>
      <Footer />
    </div>
  );
}
