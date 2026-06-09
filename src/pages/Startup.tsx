import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StartupContent } from "@/components/startup/StartupContent";

export default function Startup() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <StartupContent domainName="Startups" slug="startups" />
      </main>
      <Footer />
    </div>
  );
}
