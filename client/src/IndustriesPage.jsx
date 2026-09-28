import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function IndustriesPage({
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

  const industries = [
    {
      icon: "⌘",
      title: "Technology & Digital",
      text: "Building digital products and platforms — software, AI, data, cloud, cybersecurity, DevOps, product and digital transformation.",
    },
    {
      icon: "⚙",
      title: "Engineering & Infrastructure",
      text: "Designing, building and maintaining physical systems — civil projects, electrical systems, mechanical design, construction and infrastructure.",
    },
    {
      icon: "✚",
      title: "Healthcare & Clinical",
      text: "Supporting patient care and healthcare delivery — clinical services, care operations, medical administration and healthcare management.",
    },
    {
      icon: "◈",
      title: "Life Sciences & Pharma",
      text: "Advancing science and medicine — biotechnology, drug development, laboratories, clinical research, regulatory affairs and quality.",
    },
    {
      icon: "↗",
      title: "Finance, Banking & Insurance",
      text: "Managing money, risk and financial performance — banking, accounting, audit, taxation, insurance, investment and financial planning.",
    },
    {
      icon: "◎",
      title: "Sales & Business Growth",
      text: "Creating revenue and expanding markets — business development, enterprise sales, partnerships, account management and customer growth.",
    },
    {
      icon: "✦",
      title: "Marketing & Creative",
      text: "Building brands and reaching audiences — digital marketing, content, communications, social media, design, campaigns and brand strategy.",
    },
    {
      icon: "◇",
      title: "People & Human Resources",
      text: "Building and supporting workforces — HR, talent acquisition, employee relations, learning, compensation and organisational development.",
    },
    {
      icon: "⇄",
      title: "Supply Chain & Logistics",
      text: "Moving products from source to destination — procurement, planning, inventory, warehousing, transportation and distribution.",
    },
    {
      icon: "▦",
      title: "Operations & Business Support",
      text: "Keeping organisations running effectively — business operations, administration, project coordination, customer operations and executive support.",
    },
    {
      icon: "§",
      title: "Legal, Risk & Compliance",
      text: "Protecting organisations and supporting governance — contracts, legal operations, regulatory compliance, corporate risk and policy.",
    },
    {
      icon: "⌂",
      title: "Hospitality & Customer Experience",
      text: "Delivering customer-facing services — hospitality, travel, facilities, guest experience, retail operations and service management.",
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
              INDUSTRIES & TALENT AREAS
            </span>

            <h1>
              Different industries.
              <br />
              The right <em>expertise.</em>
            </h1>

            <p>
              Fusion Staffing Solutions supports recruitment across
              technology and non-IT professional functions, helping
              organisations search for people whose skills and experience
              align with their hiring requirements.
            </p>

            <div className="sakevra-hero-actions">
              <button
                type="button"
                className="sakevra-primary"
                onClick={onContact}
              >
                Hire Talent <span>→</span>
              </button>

              <button
                type="button"
                className="sakevra-secondary"
                onClick={onJoinTalent}
              >
                Upload Your CV <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85"
              alt="Modern professional workplace"
            />
          </div>
        </section>

        {/* INDUSTRIES */}
        <section className="industries-page-section">
          <div className="industries-page-heading">
            <span className="section-eyebrow">
              OUR RECRUITMENT AREAS
            </span>

            <h2>
              Talent across <em>industries.</em>
            </h2>

            <p>
              Every industry has different requirements. Our recruitment
              approach begins by understanding the role, skills, experience
              and professional background an organisation needs.
            </p>
          </div>

          <div className="sakevra-industry-grid">
            {industries.map((industry) => (
              <article
                className="sakevra-industry-card"
                key={industry.title}
              >
                <div className="sakevra-industry-icon">
                  {industry.icon}
                </div>

                <h3>{industry.title}</h3>

                <p>{industry.text}</p>

                <span className="industry-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        {/* IT */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              TECHNOLOGY RECRUITMENT
            </span>

            <h2>
              Talent for a
              <br />
              technology-driven world.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Technology requirements can range from software engineering
              and application development to cloud, data, artificial
              intelligence and cybersecurity.
            </p>

            <p>
              Other areas may include DevOps, infrastructure, QA and
              testing, product, business analysis, technical support
              and related digital functions.
            </p>

            <p>
              Candidate searches are based on the requirements of each
              employer and position rather than relying only on job titles.
            </p>
          </div>
        </section>

        {/* NON IT */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              NON-IT RECRUITMENT
            </span>

            <h2>
              Professional talent
              <br />
              beyond <em>technology.</em>
            </h2>

            <p>
              Fusion Staffing Solutions also supports hiring across
              professional, commercial, operational, scientific,
              healthcare and business functions.
            </p>

            <button
              type="button"
              className="sakevra-primary"
              onClick={onContact}
            >
              Discuss Your Hiring Needs →
            </button>
          </div>

          <div className="about-ai-card">
            <span>NON-IT TALENT</span>

            <div>↓</div>

            <strong>
              Finance & Accounting
            </strong>

            <div>↓</div>

            <strong>
              Healthcare & Life Sciences
            </strong>

            <div>↓</div>

            <strong>
              Engineering & Operations
            </strong>

            <div>↓</div>

            <strong>
              HR, Sales & Marketing
            </strong>

            <div>↓</div>

            <strong>
              Administration & Business Support
            </strong>

            <div>↓</div>

            <span>PROFESSIONAL TALENT</span>
          </div>
        </section>

        {/* EMPLOYERS */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              FOR EMPLOYERS
            </span>

            <h2>
              Start with your
              <br />
              hiring requirement.
            </h2>
          </div>

          <div className="about-story-copy">
            <p>
              Tell us about your organisation, the position and the
              professional expertise you need.
            </p>

            <p>
              Your job description can help us understand responsibilities,
              required skills, experience, location, employment type and
              other important hiring criteria.
            </p>

            <p>
              Relevant professionals can then be identified and reviewed
              before suitable profiles are considered for progression.
            </p>
          </div>
        </section>

        {/* PROCESS */}
        <section className="about-ai-section">
          <div>
            <span className="section-eyebrow">
              FOCUSED TALENT SEARCH
            </span>

            <h2>
              Industry knowledge.
              <br />
              Requirement-led <em>recruitment.</em>
            </h2>

            <p>
              Rather than treating every vacancy the same, our process
              starts with the actual role and the expertise required by
              the organisation.
            </p>
          </div>

          <div className="about-ai-card">
            <span>YOUR INDUSTRY</span>

            <div>↓</div>

            <strong>Job Requirement</strong>

            <div>↓</div>

            <strong>Skills & Experience</strong>

            <div>↓</div>

            <strong>Talent Search</strong>

            <div>↓</div>

            <strong>Candidate Matching</strong>

            <div>↓</div>

            <strong>Recruiter Review</strong>

            <div>↓</div>

            <span>RELEVANT PROFESSIONALS</span>
          </div>
        </section>

        {/* CANDIDATES */}
        <section className="recruitment-flow">
          <span className="section-eyebrow">
            FOR PROFESSIONALS
          </span>

          <h2>Your expertise could match a future opportunity.</h2>

          <div className="recruitment-flow-grid">
            <div>
              <strong>01</strong>
              <h3>Technology</h3>
              <p>
                Software, cloud, AI, data, cybersecurity and digital
                professionals.
              </p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Professional Services</h3>
              <p>
                Finance, HR, sales, marketing and business professionals.
              </p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Technical & Scientific</h3>
              <p>
                Engineering, healthcare and life sciences professionals.
              </p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Business Support</h3>
              <p>
                Operations, administration, customer support and
                coordination professionals.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>FUSION TALENT NETWORK</span>

          <h2>Bring your expertise to the right opportunity.</h2>

          <p>
            Students, graduates and experienced professionals can join
            the Fusion Staffing Solutions talent network and make their
            profiles available for consideration when relevant
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