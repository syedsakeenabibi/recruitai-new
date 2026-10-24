
import { useEffect, useState } from "react";
import PublicJobApplyForm from "./PublicJobApplyForm";
import "./PublicJobDetailsPage.css";

function getItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(/\n|•/)
    .map(item => item.replace(/^[\s\-–*]+/, "").trim())
    .filter(Boolean);
}

// Extract the UUID from URLs such as:
// /jobs/UUID-construction-laborer
// /jobs/UUID-cnc-machinist
// /jobs/UUID-construction-laborer#apply
function getJobIdFromUrl() {
  const pathSegment = decodeURIComponent(
    window.location.pathname.split("/").filter(Boolean).pop() || ""
  );

  const uuidMatch = pathSegment.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );

  return uuidMatch ? uuidMatch[0] : pathSegment;
}

export default function PublicJobDetailsPage({ onJobs }) {
  const [id] = useState(getJobIdFromUrl);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadJob() {
      setLoading(true);
      setError("");
      setJob(null);

      try {
        const response = await fetch(
          `/api/public-jobs/${encodeURIComponent(id)}`,
          { credentials: "include" }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Job not found.");
        }

        if (active) {
          setJob(data.job || null);

          if (!data.job) {
            setError("Job not found or no longer published.");
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load job details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      loadJob();
    } else {
      setError("Invalid job link.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  function handleApply() {
    if (window.location.hash !== "#apply") {
      window.history.pushState(
        {},
        "",
        `${window.location.pathname}#apply`
      );
    }

    document.getElementById("job-application")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    document.querySelector("#job-application input")?.focus({
      preventScroll: true
    });
  }

  useEffect(() => {
    if (job && window.location.hash === "#apply") {
      const timer = window.setTimeout(() => {
        document.getElementById("job-application")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 200);

      return () => window.clearTimeout(timer);
    }
  }, [job]);

  if (loading) {
    return (
      <main className="job-details-page">
        <p>Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="job-details-page">
        <div className="job-details-container">
          <button className="job-back-link" onClick={onJobs}>
            ← Back to all jobs
          </button>
          <p role="alert">{error || "Job not found."}</p>
        </div>
      </main>
    );
  }

  const responsibilities = getItems(job.responsibilities);
  const requirements = getItems(job.requirements);
  const benefits = getItems(job.benefits);

  const overview =
    job.description ||
    `Join ${job.companyName || "our team"} as a ${job.title}. Bring your skills, contribute to quality work, and grow your career with this opportunity.`;

  return (
    <main className="job-details-page">
      <div className="job-details-container">
        <button className="job-back-link" onClick={onJobs}>
          <span aria-hidden="true">←</span> Back to all jobs
        </button>

        <div className="job-details-layout">
          <section className="job-info-card">
            <span className="job-status-pill">Open</span>

            <div className="job-heading-row">
              <div>
                <h1>{job.title}</h1>
                <p className="job-company">{job.companyName}</p>
              </div>

              {job.salary && (
                <div className="job-salary">
                  <strong>{job.salary}</strong>
                  <span>Depending on experience and specialization</span>
                </div>
              )}
            </div>

            <div className="job-meta-row">
              <span>
                <span aria-hidden="true">⌖</span>{" "}
                {job.location}
                {job.country ? `, ${job.country}` : ""}
              </span>

              {job.employmentType && (
                <span>
                  <span aria-hidden="true">▣</span>{" "}
                  {job.employmentType}
                </span>
              )}

              {job.workplaceType && (
                <span>
                  <span aria-hidden="true">▤</span>{" "}
                  {job.workplaceType}
                </span>
              )}

              {job.industry && <span>{job.industry}</span>}
            </div>

            <div className="job-section-divider" />

            <section className="job-content-section">
              <h2>Job Overview</h2>
              <p className="job-overview-text">{overview}</p>
            </section>

            {responsibilities.length > 0 && (
              <section className="job-content-section">
                <h2>Key Responsibilities</h2>
                <ul className="job-check-list">
                  {responsibilities.map((item, index) => (
                    <li key={index}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {requirements.length > 0 && (
              <section className="job-content-section">
                <h2>Requirements / Qualifications</h2>
                <ul className="job-check-list">
                  {requirements.map((item, index) => (
                    <li key={index}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {benefits.length > 0 && (
              <section className="job-content-section">
                <h2>Benefits</h2>
                <ul className="job-check-list">
                  {benefits.map((item, index) => (
                    <li key={index}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <button
              className="job-apply-mobile-button"
              onClick={handleApply}
            >
              Apply now <span aria-hidden="true">→</span>
            </button>
          </section>

          <section
            className="job-application-card"
            id="job-application"
          >
            <PublicJobApplyForm job={job} />
          </section>
        </div>
      </div>
    </main>
  );
}
