import React, { useState } from "react";
import "./FusionWebsite.css";

export default function FusionNavbar({
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
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="sakevra-header">
      <div className="sakevra-nav">

        <button
          type="button"
          className="sakevra-brand page-brand-button"
          onClick={onHome}
        >
          <span className="sakevra-brand-mark">F</span>

          <span className="sakevra-brand-text">
            <strong>FUSION</strong>
            <small>STAFFING SOLUTIONS</small>
          </span>
        </button>

        <nav className="sakevra-links">

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onHome}
          >
            Home
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onJobs}
          >
            Find Jobs
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onCandidates}
          >
            Candidates
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onEmployers}
          >
            Employers
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onServices}
          >
            Services
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onIndustries}
          >
            Industries
          </button>


          {/* ABOUT DROPDOWN */}
          <div className="sakevra-about-menu">

            <button
              type="button"
              className="sakevra-nav-link-button sakevra-about-trigger"
              onClick={() => setAboutOpen((open) => !open)}
            >
              About
              <span>{aboutOpen ? "▴" : "▾"}</span>
            </button>

            {aboutOpen && (
              <div className="sakevra-about-dropdown">

                <button
                  type="button"
                  onClick={() => {
                    setAboutOpen(false);
                    onAbout();
                  }}
                >
                  <strong>About Us</strong>
                  <span>Who we are and how we recruit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAboutOpen(false);
                    onTerms();
                  }}
                >
                  <strong>Terms & Conditions</strong>
                  <span>Website and recruitment terms</span>
                </button>

              </div>
            )}

          </div>


          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={onContact}
          >
            Contact
          </button>

        </nav>

        <button
          type="button"
          className="sakevra-nav-cta"
          onClick={onJoinTalent}
        >
          Upload CV
          <span>↗</span>
        </button>

      </div>
    </header>
  );
}