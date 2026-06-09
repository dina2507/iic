import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Instagram, Linkedin, Twitter } from "lucide-react";
import iicLogo from "@/assets/iic-logo.png";

const footerLinks = {
  quickLinks: [
    { label: "About Us", href: "/about" },
    { label: "Events", href: "/events" },
    { label: "Domains", href: "/domains" },
    { label: "Members", href: "/members" },
    { label: "Contact", href: "/contact" },
  ],
  domains: [
    { label: "Events", href: "/domains#events" },
    { label: "Design", href: "/domains#design" },
    { label: "Editorial", href: "/domains#editorial" },
    { label: "Startups", href: "/domains#startups" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={iicLogo} 
                alt="IIC VIT Logo" 
                className="h-14 w-auto"
              />
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Fostering innovation and entrepreneurship among students at VIT University through workshops, events, and mentorship programs.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/iicvit/" target="_blank" rel="noopener noreferrer" aria-label="Follow IIC VIT on Instagram" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/iicvit/" target="_blank" rel="noopener noreferrer" aria-label="Follow IIC VIT on LinkedIn" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/IICVIT" target="_blank" rel="noopener noreferrer" aria-label="Follow IIC VIT on Twitter" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Domains */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Our Domains</h4>
            <ul className="space-y-3">
              {footerLinks.domains.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="text-primary-foreground/80 text-sm">
                  VIT University, Vellore, Tamil Nadu - 632014
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span className="text-primary-foreground/80 text-sm">iic@vit.ac.in</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span className="text-primary-foreground/80 text-sm">+91 416 220 2000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} Institution's Innovation Council, VIT. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
