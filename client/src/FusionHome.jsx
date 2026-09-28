import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function FusionHome({
  onJoinTalent,
  onOpenRecruitAI,
  onHome,
  onJobs,
  onCandidates,
  onEmployers,
  onServices,
  onIndustries,
  onAbout,
  onTerms,
  onContact,
}) {

const industries = [
  {
    icon: "⌘",
    title: "Technology & IT",
    text: "Software, AI, cloud, data, cybersecurity, DevOps, infrastructure and IT support professionals.",
  },
  {
    icon: "✚",
    title: "Healthcare & Life Sciences",
    text: "Healthcare, pharmaceutical, biotechnology, clinical, laboratory, research and medical support professionals.",
  },
  {
    icon: "▤",
    title: "Finance & Banking",
    text: "Banking, accounting, audit, taxation, insurance, payroll, investment and financial services professionals.",
  },
  {
    icon: "◎",
    title: "Sales & Marketing",
    text: "Sales, business development, account management, marketing, communications, content and brand professionals.",
  },
  {
    icon: "◇",
    title: "Human Resources & Legal",
    text: "HR, recruitment, talent acquisition, learning, employee relations, legal and compliance professionals.",
  },
  {
    icon: "▦",
    title: "Logistics & Supply Chain",
    text: "Procurement, logistics, warehousing, transportation, supply chain, inventory and distribution professionals.",
  },
  {
    icon: "✦",
    title: "Hospitality & Retail",
    text: "Hospitality, hotels, travel, retail, customer service, facilities and service-sector professionals.",
  },
  {
    icon: "◈",
    title: "Education & Professional Services",
    text: "Education, training, consulting, research, administration, project management and professional services talent.",
  },
];

const services = [
  {
    number: "01",
    title: "FTE",
    text: "Permanent full-time hiring for long-term workforce requirements.",
  },
  {
    number: "02",
    title: "W2",
    text: "Contract staffing for flexible and project-based workforce requirements.",
  },
  {
    number: "03",
    title: "C2H",
    text: "Contract-to-hire staffing with the potential for permanent employment.",
  },
  {
    number: "04",
    title: "RPO",
    text: "Recruitment process support for sourcing and managing hiring requirements.",
  },
];
  return (
 <div className="sakevra-site">
  {/* NAVIGATION */}
 <FusionNavbar
  onHome={onHome}
  onJobs={onJobs}
  onCandidates={onCandidates}
  onEmployers={onEmployers}
  onServices={onServices}
  onIndustries={onIndustries}
  onAbout={onAbout}
  onTerms={onTerms}
  onContact={onContact}
  onJoinTalent={onJoinTalent}
/>

     <main>
        {/* HERO */}
        <section className="sakevra-hero" id="home">
          <div className="sakevra-hero-glow glow-one" />
          <div className="sakevra-hero-glow glow-two" />

          <div className="sakevra-hero-content">
            <div className="sakevra-hero-copy">
              <div className="sakevra-kicker">
                <span />
                RECRUITMENT ACROSS THE US & UK
              </div>

              <h1>
                Talent moves
                <br />
                businesses <em>forward.</em>
              </h1>

              <p>
                We connect skilled professionals with meaningful
                opportunities and help organisations discover talent
                aligned with their hiring needs.
              </p>

              <div className="sakevra-hero-actions">
                <button
                  className="sakevra-primary"
                  onClick={onJoinTalent}
                >
                  Find Opportunities
                  <span>→</span>
                </button>

                <a
                  href="#employers"
                  className="sakevra-secondary"
                >
                  Hire Talent
                  <span>↗</span>
                </a>
              </div>

              <div className="sakevra-hero-note">
                <div className="hero-note-icon">✓</div>

                <div>
                  <strong>Looking for your next move?</strong>
                  <span>
                    Join our talent community and tell us what
                    you're looking for.
                  </span>
                </div>
              </div>
            </div>
<div className="sakevra-hero-visual premium-hero-visual">

  {/* decorative moving lights */}
  <div className="fusion-orbit orbit-one" />
  <div className="fusion-orbit orbit-two" />

  <div className="hero-photo-main premium-photo">
    <img
      src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
      alt="Professionals collaborating in a modern workplace"
    />

    <div className="hero-photo-overlay" />

    {/* top floating status */}
    <div className="hero-live-pill">
      <span className="live-dot"></span>
      TALENT NETWORK ACTIVE
    </div>

    {/* existing recruitment message */}
    <div className="hero-floating-card">
      <span className="floating-icon">↗</span>

      <div>
        <small>YOUR NEXT MOVE</small>
        <strong>Starts with a conversation.</strong>
      </div>
    </div>

    {/* extra floating card */}
    <div className="hero-match-card">
      <div className="match-icon">✦</div>

      <div>
        <small>SMART CONNECTIONS</small>
        <strong>Talent × Opportunity</strong>
      </div>
    </div>
  </div>

  {/* mini candidate images */}
  <div className="floating-profile profile-one">
    <img
      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
      alt=""
    />
    <span>Talent</span>
  </div>

  <div className="floating-profile profile-two">
    <img
      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
      alt=""
    />
    <span>Connect</span>
  </div>

  <div className="hero-accent-box">
    <span>US</span>
    <i />
    <span>UK</span>
  </div>
</div>
          </div>
        </section>

        {/* CANDIDATE / EMPLOYER PATHS */}
        <section className="sakevra-paths">
          <div className="sakevra-section-container">
            <div className="sakevra-path-card candidate-path">
              <span className="path-label">FOR CANDIDATES</span>

              <h2>
                Your career.
                <br />
                Your next move.
              </h2>

              <p>
                Explore opportunities and join our talent
                community so we can consider your profile for
                relevant roles.
              </p>

              <button onClick={onJoinTalent}>
                Join Our Talent Community
                <span>→</span>
              </button>

              <div className="path-decoration">01</div>
            </div>

            <div
              className="sakevra-path-card employer-path"
              id="employers"
            >
              <span className="path-label">FOR EMPLOYERS</span>

              <h2>
                Build the team
                <br />
                that moves you forward.
              </h2>

              <p>
                Tell us about your hiring requirements and the
                expertise you need for your organisation.
              </p>

              <a href="#contact">
                Request Talent
                <span>→</span>
              </a>

              <div className="path-decoration">02</div>
                        </div>
          </div>
        </section>


        {/* FUSION NETWORK SNAPSHOT */}
        <section className="sakevra-network-snapshot">
          <div className="network-snapshot-inner">

            <div className="network-snapshot-copy">
              <span className="section-eyebrow">
                FUSION NETWORK
              </span>

              <h2>
                A growing network of
                <br />
                <em>opportunity.</em>
              </h2>

              <p>
                Bringing professionals, employers and emerging talent
                together through a growing recruitment network across
                multiple industries.
              </p>
            </div>
<div className="fusion-live-visual">

  <div className="visual-grid"></div>

  <div className="visual-title">
    <span className="visual-live-dot"></span>
    LIVE TALENT FLOW
  </div>

  <div className="talent-flow">

    <div className="flow-column">
      <div className="flow-bar bar-one">
        <span>Technology</span>
      </div>

      <div className="flow-bar bar-two">
        <span>Healthcare</span>
      </div>

      <div className="flow-bar bar-three">
        <span>Finance</span>
      </div>

      <div className="flow-bar bar-four">
        <span>Engineering</span>
      </div>

      <div className="flow-bar bar-five">
        <span>Professional</span>
      </div>
    </div>

    <svg
      className="flow-line-chart"
      viewBox="0 0 500 170"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="fusionLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#ff674d" />
          <stop offset="100%" stopColor="#62dfce" />
        </linearGradient>
      </defs>

      <path
        className="flow-line"
        d="M10 140 C70 120, 90 135, 135 90 S220 115,270 65 S350 85,490 20"
      />

      <circle className="flow-node n1" cx="10" cy="140" r="6" />
      <circle className="flow-node n2" cx="135" cy="90" r="6" />
      <circle className="flow-node n3" cx="270" cy="65" r="6" />
      <circle className="flow-node n4" cx="490" cy="20" r="7" />
    </svg>

  </div>

  <div className="visual-status-row">
    <span>
      <i></i>
      TALENT
    </span>

    <span>
      <i></i>
      MATCH
    </span>

    <span>
      <i></i>
      REVIEW
    </span>

    <span>
      <i></i>
      CONNECT
    </span>
  </div>

</div>
            <div className="network-activity-panel">

              <div className="network-panel-top">
                <strong>NETWORK ACTIVITY</strong>
                <span className="network-live">ACTIVE</span>
              </div>

              <div className="network-bar-item">
                <div className="network-bar-label">
                  <strong>Talent Profiles & CVs</strong>
                  <span>GROWING</span>
                </div>

                <div className="network-bar-track">
                  <div className="network-bar-fill talent"></div>
                </div>
              </div>

              <div className="network-bar-item">
                <div className="network-bar-label">
                  <strong>Job Opportunities</strong>
                  <span>EXPANDING</span>
                </div>

                <div className="network-bar-track">
                  <div className="network-bar-fill jobs"></div>
                </div>
              </div>

              <div className="network-bar-item">
                <div className="network-bar-label">
                  <strong>Employer Connections</strong>
                  <span>BUILDING</span>
                </div>

                <div className="network-bar-track">
                  <div className="network-bar-fill employers"></div>
                </div>
              </div>

              <div className="network-bar-item">
                <div className="network-bar-label">
                  <strong>Students & Graduates</strong>
                  <span>EMERGING</span>
                </div>

                <div className="network-bar-track">
                  <div className="network-bar-fill students"></div>
                </div>
              </div>

              <div className="network-bar-item">
                <div className="network-bar-label">
                  <strong>Talent Connections</strong>
                  <span>ACTIVE</span>
                </div>

                <div className="network-bar-track">
                  <div className="network-bar-fill connections"></div>
                </div>
              </div>

              <div className="network-panel-note">
                Building connections between talent and organisations
                without displaying private recruitment data.
              </div>
            </div>
          </div>
        </section>
        {/* LIVE RECRUITMENT CONNECTION */}
<section className="fusion-connection-section">

  <div className="fusion-connection-bg"></div>

  <div className="fusion-connection-inner">

    <div className="connection-copy">

      <span className="section-eyebrow light">
        LIVE RECRUITMENT CONNECTION
      </span>

      <h2>
        Talent moves through
        <br />
        <em>one connected process.</em>
      </h2>

      <p>
        From employer requirements to talent discovery,
        matching and recruiter review, every stage moves
        toward a meaningful connection.
      </p>

      <div className="connection-tags">
        <span>US TALENT</span>
        <span>UK TALENT</span>
        <span>IT</span>
        <span>NON-IT</span>
      </div>

    </div>

    <div className="connection-engine">

      <div className="engine-orbit orbit-a"></div>
      <div className="engine-orbit orbit-b"></div>
      <div className="engine-orbit orbit-c"></div>

      <div className="engine-center">
        <span>F</span>
        <strong>FUSION</strong>
        <small>CONNECTION</small>
      </div>

      <div className="engine-node node-employer">
        <small>01</small>
        <strong>Employer</strong>
        <span>Requirement</span>
      </div>

      <div className="engine-node node-search">
        <small>02</small>
        <strong>Talent</strong>
        <span>Discovery</span>
      </div>

      <div className="engine-node node-match">
        <small>03</small>
        <strong>Skills</strong>
        <span>Alignment</span>
      </div>

      <div className="engine-node node-review">
        <small>04</small>
        <strong>Recruiter</strong>
        <span>Review</span>
      </div>

     <div className="engine-node node-connect">
  <small>05</small>
  <strong>Candidate</strong>
  <span>Connection</span>
</div>
      <div className="moving-signal signal-one"></div>
      <div className="moving-signal signal-two"></div>
      <div className="moving-signal signal-three"></div>

    </div>

  </div>

</section>
        {/* INDUSTRIES */}
        <section
          className="sakevra-industries"
          id="industries"
        >
          <div className="sakevra-section-container">
            <div className="sakevra-section-heading">
              <div>
                <span className="section-eyebrow">
                  OUR EXPERTISE
                </span>

                <h2>
                  Talent across
                  <br />
                  <em>industries.</em>
                </h2>
              </div>

              <p>
                Different industries require different skills.
                Our recruitment approach starts with understanding
                the role, its requirements and the people who can
                make an impact.
              </p>
            </div>

            {/* IT RECRUITMENT */}
{/* IT + NON-IT RECRUITMENT */}

<div className="recruitment-industry-groups">

  {/* IT RECRUITMENT */}
  <div className="recruitment-industry-group">

    <div className="recruitment-group-title">
      <span>01</span>
      <div>
        <h3>IT Recruitment</h3>
        <p>
          Technology talent across software, AI, cloud, data,
          cybersecurity, DevOps and IT infrastructure.
        </p>
      </div>
    </div>

    <div className="industry-grid">

      <article className="industry-card">
        <div className="industry-icon">⌘</div>
        <h3>Software & Development</h3>
        <p>
          Software engineers, developers, full-stack, frontend,
          backend and application professionals.
        </p>
        <span className="industry-arrow">↗</span>
      </article>

      <article className="industry-card">
        <div className="industry-icon">✦</div>
        <h3>AI, Data & Analytics</h3>
        <p>
          AI, machine learning, data science, data engineering,
          analytics and business intelligence professionals.
        </p>
        <span className="industry-arrow">↗</span>
      </article>

      <article className="industry-card">
        <div className="industry-icon">◇</div>
        <h3>Cloud & DevOps</h3>
        <p>
          Cloud engineers, DevOps, SRE, platform engineering,
          infrastructure and automation professionals.
        </p>
        <span className="industry-arrow">↗</span>
      </article>

      <article className="industry-card">
        <div className="industry-icon">◎</div>
        <h3>Cybersecurity & IT Support</h3>
        <p>
          Cybersecurity, network, systems, infrastructure,
          technical support and IT operations professionals.
        </p>
        <span className="industry-arrow">↗</span>
      </article>

    </div>
  </div>


  {/* NON-IT RECRUITMENT */}
  <div className="recruitment-industry-group">

    <div className="recruitment-group-title">
      <span>02</span>
      <div>
        <h3>Non-IT Recruitment</h3>
        <p>
          Professional talent across healthcare, finance, sales,
          HR, logistics, hospitality and professional services.
        </p>
      </div>
    </div>

    <div className="industry-grid">

      {industries
        .filter((industry) => industry.title !== "Technology & IT")
        .map((industry) => (
          <article
            className="industry-card"
            key={industry.title}
          >
            <div className="industry-icon">
              {industry.icon}
            </div>

            <h3>{industry.title}</h3>
            <p>{industry.text}</p>

            <span className="industry-arrow">↗</span>
          </article>
        ))}
    </div>
  </div>
</div>
          </div>
        </section>

        {/* SERVICES */}
        <section
          className="sakevra-services"
          id="services"
        >
          <div className="sakevra-section-container">
            <div className="services-intro">
              <span className="section-eyebrow light">
                RECRUITMENT SOLUTIONS
              </span>

              <h2>
                Hiring support built
                <br />
                around your needs.
              </h2>

              <p>
                From permanent hiring to flexible talent sourcing,
               Fusion Staffing Solutions helps organisations connect with
                relevant professionals.
              </p>
            </div>

            <div className="services-list">
              {services.map((service) => (
                <article
                  className="service-row"
                  key={service.number}
                >
                  <span className="service-number">
                    {service.number}
                  </span>

                  <h3>{service.title}</h3>

                  <p>{service.text}</p>

                  <span className="service-arrow">↗</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT / TECHNOLOGY */}
        <section
          className="sakevra-about"
          id="about"
        >
          <div className="sakevra-section-container sakevra-about-grid">
            <div className="about-image">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1100&q=85"
                alt="Professionals discussing recruitment requirements"
              />

              <div className="about-image-tag">
                <strong>People first.</strong>
                <span>Technology supported.</span>
              </div>
            </div>

            <div className="about-content">
              <span className="section-eyebrow">
               THE FUSION APPROACH
              </span>

              <h2>
               Human expertise behind 
                <br />
                <em>every hire..</em>
              </h2>

              <p>
                Every role is more than a list of keywords and
                every candidate is more than a CV.
              </p>

              <p>
                We combine recruitment expertise with intelligent
                technology to help identify relevant connections
                while keeping people at the centre of the process.
              </p>

              <div className="about-points">
                <div>
                  <span>01</span>
                  <strong>Understand</strong>
                  <p>
                    Start with the role, goals and requirements.
                  </p>
                </div>

                <div>
                  <span>02</span>
                  <strong>Connect</strong>
                  <p>
                    Identify professionals aligned with the opportunity.
                  </p>
                </div>

                <div>
                  <span>03</span>
                  <strong>Move Forward</strong>
                  <p>
                    Support meaningful conversations between talent
                    and employers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CANDIDATE CTA */}
        <section
          className="sakevra-talent-cta"
          id="candidates"
        >
          <div className="talent-cta-inner">
            <span className="section-eyebrow light">
              Fusion Staffing Solutions
            </span>

            <h2>
              Your next opportunity
              <br />
              could start <em>here.</em>
            </h2>

            <p>
              Create your candidate profile and upload your CV to
              be considered for relevant current and future
              opportunities.
            </p>

            <button onClick={onJoinTalent}>
              Upload Your CV
              <span>→</span>
            </button>
          </div>
        </section>

        {/* CONTACT */}
        <section className="sakevra-contact" id="contact">
          <div className="sakevra-section-container">
            <div>
              <span className="section-eyebrow">
                LET'S TALK
              </span>

              <h2>
                Looking for
                <br />
                the right talent?
              </h2>
            </div>

            <div className="contact-copy">
              <p>
                Tell us about the people, expertise and experience
                your organisation needs.
              </p>

              <a href="mailto:hello@sakevratalent.com">
                Start a Conversation
                <span>↗</span>
              </a>
            </div>
          </div>
          
        </section>
      </main>

      {/* FOOTER */}
      <footer className="sakevra-footer">
        <div className="sakevra-footer-main">
          <div>
            <div className="footer-brand">
             <span className="sakevra-brand-mark">F</span>

              <div>
               <strong>FUSION</strong>
<small>STAFFING SOLUTIONS</small>
              </div>
            </div>
            <p>
              Connecting skilled professionals and organisations
              across the US and UK.
            </p>
          </div>

          <div className="footer-column">
            <strong>Candidates</strong>
            <a href="#candidates">Join Talent Community</a>
            <button onClick={onJoinTalent}>Upload CV</button>
            <a href="#industries">Industries</a>
          </div>

          <div className="footer-column">
            <strong>Employers</strong>
            <a href="#employers">Hire Talent</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-column">
            <strong>Company</strong>
            <a href="#about"> About Fusion</a>
            <a href="#contact">Contact</a>
            <span>Privacy Notice</span>
          </div>
        </div>

       <div className="sakevra-footer-bottom">
  <span>
    © Fusion Staffing Solutions. All Rights Reserved.
  </span>
          <span>
            US <i /> UK
          </span>

          {onOpenRecruitAI && (
            <button onClick={onOpenRecruitAI}>
              Recruiter Access
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}