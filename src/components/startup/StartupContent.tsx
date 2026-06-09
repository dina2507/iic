import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "./startup.css";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  domain_role: string;
  image_url: string | null;
}

interface DomainEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string | null;
}

const designationLabel: Record<string, string> = {
  head: "Domain Head",
  coordinator: "Domain Coordinator",
  member: "Member",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatEventDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

// --- Zod Schemas ---

const joinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Must be a valid email")
    .refine((val) => val.endsWith("@vitstudent.ac.in"), {
      message: "Must be a VIT student email (@vitstudent.ac.in)",
    }),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be at most 500 characters"),
});

type JoinFormData = z.infer<typeof joinSchema>;

const ideaSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  email: z.string().email("Must be a valid email"),
  idea: z.string().min(20, "Idea must be at least 20 characters").max(1000, "Idea must be at most 1000 characters"),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

interface StartupContentProps {
  domainName: string;
  slug: string;
}

export function StartupContent({ domainName, slug }: StartupContentProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [isJoinSubmitting, setIsJoinSubmitting] = useState(false);
  const [isIdeaSubmitting, setIsIdeaSubmitting] = useState(false);

  // Order: Head, then Coordinator, then everyone else.
  const orderedMembers = useMemo(() => {
    const rank: Record<string, number> = { head: 0, coordinator: 1, member: 2 };
    return [...members].sort(
      (a, b) => (rank[a.domain_role] ?? 2) - (rank[b.domain_role] ?? 2),
    );
  }, [members]);

  const activeMember =
    orderedMembers.find((m) => m.id === activeMemberId) ?? orderedMembers[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    const fetchTeam = async () => {
      const { data } = await supabase
        .from("student_members")
        .select("id, name, role, domain_role, image_url")
        .eq("domain", domainName)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!cancelled && data) {
        setMembers(data);
        setActiveMemberId((prev) => prev ?? data[0]?.id ?? null);
      }
    };

    const fetchEvents = async () => {
      const { data: domainRow } = await supabase
        .from("domains")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!domainRow) return;

      const { data } = await supabase
        .from("event_domains")
        .select("events(id, title, description, date, venue, is_active)")
        .eq("domain_id", domainRow.id);

      if (cancelled || !data) return;

      const today = new Date().toISOString().split("T")[0];
      const upcoming = data
        .map((row) => row.events as (DomainEvent & { is_active: boolean | null }) | null)
        .filter((ev): ev is DomainEvent & { is_active: boolean | null } => !!ev)
        .filter((ev) => ev.is_active !== false && ev.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
      setEvents(upcoming);
    };

    fetchTeam();
    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [domainName, slug]);

  useEffect(() => {
    const root = document.querySelector(".startup-domain");
    if (!root) return;

    root.classList.add("reveal-ready");
    const nodes = root.querySelectorAll("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [orderedMembers.length, events.length]);

  // --- Join Form ---
  const joinForm = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: { name: "", email: "", reason: "" },
  });

  const handleJoinSubmit = async (data: JoinFormData) => {
    setIsJoinSubmitting(true);
    try {
      const { error } = await supabase.from("join_requests").insert({
        name: data.name,
        email: data.email,
        reason: data.reason,
      });
      if (error) throw error;
      toast.success("Your application has been submitted!");
      joinForm.reset();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Something went wrong. Please try again.");
    } finally {
      setIsJoinSubmitting(false);
    }
  };

  // --- Idea Form ---
  const ideaForm = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { name: "", email: "", idea: "" },
  });

  const handleIdeaSubmit = async (data: IdeaFormData) => {
    setIsIdeaSubmitting(true);
    try {
      const { error } = await supabase.from("idea_submissions").insert({
        name: data.name,
        email: data.email,
        idea: data.idea,
      });
      if (error) throw error;
      toast.success("Your idea has been submitted!");
      ideaForm.reset();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Something went wrong. Please try again.");
    } finally {
      setIsIdeaSubmitting(false);
    }
  };

  return (
    <div className="startup-domain">
      {/* Hero */}
      <section className="sd-hero-section" id="sd-home">
        <div className="sd-hero-copy" data-reveal>
          <span className="sd-eyebrow">
            <span className="sd-eyebrow-dot"></span>
            <span>Institution's Innovation Council · VIT Vellore</span>
          </span>
          <h1>
            <span>Where student ideas become</span> <em>real startups.</em>
          </h1>
          <p>
            A Ministry of Education Innovation Cell initiative on campus, built to
            help students move from ideation to prototype, protection, pitch, and launch.
          </p>
          <div className="sd-hero-actions">
            <a className="sd-primary-btn" href="#sd-join">Join the team <span>↗</span></a>
            <a className="sd-secondary-btn" href="#sd-idea">Share your idea</a>
          </div>
        </div>

        <div className="sd-hero-visual" aria-hidden="true" data-reveal>
          <div className="sd-emblem-card">
            <span className="sd-ministry">MoE · MIC · AICTE</span>
            <div className="sd-big-mark">i</div>
            <p>Innovation, entrepreneurship, IPR, mentorship, and industry access.</p>
          </div>
          <div className="sd-orbit sd-orbit-one"></div>
          <div className="sd-orbit sd-orbit-two"></div>
        </div>
      </section>

      {/* About */}
      <section className="sd-section sd-split" id="sd-about">
        <div data-reveal>
          <p className="sd-section-kicker">Explore</p>
          <h2>Who are we, and what builds the trust?</h2>
        </div>
        <div className="sd-about-copy" data-reveal>
          <p>
            IIC VIT is a student-driven council aligned with MoE's Institution's
            Innovation Council program. We conduct innovation and entrepreneurship
            activities, identify promising student ideas, connect teams to mentors,
            and create a visible pathway from campus problem-solving to ventures.
          </p>
          <div className="sd-note-card">
            Faculty coordinators, trained innovation ambassadors, alumni founders,
            industry experts, and student leads work together to keep the ecosystem
            accountable and useful.
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="sd-section sd-team-section" id="sd-team">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">The Team</p>
          <h2>The people behind IIC.</h2>
          <p>Tap any member to read what they are building for the council.</p>
        </div>
        {orderedMembers.length === 0 ? (
          <p className="sd-empty" data-reveal>
            Team members for this domain will appear here once they are added.
          </p>
        ) : (
          <div className="sd-team-layout">
            <div className="sd-member-grid" data-reveal>
              {orderedMembers.map((member) => (
                <button
                  className={`sd-member-card${activeMember?.id === member.id ? " active" : ""}`}
                  key={member.id}
                  onClick={() => setActiveMemberId(member.id)}
                  type="button"
                >
                  <span className="sd-avatar">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} />
                    ) : (
                      getInitials(member.name)
                    )}
                  </span>
                  <strong className="sd-member-name">{member.name}</strong>
                  <small className="sd-member-role">{member.role}</small>
                </button>
              ))}
            </div>
            {activeMember && (
              <aside className="sd-bio-panel" data-reveal>
                <span className="sd-avatar">
                  {activeMember.image_url ? (
                    <img src={activeMember.image_url} alt={activeMember.name} />
                  ) : (
                    getInitials(activeMember.name)
                  )}
                </span>
                <h3>{activeMember.name}</h3>
                <p>{activeMember.role}</p>
                <strong className="sd-bio-desc">
                  {designationLabel[activeMember.domain_role] ?? "Member"}
                </strong>
              </aside>
            )}
          </div>
        )}
      </section>

      {/* Events */}
      <section className="sd-section sd-events-section" id="sd-events">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">Upcoming</p>
          <h2>Events you do not want to miss.</h2>
          <a className="sd-secondary-btn" href="#sd-join">Get on the list</a>
        </div>
        {events.length === 0 ? (
          <p className="sd-empty" data-reveal>
            No upcoming events for this domain right now. Check back soon.
          </p>
        ) : (
          <div className="sd-event-list">
            {events.map((event, index) => (
              <article className={`sd-event-card accent-${index % 3}`} data-reveal key={event.id}>
                <time>{formatEventDate(event.date)}</time>
                <h3>{event.title}</h3>
                {event.description && <p>{event.description}</p>}
                {event.venue && <strong>{event.venue}</strong>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Join form */}
      <div className="sd-form-zone" id="sd-join">
        <form className="sd-form" data-reveal onSubmit={joinForm.handleSubmit(handleJoinSubmit)}>
          <span className="sd-pill">Join the team</span>
          <h2>Build IIC with us.</h2>
          <p>Recruitment opens twice a year. Drop your details and we will reach out when applications go live.</p>
          <div>
            <input
              aria-label="Full name"
              placeholder="Full name"
              {...joinForm.register("name")}
            />
            {joinForm.formState.errors.name && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{joinForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <input
              aria-label="VIT email"
              placeholder="VIT email"
              type="email"
              {...joinForm.register("email")}
            />
            {joinForm.formState.errors.email && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{joinForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <input
              aria-label="Reason to join"
              placeholder="Why do you want to join?"
              {...joinForm.register("reason")}
            />
            {joinForm.formState.errors.reason && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{joinForm.formState.errors.reason.message}</p>
            )}
          </div>
          <button type="submit" disabled={isJoinSubmitting}>
            {isJoinSubmitting ? "Submitting..." : "Join us"}
          </button>
        </form>
      </div>

      {/* Idea form */}
      <div className="sd-idea-zone" id="sd-idea">
        <form className="sd-form" data-reveal onSubmit={ideaForm.handleSubmit(handleIdeaSubmit)}>
          <span className="sd-pill">Share your idea</span>
          <h2>Got a startup idea?</h2>
          <p>Pitch us in two lines. If we see a spark, we will loop in a mentor and help you take the next step.</p>
          <div>
            <input
              aria-label="Your name"
              placeholder="Your name"
              {...ideaForm.register("name")}
            />
            {ideaForm.formState.errors.name && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{ideaForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <input
              aria-label="Email"
              placeholder="Email"
              type="email"
              {...ideaForm.register("email")}
            />
            {ideaForm.formState.errors.email && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{ideaForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <textarea
              aria-label="Startup idea"
              placeholder="Describe your idea in 2-3 lines..."
              {...ideaForm.register("idea")}
            />
            {ideaForm.formState.errors.idea && (
              <p className="text-sm" style={{ color: "#ef4444", marginTop: "0.25rem" }}>{ideaForm.formState.errors.idea.message}</p>
            )}
          </div>
          <button type="submit" disabled={isIdeaSubmitting}>
            {isIdeaSubmitting ? "Submitting..." : "Share your idea"}
          </button>
        </form>
      </div>
    </div>
  );
}
