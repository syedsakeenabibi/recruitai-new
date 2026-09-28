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
      title: "Permanent Recruitment",
      text: "Recruitment support for organisations looking to hire professionals for permanent and long-term positions.",
    },
    {
      number: "02",
      title: "Contract Staffing",
      text: "Flexible talent support for temporary, project-based and changing workforce requirements.",
    },
    {
      number: "03",
      title: "Contract-to-Hire",
      text: "A flexible recruitment route for organisations considering candidates for longer-term employment.",
    },
    {
      number: "04",
      title: "Talent Sourcing",
      text: "Focused candidate sourcing based on the skills, experience, location and requirements of each role.",
    },
    {
      number: "05",
      title: "IT Recruitment",
      text: "Talent sourcing across software, cloud, data, AI, cybersecurity, infrastructure, product and other technology roles.",
    },
    {
      number: "06",
      title: "Non-IT Recruitment",
      text: "Recruitment support across finance, HR, sales, marketing, operations, healthcare, engineering and other professional functions.",
    },
    {
      number: "07",
      title: "Graduate & Early-Career Hiring",
      text: "Support for organisations looking for graduates, interns, entry-level professionals and developing talent.",
    },
    {
      number: "08",
      title: "Specialist Recruitment",
      text: "Focused search for positions requiring specific professional, technical or industry expertise.",
    },
    {
      number: "09",
      title: "Candidate Screening",
      text: "Candidate information can be reviewed against important role requirements before profiles progress further.",
    },
    {
      number: "10",
      title: "Recruitment Coordination",
      text: "Support across candidate communication, interview coordination and recruitment follow-up.",
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
      {/* ======================================================
    COMPLETE RECRUITMENT SERVICES
====================================================== */}

<section className="fusion-services-pro">

  {/* INTRO */}
  <div className="fsp-intro">
    <div>
      <span className="section-eyebrow">WHAT WE DO</span>

      <h2>
        Recruitment support for
        <br />
        <em>people and businesses.</em>
      </h2>

      <p>
        Fusion Staffing Solutions connects organisations with
        professionals across IT and non-IT functions. From a new
        hiring requirement to candidate sourcing, screening and
        recruitment coordination, our services are built around
        the actual needs of each role.
      </p>
    </div>

    <div className="fsp-intro-image">
      <img
        src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85"
        alt="Recruitment professionals discussing hiring"
      />

      <div className="fsp-image-label">
        <span>FUSION STAFFING SOLUTIONS</span>
        <strong>People • Opportunity • Growth</strong>
      </div>
    </div>
  </div>


  {/* ======================================================
      EMPLOYERS + CANDIDATES + STUDENTS
  ====================================================== */}

  <div className="fsp-audience-heading">
    <span className="section-eyebrow">WHO WE SUPPORT</span>

    <h2>
      One network. Different
      <em> ambitions.</em>
    </h2>

    <p>
      Whether you need to build a team or you're ready to build
      your career, Fusion helps create relevant recruitment
      connections.
    </p>
  </div>

  <div className="fsp-audience-grid">

    {/* EMPLOYERS */}
    <article className="fsp-audience-card">
      <div className="fsp-card-image">
           <img
  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85"
  alt="Students and graduates building their careers"
  loading="eager"
/>       
        <span>FOR EMPLOYERS</span>
      </div>

      <div className="fsp-card-body">
        <small>BUILD YOUR TEAM</small>

        <h3>Looking for the right people?</h3>

        <p>
          Share your job description and hiring requirements.
          We work to understand the position before identifying
          potentially relevant professionals.
        </p>

        <div className="fsp-checks">
          <span>✓ Permanent Recruitment</span>
          <span>✓ Contract Staffing</span>
          <span>✓ Specialist Search</span>
          <span>✓ Candidate Screening</span>
        </div>

        <button type="button" onClick={onContact}>
          Submit Hiring Requirement →
        </button>
      </div>
    </article>


    {/* PROFESSIONALS */}
    <article className="fsp-audience-card featured">
      <div className="fsp-card-image">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=85"
          alt="Professionals collaborating"
        />
        <span>FOR PROFESSIONALS</span>
      </div>

      <div className="fsp-card-body">
        <small>MAKE YOUR NEXT MOVE</small>

        <h3>Experience ready for opportunity?</h3>

        <p>
          Join our talent network and make your skills, experience
          and career preferences available for consideration
          against relevant employer requirements.
        </p>

        <div className="fsp-checks">
          <span>✓ Permanent Roles</span>
          <span>✓ Contract Opportunities</span>
          <span>✓ Career Moves</span>
          <span>✓ Specialist Positions</span>
        </div>

        <button type="button" onClick={onJoinTalent}>
          Upload Your CV →
        </button>
      </div>
    </article>


    {/* STUDENTS */}
    {/* STUDENTS */}
<article className="fsp-audience-card">
  <div className="fsp-card-image">
    <img
      src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=90"
      alt="Students and graduates beginning their careers"
      loading="eager"
    />
    <span>STUDENTS & GRADUATES</span>
  </div>

  <div className="fsp-card-body">
    <small>START YOUR CAREER</small>

    <h3>Building your professional future?</h3>

    <p>
      Students, graduates and early-career professionals can join our
      network and be considered for relevant entry-level and developing
      career opportunities.
    </p>

    <div className="fsp-checks">
      <span>✓ Graduate Opportunities</span>
      <span>✓ Early-Career Roles</span>
      <span>✓ Entry-Level Hiring</span>
      <span>✓ Career Development</span>
    </div>

    <button type="button" onClick={onJoinTalent}>
      Join Talent Network →
    </button>
  </div>
</article>
</div>
{/* ======================================================
      RECRUITMENT SERVICES
  ====================================================== */}

 {/* ======================================================
      VISUAL RECRUITMENT FLOW
  ====================================================== */}

  <div className="fsp-flow-section">

    <div className="fsp-flow-copy">
      <span className="section-eyebrow">
        HOW RECRUITMENT MOVES
      </span>

      <h2>
        From requirement to
        <br />
        <em>connection.</em>
      </h2>

      <p>
        Our process starts with understanding what the employer
        actually needs. Technology can support sourcing and
        matching, while recruiter review remains part of the
        process.
      </p>

      <button type="button" onClick={onEmployers}>
        Explore Employer Services →
      </button>
    </div>

 <div className="fsp-flow-board">

      <div className="fsp-flow-status">
        <span className="fsp-live-dot"></span>
        RECRUITMENT WORKFLOW
      </div>

      <div className="fsp-flow-row">
        <span>01</span>
        <div>
          <strong>Hiring Requirement</strong>
          <small>JD • Skills • Experience • Location</small>
        </div>
        <b>✓</b>
      </div>

      <div className="fsp-flow-line"></div>

      <div className="fsp-flow-row">
        <span>02</span>
        <div>
          <strong>Requirement Analysis</strong>
          <small>Understand what the employer needs</small>
        </div>
        <b>✓</b>
      </div>

      <div className="fsp-flow-line"></div>

      <div className="fsp-flow-row">
        <span>03</span>
        <div>
          <strong>Talent Discovery</strong>
          <small>Search potentially relevant professionals</small>
        </div>
        <b>⌕</b>
      </div>

      <div className="fsp-flow-line"></div>

      <div className="fsp-flow-row active">
        <span>04</span>
        <div>
          <strong>Matching & Review</strong>
          <small>Technology supported • Recruiter reviewed</small>
        </div>
        <b>✦</b>
      </div>

      <div className="fsp-flow-line"></div>

      <div className="fsp-flow-row">
        <span>05</span>
        <div>
          <strong>Relevant Profiles</strong>
          <small>Suitable profiles can progress</small>
        </div>
        <b>→</b>
      </div>

      <div className="fsp-flow-line"></div>

      <div className="fsp-flow-row">
        <span>06</span>
        <div>
          <strong>Employer Connection</strong>
          <small>Employer decides who progresses</small>
        </div>
        <b>◎</b>
      </div>

    </div>

  </div>


  {/* ======================================================
      VISUAL ACTIVITY — NO FAKE NUMBERS
  ====================================================== */}

  <div className="fsp-network-visual">

    <div className="fsp-network-top">
      <div>
        <span className="section-eyebrow light">
          TALENT CONNECTION NETWORK
        </span>

        <h2>
          Different needs.
          <br />
          One connected <em>process.</em>
        </h2>
      </div>

      <p>
        Our recruitment model brings together employer requirements,
        candidate experience and recruiter review to support more
        focused recruitment conversations.
      </p>
    </div>


    <div className="fsp-activity-grid">

      <div className="fsp-activity">
        <div>
          <span>EMPLOYER REQUIREMENTS</span>
          <strong>Hiring Demand</strong>
        </div>

        <div className="fsp-bars">
          <i style={{ height: "35%" }}></i>
          <i style={{ height: "53%" }}></i>
          <i style={{ height: "45%" }}></i>
          <i style={{ height: "68%" }}></i>
          <i style={{ height: "61%" }}></i>
          <i style={{ height: "82%" }}></i>
          <i style={{ height: "74%" }}></i>
          <i style={{ height: "91%" }}></i>
        </div>
      </div>


      <div className="fsp-activity">
        <div>
          <span>TALENT NETWORK</span>
          <strong>Career Stages</strong>
        </div>

        <div className="fsp-stage-rings">
          <span>Students</span>
          <span>Graduates</span>
          <span>Professionals</span>
          <span>Specialists</span>
        </div>
      </div>


      <div className="fsp-activity">
        <div>
          <span>RECRUITMENT PROCESS</span>
          <strong>Connected Workflow</strong>
        </div>

        <div className="fsp-pulse-chart">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>

        <small>
          SOURCE → MATCH → REVIEW → CONNECT
        </small>
      </div>

    </div>

  </div>


  {/* FINAL CTA */}

  <div className="fsp-final">

    <div>
      <span>FOR EMPLOYERS</span>

      <h2>Have a role to fill?</h2>

      <p>
        Tell us about the skills and experience your organisation needs.
      </p>

      <button type="button" onClick={onContact}>
        Start Hiring →
      </button>
    </div>

    <div>
      <span>FOR TALENT</span>

      <h2>Ready for your next move?</h2>

      <p>
        Join our network and make your profile available for relevant opportunities.
      </p>

      <button type="button" onClick={onJoinTalent}>
        Upload Your CV →
      </button>
    </div>

  </div>

</section>

        {/* SERVICES */}
       {/* =====================================================
    OUR SERVICES - PREMIUM VISUAL SECTION
===================================================== */}
{/* =========================================================
    OUR SERVICES — COMPLETE PREMIUM SECTION
========================================================= */}

<section className="fusion-services-showcase">

  {/* HEADER */}
  <div className="fss-header">
    <div>
      <span className="section-eyebrow">OUR SERVICES</span>

      <h2>
        Recruitment support built for
        <br />
        <em>real workforce needs.</em>
      </h2>
    </div>

    <div className="fss-header-copy">
      <p>
        From a single specialist hire to flexible staffing,
        graduate recruitment and wider talent sourcing, Fusion
        Staffing Solutions supports employers through different
        stages of the recruitment process.
      </p>

      <p>
        Every search starts with the actual requirement — the role,
        skills, experience, location, employment model and business
        priorities that matter.
      </p>
    </div>
  </div>


  {/* =====================================================
      FEATURED SERVICE 01 — PERMANENT RECRUITMENT
  ===================================================== */}

  <article className="fss-feature">

    <div className="fss-feature-image">
      <img
        src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85"
        alt="Employers discussing permanent recruitment"
      />

      <div className="fss-image-overlay"></div>

      <span className="fss-feature-number">01</span>

      <div className="fss-image-caption">
        <small>LONG-TERM HIRING</small>
        <strong>Build the team behind your next move.</strong>
      </div>
    </div>

    <div className="fss-feature-content">
      <span className="fss-category">
        PERMANENT RECRUITMENT
      </span>

      <h3>
        Find professionals for
        <br />
        long-term <em>growth.</em>
      </h3>

      <p>
        We support organisations looking to recruit professionals
        into permanent and long-term positions. The process begins
        by understanding the position before potentially relevant
        talent is identified.
      </p>

      <div className="fss-detail-list">
        <span>✓ Role & requirement understanding</span>
        <span>✓ Focused candidate sourcing</span>
        <span>✓ Skills & experience alignment</span>
        <span>✓ Recruiter review</span>
        <span>✓ Relevant candidate profiles</span>
      </div>

      <button type="button" onClick={onContact}>
        Start Permanent Hiring <b>↗</b>
      </button>
    </div>

  </article>


  {/* =====================================================
      FEATURED SERVICE 02 — CONTRACT STAFFING
  ===================================================== */}

  <article className="fss-feature fss-feature-reverse">

    <div className="fss-feature-image">
      <img
        src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85"
        alt="Professional team collaborating"
      />

      <div className="fss-image-overlay"></div>

      <span className="fss-feature-number">02</span>

      <div className="fss-image-caption">
        <small>FLEXIBLE WORKFORCE</small>
        <strong>Talent that adapts to changing needs.</strong>
      </div>
    </div>

    <div className="fss-feature-content">
      <span className="fss-category">
        CONTRACT STAFFING
      </span>

      <h3>
        Flexible talent when
        <br />
        your business <em>needs it.</em>
      </h3>

      <p>
        Support for temporary, project-based and changing workforce
        requirements where organisations need greater flexibility
        without treating every hiring need as a permanent position.
      </p>

      <div className="fss-detail-list">
        <span>✓ Temporary requirements</span>
        <span>✓ Project-based talent</span>
        <span>✓ Flexible workforce support</span>
        <span>✓ Contract professionals</span>
        <span>✓ Changing workforce requirements</span>
      </div>

      <button type="button" onClick={onContact}>
        Discuss Contract Staffing <b>↗</b>
      </button>
    </div>

  </article>


  {/* =====================================================
      SERVICE EXPLORER
  ===================================================== */}

  <div className="fss-explorer-heading">
    <div>
      <span className="section-eyebrow">
        EXPLORE OUR CAPABILITIES
      </span>

      <h2>
        More ways we support
        <br />
        <em>hiring and careers.</em>
      </h2>
    </div>

    <p>
      Recruitment requirements differ by industry, career stage,
      employment model and level of specialisation. Our services
      can be shaped around those differences.
    </p>
  </div>


  <div className="fss-services-grid">

    {/* 03 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>03</span>
        <b>⇄</b>
      </div>

      <small>FLEXIBLE → LONG TERM</small>

      <h3>Contract-to-Hire</h3>

      <p>
        A flexible recruitment route for organisations considering
        professionals for potential longer-term employment.
      </p>

      <div className="fss-card-tags">
        <span>Flexible</span>
        <span>Evaluation</span>
        <span>Long-Term</span>
      </div>

      <div className="fss-card-footer">
        <span>Employer Service</span>
        <b>↗</b>
      </div>
    </article>


    {/* 04 */}
    <article className="fss-service-card fss-highlight-card">
      <div className="fss-card-top">
        <span>04</span>
        <b>⌕</b>
      </div>

      <small>SEARCH → IDENTIFY → REVIEW</small>

      <h3>Talent Sourcing</h3>

      <p>
        Focused candidate discovery based on the skills, experience,
        location and requirements that matter for a particular role.
      </p>

      <div className="fss-card-tags">
        <span>Search</span>
        <span>Matching</span>
        <span>Discovery</span>
      </div>

      <div className="fss-card-footer">
        <span>Employer Service</span>
        <b>↗</b>
      </div>
    </article>


    {/* 05 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>05</span>
        <b>⌘</b>
      </div>

      <small>TECHNOLOGY TALENT</small>

      <h3>IT & Digital Recruitment</h3>

      <p>
        Recruitment across software, cloud, AI, data, cybersecurity,
        DevOps, infrastructure, product and other technology functions.
      </p>

      <div className="fss-card-tags">
        <span>Software</span>
        <span>AI & Data</span>
        <span>Cloud</span>
      </div>

      <div className="fss-card-footer">
        <span>Specialist Hiring</span>
        <b>↗</b>
      </div>
    </article>


    {/* 06 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>06</span>
        <b>◇</b>
      </div>

      <small>BUSINESS FUNCTIONS</small>

      <h3>Professional Recruitment</h3>

      <p>
        Recruitment support across finance, HR, sales, marketing,
        operations and other professional business functions.
      </p>

      <div className="fss-card-tags">
        <span>Finance</span>
        <span>HR</span>
        <span>Commercial</span>
      </div>

      <div className="fss-card-footer">
        <span>Professional Talent</span>
        <b>↗</b>
      </div>
    </article>


    {/* 07 */}
    <article className="fss-service-card fss-graduate-card">
      <div className="fss-card-top">
        <span>07</span>
        <b>✦</b>
      </div>

      <small>EMERGING TALENT</small>

      <h3>Graduate & Early Careers</h3>

      <p>
        Recruitment support for organisations seeking graduates,
        entry-level professionals and developing early-career talent.
      </p>

      <div className="fss-card-tags">
        <span>Students</span>
        <span>Graduates</span>
        <span>Entry Level</span>
      </div>

      <div className="fss-card-footer">
        <span>Early Careers</span>
        <b>↗</b>
      </div>
    </article>


    {/* 08 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>08</span>
        <b>◎</b>
      </div>

      <small>FOCUSED EXPERTISE</small>

      <h3>Specialist Recruitment</h3>

      <p>
        Focused searches for positions requiring specific technical,
        functional, professional or industry expertise.
      </p>

      <div className="fss-card-tags">
        <span>Specialist</span>
        <span>Technical</span>
        <span>Industry</span>
      </div>

      <div className="fss-card-footer">
        <span>Specialist Search</span>
        <b>↗</b>
      </div>
    </article>


    {/* 09 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>09</span>
        <b>✓</b>
      </div>

      <small>REVIEW → ALIGN → PROGRESS</small>

      <h3>Candidate Screening</h3>

      <p>
        Candidate information can be reviewed against relevant role
        criteria before profiles are considered for further progression.
      </p>

      <div className="fss-card-tags">
        <span>Experience</span>
        <span>Skills</span>
        <span>Requirements</span>
      </div>

      <div className="fss-card-footer">
        <span>Candidate Review</span>
        <b>↗</b>
      </div>
    </article>


    {/* 10 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>10</span>
        <b>↗</b>
      </div>

      <small>CONNECT → INTERVIEW → FOLLOW UP</small>

      <h3>Recruitment Coordination</h3>

      <p>
        Support across candidate communication, interview coordination
        and recruitment follow-up as the hiring process progresses.
      </p>

      <div className="fss-card-tags">
        <span>Communication</span>
        <span>Interview</span>
        <span>Follow-Up</span>
      </div>

      <div className="fss-card-footer">
        <span>Coordination</span>
        <b>↗</b>
      </div>
    </article>


    {/* 11 */}
    <article className="fss-service-card fss-highlight-card">
      <div className="fss-card-top">
        <span>11</span>
        <b>▦</b>
      </div>

      <small>MULTIPLE REQUIREMENTS</small>

      <h3>Volume Hiring Support</h3>

      <p>
        Structured recruitment support when organisations need
        candidate sourcing across multiple positions or recurring
        workforce requirements.
      </p>

      <div className="fss-card-tags">
        <span>Multiple Roles</span>
        <span>Structured</span>
        <span>Scalable</span>
      </div>

      <div className="fss-card-footer">
        <span>Workforce Support</span>
        <b>↗</b>
      </div>
    </article>


    {/* 12 */}
    <article className="fss-service-card">
      <div className="fss-card-top">
        <span>12</span>
        <b>◉</b>
      </div>

      <small>CURRENT + FUTURE TALENT</small>

      <h3>Talent Network</h3>

      <p>
        Building connections with students, graduates, experienced
        professionals and specialists who may align with relevant
        current or future requirements.
      </p>

      <div className="fss-card-tags">
        <span>Graduates</span>
        <span>Professionals</span>
        <span>Specialists</span>
      </div>

      <div className="fss-card-footer">
        <span>Talent Community</span>
        <b>↗</b>
      </div>
    </article>

  </div>


  {/* =====================================================
      IMAGE SERVICE STORY
  ===================================================== */}

  <div className="fss-story">

    <div className="fss-story-copy">
      <span className="section-eyebrow light">
        RECRUITMENT FROM BOTH SIDES
      </span>

      <h2>
        Businesses need talent.
        <br />
        People need <em>opportunity.</em>
      </h2>

      <p>
        Fusion Staffing Solutions sits between those two needs.
        Employers bring hiring requirements. Candidates bring
        experience, skills and career ambitions. Our role is to
        support relevant connections through structured recruitment.
      </p>

      <div className="fss-story-flow">

        <div>
          <b>01</b>
          <span>
            <strong>Employer Requirement</strong>
            <small>Role • JD • Skills • Experience</small>
          </span>
        </div>

        <i>↓</i>

        <div>
          <b>02</b>
          <span>
            <strong>Talent Discovery</strong>
            <small>Search • Source • Identify</small>
          </span>
        </div>

        <i>↓</i>

        <div className="active">
          <b>03</b>
          <span>
            <strong>Match & Recruiter Review</strong>
            <small>Technology supported • Human reviewed</small>
          </span>
        </div>

        <i>↓</i>

        <div>
          <b>04</b>
          <span>
            <strong>Relevant Connection</strong>
            <small>Employer ↔ Candidate</small>
          </span>
        </div>

      </div>
    </div>


    <div className="fss-story-images">

      <div className="fss-story-main-image">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85"
          alt="Recruitment meeting"
        />

        <div>
          <span>FOR EMPLOYERS</span>
          <strong>Tell us who you need.</strong>
          <button type="button" onClick={onContact}>
            Submit Requirement →
          </button>
        </div>
      </div>

      <div className="fss-story-small-images">

        <div>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=85"
            alt="Experienced professionals"
          />

          <span>
            <small>PROFESSIONALS</small>
            <strong>Bring your experience.</strong>
          </span>
        </div>

        <div>
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=85"
            alt="Students and graduates"
          />

          <span>
            <small>STUDENTS & GRADUATES</small>
            <strong>Start building your future.</strong>
          </span>
        </div>

      </div>
    </div>

  </div>


  {/* =====================================================
      VISUAL CAPABILITY BAR — NO FAKE NUMBERS
  ===================================================== */}

  <div className="fss-capability">

    <div className="fss-capability-heading">
      <span>THE FUSION RECRUITMENT MODEL</span>

      <h2>
        One connected recruitment
        <br />
        <em>ecosystem.</em>
      </h2>

      <p>
        Different services connect at different stages of the
        recruitment journey.
      </p>
    </div>

    <div className="fss-capability-visual">

      <div className="fss-cap-line">
        <span>Role Understanding</span>
        <div><i style={{ width: "82%" }}></i></div>
        <b>01</b>
      </div>

      <div className="fss-cap-line">
        <span>Talent Sourcing</span>
        <div><i style={{ width: "92%" }}></i></div>
        <b>02</b>
      </div>

      <div className="fss-cap-line">
        <span>Candidate Matching</span>
        <div><i style={{ width: "75%" }}></i></div>
        <b>03</b>
      </div>

      <div className="fss-cap-line">
        <span>Recruiter Review</span>
        <div><i style={{ width: "87%" }}></i></div>
        <b>04</b>
      </div>

      <div className="fss-cap-line">
        <span>Employer Connection</span>
        <div><i style={{ width: "68%" }}></i></div>
        <b>05</b>
      </div>

      <small className="fss-cap-note">
        Visual representation of the recruitment workflow — not
        performance percentages.
      </small>

    </div>

  </div>


  {/* =====================================================
      FINAL TWO-SIDED CTA
  ===================================================== */}

  <div className="fss-final">

    <div className="fss-final-employer">
      <small>FOR EMPLOYERS & RECRUITERS</small>

      <h2>
        Have a hiring
        <br />
        <em>requirement?</em>
      </h2>

      <p>
        Send us the role, job description and important hiring
        criteria. We'll start by understanding what you need.
      </p>

      <button type="button" onClick={onContact}>
        Submit Hiring Requirement →
      </button>
    </div>


    <div className="fss-final-talent">
      <small>FOR PROFESSIONALS & GRADUATES</small>

      <h2>
        Ready for your
        <br />
        <em>next move?</em>
      </h2>

      <p>
        Join the Fusion talent network and make your profile
        available for relevant opportunities.
      </p>

      <button type="button" onClick={onJoinTalent}>
        Upload Your CV →
      </button>
    </div>

  </div>

</section>
  
  {/* HUMAN + TECHNOLOGY */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              HUMAN-LED. TECHNOLOGY-SUPPORTED.
            </span>

            <h2>
              Better tools.
              <br />
              Human recruitment decisions.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Technology can support role analysis, candidate search
              and matching by helping identify potentially relevant
              profiles.
            </p>

            <p>
              Recruiter review remains important because experience,
              career goals and hiring requirements cannot always be
              understood from keywords alone.
            </p>

            <p>
              Employers remain responsible for deciding which candidates
              they want to progress through their recruitment and
              selection process.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>NEED TO HIRE?</span>

          <h2>Tell us about the talent you need.</h2>

          <p>
            Share your hiring requirement with Fusion Staffing Solutions
            and start a conversation about the skills, experience and
            professionals your organisation is looking for.
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