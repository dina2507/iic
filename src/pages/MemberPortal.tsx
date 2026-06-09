import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Seo } from "@/components/Seo";
import { MemberProfileForm } from "@/components/member/MemberProfileForm";
import { UserCircle } from "lucide-react";

export default function MemberPortal() {
  return (
    <div className="min-h-screen bg-background">
      <Seo title="Member Portal" description="IIC member profile onboarding." noindex />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-3xl font-bold">IIC Member Profile</h1>
            <p className="text-muted-foreground mt-2">
              Fill in your details below. Once an admin approves your profile, it appears on the
              Members page. You can edit it anytime from your dashboard.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                Photo, contact, and social handles. Each handle can be public or members-only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberProfileForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
