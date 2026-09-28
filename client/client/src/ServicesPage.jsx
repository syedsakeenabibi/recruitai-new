import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function ServicesPage({
  onHome,
  onJobs,
  onCandidates,
  onEmployers,
  onServices,
  onIndustries,
  onAbout,
  onContact,
  onJoinTalent,
}) {
  const services = [
    {
      number: "01",
      title: "Direct Hire",
      text: "Recruitment support for permanent positions and long-term hiring requirements.",
    },
    {
      number: "02",
      title: "Contract Staffing",
      text: "Flexible talent support for temporary, project-based and changing workforce requirements.",
    },
    {
      number: "03",
      title: "Contract-to-Hire",
      text: "A flexible recruitment route for organisations considering longer-term hiring.",
    },
    {
      number: "04",
      title: "Talent Sourcing",
      text: "Focused candidate sourcing based on the skills, experience and requirements of each role.",
    },
  ];

  return (
    <div className="sakevra-site">
      <FusionNavbar
        onHome={onHome}
        onJobs={onJobs}
        onCandidates={onCandidates}
        onEmployers={onEmployers}
        onServices={onServices}
        onIndustries={onIndustries}
        onAbout={onAbout}
        onContact={onContact}
        onJoinTalent={onJoinTalent}
      />

      <main>
        <section className="about-page-hero">
          <div className="about-page-copy">
            <span className="section-eyebrow">
              RECRUITMENT SERVICES
            </span>

            <h1>
              Hiring solutions built
              <br />
              around your <em>needs.</em>
            </h1>

            <p>
              Every organisation hires differently. Sakevra supports
              employers with focused recruitment and talent sourcing
              designed around the requirements of each role.
            </p>

            <div className="sakevra-hero-actions">
              <button
                className="sakevra-primary"
                onClick={onContact}
              >
                Start Hiring <span>→</span>
              </button>

              <button
                className="sakevra-secondary"
                onClick={onEmployers}
              >
                For Employers <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85"
              alt="Recruitment team discussing hiring requirements"
            />
          </div>
        </section>

        <section className="recruitment-flow">
          <span className="section-eyebrow">
            OUR SOLUTIONS
          </span>

          <h2>Recruitment support for different hiring needs.</h2>

          <div className="recruitment-flow-grid">
            {services.map((service) => (
              <div key={service.number}>
                <strong>{service.number}</strong>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              HOW WE WORK
            </span>

            <h2>
              Start with the requirement.
              <br />
              Build the right connection.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              We begin by understanding the position, responsibilities,
              required skills, experience and other important hiring
              requirements.
            </p>

            <p>
              Relevant professionals can then be identified and reviewed
              against the opportunity before progressing through the
              recruitment process.
            </p>

            <p>
              Technology can support sourcing and matching while recruiter
              review remains part of the process.
            </p>
          </div>
        </section>

        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              OUR PROCESS
            </span>

            <h2>
              From requirement
              <br />
              to relevant talent.
            </h2>

            <p>
              Sakevra combines recruitment processes with technology-supported
              matching to help employers identify professionals relevant to
              their hiring requirements.
            </p>
          </div>

          <div className="about-ai-card">
            <span>HIRING REQUIREMENT</span>
            <div>↓</div>

            <strong>Role Understanding</strong>
            <div>↓</div>

            <strong>Candidate Sourcing</strong>
            <div>↓</div>

            <strong>Relevant Matching</strong>
            <div>↓</div>

            <strong>Recruiter Review</strong>
            <div>↓</div>

            <span>CANDIDATE CONNECTION</span>
          </div>
        </section>

        <section className="about-final-cta">
          <span>NEED TO HIRE?</span>

          <h2>Tell us about your next role.</h2>

          <p>
            Share your hiring requirement and start a conversation with
            Sakevra about the talent your organisation needs.
          </p>

          <button onClick={onContact}>
            Start Hiring →
          </button>
        </section>
      </main>
    </div>
  );
}