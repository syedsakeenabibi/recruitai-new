import { useCallback, useEffect, useMemo, useState } from "react";
import "./EmployerIntelligence.css";

const API = "/api/admin/ra";

function getDomain(job) {
  const raw = job.companyWebsite || job.website || job.rawData?.companyWebsite || "";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname
      .replace(/^www\./, "").toLowerCase();
  } catch {
    return String(job.companyName || "unknown").trim().toLowerCase();
  }
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function EmployerIntelligence() {
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState({});
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/opportunities`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load saved opportunities.");
      setJobs(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async (id) => {
    const response = await fetch(
      `${API}/opportunities/${encodeURIComponent(id)}/contacts`,
      { credentials: "include" }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load contacts.");
    setContacts((current) => ({
      ...current,
      [id]: Array.isArray(data.contacts) ? data.contacts : [],
    }));
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const employers = useMemo(() => {
    const groups = new Map();
    jobs.forEach((job) => {
      const domain = getDomain(job);
      if (!groups.has(domain)) {
        groups.set(domain, {
          domain,
          company: job.companyName || domain,
          jobs: [],
        });
      }
      groups.get(domain).jobs.push(job);
    });
    return [...groups.values()];
  }, [jobs]);

  const filtered = employers.filter((employer) =>
    `${employer.company} ${employer.domain} ${employer.jobs.map((j) => j.jobTitle).join(" ")}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const activeEmployer = employers.find((item) => item.domain === selected) || null;
  const activeJob = activeEmployer?.jobs?.[0] || null;
  const activeContacts = activeJob ? contacts[activeJob.id] || [] : [];

  async function selectEmployer(employer) {
    setSelected(employer.domain);
    setNotice("");
    setError("");
    const id = employer.jobs[0]?.id;
    if (!id || contacts[id]) return;
    try {
      setBusy(`load:${id}`);
      await loadContacts(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function discoverContacts() {
    if (!activeJob?.id) return;
    const confirmed = window.confirm(
      `Run contact discovery for ${activeEmployer.company}?\n\nThis can use Apify and Hunter services. It will not send emails.`
    );
    if (!confirmed) return;

    setBusy(`discover:${activeJob.id}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API}/opportunities/${encodeURIComponent(activeJob.id)}/find-contacts`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Contact discovery failed.");
      await loadContacts(activeJob.id);
      setNotice(data.message || "Discovery finished. Review the saved contacts below.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function exportContacts() {
    const rows = activeContacts.map((contact) => [
      contact.contactName,
      contact.contactTitle,
      contact.email,
      contact.phone,
      contact.professionalProfileUrl,
      contact.sourceProvider,
      contact.verificationStatus,
      activeEmployer?.company,
      activeEmployer?.domain,
    ]);
    if (!rows.length) return;
    const headers = [
      "Name", "Job title", "Email", "Phone", "LinkedIn",
      "Source", "Verification", "Company", "Domain",
    ];
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(activeEmployer?.company || "employer").replace(/[^a-z0-9-_]/gi, "_")}-contacts.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalContacts = Object.values(contacts).reduce(
    (sum, list) => sum + list.length, 0
  );

  return (
    <div className="ei-page">
      <section className="ei-hero">
        <div>
          <span className="ei-eyebrow">RECRUITMENT INTELLIGENCE</span>
          <h2>Employer Intelligence</h2>
          <p>Find and review employer decision-makers from your saved job opportunities.</p>
        </div>
        <button className="ei-refresh" onClick={loadJobs} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh jobs"}
        </button>
      </section>

      <section className="ei-stats">
        <article><span>Saved job openings</span><strong>{loading ? "—" : jobs.length}</strong></article>
        <article><span>Unique employers</span><strong>{loading ? "—" : employers.length}</strong></article>
        <article><span>Contacts loaded</span><strong>{totalContacts}</strong></article>
        <article><span>Email campaigns</span><strong className="ei-disabled">Disabled</strong></article>
      </section>

      <section className="ei-workflow">
        <div className="ei-section-heading">
          <div><h3>How the process works</h3><p>Discovery is manual and controlled. No scraping starts when this page opens.</p></div>
        </div>
        <div className="ei-steps">
          {[
            ["01", "Load saved jobs", "Use existing RA opportunities"],
            ["02", "Group employers", "Combine jobs by company domain"],
            ["03", "Discover contacts", "Run Apify + Hunter on request"],
            ["04", "Review results", "Inspect and deduplicate contacts"],
            ["05", "Export CSV", "Download reviewed contact records"],
          ].map(([number, title, description]) => (
            <div className="ei-step" key={number}>
              <span>{number}</span><strong>{title}</strong><small>{description}</small>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="ei-alert ei-error">{error}</div>}
      {notice && <div className="ei-alert ei-success">{notice}</div>}

      <div className="ei-layout">
        <section className="ei-panel ei-employers">
          <div className="ei-panel-heading">
            <div><h3>Employers</h3><p>{filtered.length} unique companies</p></div>
          </div>
          <input
            className="ei-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, domain or job..."
          />
          {loading ? <div className="ei-empty">Loading saved opportunities...</div> :
            filtered.length === 0 ? (
              <div className="ei-empty">
                <div className="ei-empty-icon">⌕</div>
                <strong>{jobs.length ? "No matching employers" : "No saved job opportunities"}</strong>
                <p>{jobs.length ? "Try another search." : "Save job opportunities in Research / RA first. They will appear here automatically."}</p>
              </div>
            ) : (
              <div className="ei-employer-list">
                {filtered.map((employer) => (
                  <button
                    key={employer.domain}
                    className={`ei-employer ${selected === employer.domain ? "active" : ""}`}
                    onClick={() => selectEmployer(employer)}
                  >
                    <span className="ei-company-avatar">{employer.company.slice(0, 1).toUpperCase()}</span>
                    <span className="ei-employer-copy">
                      <strong>{employer.company}</strong>
                      <small>{employer.domain}</small>
                      <small>{employer.jobs.length} saved job{employer.jobs.length === 1 ? "" : "s"}</small>
                    </span>
                    <span className="ei-chevron">›</span>
                  </button>
                ))}
              </div>
            )}
        </section>

        <section className="ei-panel ei-detail">
          {!activeEmployer ? (
            <div className="ei-empty ei-detail-empty">
              <div className="ei-empty-icon">◎</div>
              <strong>Select an employer</strong>
              <p>Choose a company to review its saved jobs and discovered contacts.</p>
            </div>
          ) : (
            <>
              <div className="ei-detail-heading">
                <div>
                  <span className="ei-eyebrow">EMPLOYER PROFILE</span>
                  <h3>{activeEmployer.company}</h3>
                  <p>{activeEmployer.domain}</p>
                </div>
                <button
                  className="ei-primary"
                  onClick={discoverContacts}
                  disabled={Boolean(busy)}
                >
                  {busy === `discover:${activeJob?.id}` ? "Discovering..." : "✦ Discover contacts"}
                </button>
              </div>

              <div className="ei-job-summary">
                <strong>{activeEmployer.jobs.length} saved opening{activeEmployer.jobs.length === 1 ? "" : "s"}</strong>
                {activeEmployer.jobs.map((job) => (
                  <div className="ei-job-row" key={job.id}>
                    <span>{job.jobTitle || "Untitled job"}</span>
                    <small>{job.location || "Location unavailable"}</small>
                  </div>
                ))}
                <small className="ei-note">One representative saved opportunity is used for discovery per employer in this view.</small>
              </div>

              <div className="ei-contact-heading">
                <div><h3>Decision-maker contacts</h3><p>Saved contact records for the selected opportunity</p></div>
                <button className="ei-export" onClick={exportContacts} disabled={!activeContacts.length}>↓ Export CSV</button>
              </div>

              {busy === `load:${activeJob?.id}` ? (
                <div className="ei-empty">Loading saved contacts...</div>
              ) : activeContacts.length === 0 ? (
                <div className="ei-empty ei-compact-empty">
                  <strong>No saved contacts loaded</strong>
                  <p>Run discovery to search for eligible business contacts. Results are not guaranteed.</p>
                </div>
              ) : (
                <div className="ei-table-wrap">
                  <table className="ei-table">
                    <thead><tr><th>Contact</th><th>Email</th><th>Source</th><th>Status</th><th>Profile</th></tr></thead>
                    <tbody>
                      {activeContacts.map((contact) => (
                        <tr key={contact.id || contact.email}>
                          <td><strong>{contact.contactName || "Name unavailable"}</strong><small>{contact.contactTitle || "Title unavailable"}</small></td>
                          <td>{contact.email || "—"}</td>
                          <td>{contact.sourceProvider || "—"}</td>
                          <td><span className="ei-status">{contact.verificationStatus || "UNVERIFIED"}</span></td>
                          <td>{contact.professionalProfileUrl ? <a href={contact.professionalProfileUrl} target="_blank" rel="noreferrer">Open ↗</a> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="ei-email-notice">Email outreach is disabled in this workspace. Contacts can be reviewed and exported only.</div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
