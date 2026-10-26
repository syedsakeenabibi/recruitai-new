
import { useEffect, useState } from "react";
import PublicJobApplyForm from "./PublicJobApplyForm";
import "./PublicJobDetailsPage.css";


function getItems(value) {
  if (!value) return [];

  const cleanItem = (item) =>
    String(item)
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/^[\s\-–*•]+/, "")
      .trim();

  const items = Array.isArray(value)
    ? value
    : String(value).split(/\r?\n|•/);

  return items
    .map(cleanItem)
    .filter(
      (item) =>
        item &&
        !/^job description:?$/i.test(item) &&
        !/^key responsibilities:?$/i.test(item) &&
        !/^responsibilities:?$/i.test(item) &&
        !/^requirements(?:\s*\/\s*qualifications)?:?$/i.test(item) &&
        !/^what we offer:?$/i.test(item) &&
        !/^benefits:?$/i.test(item) &&
        !/^apply now:?$/i.test(item)
    );
}

function getJobIdFromUrl() {
  const pathSegment = decodeURIComponent(
    window.location.pathname.split("/").filter(Boolean).pop() || ""
  );

  const uuidMatch = pathSegment.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );

  return uuidMatch ? uuidMatch[0] : pathSegment;
}


function JobContent({ value }) {
  if (!value) return null;

  const lines = String(value).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];

  const cleanText = (text) =>
    text
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .trim();

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${blocks.length}`}>
          {cleanText(paragraph.join(" "))}
        </p>
      );
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {list.map((item, index) => (
            <li key={index}>{cleanText(item)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw) => {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h-${blocks.length}`}>
          {cleanText(heading[1])}
        </h3>
      );
      return;
    }

    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);

    if (item) {
      flushParagraph();
      list.push(item[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className="public-job-content">{blocks}</div>;
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
          `/api/public-jobs/${encodeURIComponent(id)}`
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
      block: "start",
    });

    document
      .querySelector("#job-application input:not([type='hidden'])")
      ?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (job && window.location.hash === "#apply") {
      const timer = window.setTimeout(() => {
        document.getElementById("job-application")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);

      return () => window.clearTimeout(timer);
    }
  }, [job]);

  if (loading) {
    return (
      <main className="job-details-page">
        <div className="job-details-container">
          <p role="status">Loading job details...</p>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="job-details-page">
        <div className="job-details-container">
          <button
            type="button"
            className="job-back-link"
            onClick={onJobs}
          >
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
        <button
          type="button"
          className="job-back-link"
          onClick={onJobs}
        >
          <span aria-hidden="true">←</span> Back to all jobs
        </button>

        <div className="job-details-layout">
          <section className="job-info-card">
            <span className="job-status-pill">Open</span>

            <div className="job-heading-row">
              <div className="job-heading-main">
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
             <div className="job-overview-text">
  <JobContent value={overview} />
</div>
            </section>

            {responsibilities.length > 0 && (
              <section className="job-content-section">
                <h2>Key Responsibilities</h2>
                <ul className="job-check-list">
                  {responsibilities.map((item, index) => (
                    <li key={index}>
                      <span aria-hidden="true">✓</span>
                      <span>{item}</span>
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
                      <span>{item}</span>
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
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <button
              type="button"
              className="job-apply-mobile-button"
              onClick={handleApply}
            >
              Apply now <span aria-hidden="true">→</span>
            </button>
          </section>

          <section
            className="job-application-card"
            id="job-application"
            aria-label="Quick Apply"
          >
            <PublicJobApplyForm job={job} />
          </section>
        </div>
      </div>
    </main>
  );
}

