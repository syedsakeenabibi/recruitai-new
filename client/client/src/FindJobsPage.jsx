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
  const opportunityTypes = [
    {
      number: "01",
      title: "Students & Graduates",
      text: "Start building your career and make your profile available for relevant graduate and entry-level opportunities.",
    },
    {
      number: "02",
      title: "Internships & Early Careers",
      text: "Explore opportunities designed to help early-career professionals gain experience and develop their skills.",
    },
    {
      number: "03",
      title: "Experienced Professionals",
      text: "Take the next step with opportunities that may align with your experience, expertise and career goals.",
    },
    {
      number: "04",
      title: "Contract Opportunities",
      text: "Be considered for flexible, project-based and contract assignments when relevant requirements become available.",
    },
    {
      number: "05",
      title: "Permanent Opportunities",
      text: "Explore long-term career opportunities with organisations looking for relevant professional experience.",
    },
    {
      number: "06",
      title: "Career Moves",
      text: "Ready for something different? Tell us about your transferable skills, interests and the direction you want to take.",
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
              OPPORTUNITIES FOR EVERY CAREER STAGE
            </span>

            <h1>
              Find the opportunity
              <br />
              that moves you <em>forward.</em>
            </h1>

            <p>
              Whether you're a student, recent graduate, early-career
              professional or an experienced specialist, Fusion Staffing
              Solutions helps connect people with relevant employment
              opportunities.
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
                Join Our Talent Network <span>↗</span>
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

        {/* INTRODUCTION */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              FIND YOUR NEXT MOVE
            </span>

            <h2>
              Different careers.
              <br />
              More possibilities.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Fusion Staffing Solutions supports recruitment across IT
              and non-IT roles, helping candidates make their experience,
              skills and career preferences available for relevant
              employer requirements.
            </p>

            <p>
              Opportunities may include permanent, contract,
              contract-to-hire, graduate and early-career positions,
              depending on current employer requirements.
            </p>

            <p>
              Upload your CV and tell us what you're looking for. When
              your profile aligns with a relevant hiring requirement,
              our recruitment team can contact you about the opportunity.
            </p>
          </div>
        </section>

        {/* CAREER OPTIONS */}
       {/* 8-STEP CIRCULAR RECRUITMENT JOURNEY */}
<section className="fusion-cycle-section">

  <div className="fusion-cycle-heading">
    <span className="section-eyebrow">HOW IT WORKS</span>

    <h2>
      From your profile to <em>opportunity.</em>
    </h2>

    <p>
      A clear recruitment journey designed to connect your experience
      with relevant opportunities.
    </p>
  </div>

  <div className="fusion-cycle">

    {/* BACKGROUND CIRCLES */}
    <div className="cycle-ring cycle-ring-1"></div>
    <div className="cycle-ring cycle-ring-2"></div>
    <div className="cycle-ring cycle-ring-3"></div>

    {/* CONNECTION DOTS */}
    <span className="cycle-dot cycle-dot-1"></span>
    <span className="cycle-dot cycle-dot-2"></span>
    <span className="cycle-dot cycle-dot-3"></span>
    <span className="cycle-dot cycle-dot-4"></span>
    <span className="cycle-dot cycle-dot-5"></span>
    <span className="cycle-dot cycle-dot-6"></span>
    <span className="cycle-dot cycle-dot-7"></span>
    <span className="cycle-dot cycle-dot-8"></span>

    {/* CENTER */}
    <div className="cycle-center">
      <div className="cycle-center-pulse"></div>
      <div className="cycle-center-pulse cycle-pulse-delay"></div>

      <span className="cycle-star">✦</span>
      <small>FUSION</small>

      <strong>
        YOUR
        <br />
        JOURNEY
      </strong>

      <div className="cycle-center-line"></div>

      <span className="cycle-center-caption">
        Talent → Opportunity
      </span>
    </div>

    {/* 01 */}
    <article className="cycle-step cycle-step-1 cycle-orange">
      <span className="cycle-number">01</span>

      <div className="cycle-icon">⇧</div>

      <div className="cycle-content">
        <small>START HERE</small>
        <h3>Upload Your CV</h3>

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
        <small>UNDERSTAND YOUR PROFILE</small>
        <h3>Profile Review</h3>

        <p>
          We review your professional information to understand
          your skills, experience and career goals.
        </p>
      </div>
    </article>

    {/* 03 */}
    <article className="cycle-step cycle-step-3 cycle-purple">
      <span className="cycle-number">03</span>

      <div className="cycle-icon">◎</div>

      <div className="cycle-content">
        <small>RELEVANT OPPORTUNITIES</small>
        <h3>Match</h3>

        <p>
          Your profile can be considered against relevant
          employer hiring requirements.
        </p>
      </div>
    </article>

    {/* 04 */}
    <article className="cycle-step cycle-step-4 cycle-blue">
      <span className="cycle-number">04</span>

      <div className="cycle-icon">◌</div>

      <div className="cycle-content">
        <small>START A CONVERSATION</small>
        <h3>Connect</h3>

        <p>
          When a potentially relevant opportunity appears,
          our recruitment team can contact you.
        </p>
      </div>
    </article>

    {/* 05 */}
    <article className="cycle-step cycle-step-5 cycle-pink">
      <span className="cycle-number">05</span>

      <div className="cycle-icon">✓</div>

      <div className="cycle-content">
        <small>MEET THE EMPLOYER</small>
        <h3>Interview Process</h3>

        <p>
          Suitable candidates may progress through interviews,
          assessments and employer discussions.
        </p>
      </div>
    </article>

    {/* 06 */}
    <article className="cycle-step cycle-step-6 cycle-gold">
      <span className="cycle-number">06</span>

      <div className="cycle-icon">▤</div>

      <div className="cycle-content">
        <small>THE NEXT STEP</small>
        <h3>Job Offer</h3>

        <p>
          If selected by the employer, you may receive an offer
          containing the proposed employment terms.
        </p>
      </div>
    </article>

    {/* 07 */}
    <article className="cycle-step cycle-step-7 cycle-cyan">
      <span className="cycle-number">07</span>

      <div className="cycle-icon">◇</div>

      <div className="cycle-content">
        <small>GET STARTED</small>
        <h3>Onboarding</h3>

        <p>
          After accepting an offer, you can complete the required
          onboarding steps before starting the role.
        </p>
      </div>
    </article>

    {/* 08 */}
    <article className="cycle-step cycle-step-8 cycle-violet">
      <span className="cycle-number">08</span>

      <div className="cycle-icon">↗</div>

      <div className="cycle-content">
        <small>KEEP MOVING</small>
        <h3>Grow & Progress</h3>

        <p>
          Begin your new opportunity and continue building
          your professional journey.
        </p>
      </div>
    </article>

  </div>

  {/* BOTTOM FEATURES */}
  <div className="cycle-benefits">

    <div>
      <span>◇</span>
      <p>
        <strong>Recruitment Support</strong>
        Helping connect talent with relevant opportunities.
      </p>
    </div>

    <div>
      <span>◎</span>
      <p>
        <strong>Across Industries</strong>
        Opportunities across IT and non-IT roles.
      </p>
    </div>

    <div>
      <span>◉</span>
      <p>
        <strong>Support Through the Journey</strong>
        From profile submission through recruitment stages.
      </p>
    </div>

    <div>
      <span>✦</span>
      <p>
        <strong>Your Career. Your Choice.</strong>
        Explore opportunities and decide what fits you.
      </p>
    </div>

  </div>

</section>

        {/* IT + NON IT */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              IT & NON-IT OPPORTUNITIES
            </span>

            <h2>
              Your skills can take you
              <br />
              in different <em>directions.</em>
            </h2>

            <p>
              We support hiring requirements across technology and
              professional business functions, helping candidates from
              different backgrounds become visible for relevant roles.
            </p>
          </div>

          <div className="about-ai-card">
            <span>CAREER AREAS</span>

            <div>↓</div>

            <strong>
              Technology, Software, Data & AI
            </strong>

            <div>↓</div>

            <strong>
              Healthcare, Life Sciences & Engineering
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

            <span>MORE CAREER POSSIBILITIES</span>
          </div>
        </section>

        {/* PROCESS */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            HOW IT WORKS
          </span>

          <h2>From your CV to a relevant opportunity.</h2>

          <div className="recruitment-flow-grid">
            <div>
              <strong>01</strong>
              <h3>Join</h3>
              <p>
                Upload your CV and provide your professional and career
                information.
              </p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Match</h3>
              <p>
                Your skills and experience can be considered against
                relevant employer requirements.
              </p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Connect</h3>
              <p>
                If there is a potentially relevant opportunity, our
                recruitment team can contact you.
              </p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Move Forward</h3>
              <p>
                You can learn more about the opportunity and decide
                whether you want to progress.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>FUSION TALENT NETWORK</span>

          <h2>Your next opportunity could start here.</h2>

          <p>
            Don't wait until you see the perfect role. Upload your CV and
            make your profile available for consideration when relevant
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