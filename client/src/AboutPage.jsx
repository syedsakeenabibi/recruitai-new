import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function AboutPage({
  onHome,
  onJobs,
  onCandidates,
  onEmployers,
  onServices,
  onIndustries,
  onAbout,
  onTerms,
  onContact,
  onJoinTalent,
}) {

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
  onTerms={onTerms}
  onContact={onContact}
  onJoinTalent={onJoinTalent}
/>
<main>
        {/* HERO */}
        <section className="about-page-hero">
          <div className="about-page-copy">
            <span className="section-eyebrow">
              ABOUT FUSION STAFFING SOLUTIONS
            </span>

            <h1>
              Connecting people,
              <br />
              careers and <em>organisations.</em>
            </h1>

            <p>
              Fusion Staffing Solutions is a recruitment and staffing
              company focused on helping organisations connect with
              relevant talent and helping professionals become visible
              for meaningful career opportunities.
            </p>

            <div className="sakevra-hero-actions">
              <button
                type="button"
                className="sakevra-primary"
                onClick={onJoinTalent}
              >
                Join Our Talent Network <span>→</span>
              </button>

              <button
                type="button"
                className="sakevra-secondary"
                onClick={onContact}
              >
                Hire Talent <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85"
              alt="Professionals working together"
            />
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              WHO WE ARE
            </span>

            <h2>
              Recruitment built around
              <br />
              people and opportunity.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Organisations need people with the right combination of
              skills, experience and potential. Professionals need
              opportunities where their abilities can create value.
            </p>

            <p>
              Fusion Staffing Solutions works between those two needs,
              supporting employers with talent search and recruitment
              while helping candidates make their professional profiles
              available for relevant opportunities.
            </p>

            <p>
              Our recruitment approach can support IT and non-IT roles
              across different industries, functions and career levels.
            </p>
          </div>
        </section>

        {/* WHO WE SUPPORT */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            WHO WE SUPPORT
          </span>

          <h2>Talent at every stage. Hiring across different needs.</h2>

          <div className="recruitment-flow-grid">
            <div>
              <strong>01</strong>
              <h3>Students & Graduates</h3>
              <p>
                Helping emerging talent become visible for internships,
                graduate and entry-level opportunities.
              </p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Experienced Professionals</h3>
              <p>
                Connecting professionals with opportunities that may
                align with their skills and experience.
              </p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Employers</h3>
              <p>
                Supporting organisations looking for relevant people
                across permanent, contract and other hiring requirements.
              </p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Specialist Hiring</h3>
              <p>
                Supporting searches where particular technical,
                professional or industry expertise is required.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              WHAT WE DO
            </span>

            <h2>
              Start with the requirement.
              <br />
              Build the connection.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Employers can share their job descriptions and hiring
              requirements with Fusion Staffing Solutions so we can
              understand the position, responsibilities and expertise
              they are looking for.
            </p>

            <p>
              Relevant candidates can then be identified and considered
              against those requirements before recruiter review and
              potential progression.
            </p>

            <p>
              Candidates can upload their CV, experience and career
              preferences so their profile can be considered when
              potentially relevant opportunities arise.
            </p>
          </div>
        </section>

        {/* PROCESS */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              OUR RECRUITMENT PROCESS
            </span>

            <h2>
              From requirement
              <br />
              to relevant <em>connection.</em>
            </h2>

            <p>
              Each recruitment search begins with understanding what
              the employer needs. Technology can support sourcing and
              matching while recruiter review remains part of the
              process.
            </p>
          </div>

          <div className="about-ai-card">
            <span>HIRING REQUIREMENT</span>

            <div>↓</div>

            <strong>Understand the Role</strong>

            <div>↓</div>

            <strong>Talent Search</strong>

            <div>↓</div>

            <strong>Candidate Matching</strong>

            <div>↓</div>

            <strong>Recruiter Review</strong>

            <div>↓</div>

            <strong>Relevant Profiles</strong>

            <div>↓</div>

            <span>EMPLOYER & CANDIDATE CONNECTION</span>
          </div>
        </section>

        {/* IT + NON IT */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              IT & NON-IT RECRUITMENT
            </span>

            <h2>
              Different industries.
              <br />
              Different expertise.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Technology recruitment can include software, cloud,
              data, AI, cybersecurity, infrastructure, product and
              related digital roles.
            </p>

            <p>
              Non-IT recruitment can include healthcare, engineering,
              finance, accounting, life sciences, HR, sales, marketing,
              operations, administration and business support.
            </p>

            <p>
              The specific search depends on each employer's actual
              hiring requirement.
            </p>
          </div>
        </section>

        {/* APPROACH */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              OUR APPROACH
            </span>

            <h2>
              Human-led.
              <br />
              Technology-supported.
            </h2>

            <p>
              Recruitment technology can help analyse requirements,
              search information and identify potentially relevant
              profiles. But people remain central to recruitment
              conversations and decisions.
            </p>
          </div>

          <div className="about-ai-card">
            <span>PEOPLE + TECHNOLOGY</span>

            <div>↓</div>

            <strong>Understand</strong>

            <div>↓</div>

            <strong>Search</strong>

            <div>↓</div>

            <strong>Match</strong>

            <div>↓</div>

            <strong>Review</strong>

            <div>↓</div>

            <strong>Connect</strong>

            <div>↓</div>

            <span>MOVE FORWARD</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>FUSION STAFFING SOLUTIONS</span>

          <h2>Talent looking for opportunity. Employers looking for talent.</h2>

          <p>
            Whether you're building your career or building your team,
            start the conversation with Fusion Staffing Solutions.
          </p>

          <div className="sakevra-hero-actions">
            <button
              type="button"
              onClick={onJoinTalent}
            >
              Upload Your CV →
            </button>

            <button
              type="button"
              onClick={onContact}
            >
              Hire Talent →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}