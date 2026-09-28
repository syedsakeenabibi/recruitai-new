import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function FindJobsPage({
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
              FIND OPPORTUNITIES
            </span>

            <h1>
              Your next career move
              <br />
              could start <em>here.</em>
            </h1>

            <p>
              Explore career opportunities through Fusion Staffing Solutions and join our
              talent community to be considered for relevant current and
              future roles across the US and UK.
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
                onClick={onCandidates}
              >
                Candidate Network <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85"
              alt="Professionals exploring career opportunities"
            />
          </div>
        </section>

        {/* OPPORTUNITIES */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              CAREER OPPORTUNITIES
            </span>

            <h2>
              Find work that matches
              <br />
              where you want to go.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Fusion Staffing Solutions connects professionals with organisations looking
              for relevant skills, experience and expertise.
            </p>

            <p>
              Opportunities may include permanent, contract and
              contract-to-hire positions depending on employer
              requirements.
            </p>

            <p>
              Upload your CV and tell us about your experience and career
              preferences so your profile can be considered when relevant
              opportunities arise.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS - CIRCULAR JOURNEY */}
<section className="fusion-cycle-section">

  <div className="fusion-cycle-heading">
    <span className="section-eyebrow">YOUR JOURNEY</span>

    <h2>
      From your profile to <em>opportunity.</em>
    </h2>

    <p>
      Follow the recruitment journey from joining our talent network
      through to starting and growing in a new opportunity.
    </p>
  </div>

  <div className="fusion-cycle">

    {/* ANIMATED RINGS */}
    <div className="cycle-ring cycle-ring-1"></div>
    <div className="cycle-ring cycle-ring-2"></div>
    <div className="cycle-ring cycle-ring-3"></div>

    {/* CENTER */}
    <div className="cycle-center">
      <div className="cycle-center-pulse"></div>
      <div className="cycle-center-pulse cycle-pulse-delay"></div>

      <span className="cycle-star">✦</span>
      <small>FUSION</small>

      <strong>
        CAREER
        <br />
        JOURNEY
      </strong>

      <div className="cycle-center-line"></div>

      <span className="cycle-center-caption">
        Profile → Opportunity
      </span>
    </div>

    {/* 01 */}
    <article className="cycle-step cycle-step-1 cycle-orange">
      <span className="cycle-number">01</span>
      <div className="cycle-icon">⇧</div>

      <div className="cycle-content">
        <small>START HERE</small>
        <h3>Join & Upload CV</h3>
        <p>
          Create your candidate profile and share your CV,
          experience and career preferences.
        </p>
      </div>
    </article>

    {/* 02 */}
    <article className="cycle-step cycle-step-2 cycle-teal">
      <span className="cycle-number">02</span>
      <div className="cycle-icon">⌕</div>

      <div className="cycle-content">
        <small>PROFILE REVIEW</small>
        <h3>Understand</h3>
        <p>
          Your skills, experience and career preferences help us
          understand the opportunities relevant to you.
        </p>
      </div>
    </article>

    {/* 03 */}
    <article className="cycle-step cycle-step-3 cycle-purple">
      <span className="cycle-number">03</span>
      <div className="cycle-icon">◎</div>

      <div className="cycle-content">
        <small>OPPORTUNITY DISCOVERY</small>
        <h3>Match</h3>
        <p>
          Your profile can be considered against relevant employer
          requirements and available opportunities.
        </p>
      </div>
    </article>

    {/* 04 */}
    <article className="cycle-step cycle-step-4 cycle-blue">
      <span className="cycle-number">04</span>
      <div className="cycle-icon">⇄</div>

      <div className="cycle-content">
        <small>RECRUITER CONTACT</small>
        <h3>Connect</h3>
        <p>
          When there is a potentially relevant opportunity,
          our recruitment team can contact you.
        </p>
      </div>
    </article>

    {/* 05 */}
    <article className="cycle-step cycle-step-5 cycle-pink">
      <span className="cycle-number">05</span>
      <div className="cycle-icon">✓</div>

      <div className="cycle-content">
        <small>EMPLOYER PROCESS</small>
        <h3>Interview</h3>
        <p>
          Suitable candidates may progress to employer interviews,
          assessments or further discussions.
        </p>
      </div>
    </article>

    {/* 06 */}
    <article className="cycle-step cycle-step-6 cycle-gold">
      <span className="cycle-number">06</span>
      <div className="cycle-icon">▤</div>

      <div className="cycle-content">
        <small>SELECTION</small>
        <h3>Offer</h3>
        <p>
          If selected by the employer, you may receive an employment
          offer and discuss the proposed terms.
        </p>
      </div>
    </article>

    {/* 07 */}
    <article className="cycle-step cycle-step-7 cycle-cyan">
      <span className="cycle-number">07</span>
      <div className="cycle-icon">◇</div>

      <div className="cycle-content">
        <small>GET READY</small>
        <h3>Onboarding</h3>
        <p>
          Complete the required onboarding steps after accepting
          an offer and prepare for your start.
        </p>
      </div>
    </article>

    {/* 08 */}
    <article className="cycle-step cycle-step-8 cycle-violet">
      <span className="cycle-number">08</span>
      <div className="cycle-icon">↗</div>

      <div className="cycle-content">
        <small>MOVE FORWARD</small>
        <h3>Start & Grow</h3>
        <p>
          Begin your new opportunity and continue building your
          professional journey.
        </p>
      </div>
    </article>

  </div>
</section>
        {/* INDUSTRIES */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              OPPORTUNITIES ACROSS INDUSTRIES
            </span>

            <h2>
              Different skills.
              <br />
              Different career paths.
            </h2>

            <p>
              Our candidate community includes professionals across
              technology, healthcare, engineering, finance, life sciences,
              sales, marketing, HR, operations and other professional
              disciplines.
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
            <span>YOUR PROFILE</span>
            <div>↓</div>

            <strong>Skills & Experience</strong>
            <div>↓</div>

            <strong>Career Preferences</strong>
            <div>↓</div>

            <strong>Relevant Opportunities</strong>
            <div>↓</div>

            <strong>Recruiter Review</strong>
            <div>↓</div>

            <span>CAREER CONNECTION</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>JOIN THE Fusion Staffing Solutions</span>

          <h2>Ready for your next opportunity?</h2>

          <p>
            Share your professional profile and CV so you can be
            considered for relevant opportunities.
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