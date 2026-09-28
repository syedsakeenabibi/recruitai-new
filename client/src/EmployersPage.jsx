import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function EmployersPage({
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
  const hiringSupport = [
    {
      number: "01",
      title: "Share Your Requirement",
      text: "Send us your job description and tell us about the skills, experience, location and other requirements that matter.",
    },
    {
      number: "02",
      title: "Understand the Role",
      text: "We review the requirement to understand the position, responsibilities and candidate profile you need.",
    },
    {
      number: "03",
      title: "Search & Match",
      text: "Relevant professionals can be identified and considered against the requirements of the role.",
    },
    {
      number: "04",
      title: "Recruiter Review",
      text: "Potential candidate matches are reviewed before suitable profiles progress further.",
    },
    {
      number: "05",
      title: "Relevant CVs",
      text: "Relevant candidate profiles can be presented for your consideration based on the hiring requirement.",
    },
    {
      number: "06",
      title: "Move Forward",
      text: "You decide which candidates you want to progress through your organisation's recruitment process.",
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
        {/* HERO */}
        <section className="about-page-hero">
          <div className="about-page-copy">
            <span className="section-eyebrow">
              FOR EMPLOYERS
            </span>

            <h1>
              Your requirement.
              <br />
              The right <em>connection.</em>
            </h1>

            <p>
              Share your hiring requirement with Fusion Staffing Solutions.
              We work to understand the role, identify potentially relevant
              professionals and help your organisation connect with talent
              aligned with your recruitment needs.
            </p>

            <div className="sakevra-hero-actions">
              <button
                type="button"
                className="sakevra-primary"
                onClick={onContact}
              >
                Submit Hiring Requirement <span>→</span>
              </button>

              <button
                type="button"
                className="sakevra-secondary"
                onClick={onServices}
              >
                Explore Recruitment Services <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85"
              alt="Business professionals discussing recruitment requirements"
            />
          </div>
        </section>

        {/* EMPLOYER INTRO */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              HIRING SUPPORT
            </span>

            <h2>
              Tell us who you need.
              <br />
              We start with the role.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Every hiring requirement is different. Send us your job
              description and tell us about the responsibilities, required
              skills, experience, location, employment type and other
              important criteria.
            </p>

            <p>
              Fusion Staffing Solutions can use this information to support
              focused talent sourcing and candidate matching across IT and
              non-IT professional roles.
            </p>

            <p>
              Technology can help support search and matching, while recruiter
              review remains part of the process before candidate profiles
              progress to employers.
            </p>
          </div>
        </section>

        {/* HIRING PROCESS */}
      {/* AI RECRUITMENT JOURNEY */}
<section className="employer-ai-process">

  <div className="employer-ai-heading">
    <span className="section-eyebrow">
      FROM JD TO CANDIDATE
    </span>

    <h2>
      A smarter path from your requirement
      <br />
      to <em>relevant talent.</em>
    </h2>

    <p>
      Share your requirement. Fusion combines technology-supported
      matching with recruiter review to help identify relevant
      professionals for your organisation.
    </p>
  </div>

  <div className="employer-ai-flow">

    {/* 01 */}
    <article className="employer-process-card card-orange">
      <span className="process-number">01</span>

      <div className="process-visual upload-visual">
        <div className="jd-paper">
          <strong>JOB DESCRIPTION</strong>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>

        <div className="visual-bubble">⇧</div>
      </div>

      <span className="process-label">START HERE</span>

      <h3>Share Your Requirement</h3>

      <p>
        Send us your job description and tell us about the skills,
        experience, location and other requirements that matter.
      </p>
    </article>


    <div className="process-arrow">
      <span>→</span>
    </div>


    {/* 02 */}
    <article className="employer-process-card card-blue">
      <span className="process-number">02</span>

      <div className="process-visual analysis-visual">
        <div className="ai-orb-small">
          AI
        </div>

        <div className="analysis-list">
          <span>✓ Skills</span>
          <span>✓ Experience</span>
          <span>✓ Location</span>
          <span>✓ Requirements</span>
        </div>
      </div>

      <span className="process-label">
        AI + RECRUITER ANALYSIS
      </span>

      <h3>Understand the Role</h3>

      <p>
        We review the requirement to understand the position,
        responsibilities and candidate profile you need.
      </p>
    </article>


    <div className="process-arrow">
      <span>→</span>
    </div>


    {/* 03 */}
    <article className="employer-process-card card-teal">
      <span className="process-number">03</span>

      <div className="process-visual candidate-visual">

        <div className="mini-candidate">
          <div className="candidate-avatar">JD</div>
          <i></i>
          <i></i>
        </div>

        <div className="mini-candidate main-candidate">
          <div className="candidate-avatar">CV</div>

          <strong>Relevant Match</strong>

          <div className="match-bar">
            <span></span>
          </div>
        </div>

        <div className="mini-candidate">
          <div className="candidate-avatar">CV</div>
          <i></i>
          <i></i>
        </div>

      </div>

      <span className="process-label">
        TALENT DISCOVERY
      </span>

      <h3>Search & Match</h3>

      <p>
        Relevant professionals can be identified and considered
        against the requirements of the role.
      </p>
    </article>


    {/* CENTER AI */}
    <div className="employer-ai-center">

      <div className="ai-pulse pulse-one"></div>
      <div className="ai-pulse pulse-two"></div>

      <div className="ai-core">
        <small>FUSION</small>
        <strong>AI</strong>
        <span>+</span>
        <small>HUMAN REVIEW</small>
      </div>

      <p>
        Technology supports matching.
        <br />
        People review the connection.
      </p>

    </div>


    {/* 04 */}
    <article className="employer-process-card card-purple">
      <span className="process-number">04</span>

      <div className="process-visual recruiter-visual">

        <div className="review-person">
          <div>R</div>
          <strong>Recruiter</strong>
        </div>

        <div className="review-list">
          <span>✓ Experience</span>
          <span>✓ Skills</span>
          <span>✓ Requirements</span>
        </div>

      </div>

      <span className="process-label">
        HUMAN REVIEW
      </span>

      <h3>Recruiter Review</h3>

      <p>
        Potential candidate matches are reviewed before suitable
        profiles progress further.
      </p>
    </article>


    <div className="process-arrow reverse-arrow">
      <span>→</span>
    </div>


    {/* 05 */}
    <article className="employer-process-card card-coral">
      <span className="process-number">05</span>

      <div className="process-visual cv-visual">

        <div className="cv-sheet cv-back"></div>

        <div className="cv-sheet">
          <div className="cv-avatar">CV</div>

          <strong>Candidate Profile</strong>

          <i></i>
          <i></i>

          <span>✓ Relevant</span>
        </div>

        <div className="cv-sheet cv-back cv-right"></div>

      </div>

      <span className="process-label">
        SHORTLIST
      </span>

      <h3>Relevant CVs</h3>

      <p>
        Relevant candidate profiles can be presented for your
        consideration based on the hiring requirement.
      </p>
    </article>


    <div className="process-arrow reverse-arrow">
      <span>→</span>
    </div>


    {/* 06 */}
    <article className="employer-process-card card-cyan">
      <span className="process-number">06</span>

      <div className="process-visual decision-visual">
        <div className="decision-circle">✓</div>

        <strong>
          YOUR
          <br />
          DECISION
        </strong>

        <span>↗</span>
      </div>

      <span className="process-label">
        EMPLOYER DECISION
      </span>

      <h3>Move Forward</h3>

      <p>
        You decide which candidates you want to progress through
        your organisation's recruitment process.
      </p>
    </article>

  </div>


  <div className="employer-process-bottom">
    <span>
      ✦ Technology-supported matching
    </span>

    <span>
      ✓ Recruiter reviewed
    </span>

    <span>
      ◎ Employer controlled
    </span>
  </div>

</section>

        {/* IT + NON IT */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              IT & NON-IT RECRUITMENT
            </span>

            <h2>
              Different roles.
              <br />
              One recruitment <em>partner.</em>
            </h2>

            <p>
              From specialist technology requirements to professional,
              operational and commercial positions, Fusion Staffing
              Solutions can support organisations across different
              functions and industries.
            </p>

            <button
              type="button"
              className="sakevra-primary"
              onClick={onIndustries}
            >
              Explore Industries →
            </button>
          </div>

          <div className="about-ai-card">
            <span>HIRING AREAS</span>

            <div>↓</div>

            <strong>
              Technology, Software, Cloud, Data & AI
            </strong>

            <div>↓</div>

            <strong>
              Healthcare, Engineering & Life Sciences
            </strong>

            <div>↓</div>

            <strong>
              Finance, HR, Sales & Marketing
            </strong>

            <div>↓</div>

            <strong>
              Operations & Business Support
            </strong>

            <div>↓</div>

            <span>RELEVANT TALENT</span>
          </div>
        </section>

        {/* SERVICES */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            RECRUITMENT SOLUTIONS
          </span>

          <h2>Flexible support for different workforce needs.</h2>

          <div className="recruitment-flow-grid">
            <div>
              <strong>01</strong>
              <h3>Permanent Recruitment</h3>
              <p>
                Candidate sourcing and recruitment support for permanent
                hiring requirements.
              </p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Contract Staffing</h3>
              <p>
                Flexible talent support for project, temporary and changing
                workforce requirements.
              </p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Contract-to-Hire</h3>
              <p>
                A flexible route for organisations considering longer-term
                employment.
              </p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Talent Sourcing</h3>
              <p>
                Focused sourcing based on the skills, experience and
                requirements of each position.
              </p>
            </div>
          </div>
        </section>

        {/* PROCESS VISUAL */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              OUR APPROACH
            </span>

            <h2>
              From hiring requirement
              <br />
              to relevant <em>CVs.</em>
            </h2>

            <p>
              Our process begins with understanding what your organisation
              needs and progresses through talent search, matching and
              recruiter review before suitable profiles are considered
              for submission.
            </p>
          </div>

          <div className="about-ai-card">
            <span>JOB DESCRIPTION</span>
            <div>↓</div>

            <strong>Requirement Analysis</strong>
            <div>↓</div>

            <strong>Talent Search</strong>
            <div>↓</div>

            <strong>Candidate Matching</strong>
            <div>↓</div>

            <strong>Recruiter Review</strong>
            <div>↓</div>

            <strong>Relevant CVs</strong>
            <div>↓</div>

            <span>EMPLOYER DECISION</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>LOOKING FOR TALENT?</span>

          <h2>Send us your next hiring requirement.</h2>

          <p>
            Tell Fusion Staffing Solutions about the role, skills and
            experience your organisation needs and start the recruitment
            conversation.
          </p>

          <button
            type="button"
            onClick={onContact}
          >
            Submit Hiring Requirement →
          </button>
        </section>
      </main>
    </div>
  );
}