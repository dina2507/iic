import { Target, Lightbulb, Users, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Innovation First",
    description: "We foster a culture where creative ideas are celebrated and nurtured into impactful solutions.",
  },
  {
    icon: Users,
    title: "Collaborative Spirit",
    description: "Our diverse community brings together minds from various disciplines to create meaningful innovation.",
  },
  {
    icon: Target,
    title: "Goal-Oriented",
    description: "Every initiative is designed to help students achieve their entrepreneurial and innovation goals.",
  },
  {
    icon: TrendingUp,
    title: "Growth Focused",
    description: "We provide resources, mentorship, and opportunities for continuous personal and professional growth.",
  },
];

export function AboutSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              About IIC
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Empowering the Next Generation of{" "}
              <span className="text-accent">Innovators</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              The Institution's Innovation Council (IIC) at VIT University is a dynamic hub that nurtures creativity, entrepreneurship, and technological advancement. We bridge the gap between academic learning and real-world innovation through hands-on experiences, industry connections, and expert mentorship.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute inset-0 gradient-innovation rounded-3xl opacity-20 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl gradient-institutional flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <div className="text-5xl font-bold text-primary-foreground mb-2">9</div>
                    <div className="text-primary-foreground/80">Specialized Domains</div>
                  </div>
                </div>
                <div className="aspect-square rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Lightbulb className="w-10 h-10 text-accent mx-auto mb-2" />
                    <div className="text-sm font-medium text-foreground">Ideas to Impact</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl bg-secondary flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl font-bold text-foreground mb-1">10+</div>
                    <div className="text-sm text-muted-foreground">Years of Excellence</div>
                  </div>
                </div>
                <div className="aspect-[4/5] rounded-2xl gradient-innovation flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <Users className="w-10 h-10 text-accent-foreground mx-auto mb-2" />
                    <div className="text-3xl font-bold text-accent-foreground mb-1">VIT</div>
                    <div className="text-accent-foreground/80 text-sm">Innovation Hub</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
