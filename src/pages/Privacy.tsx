import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Seo } from "@/components/Seo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Seo 
        title="Privacy Policy" 
        description="Privacy Policy for Institution's Innovation Council (IIC) at VIT University"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information Collection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us when you create an account, register for events, submit applications, or contact us. This may include your name, university email address (@vitstudent.ac.in), registration number, phone number, and other profile information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                The information we collect is used to:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process event registrations and certifications</li>
                <li>Send technical notices, updates, and security alerts</li>
                <li>Communicate about upcoming events, workshops, and opportunities</li>
                <li>Respond to your comments, questions, and requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement reasonable security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party service providers (such as Supabase for authentication and database management) to facilitate our services. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:iic@vit.ac.in" className="text-accent hover:underline mt-2 inline-block">iic@vit.ac.in</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
