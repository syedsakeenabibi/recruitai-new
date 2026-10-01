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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setAboutOpen(false);
  }

  function navigate(action) {
    closeMobileMenu();

    if (typeof action === "function") {
      action();
    }
  }

  return (
    <header className="sakevra-header">
      <div className="sakevra-nav">

        {/* LOGO */}
        <button
          type="button"
          className="sakevra-brand page-brand-button"
          onClick={() => navigate(onHome)}
        >
          <span className="sakevra-brand-mark">F</span>

          <span className="sakevra-brand-text">
            <strong>FUSION</strong>
            <small>STAFFING SOLUTIONS</small>
          </span>
        </button>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="sakevra-mobile-menu-button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* NAVIGATION */}
        <nav
          className={`sakevra-links ${
            mobileMenuOpen ? "sakevra-links-mobile-open" : ""
          }`}
        >
          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onHome)}
          >
            Home
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onJobs)}
          >
            Find Jobs
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onCandidates)}
          >
            Candidates
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onEmployers)}
          >
            Employers
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onServices)}
          >
            Services
          </button>

          <button
            type="button"
            className="sakevra-nav-link-button"
            onClick={() => navigate(onIndustries)}
          >
            Industries
          </button>

          {/* ABOUT */}
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
                  onClick={() => navigate(onAbout)}
                >
                  <strong>About Us</strong>
                  <span>Who we are and how we recruit</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(onTerms)}
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
            onClick={() => navigate(onContact)}
          >
            Contact
          </button>

          {/* MOBILE UPLOAD CV */}
          <button
            type="button"
            className="sakevra-mobile-upload"
            onClick={() => navigate(onJoinTalent)}
          >
            Upload CV <span>↗</span>
          </button>
        </nav>

        {/* DESKTOP UPLOAD CV */}
        <button
          type="button"
          className="sakevra-nav-cta"
          onClick={() => navigate(onJoinTalent)}
        >
          Upload CV
          <span>↗</span>
        </button>

      </div>
    </header>
  );
}