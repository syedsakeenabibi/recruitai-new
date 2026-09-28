import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function CandidatesPage({
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
  const candidateTypes = [
    {
      number: "01",
      title: "Students",
      text: "Start building your professional profile and become visible for relevant entry-level opportunities.",
    },
    {
      number: "02",
      title: "Graduates",
      text: "Take your first professional step with graduate and early-career opportunities aligned with your background.",
    },
    {
      number: "03",
      title: "Interns & Early Careers",
      text: "Build experience, develop your skills and be considered for relevant early-career opportunities.",
    },
    {
      number: "04",
      title: "Experienced Professionals",
      text: "Explore opportunities that may align with your expertise, experience and next career goals.",
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
              FOR CANDIDATES
            </span>

            <h1>
              Your career.
              <br />
              More <em>possibilities.</em>
            </h1>

            <p>
              Whether you're a student, recent graduate, early-career
              candidate or experienced professional, Fusion Staffing
              Solutions helps make your profile visible for relevant
              employment opportunities.
            </p>

            <div className="sakevra-hero-actions">
              <button
                type="button"
                className="sakevra-primary"
                onClick={onJoinTalent}
              >
                Upload Your CV <span>→</span>
              </button>

              <button
                type="button"
                className="sakevra-secondary"
                onClick={onJobs}
              >
                Explore Opportunities <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=85"
              alt="Professionals discussing career opportunities"
            />
          </div>
        </section>

        {/* TALENT NETWORK */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              JOIN OUR TALENT NETWORK
            </span>

            <h2>
              Put your profile in front
              <br />
              of the right opportunities.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Upload your CV and tell us about your skills, experience,
              qualifications and career preferences. This gives our
              recruitment team the information needed to consider your
              profile when relevant employer requirements arise.
            </p>

            <p>
              Fusion Staffing Solutions supports recruitment across IT
              and non-IT roles, including technology, healthcare,
              engineering, finance, life sciences, sales, marketing,
              human resources, operations and business support.
            </p>

            <p>
              Joining our talent network does not guarantee placement.
              When your profile potentially aligns with a hiring
              requirement, our recruitment team can contact you to
              discuss the opportunity and possible next steps.
            </p>
          </div>
        </section>

        {/* CANDIDATE TYPES */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            EVERY CAREER HAS A STARTING POINT
          </span>

          <h2>Wherever you are in your career, start here.</h2>

          <div className="recruitment-flow-grid">
            {candidateTypes.map((candidate) => (
              <div key={candidate.number}>
                <strong>{candidate.number}</strong>
                <h3>{candidate.title}</h3>
                <p>{candidate.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* IT + NON IT */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              IT & NON-IT CAREERS
            </span>

            <h2>
              Your experience is more
              <br />
              than a <em>job title.</em>
            </h2>

            <p>
              Our talent network can include candidates from technology
              and specialist technical roles as well as professional,
              operational and commercial functions.
            </p>

            <button
              type="button"
              className="sakevra-primary"
              onClick={onIndustries}
            >
              Explore Career Areas →
            </button>
          </div>

          <div className="about-ai-card">
            <span>CAREER AREAS</span>

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
              Operations, Administration & Business Support
            </strong>

            <div>↓</div>

            <span>YOUR NEXT POSSIBILITY</span>
          </div>
        </section>

        {/* PROCESS */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            HOW IT WORKS
          </span>

          <h2>Your profile. Relevant opportunities. Real conversations.</h2>

          <div className="recruitment-flow-grid">
            <div>
              <strong>01</strong>
              <h3>Upload</h3>
              <p>
                Share your CV, experience and career preferences with
                Fusion Staffing Solutions.
              </p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Consider</h3>
              <p>
                Your profile can be considered against relevant employer
                hiring requirements.
              </p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Connect</h3>
              <p>
                When there is a potentially relevant match, our
                recruitment team can contact you about the opportunity.
              </p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Move Forward</h3>
              <p>
                Learn about the role and decide whether you want to
                progress through the employer's recruitment process.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>FUSION TALENT NETWORK</span>

          <h2>Your next opportunity could start with your CV.</h2>

          <p>
            Join our talent network today and make your skills and
            experience available for consideration when relevant
            opportunities arise.
          </p>

          <button
            type="button"
            onClick={onJoinTalent}
          >
            Upload Your CV →
          </button>
        </section>
      </main>
    </div>
  );
}