import React from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

export default function TermsPage({
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
  const terms = [
    {
      number: "01",
      title: "Acceptance of Terms",
      text: "By accessing or using the Fusion Staffing Solutions website, submitting information, applying for opportunities, uploading a CV, or using our recruitment services, you agree to these Terms & Conditions. If you do not agree with these terms, please discontinue use of the website and services.",
    },
    {
      number: "02",
      title: "Recruitment Services",
      text: "Fusion Staffing Solutions provides recruitment, staffing, candidate sourcing, talent matching and related hiring support. Services may include permanent recruitment, contract staffing, contract-to-hire, talent sourcing and recruitment process support.",
    },
    {
      number: "03",
      title: "Candidate Registration",
      text: "Candidates may create a profile, submit a CV and provide professional information for consideration for current or future opportunities. Registration with Fusion Staffing Solutions does not guarantee employment, interviews, placement or consideration for any particular position.",
    },
    {
      number: "04",
      title: "Accuracy of Candidate Information",
      text: "Candidates are responsible for ensuring that information provided through the website, CVs, applications and communications is accurate, complete and current. This includes qualifications, employment history, experience, skills, certifications, work authorization and contact information.",
    },
    {
      number: "05",
      title: "CV and Profile Use",
      text: "By submitting a CV or candidate profile, you authorize Fusion Staffing Solutions to review and process the information for recruitment-related purposes and, where appropriate, to discuss relevant opportunities with you and prospective employers.",
    },
    {
      number: "06",
      title: "No Guarantee of Employment",
      text: "Fusion Staffing Solutions does not guarantee that a candidate will receive an interview, employment offer, contract, placement or any particular employment outcome. Hiring decisions remain subject to employer requirements, candidate suitability and the applicable recruitment process.",
    },
    {
      number: "07",
      title: "Job Information",
      text: "Job descriptions, compensation information, locations, working arrangements, contract periods and other vacancy details may be provided by employers and may change. We aim to present information accurately but cannot guarantee that every opportunity will remain available or unchanged.",
    },
    {
      number: "08",
      title: "Employer Responsibilities",
      text: "Employers using our recruitment services are responsible for providing accurate role requirements, employment conditions and other relevant hiring information. Employers remain responsible for their final recruitment, interview and hiring decisions.",
    },
    {
      number: "09",
      title: "Employment and Contract Terms",
      text: "Any employment, consulting or contractual relationship resulting from an introduction may be subject to separate agreements between the relevant parties. These Terms & Conditions do not replace an employment contract, staffing agreement or other separately executed agreement.",
    },
    {
      number: "10",
      title: "Eligibility and Work Authorization",
      text: "Candidates are responsible for providing accurate information concerning their eligibility and authorization to work where required. Employers and other relevant parties may conduct appropriate verification before employment or engagement.",
    },
    {
      number: "11",
      title: "Background and Credential Verification",
      text: "Certain opportunities may require verification of employment history, education, professional qualifications, references, licenses, identity or other information. Any checks will be subject to applicable requirements and the recruitment process for the relevant position.",
    },
    {
      number: "12",
      title: "Communication",
      text: "When you provide contact information, Fusion Staffing Solutions may contact you in connection with recruitment services, applications, relevant opportunities, hiring requirements or other service-related matters. Communication preferences and applicable consent requirements will be respected.",
    },
    {
      number: "13",
      title: "Privacy and Personal Information",
      text: "Personal information provided through the website or recruitment process will be handled for legitimate recruitment, staffing, communication and operational purposes in accordance with applicable privacy requirements and any published privacy notice.",
    },
    {
      number: "14",
      title: "Confidentiality",
      text: "Users should not disclose confidential, proprietary or sensitive information unless it is reasonably necessary for the recruitment process and they are authorized to provide it. Information identified as confidential should be handled appropriately by the relevant parties.",
    },
    {
      number: "15",
      title: "Acceptable Website Use",
      text: "You must not misuse the website, attempt unauthorized access, interfere with website operation, submit malicious material, impersonate another person, provide deliberately false information, scrape restricted information or use the services for unlawful purposes.",
    },
    {
      number: "16",
      title: "Intellectual Property",
      text: "Unless otherwise stated, website branding, design, text, graphics and other original content belonging to Fusion Staffing Solutions may not be copied, reproduced, distributed or commercially exploited without appropriate authorization.",
    },
    {
      number: "17",
      title: "Third-Party Websites and Services",
      text: "The website may contain links to third-party websites or services. Fusion Staffing Solutions does not control third-party platforms and is not responsible for their availability, content, privacy practices or independent terms and conditions.",
    },
    {
      number: "18",
      title: "Service Availability and Changes",
      text: "We may update, modify, suspend or discontinue website features, recruitment services or information when reasonably necessary. We may also update these Terms & Conditions to reflect changes to our services, operations or applicable requirements.",
    },
    {
      number: "19",
      title: "Limitation of Responsibility",
      text: "To the extent permitted by applicable law, Fusion Staffing Solutions is not responsible for losses arising solely from reliance on inaccurate information supplied by third parties, changes made by employers, unavailable vacancies or decisions independently made by candidates or employers. Nothing in these terms excludes liability that cannot legally be excluded.",
    },
    {
      number: "20",
      title: "Questions and Contact",
      text: "If you have questions about these Terms & Conditions, our recruitment services or the use of this website, please contact Fusion Staffing Solutions through the contact options provided on the website.",
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
        onTerms={onTerms}
        onContact={onContact}
        onJoinTalent={onJoinTalent}
      />

      <main className="terms-page">

        {/* HERO */}
        <section className="terms-hero">
          <div className="terms-hero-inner">
            <span className="section-eyebrow light">
              LEGAL & WEBSITE INFORMATION
            </span>

            <h1>
              Terms & <em>Conditions.</em>
            </h1>

            <p>
              These terms explain the conditions that apply when using
              the Fusion Staffing Solutions website and our recruitment
              and staffing services.
            </p>
          </div>
        </section>

        {/* INTRO */}
        <section className="terms-content">
          <div className="terms-content-inner">

            <div className="terms-intro">
              <div>
                <span className="section-eyebrow">
                  FUSION STAFFING SOLUTIONS
                </span>

                <h2>
                  Clear terms for candidates
                  <br />
                  and employers.
                </h2>
              </div>

              <p>
                Please read these Terms & Conditions carefully.
                They apply to visitors, candidates and employers using
                our website and recruitment services.
              </p>
            </div>

            {/* TERMS */}
            <div className="terms-list">
              {terms.map((term) => (
                <article className="terms-item" key={term.number}>
                  <div className="terms-number">
                    {term.number}
                  </div>

                  <div className="terms-copy">
                    <h3>{term.title}</h3>
                    <p>{term.text}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* BOTTOM */}
            <div className="terms-bottom">
              <span>FUSION STAFFING SOLUTIONS</span>

              <h2>
                Questions about our
                <br />
                terms or services?
              </h2>

              <button type="button" onClick={onContact}>
                Contact Us
                <span>→</span>
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}