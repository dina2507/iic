import { useEffect, useState } from "react";
import "./startup.css";

const stats: [string, string][] = [
  ["50+", "Events hosted"],
  ["20+", "Startups mentored"],
  ["5K+", "Students engaged"],
  ["8", "Student domains"],
];

const domains: [string, string][] = [
  ["Innovation", "Idea validation, design thinking, prototypes, and YUKTI-ready student innovation pipelines."],
  ["Startup", "Mentor circles, pitch reviews, founder clinics, and incubation support for campus ventures."],
  ["IPR", "Patent literacy, prior-art search sessions, copyrights, trademarks, and protection strategy."],
  ["Industry Connect", "Founder talks, expert panels, company challenges, and real-world problem statements."],
];

const members: [string, string, string, string][] = [
  ["AM", "Aarav Mehta", "Student Convener", "Startup strategy and founder outreach."],
  ["PS", "Priya Sharma", "Co-Lead", "Mentorship programs and event operations."],
  ["RI", "Rohan Iyer", "Innovation Lead", "Hackathons and prototype reviews."],
  ["AV", "Ananya Verma", "Design Lead", "Campaign systems and visual identity."],
];

const startups: [string, string, string][] = [
  ["N", "Nimbus", "Cloud Ops"],
  ["V", "Verdant", "Agritech"],
  ["P", "Pulse", "Healthtech"],
  ["F", "Forge", "Hardware"],
  ["L", "Lumen", "Edtech"],
];

const events: [string, string, string, string][] = [
  ["Jun 22, 2026", "Founder Fireside", "Closed-room conversation with alumni founders raising their first institutional rounds.", "Anna Auditorium"],
  ["Jul 05, 2026", "Pitch Night", "Five student teams. Five minutes each. Real mentors and angels in the room.", "MB 105"],
  ["Aug 14, 2026", "IPR Sprint", "Hands-on session on patent search, disclosure drafting, and filing pathways.", "SJT Gallery"],
];

export function StartupContent() {
  const [activeMember, setActiveMember] = useState<[string, string, string, string]>(members[0]);

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
  }, []);

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

        <div className="sd-stats-strip" data-reveal>
          {stats.map(([number, label]) => (
            <div className="sd-stat" key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
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

      {/* Domains */}
      <section className="sd-section sd-civic-band" id="sd-domains">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">Council Work</p>
          <h2>Programs that make innovation repeatable.</h2>
        </div>
        <div className="sd-domain-grid">
          {domains.map(([title, copy], index) => (
            <article className="sd-domain-card" data-reveal key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="sd-section sd-team-section" id="sd-team">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">The Team</p>
          <h2>The people behind IIC.</h2>
          <p>Tap any member to read what they are building for the council.</p>
        </div>
        <div className="sd-team-layout">
          <div className="sd-member-grid" data-reveal>
            {members.map((member) => (
              <button
                className={`sd-member-card${activeMember[1] === member[1] ? " active" : ""}`}
                key={member[1]}
                onClick={() => setActiveMember(member)}
                type="button"
              >
                <span className="sd-avatar">{member[0]}</span>
                <strong className="sd-member-name">{member[1]}</strong>
                <small className="sd-member-role">{member[2]}</small>
              </button>
            ))}
          </div>
          <aside className="sd-bio-panel" data-reveal>
            <span className="sd-avatar">{activeMember[0]}</span>
            <h3>{activeMember[1]}</h3>
            <p>{activeMember[2]}</p>
            <strong className="sd-bio-desc">{activeMember[3]}</strong>
          </aside>
        </div>
      </section>

      {/* Portfolio */}
      <section className="sd-section sd-portfolio-section">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">Portfolio</p>
          <h2>Startups we have helped get off the ground.</h2>
        </div>
        <div className="sd-startup-grid" data-reveal>
          {startups.map(([initial, name, sector], index) => (
            <article className={`sd-startup sd-startup-${index}`} key={name}>
              <span className="sd-avatar">{initial}</span>
              <h3>{name}</h3>
              <p>{sector}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="sd-section sd-events-section" id="sd-events">
        <div className="sd-section-heading" data-reveal>
          <p className="sd-section-kicker">Upcoming</p>
          <h2>Events you do not want to miss.</h2>
          <a className="sd-secondary-btn" href="#sd-join">Get on the list</a>
        </div>
        <div className="sd-event-list">
          {events.map(([date, title, copy, venue], index) => (
            <article className={`sd-event-card accent-${index}`} data-reveal key={title}>
              <time>{date}</time>
              <h3>{title}</h3>
              <p>{copy}</p>
              <strong>{venue}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* Join form */}
      <div className="sd-form-zone" id="sd-join">
        <form className="sd-form" data-reveal onSubmit={(e) => e.preventDefault()}>
          <span className="sd-pill">Join the team</span>
          <h2>Build IIC with us.</h2>
          <p>Recruitment opens twice a year. Drop your details and we will reach out when applications go live.</p>
          <input aria-label="Full name" placeholder="Full name" />
          <input aria-label="VIT email" placeholder="VIT email" type="email" />
          <input aria-label="Reason to join" placeholder="Why do you want to join?" />
          <button type="submit">Join us</button>
        </form>
      </div>

      {/* Idea form */}
      <div className="sd-idea-zone" id="sd-idea">
        <form className="sd-form" data-reveal onSubmit={(e) => e.preventDefault()}>
          <span className="sd-pill">Share your idea</span>
          <h2>Got a startup idea?</h2>
          <p>Pitch us in two lines. If we see a spark, we will loop in a mentor and help you take the next step.</p>
          <input aria-label="Your name" placeholder="Your name" />
          <input aria-label="Email" placeholder="Email" type="email" />
          <textarea aria-label="Startup idea" placeholder="Describe your idea in 2-3 lines..." />
          <button type="submit">Share your idea</button>
        </form>
      </div>
    </div>
  );
}
